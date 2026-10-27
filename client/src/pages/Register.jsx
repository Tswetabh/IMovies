import { useState } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { apiMessage } from '../services/api.js';
import ErrorAlert from '../components/ErrorAlert.jsx';

export default function Register() {
  const { user, register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get('redirect') || '/';

  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (user) return <Navigate to={redirect} replace />;

  const update = (field) => (event) =>
    setForm((current) => ({ ...current, [field]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (form.password !== form.confirm) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);

    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate(redirect, { replace: true });
    } catch (requestError) {
      setError(apiMessage(requestError, 'Could not create your account.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container page auth-page">
      <div className="auth-card">
        <span className="eyebrow">Join IMovies</span>
        <h1>Create your account</h1>
        <p className="auth-sub">Free to join. Book in seconds, cancel before showtime.</p>

        <ErrorAlert message={error} />

        <form onSubmit={handleSubmit} className="auth-form">
          <label className="form-label" htmlFor="name">
            Full name
          </label>
          <input
            id="name"
            className="form-control"
            autoComplete="name"
            required
            value={form.name}
            onChange={update('name')}
          />

          <label className="form-label" htmlFor="email">
            Email address
          </label>
          <input
            id="email"
            type="email"
            className="form-control"
            autoComplete="email"
            required
            value={form.email}
            onChange={update('email')}
          />

          <label className="form-label" htmlFor="password">
            Password
          </label>
          <input
            id="password"
            type="password"
            className="form-control"
            autoComplete="new-password"
            minLength={8}
            required
            value={form.password}
            onChange={update('password')}
          />
          <p className="field-hint">At least 8 characters.</p>

          <label className="form-label" htmlFor="confirm">
            Confirm password
          </label>
          <input
            id="confirm"
            type="password"
            className="form-control"
            autoComplete="new-password"
            required
            value={form.confirm}
            onChange={update('confirm')}
          />

          <button type="submit" className="btn btn-gold w-100" disabled={submitting}>
            {submitting ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
                Creating account…
              </>
            ) : (
              'Create account'
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
