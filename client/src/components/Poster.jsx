import { useState } from 'react';

export default function Poster({ movie, className = '' }) {
  const [failed, setFailed] = useState(!movie?.posterUrl);

  if (failed) {
    return (
      <div className={`poster-fallback ${className}`} aria-hidden="true">
        <i className="bi bi-film" />
        <span>{movie?.title ?? 'IMovies'}</span>
      </div>
    );
  }

  return (
    <img
      src={movie.posterUrl}
      alt={`${movie.title} poster`}
      className={`poster-image ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
