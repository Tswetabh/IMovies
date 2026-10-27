import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { apiMessage } from '../services/api.js';
import MovieCard from '../components/MovieCard.jsx';
import Loading from '../components/Loading.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';
import EmptyState from '../components/EmptyState.jsx';

const GENRES = [
  'Action',
  'Adventure',
  'Animation',
  'Comedy',
  'Crime',
  'Drama',
  'Family',
  'Horror',
  'Mystery',
  'Romance',
  'Sci-Fi',
  'Thriller',
];

export default function Movies() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const genre = searchParams.get('genre') || '';

  const [term, setTerm] = useState(query);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = new URLSearchParams(searchParams);

      if (term.trim()) next.set('q', term.trim());
      else next.delete('q');

      setSearchParams(next, { replace: true });
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term]);

  useEffect(() => {
    let active = true;
    setLoading(true);

    api
      .get('/movies', {
        params: { q: query || undefined, genre: genre || undefined, limit: 60 },
      })
      .then(({ data }) => {
        if (active) setMovies(data.data.movies);
      })
      .catch((requestError) => {
        if (active) setError(apiMessage(requestError, 'Could not load movies.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [query, genre]);

  const selectGenre = (value) => {
    const next = new URLSearchParams(searchParams);

    if (genre === value) next.delete('genre');
    else next.set('genre', value);

    setSearchParams(next);
  };

  return (
    <div className="container page">
      <header className="page-head">
        <div>
          <span className="eyebrow">Browse</span>
          <h1>Movies</h1>
          <p>Everything playing now, plus what is on the way.</p>
        </div>

        <div className="search-field">
          <i className="bi bi-search" aria-hidden="true" />
          <input
            type="search"
            className="form-control"
            placeholder="Search by title…"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            aria-label="Search movies by title"
          />
        </div>
      </header>

      <div className="chip-row" role="group" aria-label="Filter by genre">
        {GENRES.map((value) => (
          <button
            key={value}
            type="button"
            className={`chip ${genre === value ? 'chip-active' : ''}`}
            onClick={() => selectGenre(value)}
            aria-pressed={genre === value}
          >
            {value}
          </button>
        ))}
      </div>

      <ErrorAlert message={error} />

      {loading ? (
        <Loading label="Loading movies…" />
      ) : movies.length === 0 ? (
        <EmptyState
          icon="bi-search"
          title="No movies match that search"
          message="Try a different title or clear the genre filter."
          action={
            <button
              type="button"
              className="btn btn-outline-light"
              onClick={() => {
                setTerm('');
                setSearchParams({});
              }}
            >
              Clear filters
            </button>
          }
        />
      ) : (
        <>
          <p className="result-count">
            {movies.length} {movies.length === 1 ? 'movie' : 'movies'}
            {genre ? ` in ${genre}` : ''}
          </p>

          <div className="movies-grid">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
