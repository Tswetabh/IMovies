import mongoose from 'mongoose';

const movieSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 160,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 4000,
    },
    posterUrl: {
      type: String,
      trim: true,
      default: '',
    },
    trailerUrl: {
      type: String,
      trim: true,
      default: '',
    },
    genres: {
      type: [String],
      default: [],
    },
    languages: {
      type: [String],
      default: ['English'],
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 1,
      max: 600,
    },
    releaseDate: {
      type: Date,
      required: true,
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 10,
    },
    certificate: {
      type: String,
      enum: ['U', 'UA', 'A', 'S'],
      default: 'UA',
    },
    status: {
      type: String,
      enum: ['now_showing', 'coming_soon', 'archived'],
      default: 'now_showing',
      index: true,
    },
    director: { type: String, trim: true, default: '' },
    cast: { type: [String], default: [] },
  },
  { timestamps: true }
);

movieSchema.index({ title: 'text', description: 'text' });

movieSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    return ret;
  },
});

export const Movie = mongoose.model('Movie', movieSchema);
