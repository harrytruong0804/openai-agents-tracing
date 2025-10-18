import { Request, Response, NextFunction } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const JWT_SECRET = process.env.JWT_SECRET || 'default_jwt_secret';
const BCRYPT_SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_SALT_ROUNDS);
}

export async function comparePassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export enum Roles {
  ADMIN,
  READ_ONLY,
}

export interface JwtPayload {
  id: string;
  role: keyof typeof Roles;
}

declare module 'express' {
  interface Request {
    user?: JwtPayload;
  }
}

export function authenticateJwt(roles?: (keyof typeof Roles)[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;

    if (
      authHeader &&
      typeof authHeader === 'string' &&
      authHeader.startsWith('Bearer ')
    ) {
      const token = authHeader.slice(7);
      jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
          return res.status(401).json({ error: 'Invalid token' });
        }
        req['user'] = user as JwtPayload;

        if (roles && roles.length > 0) {
          if (!roles.includes(req.user!.role)) {
            return res.status(403).json({ error: 'Unauthorized' });
          }
        }

        next();
      });
    } else {
      res.status(401).json({ error: 'No token provided' });
    }
  };
}

/**
 * Utility to issue JWT after successful authentication.
 */
export function generateJwt(
  payload: object,
  expiresIn: SignOptions['expiresIn'] = '1d'
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
