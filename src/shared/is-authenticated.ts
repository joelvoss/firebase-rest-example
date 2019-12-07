import { Request, Response, NextFunction } from 'express';

import { logger } from './logger';
import { admin } from './firebase';

/**
 * Middleware to check if a request is authenticated.
 */
export async function isAuthenticated(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  let token = req.headers['authorization'];
  if (!token) {
    return res.status(401).json('token-not-found');
  }

  // Strip "Bearer"
  token = token.split(' ')[1];

  // Verify token
  try {
    await admin.auth().verifyIdToken(token);
    return next();
  } catch (_) {
    logger.debug(`invalid-token`);
    return res.status(401).json('invalid-token');
  }
}
