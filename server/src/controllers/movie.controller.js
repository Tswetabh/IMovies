import { Movie } from '../models/Movie.js';
import { Showtime } from '../models/Showtime.js';
import { ApiError, asyncHandler } from '../utils/http.js';

const ALLOWED_FIELDS = [
  'title',
  'description',
  'posterUrl',
  'trailerUrl',
  'genres',
  'languages',
  'durationMinutes',
  'releaseDate',
  'rating',
  'certificate',
  'status',
  'director',
  'cast',
];

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function pickFields(body = {}) {
  return ALLOWED_FIELDS.reduce((payload, field) => {
    if (body[field] !== undefined) payload[field] = body[field];
    return payload;
  }, {});
}

export const listMovies = asyncHandler(async (req, res) => {
  const { q, genre, language, status, page = 1, limit = 24 } = req.query;
  const filter = {};

  if (q) filter.title = { $regex: escapeRegex(String(q).trim()), $options: 'i' };
  if (genre) filter.genres = genre;
  if (language) filter.languages = language;
  if (status) filter.status = status;

  const pageNumber = Math.max(1, Number(page) || 1);
  const pageSize = Math.min(60, Math.max(1, Number(limit) || 24));

  const [movies, total] = await Promise.all([
    Movie.find(filter)
      .sort({ releaseDate: -1, createdAt: -1 })
      .skip((pageNumber - 1) * pageSize)
      .limit(pageSize),
    Movie.countDocuments(filter),
  ]);

  res.json({
    success: true,
    data: {
      movies,
      pagination: {
        page: pageNumber,
        limit: pageSize,
        total,
        pages: Math.ceil(total / pageSize) || 1,
      },
    },
  });
});

export const getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);

  if (!movie) throw new ApiError(404, 'Movie not found');

  res.json({ success: true, data: { movie } });
});

export const createMovie = asyncHandler(async (req, res) => {
  const payload = pickFields(req.body);

  if (!payload.title || !payload.description || !payload.durationMinutes || !payload.releaseDate) {
    throw new ApiError(400, 'Title, description, duration and release date are required');
  }

  const movie = await Movie.create(payload);
  res.status(201).json({ success: true, data: { movie } });
});

export const updateMovie = asyncHandler(async (req, res) => {
  const payload = pickFields(req.body);

  if (Object.keys(payload).length === 0) {
    throw new ApiError(400, 'Nothing to update');
  }

  const movie = await Movie.findByIdAndUpdate(req.params.id, payload, {
    new: true,
    runValidators: true,
  });

  if (!movie) throw new ApiError(404, 'Movie not found');

  res.json({ success: true, data: { movie } });
});

export const deleteMovie = asyncHandler(async (req, res) => {
  const upcoming = await Showtime.countDocuments({
    movie: req.params.id,
    startTime: { $gte: new Date() },
    status: 'scheduled',
  });

  if (upcoming > 0) {
    throw new ApiError(
      409,
      'This movie still has scheduled showtimes. Cancel or delete those showtimes first.'
    );
  }

  const movie = await Movie.findByIdAndDelete(req.params.id);

  if (!movie) throw new ApiError(404, 'Movie not found');

  res.json({ success: true, data: { movie } });
});
