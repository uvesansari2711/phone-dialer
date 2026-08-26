import mongoose from 'mongoose';
import { config } from '../config/env.js';
import { logger } from '../config/logger.js';

export async function connectDatabase(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri);
  logger.info('Connected to MongoDB');
}

export async function disconnectDatabase(): Promise<void> {
  await mongoose.disconnect();
}
