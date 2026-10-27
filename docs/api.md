# IMovies — API Reference

Base URL: `http://localhost:5000/api`

All responses are JSON.

```json
// success
{ "success": true, "data": { } }

// failure
{ "success": false, "message": "Human readable reason", "details": { } }
```

Authenticated requests send:

```http
Authorization: Bearer <jwt>
```

---

## Health

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/health` | — | Service status and uptime |

---

## Authentication

| Method | Path | Auth | Body | Description |
|---|---|---|---|---|
| POST | `/auth/register` | — | `name, email, password` | Create a customer account |
| POST | `/auth/login` | — | `email, password` | Returns `{ token, user }` |
| GET | `/auth/me` | Bearer | — | Current user |

Register returns `201`. Passwords must be at least 8 characters.

---

## Movies

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/movies` | — | List movies |
| GET | `/movies/:id` | — | Single movie |
| POST | `/movies` | Admin | Create |
| PATCH | `/movies/:id` | Admin | Update |
| DELETE | `/movies/:id` | Admin | Delete (blocked while scheduled showtimes exist) |

### Query parameters for `GET /movies`

| Param | Example | Meaning |
|---|---|---|
| `q` | `neon` | Case-insensitive title search |
| `genre` | `Thriller` | Exact genre match |
| `language` | `Hindi` | Exact language match |
| `status` | `now_showing` | `now_showing`, `coming_soon`, `archived` |
| `page` | `2` | Page number |
| `limit` | `24` | Page size (max 60) |

### Movie payload

```json
{
  "title": "Neon Horizon",
  "description": "A courier pilot smuggles a stolen memory…",
  "posterUrl": "https://…",
  "trailerUrl": "https://…",
  "genres": ["Sci-Fi", "Thriller"],
  "languages": ["English", "Hindi"],
  "durationMinutes": 128,
  "releaseDate": "2026-09-18",
  "rating": 8.4,
  "certificate": "UA",
  "status": "now_showing",
  "director": "Aria Kulkarni",
  "cast": ["Dev Malhotra", "Ines Ferreira"]
}
```

---

## Theatres and screens

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/theatres` | — | List theatres with embedded screens |
| GET | `/theatres/:id` | — | Single theatre |
| POST | `/theatres` | Admin | Create theatre with screens |
| PATCH | `/theatres/:id` | Admin | Update name / city / address |
| DELETE | `/theatres/:id` | Admin | Delete (blocked if showtimes exist) |
| POST | `/theatres/:id/screens` | Admin | Add a screen |
| DELETE | `/theatres/:id/screens/:screenId` | Admin | Remove a screen |

```json
{
  "name": "PVR Icon, Andheri",
  "city": "Mumbai",
  "address": "4th Floor, Infiniti Mall",
  "screens": [
    { "name": "Audi 1", "rows": 8, "seatsPerRow": 10, "format": "2D" }
  ]
}
```

Limits: `rows` 1–26, `seatsPerRow` 1–40.

---

## Showtimes

| Method | Path | Auth | Description |
|---|---|---|---|
| GET | `/showtimes` | — | List scheduled showtimes |
| GET | `/showtimes/:id` | — | Single showtime |
| GET | `/showtimes/:id/seats` | — | Seat map and availability |
| POST | `/showtimes` | Admin | Schedule a show |
| PATCH | `/showtimes/:id` | Admin | Update time, price, status |
| DELETE | `/showtimes/:id` | Admin | Delete (blocked if confirmed bookings exist) |

### Query parameters for `GET /showtimes`

| Param | Meaning |
|---|---|
| `movie` | Movie id |
| `theatre` | Theatre id |
| `date` | `YYYY-MM-DD` (UTC day) |
| `status` | `scheduled` (default), `cancelled`, `completed`, `all` |
| `includePast` | `true` to include past shows |

### Seat map response

```json
{
  "success": true,
  "data": {
    "showtime": { "id": "…", "startTime": "2026-10-27T18:30:00.000Z" },
    "screen": { "id": "…", "name": "Audi 1", "rows": 8, "seatsPerRow": 10, "format": "2D" },
    "rows": [
      {
        "row": "A",
        "seats": [
          { "label": "A1", "status": "available" },
          { "label": "A2", "status": "booked" }
        ]
      }
    ],
    "bookedSeats": ["A2"],
    "availableSeats": 79,
    "ticketPrice": 250
  }
}
```

---

## Bookings

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/bookings` | Customer / Admin | Create a booking |
| GET | `/bookings/my-bookings` | Bearer | Current user's bookings |
| GET | `/bookings/:id` | Owner or admin | Single booking |
| PATCH | `/bookings/:id/cancel` | Owner or admin | Cancel and release seats |
| GET | `/bookings/admin/all` | Admin | Every booking |

### Create booking

```http
POST /api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{ "showtimeId": "6720…", "seats": ["A1", "A2"] }
```

Response `201`:

```json
{
  "success": true,
  "data": {
    "booking": {
      "id": "6721…",
      "reference": "IMO-8K2F4Q",
      "seats": ["A1", "A2"],
      "totalAmount": 500,
      "status": "confirmed",
      "movie": { "title": "Neon Horizon" },
      "theatre": { "name": "PVR Icon, Andheri" },
      "showtime": { "startTime": "2026-10-27T18:30:00.000Z" }
    }
  }
}
```

### Rules

- 1–10 seats per booking.
- Every seat must exist on the screen (`rows × seatsPerRow`).
- Showtime must be `scheduled` and in the future.
- Seats held by a confirmed booking are rejected with `409`.
- A unique partial index prevents simultaneous duplicate bookings.
- Cancelling is allowed until the showtime begins.

### Error examples

```json
// 409 — someone got there first
{
  "success": false,
  "message": "Some of those seats were just booked",
  "details": { "takenSeats": ["A2"] }
}

// 400 — seat does not exist
{
  "success": false,
  "message": "Some of those seats do not exist on this screen",
  "details": { "invalidSeats": ["Z99"] }
}

// 401
{ "success": false, "message": "Please sign in to continue" }

// 403
{ "success": false, "message": "You do not have permission to do that" }
```

---

## Status codes

| Code | Meaning |
|---|---|
| 200 | OK |
| 201 | Created |
| 400 | Invalid input / invalid seat / malformed id |
| 401 | Missing or expired token |
| 403 | Authenticated but not allowed |
| 404 | Resource or route not found |
| 409 | Conflict: duplicate email, seat taken, dependency exists |
| 422 | Schema validation failed |
| 500 | Unexpected server error |
