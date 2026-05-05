/**
 * USD with K/M/B/T suffix. Falls through to scientific notation for tiny
 * memecoin prices.
 */
export function formatUsd(n: number): string {
  if (!Number.isFinite(n)) return '—';
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
  if (n >= 1) return `$${n.toFixed(2)}`;
  if (n >= 1e-4) return `$${n.toFixed(4)}`;
  if (n >= 1e-7) return `$${n.toFixed(7)}`;
  return `$${n.toExponential(2)}`;
}

/** "+24.3%" / "-1.2%". */
export function formatPercent(n: number, digits = 1): string {
  if (!Number.isFinite(n)) return '—';
  const sign = n > 0 ? '+' : '';
  return `${sign}${n.toFixed(digits)}%`;
}

/** "0.5h" / "12h" / "5d" / "2mo" / "3y". */
export function formatAge(hours: number): string {
  if (!Number.isFinite(hours) || hours < 0) return '—';
  if (hours < 1) return `${(hours * 60).toFixed(0)}m`;
  if (hours < 24) return `${hours.toFixed(hours < 10 ? 1 : 0)}h`;
  const days = hours / 24;
  if (days < 30) return `${days.toFixed(0)}d`;
  const months = days / 30;
  if (months < 18) return `${months.toFixed(0)}mo`;
  return `${(months / 12).toFixed(1)}y`;
}

/** Truncate a contract address: '7xKX...3aBc'. */
export function shortAddress(addr: string, head = 4, tail = 4): string {
  if (!addr) return '';
  if (addr.length <= head + tail + 1) return addr;
  return `${addr.slice(0, head)}…${addr.slice(-tail)}`;
}
