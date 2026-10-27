# IMovies — Movie ticket booking made simple

IMovies is a full-stack MERN application for browsing movies, comparing showtimes and reserving seats with real-time availability. It ships with JWT authentication, customer and admin roles, an interactive seat map, and server-side protection against double bookings.

| | |
|---|---|
| **Frontend** | React 19, Vite, Bootstrap 5, React Router |
| **Backend** | Node.js, Express 5, Mongoose |
| **Database** | MongoDB (local or Atlas) |
| **Auth** | JWT + bcrypt password hashing |
| **Tests** | Node test runner + Supertest, in-memory MongoDB for integration |

---

## Features

**Customers**

- Browse, search and filter movies by genre
- See showtimes grouped by date and theatre
- Live seat map with available, selected and booked seats
- Book up to 10 seats per transaction
- Booking reference and full booking history
- Cancel a booking before the showtime starts — seats are released instantly

**Admins**

- Create, edit and delete movies
- Manage theatres and screens (rows × seats, 2D/3D/IMAX/4DX)
- Schedule showtimes and cancel them
- Monitor every booking with revenue totals

**Engineering**

- Server-side validation of every seat against the screen layout
- A unique partial index guarantees two people cannot hold the same seat
- Centralised error handling and consistent JSON responses
- Seeded demo data (8 movies, 3 theatres, 7 screens, ~70 showtimes)

---

## Quick start

### 1. Prerequisites

- Node.js 18 or newer (built and tested on Node 24)
- npm 9 or newer
- Git
- MongoDB — either a free **MongoDB Atlas** cluster or a local `mongod`

### 2. Install dependencies

```bash
npm run install:all
```

Or install each side separately:

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Create the environment file

```bash
cd server
cp .env.example .env
```

Then edit `server/.env`:

```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/imovies
JWT_SECRET=<a long random string>
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ADMIN_NAME=IMovies Admin
ADMIN_EMAIL=admin@imovies.test
ADMIN_PASSWORD=Admin@12345
```

> The repository ships an `.env` pointing at `mongodb://127.0.0.1:27017/imovies`. If you use Atlas, replace `MONGO_URI` with your connection string.

**Getting an Atlas connection string**

1. Create a free account at <https://www.mongodb.com/cloud/atlas>.
2. Create a free M0 cluster.
3. Add a database user and allow your IP (or `0.0.0.0/0` while developing).
4. Click **Connect → Drivers** and copy the `mongodb+srv://...` string.
5. Append the database name, e.g. `.../imovies?retryWrites=true&w=majority`.

### 4. Seed the database

```bash
npm run seed
```

This clears the collections and creates demo movies, theatres, screens, showtimes and two sample bookings.

### 5. Run both apps

```bash
npm run dev
```

- Frontend: <http://localhost:5173>
- API: <http://localhost:5000/api/health>

Or run them in two terminals:

```bash
npm run dev:server
npm run dev:client
```

### Demo accounts

| Role | Email | Password |
|---|---|---|
| Customer | `demo@imovies.test` | `Demo@12345` |
| Admin | `admin@imovies.test` | `Admin@12345` |

---

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Run API and React app together |
| `npm run dev:server` | API only, with file watching |
| `npm run dev:client` | Vite dev server only |
| `npm run seed` | Reset and seed demo data |
| `npm test` | Unit tests (no database needed) |
| `npm run test:integration` | Full API suite against an in-memory MongoDB |
| `npm run build` | Production build of the React app |

---

## Project structure

```text
.
├── client/                    React application
│   ├── src/
│   │   ├── components/        Shared UI + seat grid + admin panels
│   │   ├── context/           Auth context (JWT session)
│   │   ├── pages/             Route-level screens
│   │   ├── services/          Axios instance and error helpers
│   │   └── utils/             Date, currency and duration formatting
│   └── vite.config.js         Dev proxy: /api → localhost:5000
│
├── server/                    Express API
│   ├── src/
│   │   ├── config/            Environment + MongoDB connection
│   │   ├── controllers/       Request handlers
│   │   ├── middleware/        Auth, error handling
│   │   ├── models/            Mongoose schemas
│   │   ├── routes/            REST routes
│   │   ├── utils/             Seat maths, tokens, HTTP helpers
│   │   ├── app.js             Express app factory
│   │   ├── server.js          Startup + graceful shutdown
│   │   └── seed.js            Demo data
│   ├── scripts/               Integration test runner
│   └── tests/                 Unit + API tests
│
├── docs/                      Architecture, ER diagram, user flow, API
└── package.json               Root convenience scripts
```

---

## How seat locking works

1. `GET /api/showtimes/:id/seats` returns the screen layout plus every confirmed seat.
2. `POST /api/bookings` re-validates each requested seat against the screen's rows and columns.
3. A pre-check rejects seats that are already confirmed.
4. A **unique partial index** on `{ showtime, seats }` where `status: 'confirmed'` makes the final insert atomic — two simultaneous requests for the same seat cannot both succeed.
5. Cancelling a booking flips its status, which removes it from the partial index and frees the seats.

---

## Documentation

- [Architecture](docs/architecture.md)
- [ER diagram](docs/er-diagram.md)
- [User flow](docs/user-flow.md)
- [API reference](docs/api.md)

---

## Deployment

### Database — MongoDB Atlas

Create the cluster, database user and network rule, then use the SRV connection string as `MONGO_URI`.

### Backend — Render (example)

1. Create a **Web Service** from your GitHub repository.
2. Root directory: `server`.
3. Build command: `npm install`.
4. Start command: `npm start`.
5. Environment variables: `MONGO_URI`, `JWT_SECRET`, `CLIENT_URL` (your deployed frontend URL), `NODE_ENV=production`.
6. After the first deploy, seed once from the Render shell: `npm run seed`.

### Frontend — Vercel (example)

1. Import the repository and set **Root Directory** to `client`.
2. Framework preset: Vite. Build command `npm run build`, output `dist`.
3. Environment variable: `VITE_API_URL=https://<your-api>.onrender.com/api`.
4. Redeploy, then add the frontend URL to `CLIENT_URL` on the backend.

### Before you submit

- [ ] Demo link opens and the browse → seats → booking flow works
- [ ] GitHub repository is public and has this README
- [ ] `.env` is **not** committed (it is git-ignored)
- [ ] `npm test` and `npm run test:integration` pass
- [ ] Demo credentials are included in the submission notes

---

## Troubleshooting

| Symptom | Fix |
|---|---|
| `Cannot reach the IMovies API` | Start the backend on port 5000, or check `VITE_API_URL` |
| `Missing required environment variables` | Create `server/.env` from `.env.example` |
| `MongooseServerSelectionError` | Check the Atlas IP allow-list and password encoding |
| Seats look stale after a conflict | The UI refreshes the seat map automatically; re-select seats |
| CORS error in production | Add the frontend origin to `CLIENT_URL` on the backend |
