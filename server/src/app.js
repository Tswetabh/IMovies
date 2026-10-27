import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { env } from './config/env.js';
import { apiRouter } from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { ApiError, notFound } from './utils/http.js';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(
    cors({
      origin(origin, callback) {
        const allowAll = env.clientUrl.includes('*');

        if (!origin || allowAll || env.clientUrl.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(new ApiError(403, `Origin ${origin} is not allowed by CORS`));
      },
    })
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  if (env.nodeEnv !== 'test') {
    app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));
  }

  app.get('/api/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        status: 'ok',
        service: 'imovies-api',
        uptimeSeconds: Math.round(process.uptime()),
      },
    });
  });

  app.use('/api', apiRouter);
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
