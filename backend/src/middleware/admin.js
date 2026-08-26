import { ForbiddenError } from '../utils/errors.js';

export function adminMiddleware(req, _res, next) {
  if (req.user?.role !== 'ADMIN') {
    return next(new ForbiddenError('Admin access required'));
  }
  next();
}
