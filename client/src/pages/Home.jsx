import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api, { apiMessage } from '../services/api.js';
import MovieCard from '../components/MovieCard.jsx';
import Loading from '../components/Loading.jsx';
import ErrorAlert from '../components/ErrorAlert.jsx';

export default function Home() {
  const navigate = useNavigate();
  const [nowShowing, setNowShowing] = useState([]);
  const [comingSoon, setComingSoon] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let active = true;

    Promise.all([
      api.get('/movies', { params: { status: 'now_showing', limit: 8 } }),
      api.get('/movies', { params: { status: 'coming_soon', limit: 4 } }),
    ])
      .then(([showing, upcoming]) => {
        if (!active) return;
        setNowShowing(showing.data.data.movies);
        setComingSoon(upcoming.data.data.movies);
      })
      .catch((requestError) => {
        if (active) setError(apiMessage(requestError, 'Could not load movies right now.'));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    navigate(query.trim() ? `/movies?q=${encodeURIComponent(query.trim())}` : '/movies');
  };

  return (
    <>
      <section className="hero">
        <div className="container hero-shell">
          <div className="hero-copy">
            <span className="eyebrow">
              <i className="bi bi-ticket-perforated" aria-hidden="true" /> Now booking in Mumbai & Pune
            </span>

            <h1>
              Book the <span>big screen</span> without the queue.
            </h1>

            <p>
              Browse what is playing, compare showtimes, and lock your favourite seats in
              under a minute. Real-time availability, instant confirmation.
            </p>

            <form className="hero-search" onSubmit={handleSearch} role="search">
              <i className="bi bi-search" aria-hidden="true" />
              <input
                type="search"
                placeholder="Search movies, genres…"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                aria-label="Search movies"
              />
              <button type="submit" className="btn btn-gold">
                Find tickets
              </button>
            </form>

            <div className="hero-points">
              <span>
                <i className="bi bi-lightning-charge-fill" aria-hidden="true" /> Live seat map
              </span>
              <span>
                <i className="bi bi-shield-lock-fill" aria-hidden="true" /> Secure sign-in
              </span>
              <span>
                <i className="bi bi-cash-coin" aria-hidden="true" /> No hidden fees
              </span>
            </div>
          </div>

          <div className="hero-ticket" aria-hidden="true">
            <div className="hero-ticket-top">
              <span>ADMIT ONE</span>
              <span>IMOVIES</span>
            </div>
            <div className="hero-ticket-mid">
              <i className="bi bi-film" />
              <strong>TONIGHT</strong>
              <span>Screen 3 · Row F · Seat 12</span>
            </div>
            <div className="hero-ticket-bottom">
              <span className="barcode" />
              <span>IMO-8K2F4Q</span>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">Now showing</span>
              <h2>Pick something worth leaving home for</h2>
            </div>
            <Link to="/movies" className="btn btn-outline-light">
              All movies <i className="bi bi-arrow-right" aria-hidden="true" />
            </Link>
          </div>

          <ErrorAlert message={error} />

          {loading ? (
            <Loading label="Loading the marquee…" />
          ) : (
            <div className="movies-grid">
              {nowShowing.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          )}
        </div>
      </section>

      {comingSoon.length > 0 && (
        <section className="section section-muted">
          <div className="container">
            <div className="section-head">
              <div>
                <span className="eyebrow">Coming soon</span>
                <h2>Save the date</h2>
              </div>
            </div>

            <div className="movies-grid">
              {comingSoon.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head">
            <div>
              <span className="eyebrow">How it works</span>
              <h2>Three steps to a seat</h2>
            </div>
          </div>

          <div className="steps">
            <article className="step-card">
              <span className="step-number">01</span>
              <h3>Choose a movie</h3>
              <p>Filter by genre or language and see what is playing near you.</p>
            </article>
            <article className="step-card">
              <span className="step-number">02</span>
              <h3>Pick a showtime</h3>
              <p>Compare theatres, screens and show timings for the next five days.</p>
            </article>
            <article className="step-card">
              <span className="step-number">03</span>
              <h3>Lock your seats</h3>
              <p>Select up to ten seats and get an instant booking reference.</p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
