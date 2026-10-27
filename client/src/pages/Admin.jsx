import { useCallback, useEffect, useState } from 'react';
import api, { apiMessage } from '../services/api.js';
import Loading from '../components/Loading.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import MoviesPanel from '../components/admin/MoviesPanel.jsx';
import TheatresPanel from '../components/admin/TheatresPanel.jsx';
import ShowtimesPanel from '../components/admin/ShowtimesPanel.jsx';
import BookingsPanel from '../components/admin/BookingsPanel.jsx';

const TABS = [
  { id: 'movies', label: 'Movies', icon: 'bi-film' },
  { id: 'theatres', label: 'Theatres', icon: 'bi-building' },
  { id: 'showtimes', label: 'Showtimes', icon: 'bi-clock-history' },
  { id: 'bookings', label: 'Bookings', icon: 'bi-ticket-perforated' },
];

export default function Admin() {
  const [tab, setTab] = useState('movies');
  const [data, setData] = useState({ movies: [], theatres: [], showtimes: [], bookings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = useCallback(async () => {
    setError('');

    try {
      const [movies, theatres, showtimes, bookings] = await Promise.all([
        api.get('/movies', { params: { limit: 60 } }),
        api.get('/theatres'),
        api.get('/showtimes', { params: { includePast: true, status: 'all' } }),
        api.get('/bookings/admin/all'),
      ]);

      setData({
        movies: movies.data.data.movies,
        theatres: theatres.data.data.theatres,
        showtimes: showtimes.data.data.showtimes,
        bookings: bookings.data.data.bookings,
      });
    } catch (requestError) {
      setError(apiMessage(requestError, 'Could not load the admin dashboard.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  return (
    <div className="container page">
      <header className="page-head">
        <div>
          <span className="eyebrow">Operations</span>
          <h1>Admin dashboard</h1>
          <p>Manage the catalogue, screens, showtimes and every booking.</p>
        </div>
      </header>

      <div className="tabs-row" role="tablist" aria-label="Admin sections">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            className={`tab-button ${tab === item.id ? 'tab-active' : ''}`}
            onClick={() => setTab(item.id)}
          >
            <i className={`bi ${item.icon}`} aria-hidden="true" /> {item.label}
          </button>
        ))}
      </div>

      <ErrorAlert message={error} onRetry={loadAll} />

      {loading ? (
        <Loading label="Loading dashboard…" />
      ) : (
        <>
          {tab === 'movies' && <MoviesPanel movies={data.movies} onRefresh={loadAll} />}
          {tab === 'theatres' && <TheatresPanel theatres={data.theatres} onRefresh={loadAll} />}
          {tab === 'showtimes' && (
            <ShowtimesPanel
              showtimes={data.showtimes}
              movies={data.movies}
              theatres={data.theatres}
              onRefresh={loadAll}
            />
          )}
          {tab === 'bookings' && <BookingsPanel bookings={data.bookings} />}
        </>
      )}
    </div>
  );
}
