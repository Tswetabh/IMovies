import mongoose from 'mongoose';

const showtimeSchema = new mongoose.Schema(
  {
    movie: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: true,
      index: true,
    },
    theatre: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Theatre',
      required: true,
      index: true,
    },
    screenId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
      index: true,
    },
    ticketPrice: {
      type: Number,
      required: true,
      min: [0, 'Ticket price cannot be negative'],
    },
    language: {
      type: String,
      trim: true,
      default: 'English',
    },
    format: {
      type: String,
      enum: ['2D', '3D', 'IMAX', '4DX'],
      default: '2D',
    },
    status: {
      type: String,
      enum: ['scheduled', 'cancelled', 'completed'],
      default: 'scheduled',
      index: true,
    },
  },
  { timestamps: true }
);

showtimeSchema.index({ movie: 1, startTime: 1 });
showtimeSchema.index({ theatre: 1, startTime: 1 });

showtimeSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Showtime = mongoose.model('Showtime', showtimeSchema);
