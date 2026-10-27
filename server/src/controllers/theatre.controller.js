import { Theatre } from '../models/Theatre.js';
import { Showtime } from '../models/Showtime.js';
import { ApiError, asyncHandler } from '../utils/http.js';

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function validateScreen(payload = {}) {
  const rows = Number(payload.rows);
  const seatsPerRow = Number(payload.seatsPerRow);

  if (!payload.name) throw new ApiError(400, 'Screen name is required');
  if (!Number.isInteger(rows) || rows < 1 || rows > 26) {
    throw new ApiError(400, 'Screen rows must be a whole number between 1 and 26');
  }
  if (!Number.isInteger(seatsPerRow) || seatsPerRow < 1 || seatsPerRow > 40) {
    throw new ApiError(400, 'Seats per row must be a whole number between 1 and 40');
  }

  return {
    name: String(payload.name).trim(),
    rows,
    seatsPerRow,
    format: payload.format || '2D',
  };
}

export const listTheatres = asyncHandler(async (req, res) => {
  const { city, q } = req.query;
  const filter = {};

  if (city) filter.city = city;
  if (q) filter.name = { $regex: escapeRegex(String(q).trim()), $options: 'i' };

  const theatres = await Theatre.find(filter).sort({ name: 1 });

  res.json({ success: true, data: { theatres } });
});

export const getTheatre = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);

  if (!theatre) throw new ApiError(404, 'Theatre not found');

  res.json({ success: true, data: { theatre } });
});

export const createTheatre = asyncHandler(async (req, res) => {
  const { name, city, address, screens = [] } = req.body ?? {};

  if (!name || !city) throw new ApiError(400, 'Theatre name and city are required');

  if (!Array.isArray(screens)) throw new ApiError(400, 'Screens must be a list');

  const theatre = await Theatre.create({
    name: String(name).trim(),
    city: String(city).trim(),
    address: address ? String(address).trim() : '',
    screens: screens.map(validateScreen),
  });

  res.status(201).json({ success: true, data: { theatre } });
});

export const updateTheatre = asyncHandler(async (req, res) => {
  const { name, city, address } = req.body ?? {};
  const payload = {};

  if (name !== undefined) payload.name = String(name).trim();
  if (city !== undefined) payload.city = String(city).trim();
  if (address !== undefined) payload.address = String(address).trim();

  if (Object.keys(payload).length === 0) throw new ApiError(400, 'Nothing to update');

  const theatre = await Theatre.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });

  if (!theatre) throw new ApiError(404, 'Theatre not found');

  res.json({ success: true, data: { theatre } });
});

export const deleteTheatre = asyncHandler(async (req, res) => {
  const showtimes = await Showtime.countDocuments({ theatre: req.params.id });

  if (showtimes > 0) {
    throw new ApiError(
      409,
      'This theatre still has showtimes attached. Remove those showtimes first.'
    );
  }

  const theatre = await Theatre.findByIdAndDelete(req.params.id);

  if (!theatre) throw new ApiError(404, 'Theatre not found');

  res.json({ success: true, data: { theatre } });
});

export const addScreen = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);

  if (!theatre) throw new ApiError(404, 'Theatre not found');

  theatre.screens.push(validateScreen(req.body));
  await theatre.save();

  res.status(201).json({ success: true, data: { theatre } });
});

export const deleteScreen = asyncHandler(async (req, res) => {
  const theatre = await Theatre.findById(req.params.id);

  if (!theatre) throw new ApiError(404, 'Theatre not found');

  const screen = theatre.screens.id(req.params.screenId);

  if (!screen) throw new ApiError(404, 'Screen not found');

  const showtimes = await Showtime.countDocuments({ screenId: screen._id });

  if (showtimes > 0) {
    throw new ApiError(
      409,
      'This screen has showtimes attached. Remove those showtimes before deleting the screen.'
    );
  }

  screen.deleteOne();
  await theatre.save();

  res.json({ success: true, data: { theatre } });
});
