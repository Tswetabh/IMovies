import { Showtime } from '../models/Showtime.js';
import { Movie } from '../models/Movie.js';
import { Theatre } from '../models/Theatre.js';
import { Booking } from '../models/Booking.js';
import { ApiError, asyncHandler } from '../utils/http.js';
import { seatLayout } from '../utils/seats.js';

const MOVIE_FIELDS = 'title posterUrl durationMinutes languages genres rating certificate';

function findScreen(theatre, screenId) {
  if (!theatre || !Array.isArray(theatre.screens)) return null;
  return theatre.screens.find((screen) => String(screen._id) === String(screenId)) ?? null;
}

function present(showtime) {
  const data = showtime.toJSON();
  const theatre = showtime.theatre;
  const screen = findScreen(theatre, showtime.screenId);

  return {
    ...data,
    screen: screen
      ? {
          id: String(screen._id),
          name: screen.name,
          rows: screen.rows,
          seatsPerRow: screen.seatsPerRow,
          format: screen.format,
        }
      : null,
  };
}

async function loadShowtime(id) {
  const showtime = await Showtime.findById(id)
    .populate('movie', MOVIE_FIELDS)
    .populate('theatre');

  if (!showtime) throw new ApiError(404, 'Showtime not found');

  return showtime;
}

export const listShowtimes = asyncHandler(async (req, res) => {
  const { movie, theatre, date, status = 'scheduled', includePast } = req.query;
  const filter = {};

  if (movie) filter.movie = movie;
  if (theatre) filter.theatre = theatre;
  if (status && status !== 'all') filter.status = status;

  if (date) {
    const start = new Date(`${date}T00:00:00.000Z`);

    if (Number.isNaN(start.getTime())) throw new ApiError(400, 'Date must be in YYYY-MM-DD format');

    filter.startTime = { $gte: start, $lt: new Date(start.getTime() + 24 * 60 * 60 * 1000) };
  } else if (includePast !== 'true') {
    filter.startTime = { $gte: new Date() };
  }

  const showtimes = await Showtime.find(filter)
    .populate('movie', MOVIE_FIELDS)
    .populate('theatre')
    .sort({ startTime: 1 })
    .limit(400);

  res.json({ success: true, data: { showtimes: showtimes.map(present) } });
});

export const getShowtime = asyncHandler(async (req, res) => {
  const showtime = await loadShowtime(req.params.id);
  res.json({ success: true, data: { showtime: present(showtime) } });
});

export const getShowtimeSeats = asyncHandler(async (req, res) => {
  const showtime = await loadShowtime(req.params.id);
  const screen = findScreen(showtime.theatre, showtime.screenId);

  if (!screen) {
    throw new ApiError(409, 'The screen for this showtime is no longer available');
  }

  const bookings = await Booking.find(
    { showtime: showtime._id, status: 'confirmed' },
    { seats: 1 }
  ).lean();

  const bookedSeats = bookings.flatMap((booking) => booking.seats);
  const rows = seatLayout(
    { rows: screen.rows, seatsPerRow: screen.seatsPerRow },
    bookedSeats
  );

  res.json({
    success: true,
    data: {
      showtime: present(showtime),
      screen: {
        id: String(screen._id),
        name: screen.name,
        rows: screen.rows,
        seatsPerRow: screen.seatsPerRow,
        format: screen.format,
      },
      rows,
      bookedSeats,
      availableSeats: screen.rows * screen.seatsPerRow - bookedSeats.length,
      ticketPrice: showtime.ticketPrice,
    },
  });
});

export const createShowtime = asyncHandler(async (req, res) => {
  const { movie, theatre, screenId, startTime, ticketPrice, language, format } = req.body ?? {};

  if (!movie || !theatre || !screenId || !startTime || ticketPrice === undefined) {
    throw new ApiError(
      400,
      'Movie, theatre, screen, start time and ticket price are required'
    );
  }

  const [movieDoc, theatreDoc] = await Promise.all([
    Movie.findById(movie),
    Theatre.findById(theatre),
  ]);

  if (!movieDoc) throw new ApiError(404, 'Movie not found');
  if (!theatreDoc) throw new ApiError(404, 'Theatre not found');

  const screen = findScreen(theatreDoc, screenId);
  if (!screen) throw new ApiError(400, 'That screen does not belong to the selected theatre');

  const startsAt = new Date(startTime);
  if (Number.isNaN(startsAt.getTime())) throw new ApiError(400, 'Start time is not a valid date');
  if (startsAt.getTime() < Date.now()) throw new ApiError(400, 'Start time must be in the future');

  const showtime = await Showtime.create({
    movie,
    theatre,
    screenId,
    startTime: startsAt,
    ticketPrice: Number(ticketPrice),
    language: language || 'English',
    format: format || screen.format,
  });

  const populated = await loadShowtime(showtime._id);
  res.status(201).json({ success: true, data: { showtime: present(populated) } });
});

export const updateShowtime = asyncHandler(async (req, res) => {
  const showtime = await Showtime.findById(req.params.id);

  if (!showtime) throw new ApiError(404, 'Showtime not found');

  const { startTime, ticketPrice, language, format, status } = req.body ?? {};

  if (startTime !== undefined) {
    const startsAt = new Date(startTime);
    if (Number.isNaN(startsAt.getTime())) throw new ApiError(400, 'Start time is not a valid date');
    showtime.startTime = startsAt;
  }

  if (ticketPrice !== undefined) {
    const price = Number(ticketPrice);
    if (!Number.isFinite(price) || price < 0) throw new ApiError(400, 'Ticket price is invalid');
    showtime.ticketPrice = price;
  }

  if (language !== undefined) showtime.language = language;
  if (format !== undefined) showtime.format = format;
  if (status !== undefined) showtime.status = status;

  await showtime.save();

  const populated = await loadShowtime(showtime._id);
  res.json({ success: true, data: { showtime: present(populated) } });
});

export const deleteShowtime = asyncHandler(async (req, res) => {
  const bookings = await Booking.countDocuments({
    showtime: req.params.id,
    status: 'confirmed',
  });

  if (bookings > 0) {
    throw new ApiError(
      409,
      'This showtime has confirmed bookings. Cancel the showtime instead of deleting it.'
    );
  }

  const showtime = await Showtime.findByIdAndDelete(req.params.id);

  if (!showtime) throw new ApiError(404, 'Showtime not found');

  res.json({ success: true, data: { showtime } });
});
