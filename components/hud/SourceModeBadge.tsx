'use client';

import { useMetaStore } from '@/lib/store';
import { useNarratives } from '@/lib/useNarratives';

export default function SourceModeBadge() {
  const window = useMetaStore((s) => s.timeWindow);
  const { data, isFetching, isError } = useNarratives(window);

  const source = data?.source;
  const isLive = source === 'x';
  const label = isLive ? 'LIVE' : 'MOCK';
  const color = isLive ? 'text-neon-cyan' : 'text-neon-amber';
  const dot = isLive ? 'bg-neon-cyan' : 'bg-neon-amber';

  const count = data?.narratives.length ?? 0;
  let status = 'STANDBY';
  if (isError) status = 'ERROR';
  else if (isFetching) status = 'SYNCING';
  else if (count > 0) status = 'OK';

  return (
    <div className="pointer-events-none fixed bottom-16 left-3 z-30 flex items-center gap-2 rounded-sm border border-white/10 bg-black/55 px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.3em] backdrop-blur">
      <span className={`h-1.5 w-1.5 rounded-full ${dot} animate-pulse`} />
      <span className={color}>{label}</span>
      <span className="text-white/30">/</span>
      <span className="text-white/60">{window}</span>
      <span className="text-white/30">/</span>
      <span className="text-white/60">{count} narratives</span>
      <span className="text-white/30">/</span>
      <span className="text-white/40">{status}</span>
    </div>
  );
}
