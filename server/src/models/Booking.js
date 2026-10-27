import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema(
  {
    reference: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    showtime: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showtime',
      required: true,
      index: true,
    },
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: true,
    },
    seats: {
      type: [String],
      required: true,
      validate: {
        validator: (seats) => Array.isArray(seats) && seats.length > 0 && seats.length <= 10,
        message: 'A booking must contain between 1 and 10 seats',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ['confirmed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    cancelledAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// A seat can only belong to one active booking per showtime.
// Cancelled bookings leave the partial index, which frees the seats again.
bookingSchema.index(
  { showtime: 1, seats: 1 },
  { unique: true, partialFilterExpression: { status: 'confirmed' } }
);

bookingSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Booking = mongoose.model('Booking', bookingSchema);
