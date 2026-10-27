const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatCurrency(value) {
  return inr.format(Number(value) || 0);
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDate(value, options = {}) {
  return new Date(value).toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    ...options,
  });
}

export function formatDateTime(value) {
  return `${formatDate(value)} · ${formatTime(value)}`;
}

export function formatDuration(minutes) {
  const total = Number(minutes) || 0;
  const hours = Math.floor(total / 60);
  const rest = total % 60;

  if (hours === 0) return `${rest}m`;

  return rest === 0 ? `${hours}h` : `${hours}h ${rest}m`;
}

export function dateKey(value) {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function dayLabel(value) {
  const date = new Date(value);
  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  if (dateKey(date) === dateKey(today)) return 'Today';
  if (dateKey(date) === dateKey(tomorrow)) return 'Tomorrow';

  return formatDate(date, { weekday: 'short', day: 'numeric', month: 'short' });
}

export function initials(name = '') {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function toDateTimeLocal(value) {
  const date = new Date(value);
  const pad = (input) => String(input).padStart(2, '0');

  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}
