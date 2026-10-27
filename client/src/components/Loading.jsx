export default function Loading({ label = 'Loading…', compact = false }) {
  return (
    <div className={`loading-state ${compact ? 'loading-compact' : ''}`} role="status">
      <span className="spinner-border text-warning" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}
