import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

// Re-export date-fns helpers used across the app.
export { format, formatDistanceToNow };

export function formatDate(date) {
  if (!date) return '—';
  const d = new Date(date);
  if (isToday(d)) return `Today, ${format(d, 'h:mm a')}`;
  if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
  return format(d, 'MMM d, yyyy');
}

export function shortDate(date) {
  if (!date) return '—';
  return format(new Date(date), 'MMM d, yyyy');
}

export function timeAgo(date) {
  if (!date) return '—';
  return `${formatDistanceToNow(new Date(date))} ago`;
}

export function formatBytes(bytes) {
  if (!bytes && bytes !== 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024;
    unit++;
  }
  return `${value < 10 && unit > 0 ? value.toFixed(1) : Math.round(value)} ${units[unit]}`;
}

export function greeting(name) {
  const hour = new Date().getHours();
  const word = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return name ? `${word}, ${name.split(' ')[0]}` : word;
}

/** Initials for avatar fallbacks. */
export function initials(name = '') {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() || '')
    .join('');
}

export function truncate(text, max = 120) {
  if (!text) return '';
  return text.length > max ? `${text.slice(0, max)}...` : text;
}

export function downloadTextFile(content, filename, mime = 'text/markdown') {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
