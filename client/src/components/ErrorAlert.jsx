export default function ErrorAlert({ message, onRetry }) {
  if (!message) return null;

  return (
    <div className="alert alert-danger d-flex align-items-center gap-3" role="alert">
      <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" />
      <div className="flex-grow-1">{message}</div>
      {onRetry && (
        <button type="button" className="btn btn-sm btn-outline-light" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
