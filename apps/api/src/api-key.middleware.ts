import { Request, Response, NextFunction } from 'express';
import { comparePassword } from './auth.middleware';
import { ApiKey } from './models';

declare module 'express' {
  interface Request {
    apiKey?: {
      id: string;
      name: string;
    };
  }
}

export async function authenticateApiKey(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  if (
    !authHeader ||
    typeof authHeader !== 'string' ||
    !authHeader.startsWith('Bearer ')
  ) {
    return res.status(401).json({ error: 'No API key provided' });
  }

  const apiKey = authHeader.slice(7);

  if (!apiKey.startsWith('ak_')) {
    return res.status(401).json({ error: 'Invalid API key format' });
  }

  try {
    const allApiKeys = await ApiKey.find({ isActive: true });

    let validKey: any = null;
    for (const key of allApiKeys) {
      const isValid = await comparePassword(apiKey, key.keyHash);
      if (isValid) {
        const now = new Date();
        if (key.expiresAt && key.expiresAt < now) {
          return res.status(401).json({ error: 'API key has expired' });
        }
        validKey = key;
        break;
      }
    }

    if (!validKey) {
      return res.status(401).json({ error: 'Invalid API key' });
    }

    ApiKey.findByIdAndUpdate(validKey._id, {
      lastUsedAt: new Date(),
    }).catch((err) => {
      console.error('Error updating lastUsedAt for API key:', err);
    });

    req.apiKey = {
      id: String(validKey._id),
      name: validKey.name,
    };

    next();
  } catch (error) {
    console.error('Error validating API key:', error);
    return res.status(500).json({ error: 'Failed to validate API key' });
  }
}
