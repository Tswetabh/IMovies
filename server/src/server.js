import { assertEnv, env } from './config/env.js';
import { connectDb, disconnectDb } from './config/db.js';
import { createApp } from './app.js';

async function start() {
  try {
    assertEnv();
    await connectDb();

    const app = createApp();
    const server = app.listen(env.port, () => {
      console.log(`IMovies API listening on http://localhost:${env.port}`);
      console.log(`Environment: ${env.nodeEnv}`);
    });

    const shutdown = async (signal) => {
      console.log(`\n${signal} received, shutting down...`);
      server.close(async () => {
        await disconnectDb();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    console.error('Failed to start the API:', error.message);
    process.exit(1);
  }
}

start();
