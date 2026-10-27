export default function EmptyState({ icon = 'bi-popcorn', title, message, action }) {
  return (
    <div className="empty-state">
      <i className={`bi ${icon}`} aria-hidden="true" />
      <h3>{title}</h3>
      {message && <p>{message}</p>}
      {action}
    </div>
  );
}
