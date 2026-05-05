'use client';

import { useMetaStore } from '@/lib/store';
import { useTokens } from '@/lib/useTokens';

/**
 * Subtle bottom-centre HUD pill that announces orbital data state:
 *
 *   • initial fetch in flight  → "Scanning orbital chatter…"
 *   • fetch resolved with 0    → "No orbital activity detected"
 *   • otherwise                → hidden
 *
 * Sits behind the MoonModeBadge in the z-stack and stays narrow so it
 * never competes with content. Pulses softly while loading.
 */
export default function MoonStatusOverlay() {
  const window = useMetaStore((s) => s.timeWindow);
  const { data, isFetching, isError } = useTokens(window);
  const count = data?.tokens.length ?? 0;

  let message: string | null = null;
  let tone: 'loading' | 'empty' | 'error' = 'loading';
  if (isError) {
    message = 'Orbital telemetry offline';
    tone = 'error';
  } else if (isFetching && count === 0) {
    message = 'Scanning orbital chatter…';
    tone = 'loading';
  } else if (!isFetching && count === 0) {
    message = 'No orbital activity detected';
    tone = 'empty';
  }

  if (!message) return null;

  const colour =
    tone === 'error'
      ? 'text-rose-300/85'
      : tone === 'empty'
        ? 'text-white/45'
        : 'text-cyan-300/85';
  const dot =
    tone === 'error'
      ? 'bg-rose-300'
      : tone === 'empty'
        ? 'bg-white/40'
        : 'bg-cyan-300';

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-20 flex justify-center">
      <div
        className={[
          'flex items-center gap-2.5 rounded-sm border border-white/10 bg-black/55 px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.4em] backdrop-blur',
          colour,
          tone === 'loading' ? 'animate-pulse' : '',
        ].join(' ')}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
        {message}
      </div>
    </div>
  );
}
