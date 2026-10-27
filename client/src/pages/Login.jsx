import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiMessage } from '../services/api.js';
import ErrorAlert from '../components/ErrorAlert.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={redirect} replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      await login(email.trim(), password);
      navigate(redirect, { replace: true });
    } catch (requestError) {
      setError(apiMessage(requestError, 'Could not sign you in.'));
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    setEmail('demo@imovies.test');
    setPassword('Demo@12345');
  };

  return (
    <div className="container page auth-page">
      <div className="auth-card">
        <span className="eyebrow">Welcome back</span>
        <h1>Sign in to IMovies</h1>
        <p className="auth-sub">Your seats, bookings and references in one place.</p>

        <ErrorAlert message={error} />

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            className="form-control"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />

          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="form-control"
            autoComplete="current-password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <button type="submit" className="btn btn-gold w-100" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Signing in…
              </>
            ) : (
              'Sign in'
            )}
          </button>
        </form>

        <div className="demo-box">
          <div>
            <strong>Demo account</strong>
            <p>demo@imovies.test · Demo@12345</p>
          </div>
          <button type="button" className="btn btn-sm btn-outline-light" onClick={fillDemo}>
            Use it
          </button>
        </div>

        <p className="auth-switch">
          New here? <Link to="/register">Create an account</Link>
        </p>
      </div>
    </div>
  );
}
