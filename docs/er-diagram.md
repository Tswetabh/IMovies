# IMovies — Entity Relationship Diagram

## Model diagram

```mermaid
erDiagram
    USER ||--o{ BOOKING : places
    MOVIE ||--o{ SHOWTIME : screens
    THEATRE ||--|{ SCREEN : contains
    THEATRE ||--o{ SHOWTIME : hosts
    SCREEN ||--o{ SHOWTIME : used_by
    SHOWTIME ||--o{ BOOKING : receives

    USER {
        ObjectId id PK
        string name
        string email UK
        string password "bcrypt hash"
        string role "customer | admin"
        Date createdAt
        Date updatedAt
    }

    MOVIE {
        ObjectId id PK
        string title
        string description
        string posterUrl
        string trailerUrl
        string[] genres
        string[] languages
        number durationMinutes
        Date releaseDate
        number rating "0-10"
        string certificate "U | UA | A | S"
        string status "now_showing | coming_soon | archived"
        string director
        string[] cast
        Date createdAt
        Date updatedAt
    }

    THEATRE {
        ObjectId id PK
        string name
        string city
        string address
        Screen[] screens "embedded"
        Date createdAt
        Date updatedAt
    }

    SCREEN {
        ObjectId id PK
        string name
        number rows "1-26"
        number seatsPerRow "1-40"
        string format "2D | 3D | IMAX | 4DX"
    }

    SHOWTIME {
        ObjectId id PK
        ObjectId movie FK
        ObjectId theatre FK
        ObjectId screenId FK
        Date startTime
        number ticketPrice
        string language
        string format
        string status "scheduled | cancelled | completed"
        Date createdAt
        Date updatedAt
    }

    BOOKING {
        ObjectId id PK
        string reference UK "IMO-XXXXXX"
        ObjectId user FK
        ObjectId showtime FK
        ObjectId movie FK
        ObjectId theatre FK
        string[] seats "e.g. A1, A2"
        number totalAmount
        string status "confirmed | cancelled"
        Date cancelledAt
        Date createdAt
        Date updatedAt
    }
```

## Relational view

| From | Cardinality | To | Notes |
|---|---|---|---|
| User | 1 → many | Booking | A customer can hold many bookings |
| Movie | 1 → many | Showtime | A movie can run at many times |
| Theatre | 1 → many | Screen | Screens are embedded documents |
| Theatre | 1 → many | Showtime | A theatre hosts many shows |
| Screen | 1 → many | Showtime | `screenId` points at an embedded screen |
| Showtime | 1 → many | Booking | One show has many bookings |

## Seat availability

Seats are **not** stored as rows in a collection. The screen stores `rows` and `seatsPerRow`; labels are generated as `A1 … Z40`.

Availability for a showtime is derived:

```text
all seats      = every label in rows × seatsPerRow
booked seats   = union of seats on confirmed bookings for that showtime
available     = all seats − booked seats
```

This keeps the schema small and means changing a screen's layout immediately changes future shows.

## Key indexes

| Collection | Index | Purpose |
|---|---|---|
| `users` | `{ email: 1 }` unique | Prevent duplicate accounts |
| `movies` | `{ title: "text", description: "text" }` | Full-text search |
| `movies` | `{ status: 1 }` | Filter now showing / coming soon |
| `showtimes` | `{ movie: 1, startTime: 1 }` | Movie detail page |
| `showtimes` | `{ theatre: 1, startTime: 1 }` | Theatre schedule |
| `bookings` | `{ reference: 1 }` unique | Booking lookup |
| `bookings` | `{ user: 1 }` | My bookings |
| `bookings` | `{ showtime: 1, seats: 1 }` unique, partial `status: "confirmed"` | **Prevents double booking** |

The partial unique index is the core integrity guarantee. A cancelled booking leaves the index, freeing its seats for the next customer.
