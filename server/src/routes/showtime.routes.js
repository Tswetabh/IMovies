import { Router } from 'express';
import {
  createShowtime,
  deleteShowtime,
  getShowtime,
  getShowtimeSeats,
  listShowtimes,
  updateShowtime,
} from '../controllers/showtime.controller.js';
import { requireAdmin } from '../middleware/auth.js';

export const showtimeRouter = Router();

showtimeRouter.get('/', listShowtimes);
showtimeRouter.get('/:id/seats', getShowtimeSeats);
showtimeRouter.get('/:id', getShowtime);
showtimeRouter.post('/', requireAdmin, createShowtime);
showtimeRouter.patch('/:id', requireAdmin, updateShowtime);
showtimeRouter.delete('/:id', requireAdmin, deleteShowtime);
