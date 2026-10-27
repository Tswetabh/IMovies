import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../utils/format.js';

export default function Navbar() {
  const { user, isAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container nav-shell">
        <Link to="/" className="brand" aria-label="IMovies home">
          <span className="brand-mark">
            <i className="bi bi-camera-reels-fill" aria-hidden="true" />
          </span>
          <span>
            I<span className="brand-accent">Movies</span>
          </span>
        </Link>

        <nav className="nav-links" aria-label="Main navigation">
          <NavLink to="/" end>
            Home
          </NavLink>
          <NavLink to="/movies">Movies</NavLink>
          {user && <NavLink to="/bookings">My bookings</NavLink>}
          {isAdmin && <NavLink to="/admin">Admin</NavLink>}
        </nav>

        <div className="nav-account">
          {user ? (
            <>
              <span className="avatar" title={user.name}>
                {initials(user.name)}
              </span>
              <span className="account-name">{user.name.split(' ')[0]}</span>
              <button type="button" className="btn btn-sm btn-outline-light" onClick={handleLogout}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="btn btn-sm btn-outline-light">
                Sign in
              </Link>
              <Link to="/register" className="btn btn-sm btn-gold">
                Join free
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
