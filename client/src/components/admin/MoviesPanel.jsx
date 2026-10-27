import { useState } from 'react';
import api, { apiMessage } from '../../services/api.js';
import ErrorAlert from '../ErrorAlert.jsx';

const EMPTY = {
  title: '',
  description: '',
  posterUrl: '',
  trailerUrl: '',
  genres: '',
  languages: 'English',
  durationMinutes: 120,
  releaseDate: '',
  rating: 0,
  certificate: 'UA',
  status: 'now_showing',
  director: '',
  cast: '',
};

function toForm(movie) {
  return {
    title: movie.title,
    description: movie.description,
    posterUrl: movie.posterUrl || '',
    trailerUrl: movie.trailerUrl || '',
    genres: movie.genres.join(', '),
    languages: movie.languages.join(', '),
    durationMinutes: movie.durationMinutes,
    releaseDate: new Date(movie.releaseDate).toISOString().slice(0, 10),
    rating: movie.rating,
    certificate: movie.certificate,
    status: movie.status,
    director: movie.director || '',
    cast: movie.cast.join(', '),
  };
}

function toPayload(form) {
  const split = (value) =>
    value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

  return {
    title: form.title.trim(),
    description: form.description.trim(),
    posterUrl: form.posterUrl.trim(),
    trailerUrl: form.trailerUrl.trim(),
    genres: split(form.genres),
    languages: split(form.languages),
    durationMinutes: Number(form.durationMinutes),
    releaseDate: form.releaseDate,
    rating: Number(form.rating),
    certificate: form.certificate,
    status: form.status,
    director: form.director.trim(),
    cast: split(form.cast),
  };
}

export default function MoviesPanel({ movies, onRefresh }) {
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const startNew = () => {
    setForm(EMPTY);
    setEditingId(null);
    setError('');
    setOpen(true);
  };

  const startEdit = (movie) => {
    setForm(toForm(movie));
    setEditingId(movie.id);
    setError('');
    setOpen(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError('');

    try {
      const payload = toPayload(form);

      if (editingId) await api.patch(`/movies/${editingId}`, payload);
      else await api.post('/movies', payload);

      setOpen(false);
      setForm(EMPTY);
      setEditingId(null);
      await onRefresh();
    } catch (requestError) {
      setError(apiMessage(requestError, 'Could not save the movie.'));
    } finally {
      setBusy(false);
    }
  };

  const remove = async (movie) => {
    if (!window.confirm(`Delete "${movie.title}"? This cannot be undone.`)) return;

    setError('');

    try {
      await api.delete(`/movies/${movie.id}`);
      await onRefresh();
    } catch (requestError) {
      setError(apiMessage(requestError, 'Could not delete the movie.'));
    }
  };

  return (
    <section className="admin-panel">
      <div className="admin-toolbar">
        <h2>Catalogue ({movies.length})</h2>
        <button type="button" className="btn btn-gold" onClick={startNew}>
          <i className="bi bi-plus-lg" aria-hidden="true" /> New movie
        </button>
      </div>

      <ErrorAlert message={error} />

      {open && (
        <form className="admin-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <label>
              Title
              <input className="form-control" required value={form.title} onChange={update('title')} />
            </label>

            <label>
              Director
              <input className="form-control" value={form.director} onChange={update('director')} />
            </label>

            <label>
              Duration (minutes)
              <input
                type="number"
                min="1"
                max="600"
                className="form-control"
                required
                value={form.durationMinutes}
                onChange={update('durationMinutes')}
              />
            </label>

            <label>
              Release date
              <input
                type="date"
                className="form-control"
                required
                value={form.releaseDate}
                onChange={update('releaseDate')}
              />
            </label>

            <label>
              Certificate
              <select className="form-select" value={form.certificate} onChange={update('certificate')}>
                {['U', 'UA', 'A', 'S'].map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>

            <label>
              Status
              <select className="form-select" value={form.status} onChange={update('status')}>
                <option value="now_showing">Now showing</option>
                <option value="coming_soon">Coming soon</option>
                <option value="archived">Archived</option>
              </select>
            </label>

            <label>
              Rating (0–10)
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                className="form-control"
                value={form.rating}
                onChange={update('rating')}
              />
            </label>

            <label>
              Poster URL
              <input className="form-control" value={form.posterUrl} onChange={update('posterUrl')} />
            </label>

            <label>
              Trailer URL
              <input className="form-control" value={form.trailerUrl} onChange={update('trailerUrl')} />
            </label>

            <label>
              Genres (comma separated)
              <input className="form-control" value={form.genres} onChange={update('genres')} />
            </label>

            <label>
              Languages (comma separated)
              <input className="form-control" value={form.languages} onChange={update('languages')} />
            </label>

            <label>
              Cast (comma separated)
              <input className="form-control" value={form.cast} onChange={update('cast')} />
            </label>
          </div>

          <label className="d-block mt-3">
            Description
            <textarea
              className="form-control"
              rows="3"
              required
              value={form.description}
              onChange={update('description')}
            />
          </label>

          <div className="admin-form-actions">
            <button type="submit" className="btn btn-gold" disabled={busy}>
              {busy ? 'Saving…' : editingId ? 'Save changes' : 'Create movie'}
            </button>
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={() => setOpen(false)}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      <div className="table-responsive">
        <table className="table admin-table align-middle">
          <thead>
            <tr>
              <th>Title</th>
              <th>Status</th>
              <th>Duration</th>
              <th>Rating</th>
              <th>Release</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {movies.map((movie) => (
              <tr key={movie.id}>
                <td>
                  <strong>{movie.title}</strong>
                  <span className="cell-sub">{movie.genres.join(', ')}</span>
                </td>
                <td>
                  <span className="pill">{movie.status.replace('_', ' ')}</span>
                </td>
                <td>{movie.durationMinutes} min</td>
                <td>{movie.rating ? movie.rating.toFixed(1) : '—'}</td>
                <td>{new Date(movie.releaseDate).toLocaleDateString('en-IN')}</td>
                <td className="text-end">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-light me-2"
                    onClick={() => startEdit(movie)}
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    onClick={() => remove(movie)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {movies.length === 0 && (
              <tr>
                <td colSpan="6" className="text-center py-4">
                  No movies yet. Create one to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="admin-footnote">
        Ticket prices come from each showtime, not the movie. Booking totals are calculated
        server-side.
      </p>
    </section>
  );
}
