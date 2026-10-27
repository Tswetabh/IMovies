import { User } from '../models/User.js';
import { signToken } from '../utils/token.js';
import { ApiError, asyncHandler } from '../utils/http.js';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body ?? {};

  if (!name || !email || !password) {
    throw new ApiError(400, 'Name, email and password are required');
  }

  if (!EMAIL_PATTERN.test(email)) {
    throw new ApiError(400, 'Enter a valid email address');
  }

  if (password.length < 8) {
    throw new ApiError(400, 'Password must be at least 8 characters');
  }

  const exists = await User.exists({ email: email.toLowerCase() });

  if (exists) {
    throw new ApiError(409, 'An account with that email already exists');
  }

  const user = await User.create({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    password,
  });

  res.status(201).json({
    success: true,
    data: { token: signToken(user), user },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body ?? {};

  if (!email || !password) {
    throw new ApiError(400, 'Email and password are required');
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    throw new ApiError(401, 'Email or password is incorrect');
  }

  res.json({
    success: true,
    data: { token: signToken(user), user },
  });
});

export const me = asyncHandler(async (req, res) => {
  res.json({ success: true, data: { user: req.user } });
});
