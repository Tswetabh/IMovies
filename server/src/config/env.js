import dotenv from 'dotenv';

dotenv.config({ quiet: true });

const required = ['MONGO_URI', 'JWT_SECRET'];

export const env = {
  port: Number(process.env.PORT) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGO_URI || '',
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: (process.env.CLIENT_URL || 'http://localhost:5173')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  admin: {
    name: process.env.ADMIN_NAME || 'IMovies Admin',
    email: process.env.ADMIN_EMAIL || 'admin@imovies.test',
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
  },
};

export function assertEnv() {
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}. ` +
        'Copy server/.env.example to server/.env and fill in the values.'
    );
  }
}
