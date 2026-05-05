'use client';

import { useMetaStore } from '@/lib/store';
import { useTokens } from '@/lib/useTokens';

/**
 * Bottom-left status pill for the /moon route. Reads the active time window
 * from the store and live token count from /api/tokens. Mirrors the shape
 * + position of the Earth-side SourceModeBadge so the two surfaces feel
 * symmetric.
 */
export default function MoonModeBadge() {
  const window = useMetaStore((s) => s.timeWindow);
  const { data, isFetching, isError } = useTokens(window);

  const source = data?.source ?? 'mock';
  const isLive = source !== 'mock';
  const label = isLive ? source.toUpperCase() : 'MOCK';
  const color = isLive ? 'text-neon-cyan' : 'text-neon-amber';
  const dot = isLive ? 'bg-neon-cyan' : 'bg-neon-amber';

  const count = data?.tokens.length ?? 0;
  let status = 'Standby';
  if (isError) status = 'Error';
  else if (isFetching && count === 0) status = 'Syncing';
  else if (count > 0) status = 'OK';

  return (
    <div className="pointer-events-none fixed bottom-3 left-[296px] z-30 flex items-center gap-2 rounded-sm border border-white/10 bg-black/55 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em] backdrop-blur">
      <span className={`h-1.5 w-1.5 rounded-full ${dot} animate-pulse`} />
      <span className={color}>{label}</span>
      <span className="text-white/30">/</span>
      <span className="text-white/60">{window}</span>
      <span className="text-white/30">/</span>
      <span className="text-white/60">{count} tokens</span>
      <span className="text-white/30">/</span>
      <span className="text-white/40">{status}</span>
    </div>
  );
}
