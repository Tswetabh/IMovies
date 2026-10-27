import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api, { apiMessage } from '../services/api.js';
import { useAuth } from '../context/AuthContext.jsx';
import SeatGrid from '../components/SeatGrid.jsx';
import Loading from '../components/Loading.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import { formatCurrency, formatDate, formatTime } from '../utils/format.js';

const MAX_SEATS = 10;
const selectionKey = (id) => `imovies.selection.${id}`;

function readSavedSelection(id) {
  try {
    const raw = sessionStorage.getItem(selectionKey(id));
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function SeatBooking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [data, setData] = useState(null);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [booking, setBooking] = useState(null);
  const restored = useRef(false);

  const loadSeats = useCallback(() => {
    setLoading(true);
    setError('');

    return api
      .get(`/showtimes/${id}/seats`)
      .then(({ data: response }) => {
        setData(response.data);

        if (!restored.current) {
          restored.current = true;
          const available = new Set(
            response.data.rows.flatMap((row) =>
              row.seats.filter((seat) => seat.status === 'available').map((seat) => seat.label)
            )
          );
          const saved = readSavedSelection(id).filter((seat) => available.has(seat));
          if (saved.length > 0) setSelected(saved);
        }
      })
      .catch((requestError) => {
        setError(apiMessage(requestError, 'Could not load seats for this showtime.'));
      })
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    loadSeats();
  }, [loadSeats]);

  useEffect(() => {
    if (booking || !restored.current) return;
    sessionStorage.setItem(selectionKey(id), JSON.stringify(selected));
  }, [selected, id, booking]);

  const toggleSeat = (label) => {
    setSubmitError('');

    if (!selected.includes(label) && selected.length >= MAX_SEATS) {
      setSubmitError(`You can book at most ${MAX_SEATS} seats in one booking.`);
      return;
    }

    setSelected((current) =>
      current.includes(label)
        ? current.filter((seat) => seat !== label)
        : [...current, label]
    );
  };

  const handleConfirm = async () => {
    if (selected.length === 0) {
      setSubmitError('Pick at least one seat to continue.');
      return;
    }

    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent(`/showtimes/${id}/seats`)}`);
      return;
    }

    setSubmitting(true);
    setSubmitError('');

    try {
      const { data: response } = await api.post('/bookings', {
        showtimeId: id,
        seats: selected,
      });

      setBooking(response.data.booking);
      setSelected([]);
      sessionStorage.removeItem(selectionKey(id));
    } catch (requestError) {
      setSubmitError(apiMessage(requestError, 'Could not complete the booking.'));

      if (requestError.response?.status === 409) {
        const taken = requestError.response.data.details?.takenSeats ?? [];
        restored.current = true;
        setSelected((current) => current.filter((seat) => !taken.includes(seat)));
        await loadSeats();
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="container page">
        <Loading label="Loading the seat map…" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container page">
        <ErrorAlert message={error || 'Showtime not found.'} onRetry={loadSeats} />
        <Link to="/movies" className="btn btn-outline-light">
          Back to movies
        </Link>
      </div>
    );
  }

  const { showtime, screen, rows, ticketPrice, availableSeats } = data;
  const movie = showtime.movie;
  const theatre = showtime.theatre;
  const total = ticketPrice * selected.length;

  if (booking) {
    return (
      <div className="container page">
        <div className="confirmation-card">
          <span className="confirmation-icon">
            <i className="bi bi-check-lg" aria-hidden="true" />
          </span>
          <h1>You are booked!</h1>
          <p className="confirmation-sub">
            Show this reference at the counter. Seats are held under your account.
          </p>

          <div className="confirmation-reference">
            <span>Booking reference</span>
            <strong>{booking.reference}</strong>
          </div>

          <dl className="confirmation-details">
            <div>
              <dt>Movie</dt>
              <dd>{booking.movie?.title ?? 'Movie'}</dd>
            </div>
            <div>
              <dt>Theatre</dt>
              <dd>{booking.theatre?.name}</dd>
            </div>
            <div>
              <dt>Showtime</dt>
              <dd>
                {formatDate(booking.showtime.startTime)} ·{' '}
                {formatTime(booking.showtime.startTime)}
              </dd>
            </div>
            <div>
              <dt>Seats</dt>
              <dd>{booking.seats.join(', ')}</dd>
            </div>
            <div>
              <dt>Total paid</dt>
              <dd>{formatCurrency(booking.totalAmount)}</dd>
            </div>
          </dl>

          <div className="confirmation-actions">
            <Link to="/bookings" className="btn btn-gold">
              View my bookings
            </Link>
            <Link to="/movies" className="btn btn-outline-light">
              Browse more movies
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container page">
      <Link to={`/movies/${movie?.id}`} className="back-link">
        <i className="bi bi-arrow-left" aria-hidden="true" /> Back to {movie?.title}
      </Link>

      <header className="booking-head">
        <div>
          <span className="eyebrow">Select seats</span>
          <h1>{movie?.title}</h1>
          <p>
            {theatre?.name} · {screen?.name} · {formatDate(showtime.startTime)} at{' '}
            {formatTime(showtime.startTime)}
          </p>
        </div>

        <div className="booking-head-meta">
          <span className="pill">{showtime.format}</span>
          <span className="pill">{formatCurrency(ticketPrice)} / seat</span>
          <span className="pill">{availableSeats} available</span>
        </div>
      </header>

      {showtime.status !== 'scheduled' && (
        <div className="alert alert-warning">
          This showtime is no longer accepting bookings.
        </div>
      )}

      <div className="booking-layout">
        <section className="seat-panel">
          <div className="seat-legend">
            <span>
              <i className="legend-dot legend-available" /> Available
            </span>
            <span>
              <i className="legend-dot legend-selected" /> Selected
            </span>
            <span>
              <i className="legend-dot legend-booked" /> Booked
            </span>
          </div>

          <SeatGrid rows={rows} selected={selected} onToggle={toggleSeat} />

          <p className="seat-note">
            <i className="bi bi-info-circle" aria-hidden="true" /> Up to {MAX_SEATS} seats per
            booking. Seats are only locked once you confirm.
          </p>
        </section>

        <aside className="summary-panel">
          <h2>Your selection</h2>

          {selected.length === 0 ? (
            <p className="summary-empty">Tap a seat on the map to get started.</p>
          ) : (
            <>
              <div className="summary-seats">
                {selected.map((seat) => (
                  <button
                    key={seat}
                    type="button"
                    className="seat-tag"
                    onClick={() => toggleSeat(seat)}
                    aria-label={`Remove seat ${seat}`}
                  >
                    {seat} <i className="bi bi-x" aria-hidden="true" />
                  </button>
                ))}
              </div>

              <dl className="summary-lines">
                <div>
                  <dt>
                    Tickets ({selected.length} × {formatCurrency(ticketPrice)})
                  </dt>
                  <dd>{formatCurrency(total)}</dd>
                </div>
                <div>
                  <dt>Convenience fee</dt>
                  <dd>{formatCurrency(0)}</dd>
                </div>
                <div className="summary-total">
                  <dt>Total</dt>
                  <dd>{formatCurrency(total)}</dd>
                </div>
              </dl>
            </>
          )}

          <ErrorAlert message={submitError} />

          <button
            type="button"
            className="btn btn-gold w-100"
            disabled={selected.length === 0 || submitting || showtime.status !== 'scheduled'}
            onClick={handleConfirm}
          >
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Booking…
              </>
            ) : user ? (
              `Confirm ${selected.length || ''} ${selected.length === 1 ? 'seat' : 'seats'}`
            ) : (
              'Sign in to book'
            )}
          </button>

          {!user && (
            <p className="summary-hint">
              You can pick seats first — we will ask you to sign in before confirming.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
