import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api, { apiMessage } from '../services/api.js';
import Poster from '../components/Poster.jsx';
import Loading from '../components/Loading.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import EmptyState from '../components/EmptyState.jsx';
import { dateKey, dayLabel, formatCurrency, formatDuration, formatTime } from '../utils/format.js';

export default function MovieDetail() {
  const { id } = useParams();
  const [movie, setMovie] = useState(null);
  const [showtimes, setShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      api.get(`/movies/${id}`),
      api.get('/showtimes', { params: { movie: id } }),
    ])
      .then(([movieResponse, showtimeResponse]) => {
        if (!active) return;
        setMovie(movieResponse.data.data.movie);
        setShowtimes(showtimeResponse.data.data.showtimes);
      })
      .catch((requestError) => {
        if (active) setError(apiMessage(requestError, 'Could not load this movie.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [id]);

  const dates = useMemo(() => {
    const groups = new Map();

    for (const showtime of showtimes) {
      const key = dateKey(showtime.startTime);
      if (!groups.has(key)) groups.set(key, { key, label: dayLabel(showtime.startTime) });
    }

    return [...groups.values()];
  }, [showtimes]);

  useEffect(() => {
    if (dates.length > 0 && !dates.some((date) => date.key === selectedDate)) {
      setSelectedDate(dates[0].key);
    }
  }, [dates, selectedDate]);

  const theatresForDate = useMemo(() => {
    const groups = new Map();

    for (const showtime of showtimes) {
      if (dateKey(showtime.startTime) !== selectedDate) continue;

      const theatreId = showtime.theatre?.id ?? 'unknown';

      if (!groups.has(theatreId)) {
        groups.set(theatreId, { theatre: showtime.theatre, times: [] });
      }

      groups.get(theatreId).times.push(showtime);
    }

    for (const group of groups.values()) {
      group.times.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));
    }

    return [...groups.values()];
  }, [showtimes, selectedDate]);

  if (loading) {
    return (
      <div className="container page">
        <Loading label="Loading movie details…" />
      </div>
    );
  }

  if (error || !movie) {
    return (
      <div className="container page">
        <ErrorAlert message={error || 'Movie not found.'} />
        <Link to="/movies" className="btn btn-outline-light">
          Back to movies
        </Link>
      </div>
    );
  }

  return (
    <div className="container page">
      <section className="detail-hero">
        <div className="detail-poster">
          <Poster movie={movie} />
        </div>

        <div className="detail-copy">
          <div className="detail-badges">
            <span className="pill">{movie.certificate}</span>
            <span className="pill">{formatDuration(movie.durationMinutes)}</span>
            {movie.rating > 0 && (
              <span className="pill pill-gold">
                <i className="bi bi-star-fill" aria-hidden="true" /> {movie.rating.toFixed(1)}
              </span>
            )}
            {movie.status === 'coming_soon' && <span className="pill pill-red">Coming soon</span>}
          </div>

          <h1>{movie.title}</h1>

          <p className="detail-meta">
            {movie.genres.join(' · ')} · {movie.languages.join(', ')} ·{' '}
            {new Date(movie.releaseDate).getFullYear()}
          </p>

          <p className="detail-description">{movie.description}</p>

          <dl className="detail-facts">
            {movie.director && (
              <>
                <dt>Director</dt>
                <dd>{movie.director}</dd>
              </>
            )}
            {movie.cast?.length > 0 && (
              <>
                <dt>Cast</dt>
                <dd>{movie.cast.join(', ')}</dd>
              </>
            )}
          </dl>

          {movie.trailerUrl && (
            <a
              href={movie.trailerUrl}
              target="_blank"
              rel="noreferrer"
              className="btn btn-outline-light"
            >
              <i className="bi bi-play-circle" aria-hidden="true" /> Watch trailer
            </a>
          )}
        </div>
      </section>

      <section className="section section-tight">
        <div className="section-head">
          <div>
            <span className="eyebrow">Showtimes</span>
            <h2>Choose a time</h2>
          </div>
        </div>

        {dates.length === 0 ? (
          <EmptyState
            icon="bi-calendar-x"
            title="No showtimes scheduled yet"
            message="This movie does not have any upcoming shows. Check back soon."
          />
        ) : (
          <>
            <div className="date-tabs" role="tablist" aria-label="Show dates">
              {dates.map((date) => (
                <button
                  key={date.key}
                  type="button"
                  role="tab"
                  aria-selected={selectedDate === date.key}
                  className={`date-tab ${selectedDate === date.key ? 'date-tab-active' : ''}`}
                  onClick={() => setSelectedDate(date.key)}
                >
                  {date.label}
                </button>
              ))}
            </div>

            <div className="theatre-times">
              {theatresForDate.map(({ theatre, times }) => (
                <article key={theatre?.id ?? 'unknown'} className="theatre-time-card">
                  <div>
                    <h3>{theatre?.name ?? 'Theatre'}</h3>
                    <p>
                      {theatre?.city}
                      {theatre?.address ? ` · ${theatre.address}` : ''}
                    </p>
                  </div>

                  <div className="time-grid">
                    {times.map((showtime) => (
                      <Link
                        key={showtime.id}
                        to={`/showtimes/${showtime.id}/seats`}
                        className="time-chip"
                      >
                        <strong>{formatTime(showtime.startTime)}</strong>
                        <span>
                          {showtime.format} · {formatCurrency(showtime.ticketPrice)}
                        </span>
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
