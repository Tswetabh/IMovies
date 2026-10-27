import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import api, { apiMessage } from '../services/api.js';
import Poster from '../components/Poster.jsx';
import Loading from '../components/Loading.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { formatCurrency, formatDate, formatTime } from '../utils/format.js';

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [tab, setTab] = useState('upcoming');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingId, setPendingId] = useState(null);

  useEffect(() => {
    let active = true;

    api
      .get('/bookings/my-bookings')
      .then(({ data }) => {
        if (active) setBookings(data.data.bookings);
      })
      .catch((requestError) => {
        if (active) setError(apiMessage(requestError, 'Could not load your bookings.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const groups = useMemo(() => {
    const now = Date.now();
    const upcoming = [];
    const history = [];

    for (const booking of bookings) {
      const startsAt = booking.showtime ? new Date(booking.showtime.startTime).getTime() : 0;
      const isUpcoming = booking.status === 'confirmed' && startsAt > now;
      (isUpcoming ? upcoming : history).push(booking);
    }

    return { upcoming, history };
  }, [bookings]);

  const visible = tab === 'upcoming' ? groups.upcoming : groups.history;

  const cancelBooking = async (booking) => {
    const confirmed = window.confirm(
      `Cancel ${booking.seats.length} seat(s) for ${booking.movie?.title}? Seats are released immediately.`
    );

    if (!confirmed) return;

    setPendingId(booking.id);
    setError('');

    try {
      const { data } = await api.patch(`/bookings/${booking.id}/cancel`);
      const updated = data.data.booking;

      setBookings((current) =>
        current.map((item) => (item.id === updated.id ? { ...item, ...updated } : item))
      );
      setTab('history');
    } catch (requestError) {
      setError(apiMessage(requestError, 'Could not cancel that booking.'));
    } finally {
      setPendingId(null);
    }
  };

  return (
    <div className="container page">
      <header className="page-head">
        <div>
          <span className="eyebrow">Your tickets</span>
          <h1>My bookings</h1>
          <p>Everything you have booked, all in one place.</p>
        </div>
      </header>

      <div className="tabs-row" role="tablist" aria-label="Booking filters">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'upcoming'}
          className={`tab-button ${tab === 'upcoming' ? 'tab-active' : ''}`}
          onClick={() => setTab('upcoming')}
        >
          Upcoming ({groups.upcoming.length})
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'history'}
          className={`tab-button ${tab === 'history' ? 'tab-active' : ''}`}
          onClick={() => setTab('history')}
        >
          Past & cancelled ({groups.history.length})
        </button>
      </div>

      <ErrorAlert message={error} />

      {loading ? (
        <Loading label="Loading your bookings…" />
      ) : visible.length === 0 ? (
        <EmptyState
          icon="bi-ticket-perforated"
          title={tab === 'upcoming' ? 'No upcoming tickets' : 'Nothing in your history yet'}
          message="Find a movie you like and lock a seat — it takes about a minute."
          action={
            <Link to="/movies" className="btn btn-gold">
              Browse movies
            </Link>
          }
        />
      ) : (
        <div className="booking-list">
          {visible.map((booking) => {
            const startsAt = booking.showtime ? new Date(booking.showtime.startTime) : null;
            const canCancel =
              booking.status === 'confirmed' && startsAt && startsAt.getTime() > Date.now();

            return (
              <article key={booking.id} className="booking-card">
                <div className="booking-thumb">
                  <Poster movie={booking.movie} />
                </div>

                <div className="booking-body">
                  <div className="booking-title-row">
                    <h2>{booking.movie?.title}</h2>
                    <span className={`status-pill status-${booking.status}`}>
                      {booking.status}
                    </span>
                  </div>

                  <p className="booking-place">
                    {booking.theatre?.name} · {booking.theatre?.city}
                  </p>

                  <div className="booking-facts">
                    <span>
                      <i className="bi bi-calendar-event" aria-hidden="true" />{' '}
                      {startsAt ? formatDate(startsAt) : 'Date unavailable'}
                    </span>
                    <span>
                      <i className="bi bi-clock" aria-hidden="true" />{' '}
                      {startsAt ? formatTime(startsAt) : '—'}
                    </span>
                    <span>
                      <i className="bi bi-grid-3x3-gap" aria-hidden="true" />{' '}
                      {booking.seats.join(', ')}
                    </span>
                    <span>
                      <i className="bi bi-cash" aria-hidden="true" />{' '}
                      {formatCurrency(booking.totalAmount)}
                    </span>
                  </div>

                  <p className="booking-reference">
                    Reference <strong>{booking.reference}</strong>
                  </p>
                </div>

                <div className="booking-actions">
                  {canCancel ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      disabled={pendingId === booking.id}
                      onClick={() => cancelBooking(booking)}
                    >
                      {pendingId === booking.id ? 'Cancelling…' : 'Cancel booking'}
                    </button>
                  ) : (
                    booking.status === 'cancelled' && (
                      <span className="booking-note">Seats released</span>
                    )
                  )}

                  <Link
                    to={`/movies/${booking.movie?.id}`}
                    className="btn btn-sm btn-outline-light"
                  >
                    Book again
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
