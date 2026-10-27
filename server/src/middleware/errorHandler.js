import mongoose from 'mongoose';
import { ApiError } from '../utils/http.js';

export function errorHandler(error, _req, res, _next) {
  let statusCode = 500;
  let message = 'Something went wrong on the server';
  let details;

  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
    details = error.details;
  } else if (error instanceof mongoose.Error.ValidationError) {
    statusCode = 422;
    message = 'Some fields need attention';
    details = Object.values(error.errors).map((item) => ({
      field: item.path,
      message: item.message,
    }));
  } else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = `Invalid value for ${error.path}`;
  } else if (error.code === 11000) {
    statusCode = 409;

    if (error.keyPattern && error.keyPattern.reference) {
      message = 'Could not generate a unique booking reference. Please try again.';
    } else if (error.keyPattern && error.keyPattern.email) {
      message = 'An account with that email already exists';
    } else {
      message = 'One or more of those seats were just booked. Please pick different seats.';
      details = { seats: 'unavailable' };
    }
  } else if (error.type === 'entity.parse.failed') {
    statusCode = 400;
    message = 'Request body must be valid JSON';
  }

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}
