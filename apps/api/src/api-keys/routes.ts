import { Router, type Request, type Response } from 'express';
import crypto from 'crypto';
import { authenticateJwt, hashPassword } from '../auth.middleware';
import { validateZod } from '../validate.middleware';
import { CreateApiKeySchema } from './types';
import { ApiKey } from '../models';

const router = Router();

function generateApiKey(): { key: string; prefix: string; suffix: string } {
  const randomBytes = crypto.randomBytes(24);
  const randomString = randomBytes.toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
  const key = `ak_${randomString}`;
  const prefix = key.slice(0, 5);
  const suffix = key.slice(-2);
  return { key, prefix, suffix };
}

function calculateExpiryDate(expiresIn: string): Date | null {
  if (expiresIn === 'never') return null;
  
  const now = new Date();
  switch (expiresIn) {
    case '1_month':
      return new Date(now.setMonth(now.getMonth() + 1));
    case '3_months':
      return new Date(now.setMonth(now.getMonth() + 3));
    case '6_months':
      return new Date(now.setMonth(now.getMonth() + 6));
    case '12_months':
      return new Date(now.setMonth(now.getMonth() + 12));
    default:
      return null;
  }
}

router.post(
  '/',
  authenticateJwt(['ADMIN']),
  validateZod(CreateApiKeySchema, 'body'),
  async (req: Request, res: Response) => {
    const { name, expiresIn } = req.body;

    try {
      const { key, prefix, suffix } = generateApiKey();
      const keyHash = await hashPassword(key);
      const expiresAt = calculateExpiryDate(expiresIn);

      const apiKey = await ApiKey.create({
        name,
        keyHash,
        prefix,
        suffix,
        createdBy: req.user!.id,
        expiresAt,
      });

      return res.status(201).json({
        id: apiKey._id,
        name: apiKey.name,
        key,
        prefix,
        suffix,
        expiresAt: apiKey.expiresAt,
        createdAt: apiKey.createdAt,
      });
    } catch (error) {
      console.error('Error creating API key:', error);
      return res.status(500).json({
        error: 'Failed to create API key',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

router.get('/', authenticateJwt(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const apiKeys = await ApiKey.find({ isActive: true })
      .populate('createdBy', 'email')
      .sort({ createdAt: -1 });

    const maskedKeys = apiKeys.map((key: any) => {
      return {
        id: key._id,
        name: key.name,
        maskedKey: `${key.prefix}...${key.suffix}`,
        prefix: key.prefix,
        suffix: key.suffix,
        createdBy: key.createdBy,
        expiresAt: key.expiresAt,
        lastUsedAt: key.lastUsedAt,
        createdAt: key.createdAt,
        updatedAt: key.updatedAt,
      };
    });

    return res.status(200).json({ data: maskedKeys });
  } catch (error) {
    console.error('Error fetching API keys:', error);
    return res.status(500).json({
      error: 'Failed to fetch API keys',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.get('/:id', authenticateJwt(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const apiKey = await ApiKey.findById(req.params.id).populate('createdBy', 'email');

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    return res.status(200).json({
      id: apiKey._id,
      name: apiKey.name,
      prefix: apiKey.prefix,
      suffix: apiKey.suffix,
      maskedKey: `${apiKey.prefix}...${apiKey.suffix}`,
      createdBy: apiKey.createdBy,
      expiresAt: apiKey.expiresAt,
      lastUsedAt: apiKey.lastUsedAt,
      isActive: apiKey.isActive,
      createdAt: apiKey.createdAt,
      updatedAt: apiKey.updatedAt,
    });
  } catch (error) {
    console.error('Error fetching API key:', error);
    return res.status(500).json({
      error: 'Failed to fetch API key',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

router.delete('/:id', authenticateJwt(['ADMIN']), async (req: Request, res: Response) => {
  try {
    const apiKey = await ApiKey.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!apiKey) {
      return res.status(404).json({ error: 'API key not found' });
    }

    return res.status(200).json({
      message: 'API key deactivated successfully',
      id: apiKey._id,
    });
  } catch (error) {
    console.error('Error deleting API key:', error);
    return res.status(500).json({
      error: 'Failed to delete API key',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

