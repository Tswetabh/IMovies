import dns from 'node:dns';
import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb(uri = env.mongoUri) {
  if (!uri) {
    throw new Error(
      'MONGO_URI is not set. Copy server/.env.example to server/.env and add your connection string.'
    );
  }

  // Some local networks refuse SRV lookups through the system resolver.
  // Setting MONGO_DNS_SERVERS lets Node use public DNS for Atlas SRV records.
  if (process.env.MONGO_DNS_SERVERS) {
    const servers = process.env.MONGO_DNS_SERVERS.split(',')
      .map((server) => server.trim())
      .filter(Boolean);

    if (servers.length > 0) dns.setServers(servers);
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });

  return mongoose.connection;
}

export async function disconnectDb() {
  await mongoose.connection.close();
}
