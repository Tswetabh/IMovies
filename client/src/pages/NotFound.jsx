import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container page">
      <div className="not-found">
        <span className="eyebrow">404</span>
        <h1>This screen is empty</h1>
        <p>The page you are looking for has left the theatre.</p>
        <Link to="/" className="btn btn-gold">
          Back to home
        </Link>
      </div>
    </div>
  );
}
