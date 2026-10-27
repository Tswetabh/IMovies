import { useState } from 'react';

const LOCAL_POSTERS = {
  'Neon Horizon': '/posters/dune_2.jpg',
  'The Last Monsoon': '/posters/pride_of_bharat.jpg',
  'Midnight Circuit': '/posters/og.jpg',
  'Paper Lanterns': '/posters/avatar.jpg',
  'Iron Valley': '/posters/baaghi4.jpg',
  'Laugh Track': '/posters/pushpa_2.jpg',
  'The Quiet Deep': '/posters/toxic.jpg',
  'Skyward Bound': '/posters/ramayana.jpg',
};

export default function Poster({ movie, className = '' }) {
  const localPoster = movie?.title ? LOCAL_POSTERS[movie.title] : '';
  const source = localPoster || movie?.posterUrl;
  const [failed, setFailed] = useState(!source);

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
      src={source}
      alt={`${movie.title} poster`}
      className={`poster-image ${className}`}
      loading="lazy"
      onError={() => setFailed(true)}
    />
  );
}
