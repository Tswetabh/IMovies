import { User } from '../models/User.js';
import { ApiError } from '../utils/http.js';
import { verifyToken } from '../utils/token.js';

export function requireAuth(...roles) {
  return async function authMiddleware(req, _res, next) {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

    if (!token) {
      throw new ApiError(401, 'Please sign in to continue');
    }

    let payload;

    try {
      payload = verifyToken(token);
    } catch {
      throw new ApiError(401, 'Your session has expired. Please sign in again.');
    }

    const user = await User.findById(payload.sub);

    if (!user) {
      throw new ApiError(401, 'This account no longer exists');
    }

    if (roles.length > 0 && !roles.includes(user.role)) {
      throw new ApiError(403, 'You do not have permission to do that');
    }

    req.user = user;
    next();
  };
}

export const requireAdmin = requireAuth('admin');
