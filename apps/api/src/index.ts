import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';

import authRoutes from './auth/routes';
import tracesRoutes from './traces/routes';
import apiKeysRoutes from './api-keys/routes';
import analyticsRoutes from './analytics/routes';

const app = express();
const PORT = process.env.PORT || 3001;

mongoose
  .connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/traces')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => {
  return res
    .status(200)
    .json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/traces', tracesRoutes);
app.use('/api-keys', apiKeysRoutes);
app.use('/analytics', analyticsRoutes);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
