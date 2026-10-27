import { Router } from 'express';
import { authRouter } from './auth.routes.js';
import { movieRouter } from './movie.routes.js';
import { theatreRouter } from './theatre.routes.js';
import { showtimeRouter } from './showtime.routes.js';
import { bookingRouter } from './booking.routes.js';

export const apiRouter = Router();

apiRouter.use('/auth', authRouter);
apiRouter.use('/movies', movieRouter);
apiRouter.use('/theatres', theatreRouter);
apiRouter.use('/showtimes', showtimeRouter);
apiRouter.use('/bookings', bookingRouter);
