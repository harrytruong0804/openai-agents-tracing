import { Router, type Request, type Response } from 'express';
import {
  authenticateJwt,
  comparePassword,
  generateJwt,
  hashPassword,
} from '../auth.middleware';
import { User } from '../models';
import { validateZod } from '../validate.middleware';
import { CreateUserSchema, LoginSchema } from './types';

const router = Router();

router.get('/setup-status', async (req: Request, res: Response) => {
  try {
    const userCount = await User.countDocuments();
    return res.status(200).json({ completed: userCount > 0 });
  } catch (error) {
    console.error('Error checking setup status:', error);
    return res.status(500).json({ error: 'Failed to check setup status' });
  }
});

router.post(
  '/setup',
  validateZod(CreateUserSchema, 'body'),
  async (req: Request, res: Response) => {
    try {
      const userCount = await User.countDocuments();
      if (userCount > 0) {
        return res.status(403).json({ error: 'Setup already completed' });
      }

      const { email, password } = req.body;
      const hashedPassword = await hashPassword(password);
      const user = await User.create({
        email,
        role: 'ADMIN',
        password: hashedPassword,
      });

      const token = generateJwt({ id: user.id, role: user.role });
      return res.status(201).json({ 
        message: 'Setup completed successfully',
        token 
      });
    } catch (error) {
      console.error('Error during setup:', error);
      return res.status(500).json({ 
        error: 'Failed to complete setup',
        details: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
);

router.post(
  '/login',
  validateZod(LoginSchema, 'body'),
  async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateJwt({ id: user.id, role: user.role });
    return res.status(200).json({ token });
  }
);

router.post(
  '/create-user',
  authenticateJwt(['ADMIN']),
  validateZod(CreateUserSchema, 'body'),
  async (req: Request, res: Response) => {
    const { email, role, password } = req.body;
    const hashedPassword = await hashPassword(password);
    const user = await User.create({
      email,
      role,
      password: hashedPassword,
    });
    return res.status(200).json({ user });
  }
);

export default router;
