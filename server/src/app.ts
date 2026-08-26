import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: config.clientUrl,
      credentials: true,
    }),
  );

  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.use('/api', routes);

  app.use(errorHandler);

  return app;
}
