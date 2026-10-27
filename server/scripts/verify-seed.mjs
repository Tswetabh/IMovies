import { spawnSync } from 'node:child_process';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongo = await MongoMemoryServer.create();
const uri = mongo.getUri('imovies-seed-check');

const seed = spawnSync(process.execPath, ['src/seed.js'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    MONGO_URI: uri,
    JWT_SECRET: process.env.JWT_SECRET || 'seed-check-secret',
  },
});

if (seed.status !== 0) {
  await mongo.stop();
  process.exit(seed.status ?? 1);
}

await mongoose.connect(uri);
const db = mongoose.connection.db;

const counts = {
  users: await db.collection('users').countDocuments(),
  movies: await db.collection('movies').countDocuments(),
  theatres: await db.collection('theatres').countDocuments(),
  showtimes: await db.collection('showtimes').countDocuments(),
  bookings: await db.collection('bookings').countDocuments(),
};

console.log('\nCollection counts:', counts);

const admin = await db.collection('users').findOne({ email: 'admin@imovies.test' });
console.log('Admin exists:', Boolean(admin), '| role:', admin?.role);
console.log('Password stored hashed:', admin?.password?.startsWith('$2'));

const bookingIndexes = await db.collection('bookings').indexes();
const seatIndex = bookingIndexes.find((index) => index.key?.seats);
console.log('Seat uniqueness index:', JSON.stringify(seatIndex));

const demoShowtime = await db.collection('showtimes').findOne({});
const demoSeats = await db
  .collection('bookings')
  .find({ showtime: demoShowtime._id, status: 'confirmed' })
  .toArray();

console.log(
  'Demo bookings on first showtime:',
  demoSeats.map((booking) => booking.seats)
);

await mongoose.disconnect();
await mongo.stop();
