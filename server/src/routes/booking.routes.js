import { Router } from 'express';
import {
  cancelBooking,
  createBooking,
  getBooking,
  listAllBookings,
  myBookings,
} from '../controllers/booking.controller.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';

export const bookingRouter = Router();

bookingRouter.post('/', requireAuth(), createBooking);
bookingRouter.get('/my-bookings', requireAuth(), myBookings);
bookingRouter.get('/admin/all', requireAdmin, listAllBookings);
bookingRouter.get('/:id', requireAuth(), getBooking);
bookingRouter.patch('/:id/cancel', requireAuth(), cancelBooking);
