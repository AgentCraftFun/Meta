'use client';

import { useMetaStore } from '@/lib/store';

export default function SpeakerToggle() {
  const muted = useMetaStore((s) => s.muted);
  const toggle = useMetaStore((s) => s.toggleMuted);
  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={!muted}
      aria-label={muted ? 'Unmute UI sounds' : 'Mute UI sounds'}
      title={muted ? 'Unmute (M)' : 'Mute (M)'}
      className={[
        'pointer-events-auto fixed right-[152px] top-5 z-30 flex h-9 w-9 items-center justify-center rounded-sm border bg-black/40 font-mono text-[14px] backdrop-blur-xl transition-colors',
        muted
          ? 'border-white/10 text-white/40 hover:text-white/70'
          : 'border-neon-cyan/40 text-neon-cyan shadow-neon-cyan',
      ].join(' ')}
    >
      {muted ? '🔇' : '🔊'}
    </button>
  );
}
