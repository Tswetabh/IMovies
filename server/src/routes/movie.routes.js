import { Router } from 'express';
import {
  createMovie,
  deleteMovie,
  getMovie,
  listMovies,
  updateMovie,
} from '../controllers/movie.controller.js';
import { requireAdmin } from '../middleware/auth.js';

export const movieRouter = Router();

movieRouter.get('/', listMovies);
movieRouter.get('/:id', getMovie);
movieRouter.post('/', requireAdmin, createMovie);
movieRouter.patch('/:id', requireAdmin, updateMovie);
movieRouter.delete('/:id', requireAdmin, deleteMovie);
