import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';

const TEST_URI = process.env.MONGO_URI_TEST;

if (TEST_URI) {
  process.env.MONGO_URI = TEST_URI;
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'integration-test-secret';
  process.env.NODE_ENV = 'test';
  process.env.CLIENT_URL = 'http://localhost:5173';
}

describe(
  'IMovies API integration',
  { skip: TEST_URI ? false : 'Set MONGO_URI_TEST to run the database-backed suite' },
  () => {
    const state = {
      app: null,
      disconnect: null,
      customer: { token: null },
      other: { token: null },
      admin: { token: null },
      movieId: null,
      theatreId: null,
      screenId: null,
      showtimeId: null,
      bookingId: null,
    };

    before(async () => {
      const { createApp } = await import('../src/app.js');
      const { connectDb, disconnectDb } = await import('../src/config/db.js');
      const { User } = await import('../src/models/User.js');
      const mongoose = (await import('mongoose')).default;

      await connectDb(TEST_URI);
      await mongoose.connection.dropDatabase();

      state.app = createApp();
      state.disconnect = disconnectDb;

      await User.create({
        name: 'Integration Admin',
        email: 'admin@integration.test',
        password: 'Admin@12345',
        role: 'admin',
      });
    });

    after(async () => {
      if (state.disconnect) await state.disconnect();
    });

    test('health endpoint responds', async () => {
      const response = await request(state.app).get('/api/health').expect(200);
      assert.equal(response.body.data.status, 'ok');
    });

    test('customer can register and read their profile', async () => {
      const response = await request(state.app)
        .post('/api/auth/register')
        .send({ name: 'Integration Customer', email: 'customer@integration.test', password: 'Passw0rd!' })
        .expect(201);

      state.customer.token = response.body.data.token;
      assert.equal(response.body.data.user.role, 'customer');

      const profile = await request(state.app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${state.customer.token}`)
        .expect(200);

      assert.equal(profile.body.data.user.email, 'customer@integration.test');
    });

    test('duplicate registration is rejected', async () => {
      await request(state.app)
        .post('/api/auth/register')
        .send({ name: 'Copy', email: 'customer@integration.test', password: 'Passw0rd!' })
        .expect(409);
    });

    test('login rejects a wrong password', async () => {
      await request(state.app)
        .post('/api/auth/login')
        .send({ email: 'customer@integration.test', password: 'wrong-password' })
        .expect(401);
    });

    test('admin can log in', async () => {
      const response = await request(state.app)
        .post('/api/auth/login')
        .send({ email: 'admin@integration.test', password: 'Admin@12345' })
        .expect(200);

      state.admin.token = response.body.data.token;
      assert.equal(response.body.data.user.role, 'admin');
    });

    test('customers cannot create movies', async () => {
      await request(state.app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${state.customer.token}`)
        .send({ title: 'Nope', description: 'Nope', durationMinutes: 90, releaseDate: '2026-01-01' })
        .expect(403);
    });

    test('admin can create a movie, theatre and showtime', async () => {
      const movie = await request(state.app)
        .post('/api/movies')
        .set('Authorization', `Bearer ${state.admin.token}`)
        .send({
          title: 'Integration Feature',
          description: 'A film created by the test suite.',
          durationMinutes: 110,
          releaseDate: '2026-10-01',
          genres: ['Drama'],
          languages: ['English'],
          status: 'now_showing',
        })
        .expect(201);

      state.movieId = movie.body.data.movie.id;

      const theatre = await request(state.app)
        .post('/api/theatres')
        .set('Authorization', `Bearer ${state.admin.token}`)
        .send({
          name: 'Integration Cinema',
          city: 'Testville',
          screens: [{ name: 'Screen 1', rows: 4, seatsPerRow: 5, format: '2D' }],
        })
        .expect(201);

      state.theatreId = theatre.body.data.theatre.id;
      state.screenId = theatre.body.data.theatre.screens[0].id;

      const startTime = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

      const showtime = await request(state.app)
        .post('/api/showtimes')
        .set('Authorization', `Bearer ${state.admin.token}`)
        .send({
          movie: state.movieId,
          theatre: state.theatreId,
          screenId: state.screenId,
          startTime,
          ticketPrice: 300,
        })
        .expect(201);

      state.showtimeId = showtime.body.data.showtime.id;
      assert.equal(showtime.body.data.showtime.screen.rows, 4);
    });

    test('seat map starts fully available', async () => {
      const response = await request(state.app)
        .get(`/api/showtimes/${state.showtimeId}/seats`)
        .expect(200);

      assert.equal(response.body.data.rows.length, 4);
      assert.equal(response.body.data.availableSeats, 20);
      assert.equal(response.body.data.bookedSeats.length, 0);
    });

    test('a seat outside the screen is rejected', async () => {
      await request(state.app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${state.customer.token}`)
        .send({ showtimeId: state.showtimeId, seats: ['Z99'] })
        .expect(400);
    });

    test('customer can book seats', async () => {
      const response = await request(state.app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${state.customer.token}`)
        .send({ showtimeId: state.showtimeId, seats: ['A1', 'A2'] })
        .expect(201);

      state.bookingId = response.body.data.booking.id;
      assert.equal(response.body.data.booking.totalAmount, 600);
      assert.deepEqual(response.body.data.booking.seats, ['A1', 'A2']);
      assert.match(response.body.data.booking.reference, /^IMO-/);
    });

    test('the booked seats show up as unavailable', async () => {
      const response = await request(state.app)
        .get(`/api/showtimes/${state.showtimeId}/seats`)
        .expect(200);

      assert.deepEqual(response.body.data.bookedSeats.sort(), ['A1', 'A2']);
      assert.equal(response.body.data.availableSeats, 18);
    });

    test('another customer cannot take the same seats', async () => {
      const registered = await request(state.app)
        .post('/api/auth/register')
        .send({ name: 'Second Customer', email: 'second@integration.test', password: 'Passw0rd!' })
        .expect(201);

      state.other.token = registered.body.data.token;

      const response = await request(state.app)
        .post('/api/bookings')
        .set('Authorization', `Bearer ${state.other.token}`)
        .send({ showtimeId: state.showtimeId, seats: ['A2', 'A3'] })
        .expect(409);

      assert.equal(response.body.success, false);
    });

    test('customer sees the booking in their history', async () => {
      const response = await request(state.app)
        .get('/api/bookings/my-bookings')
        .set('Authorization', `Bearer ${state.customer.token}`)
        .expect(200);

      assert.equal(response.body.data.bookings.length, 1);
      assert.equal(response.body.data.bookings[0].movie.title, 'Integration Feature');
    });

    test('another customer cannot read the booking', async () => {
      await request(state.app)
        .get(`/api/bookings/${state.bookingId}`)
        .set('Authorization', `Bearer ${state.other.token}`)
        .expect(403);
    });

    test('cancelling a booking releases the seats', async () => {
      await request(state.app)
        .patch(`/api/bookings/${state.bookingId}/cancel`)
        .set('Authorization', `Bearer ${state.customer.token}`)
        .expect(200);

      const seats = await request(state.app)
        .get(`/api/showtimes/${state.showtimeId}/seats`)
        .expect(200);

      assert.equal(seats.body.data.availableSeats, 20);
      assert.equal(seats.body.data.bookedSeats.length, 0);
    });

    test('a movie with scheduled showtimes cannot be deleted', async () => {
      await request(state.app)
        .delete(`/api/movies/${state.movieId}`)
        .set('Authorization', `Bearer ${state.admin.token}`)
        .expect(409);
    });
  }
);
