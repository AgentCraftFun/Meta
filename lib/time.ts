/** Format a Date as HH:MM:SS UTC. */
export function formatUtcClock(d = new Date()): string {
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  const s = String(d.getUTCSeconds()).padStart(2, '0');
  return `${h}:${m}:${s} UTC`;
}

/** "12 min ago", "3 hr ago", "2 d ago" relative to now. */
export function timeAgo(iso: string, now = Date.now()): string {
  const then = new Date(iso).getTime();
  const diffMs = Math.max(0, now - then);
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} d ago`;
  const wk = Math.floor(day / 7);
  return `${wk} wk ago`;
}
