import { Router } from 'express';
import {
  addScreen,
  createTheatre,
  deleteScreen,
  deleteTheatre,
  getTheatre,
  listTheatres,
  updateTheatre,
} from '../controllers/theatre.controller.js';
import { requireAdmin } from '../middleware/auth.js';

export const theatreRouter = Router();

theatreRouter.get('/', listTheatres);
theatreRouter.get('/:id', getTheatre);
theatreRouter.post('/', requireAdmin, createTheatre);
theatreRouter.patch('/:id', requireAdmin, updateTheatre);
theatreRouter.delete('/:id', requireAdmin, deleteTheatre);
theatreRouter.post('/:id/screens', requireAdmin, addScreen);
theatreRouter.delete('/:id/screens/:screenId', requireAdmin, deleteScreen);
