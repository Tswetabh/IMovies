import { useMemo, useState } from 'react';
import { formatCurrency, formatDate, formatTime } from '../../utils/format.js';

export default function BookingsPanel({ bookings }) {
  const [status, setStatus] = useState('all');
  const [term, setTerm] = useState('');

  const visible = useMemo(() => {
    const needle = term.trim().toLowerCase();

    return bookings.filter((booking) => {
      if (status !== 'all' && booking.status !== status) return false;
      if (!needle) return true;

      return (
        booking.reference.toLowerCase().includes(needle) ||
        booking.user?.email?.toLowerCase().includes(needle) ||
        booking.user?.name?.toLowerCase().includes(needle) ||
        booking.movie?.title?.toLowerCase().includes(needle)
      );
    });
  }, [bookings, status, term]);

  const confirmed = bookings.filter((booking) => booking.status === 'confirmed');
  const revenue = confirmed.reduce((total, booking) => total + booking.totalAmount, 0);

  return (
    <section className="admin-panel">
      <div className="admin-toolbar">
        <h2>Bookings ({bookings.length})</h2>
        <div className="stat-inline">
          <span>
            Confirmed <strong>{confirmed.length}</strong>
          </span>
          <span>
            Revenue <strong>{formatCurrency(revenue)}</strong>
          </span>
        </div>
      </div>

      <div className="admin-filters">
        <div className="chip-row">
          {['all', 'confirmed', 'cancelled'].map((value) => (
            <button
              key={value}
              type="button"
              className={`chip ${status === value ? 'chip-active' : ''}`}
              onClick={() => setStatus(value)}
            >
              {value === 'all' ? 'All' : value}
            </button>
          ))}
        </div>

        <input
          type="search"
          className="form-control admin-search"
          placeholder="Search reference, customer or movie…"
          value={term}
          onChange={(event) => setTerm(event.target.value)}
        />
      </div>

      <div className="table-responsive">
        <table className="table admin-table align-middle">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Customer</th>
              <th>Movie</th>
              <th>Show</th>
              <th>Seats</th>
              <th>Total</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((booking) => (
              <tr key={booking.id}>
                <td>
                  <strong>{booking.reference}</strong>
                </td>
                <td>
                  {booking.user?.name ?? 'Customer'}
                  <span className="cell-sub">{booking.user?.email}</span>
                </td>
                <td>{booking.movie?.title}</td>
                <td>
                  {booking.showtime ? formatDate(booking.showtime.startTime) : '—'}
                  <span className="cell-sub">
                    {booking.showtime ? formatTime(booking.showtime.startTime) : ''}
                  </span>
                </td>
                <td>{booking.seats.join(', ')}</td>
                <td>{formatCurrency(booking.totalAmount)}</td>
                <td>
                  <span className={`status-pill status-${booking.status}`}>
                    {booking.status}
                  </span>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan="7" className="text-center py-4">
                  No bookings match those filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
