import { Booking } from '../models/Booking.js';
import { Showtime } from '../models/Showtime.js';
import { ApiError, asyncHandler } from '../utils/http.js';
import {
  calculateTotal,
  createBookingReference,
  isValidSeat,
  normaliseSeats,
} from '../utils/seats.js';

const BOOKING_POPULATE = [
  { path: 'movie', select: 'title posterUrl durationMinutes certificate' },
  { path: 'theatre', select: 'name city address' },
  {
    path: 'showtime',
    select: 'startTime ticketPrice language format screenId status',
  },
];

const MAX_SEATS_PER_BOOKING = 10;

function findScreen(theatre, screenId) {
  if (!theatre || !Array.isArray(theatre.screens)) return null;
  return theatre.screens.find((screen) => String(screen._id) === String(screenId)) ?? null;
}

async function populateBooking(id) {
  return Booking.findById(id)
    .populate(BOOKING_POPULATE)
    .populate('user', 'name email');
}

export const createBooking = asyncHandler(async (req, res) => {
  const { showtimeId, seats } = req.body ?? {};

  if (!showtimeId) throw new ApiError(400, 'A showtime is required');

  const showtime = await Showtime.findById(showtimeId).populate('theatre');

  if (!showtime) throw new ApiError(404, 'Showtime not found');
  if (showtime.status !== 'scheduled') {
    throw new ApiError(409, 'This showtime is not accepting bookings');
  }
  if (showtime.startTime.getTime() <= Date.now()) {
    throw new ApiError(409, 'This showtime has already started');
  }

  const screen = findScreen(showtime.theatre, showtime.screenId);

  if (!screen) throw new ApiError(409, 'The screen for this showtime is no longer available');

  const requested = normaliseSeats(seats);

  if (requested.length === 0) throw new ApiError(400, 'Choose at least one seat');
  if (requested.length > MAX_SEATS_PER_BOOKING) {
    throw new ApiError(400, `You can book at most ${MAX_SEATS_PER_BOOKING} seats at once`);
  }

  const invalid = requested.filter(
    (seat) => !isValidSeat(seat, screen.rows, screen.seatsPerRow)
  );

  if (invalid.length > 0) {
    throw new ApiError(400, 'Some of those seats do not exist on this screen', {
      invalidSeats: invalid,
    });
  }

  const clashes = await Booking.find(
    { showtime: showtime._id, status: 'confirmed', seats: { $in: requested } },
    { seats: 1 }
  ).lean();

  if (clashes.length > 0) {
    const taken = [...new Set(clashes.flatMap((booking) => booking.seats))];
    throw new ApiError(409, 'Some of those seats were just booked', {
      takenSeats: taken,
    });
  }

  const totalAmount = calculateTotal(showtime.ticketPrice, requested.length);
  let booking = null;
  let lastError = null;

  for (let attempt = 0; attempt < 3 && !booking; attempt += 1) {
    try {
      booking = await Booking.create({
        reference: createBookingReference(),
        user: req.user._id,
        showtime: showtime._id,
        movie: showtime.movie,
        theatre: showtime.theatre._id,
        seats: requested,
        totalAmount,
      });
    } catch (error) {
      lastError = error;

      const referenceClash =
        error.code === 11000 && error.keyPattern && error.keyPattern.reference;

      if (!referenceClash) throw error;
    }
  }

  if (!booking) throw lastError ?? new ApiError(500, 'Could not create the booking');

  const populated = await populateBooking(booking._id);

  res.status(201).json({ success: true, data: { booking: populated } });
});

export const myBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.find({ user: req.user._id })
    .populate(BOOKING_POPULATE)
    .sort({ createdAt: -1 });

  res.json({ success: true, data: { bookings } });
});

export const getBooking = asyncHandler(async (req, res) => {
  const booking = await populateBooking(req.params.id);

  if (!booking) throw new ApiError(404, 'Booking not found');

  const ownerId = booking.user?._id ?? booking.user;

  if (String(ownerId) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to view this booking');
  }

  res.json({ success: true, data: { booking } });
});

export const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findById(req.params.id).populate('showtime');

  if (!booking) throw new ApiError(404, 'Booking not found');

  if (String(booking.user) !== String(req.user._id) && req.user.role !== 'admin') {
    throw new ApiError(403, 'You do not have permission to cancel this booking');
  }

  if (booking.status === 'cancelled') {
    throw new ApiError(409, 'This booking is already cancelled');
  }

  if (booking.showtime && booking.showtime.startTime.getTime() <= Date.now()) {
    throw new ApiError(409, 'Bookings cannot be cancelled after the showtime has started');
  }

  booking.status = 'cancelled';
  booking.cancelledAt = new Date();
  await booking.save();

  const populated = await populateBooking(booking._id);

  res.json({ success: true, data: { booking: populated } });
});

export const listAllBookings = asyncHandler(async (req, res) => {
  const { showtime, user, status } = req.query;
  const filter = {};

  if (showtime) filter.showtime = showtime;
  if (user) filter.user = user;
  if (status) filter.status = status;

  const bookings = await Booking.find(filter)
    .populate(BOOKING_POPULATE)
    .populate('user', 'name email')
    .sort({ createdAt: -1 })
    .limit(500);

  res.json({ success: true, data: { bookings } });
});
