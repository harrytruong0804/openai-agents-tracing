import { Request, Response, NextFunction } from 'express';
import { authenticateApiKey } from './api-key.middleware';
import { authenticateJwt } from './auth.middleware';

/**
 * Accepts either JWT or API key authentication.
 * - If the Bearer token starts with "ak_", routes to API key auth.
 * - Otherwise, routes to JWT auth.
 */
export function authenticateEither(roles?: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (
      authHeader &&
      typeof authHeader === 'string' &&
      authHeader.startsWith('Bearer ak_')
    ) {
      return authenticateApiKey(req, res, next);
    }

    return authenticateJwt(roles as any)(req, res, next);
  };
}
