import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-shell">
        <div>
          <p className="footer-brand">IMovies</p>
          <p className="footer-note">Movie ticket booking made simple.</p>
        </div>

        <nav className="footer-links" aria-label="Footer">
          <Link to="/movies">Browse movies</Link>
          <Link to="/bookings">My bookings</Link>
          <Link to="/login">Sign in</Link>
        </nav>

        <p className="footer-note footer-copy">
          Built with the MERN stack · {new Date().getFullYear()}
        </p>
      </div>
    </footer>
  );
}
