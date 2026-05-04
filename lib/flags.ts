/**
 * Convert an ISO 3166-1 alpha-2 country code into a flag emoji using the
 * regional-indicator unicode block. Returns the empty string for invalid
 * codes so callers can render text fallbacks.
 */
export function flagEmoji(iso: string): string {
  if (!iso || iso.length !== 2) return '';
  const upper = iso.toUpperCase();
  const a = 'A'.charCodeAt(0);
  const base = 0x1f1e6;
  const codePoints = [
    base + (upper.charCodeAt(0) - a),
    base + (upper.charCodeAt(1) - a),
  ];
  if (codePoints.some((c) => c < base || c > base + 25)) return '';
  return String.fromCodePoint(...codePoints);
}
