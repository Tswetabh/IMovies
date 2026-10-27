import { Link } from 'react-router-dom';
import Poster from './Poster.jsx';
import { formatDuration } from '../utils/format.js';

export default function MovieCard({ movie }) {
  return (
    <Link to={`/movies/${movie.id}`} className="movie-card">
      <div className="movie-poster">
        <Poster movie={movie} />
        {movie.rating > 0 && (
          <span className="rating-pill">
            <i className="bi bi-star-fill" aria-hidden="true" /> {movie.rating.toFixed(1)}
          </span>
        )}
        {movie.status === 'coming_soon' && <span className="soon-pill">Coming soon</span>}
        <span className="movie-card-cta">
          <i className="bi bi-ticket-perforated" aria-hidden="true" /> Book tickets
        </span>
      </div>

      <div className="movie-card-body">
        <h3>{movie.title}</h3>
        <p>
          {movie.genres.slice(0, 2).join(' · ') || 'Feature film'} ·{' '}
          {formatDuration(movie.durationMinutes)}
        </p>
        <p className="movie-card-lang">{movie.languages.slice(0, 2).join(', ')}</p>
      </div>
    </Link>
  );
}
