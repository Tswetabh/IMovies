import { useMemo, useState } from 'react';
import api, { apiMessage } from '../../services/api.js';
import ErrorAlert from '../ErrorAlert.jsx';
import { formatCurrency, formatDate, formatTime, toDateTimeLocal } from '../../utils/format.js';

function tomorrowEvening() {
  return toDateTimeLocal(new Date(Date.now() + 24 * 60 * 60 * 1000));
}

export default function ShowtimesPanel({ showtimes, movies, theatres, onRefresh }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({
    movie: '',
    theatre: '',
    screenId: '',
    startTime: tomorrowEvening(),
    ticketPrice: 250,
    language: 'English',
    format: '2D',
  });

  const selectedTheatre = useMemo(
    () => theatres.find((theatre) => theatre.id === form.theatre) ?? null,
    [theatres, form.theatre]
  );

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const changeTheatre = (event) => {
    const theatreId = event.target.value;
    const theatre = theatres.find((item) => item.id === theatreId);
    const screen = theatre?.screens[0];

    setForm((current) => ({
      ...current,
      theatre: theatreId,
      screenId: screen?.id ?? '',
      format: screen?.format ?? current.format,
    }));
  };

  const changeScreen = (event) => {
    const screen = selectedTheatre?.screens.find((item) => item.id === event.target.value);

    setForm((current) => ({
      ...current,
      screenId: event.target.value,
      format: screen?.format ?? current.format,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      await api.post('/showtimes', {
        ...form,
        ticketPrice: Number(form.ticketPrice),
        startTime: new Date(form.startTime).toISOString(),
      });

      setForm({
        movie: '',
        theatre: '',
        screenId: '',
        startTime: tomorrowEvening(),
        ticketPrice: 250,
        language: 'English',
        format: '2D',
      });
      setOpen(false);
      await onRefresh();
    } catch (requestError) {
      setError(apiMessage(requestError, 'Could not create the showtime.'));
    } finally {
      setBusy(false);
    }
  };

  const cancelShowtime = async (showtime) => {
    if (!window.confirm('Cancel this showtime? Existing bookings keep their reference.')) return;
    setError('');

    try {
      await api.patch(`/showtimes/${showtime.id}`, { status: 'cancelled' });
      await onRefresh();
    } catch (requestError) {
      setError(apiMessage(requestError, 'Could not cancel the showtime.'));
    }
  };

  const removeShowtime = async (showtime) => {
    if (!window.confirm('Delete this showtime permanently?')) return;
    setError('');

    try {
      await api.delete(`/showtimes/${showtime.id}`);
      await onRefresh();
    } catch (requestError) {
      setError(apiMessage(requestError, 'Could not delete the showtime.'));
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-toolbar">
        <h2>Showtimes ({showtimes.length})</h2>
        <button
          type="button"
          className="btn btn-gold"
          onClick={() => {
            setOpen((current) => !current);
            setError('');
          }}
        >
          <i className="bi bi-plus-lg" aria-hidden="true" /> New showtime
        </button>
      </div>

      <ErrorAlert message={error} />

      {open && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Movie
              <select className="form-select" required value={form.movie} onChange={update('movie')}>
                <option value="">Select a movie</option>
                {movies.map((movie) => (
                  <option key={movie.id} value={movie.id}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Theatre
              <select
                className="form-select"
                required
                value={form.theatre}
                onChange={changeTheatre}
              >
                <option value="">Select a theatre</option>
                {theatres.map((theatre) => (
                  <option key={theatre.id} value={theatre.id}>
                    {theatre.name} · {theatre.city}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Screen
              <select
                className="form-select"
                required
                value={form.screenId}
                onChange={changeScreen}
                disabled={!selectedTheatre}
              >
                <option value="">Select a screen</option>
                {(selectedTheatre?.screens ?? []).map((screen) => (
                  <option key={screen.id} value={screen.id}>
                    {screen.name} · {screen.rows}×{screen.seatsPerRow} · {screen.format}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Starts at
              <input
                type="datetime-local"
                className="form-control"
                required
                value={form.startTime}
                onChange={update('startTime')}
              />
            </label>

            <label>
              Ticket price (₹)
              <input
                type="number"
                min="0"
                step="10"
                className="form-control"
                required
                value={form.ticketPrice}
                onChange={update('ticketPrice')}
              />
            </label>

            <label>
              Language
              <input className="form-control" value={form.language} onChange={update('language')} />
            </label>

            <label>
              Format
              <select className="form-select" value={form.format} onChange={update('format')}>
                {['2D', '3D', 'IMAX', '4DX'].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn-gold" disabled={busy}>
              {busy ? 'Saving…' : 'Create showtime'}
            </button>
            <button type="button" className="btn btn-outline-light" onClick={() => setOpen(false)}>
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="table-responsive">
        <table className="table admin-table align-middle">
          <thead>
            <tr>
              <th>Movie</th>
              <th>Theatre · Screen</th>
              <th>Starts</th>
              <th>Price</th>
              <th>Status</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {showtimes.map((showtime) => (
              <tr key={showtime.id}>
                <td>
                  <strong>{showtime.movie?.title ?? 'Movie'}</strong>
                  <span className="cell-sub">
                    {showtime.language} · {showtime.format}
                  </span>
                </td>
                <td>
                  {showtime.theatre?.name ?? 'Theatre'}
                  <span className="cell-sub">{showtime.screen?.name ?? 'Screen'}</span>
                </td>
                <td>
                  {formatDate(showtime.startTime)}
                  <span className="cell-sub">{formatTime(showtime.startTime)}</span>
                </td>
                <td>{formatCurrency(showtime.ticketPrice)}</td>
                <td>
                  <span className={`status-pill status-${showtime.status}`}>
                    {showtime.status}
                  </span>
                </td>
                <td className="text-end">
                  {showtime.status === 'scheduled' && (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-light me-2"
                      onClick={() => cancelShowtime(showtime)}
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => removeShowtime(showtime)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {showtimes.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  No showtimes scheduled yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
