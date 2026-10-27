# IMovies — User Flow

## Customer journey

```mermaid
flowchart TD
    A[Open IMovies] --> B[Home: featured movies]
    B --> C{Search or browse?}
    C -->|Search| D[Movies list filtered by title]
    C -->|Browse| E[Movies list]
    D --> F[Movie detail]
    E --> F
    F --> G[Pick a date]
    G --> H[Pick theatre and showtime]
    H --> I[Seat map for that show]

    I --> J[Select up to 10 seats]
    J --> K{Signed in?}
    K -->|No| L[Sign in or create account]
    L --> M[Return to seat map with selections restored]
    K -->|Yes| N[Confirm booking]
    M --> N

    N --> O{Seats still free?}
    O -->|No, 409| P[Seat map refreshes and taken seats clear]
    P --> J
    O -->|Yes| Q[Booking created with reference]
    Q --> R[Confirmation screen]
    R --> S[My bookings]
    S --> T[Cancel before showtime]
    T --> U[Seats released]
```

## Authentication flow

```mermaid
sequenceDiagram
    participant U as User
    participant C as React
    participant A as API
    participant D as MongoDB

    U->>C: Submit email + password
    C->>A: POST /api/auth/login
    A->>D: findOne({ email }).select('+password')
    D-->>A: user with hash
    A->>A: bcrypt.compare
    alt Wrong credentials
        A-->>C: 401 Email or password is incorrect
        C-->>U: Inline error
    else Valid
        A-->>C: 200 { token, user }
        C->>C: Store token in localStorage
        C->>A: GET /api/auth/me (on reload)
        A-->>C: 200 { user }
        C-->>U: Signed-in navigation
    end
```

## Admin journey

```mermaid
flowchart LR
    A[Sign in as admin] --> B[Admin dashboard]
    B --> C[Movies tab]
    B --> D[Theatres tab]
    B --> E[Showtimes tab]
    B --> F[Bookings tab]

    C --> C1[Create or edit movie]
    C --> C2[Delete movie]

    D --> D1[Create theatre + first screen]
    D --> D2[Add or remove screens]

    E --> E1[Schedule a showtime]
    E --> E2[Cancel a showtime]
    E --> E3[Delete a showtime]

    F --> F1[Filter by status]
    F --> F2[Search reference / customer / movie]
    F --> F3[Review revenue]
```

## Booking state machine

```mermaid
stateDiagram-v2
    [*] --> Selected: customer taps seats
    Selected --> Confirmed: POST /api/bookings succeeds
    Selected --> Conflict: seat taken (409)
    Conflict --> Selected: choose different seats
    Confirmed --> Cancelled: cancel before start time
    Confirmed --> Completed: showtime passes
    Cancelled --> [*]: seats released
    Completed --> [*]
```

## Guest-to-member hand-off

1. A guest selects seats on `/showtimes/:id/seats`.
2. The selection is stored in `sessionStorage` under `imovies.selection.<showtimeId>`.
3. Clicking **Sign in to book** redirects to `/login?redirect=/showtimes/<id>/seats`.
4. After login or registration the redirect returns to the same showtime.
5. The seat map reloads and restores any selected seats that are still available.

## Error paths

| Situation | What the customer sees |
|---|---|
| Seat taken between selection and confirm | Seats clear automatically and the map refreshes |
| Session expired | Redirect to sign in, then back to the flow |
| Showtime already started | Warning banner, confirm button disabled |
| Invalid seat label | 400 with `invalidSeats` details |
| More than 10 seats | Inline message on the seat panel |
| Cancelling after start | 409 with a clear explanation |
