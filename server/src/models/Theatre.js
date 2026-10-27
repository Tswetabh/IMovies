import mongoose from 'mongoose';

const screenSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Screen name is required'],
    trim: true,
  },
  rows: {
    type: Number,
    required: true,
    min: [1, 'A screen needs at least 1 row'],
    max: [26, 'A screen supports at most 26 rows'],
  },
  seatsPerRow: {
    type: Number,
    required: true,
    min: [1, 'A row needs at least 1 seat'],
    max: [40, 'A row supports at most 40 seats'],
  },
  format: {
    type: String,
    enum: ['2D', '3D', 'IMAX', '4DX'],
    default: '2D',
  },
});

screenSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

const theatreSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Theatre name is required'],
      trim: true,
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true,
    },
    address: {
      type: String,
      trim: true,
      default: '',
    },
    screens: {
      type: [screenSchema],
      default: [],
    },
  },
  { timestamps: true }
);

theatreSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Theatre = mongoose.model('Theatre', theatreSchema);
