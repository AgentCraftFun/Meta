'use client';

/**
 * A faint cyan horizontal scan line that sweeps top → bottom on a slow loop.
 * Pure decorative atmosphere; sits absolute inside a section.
 */
export default function Scanline() {
  return (
    <span
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-px"
      style={{
        background:
          'linear-gradient(to right, transparent, rgba(34, 211, 238, 0.55) 50%, transparent)',
        animation: 'scanline-sweep 9s linear infinite',
      }}
    >
      <style jsx>{`
        @keyframes scanline-sweep {
          0% {
            transform: translateY(0);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          95% {
            opacity: 1;
          }
          100% {
            transform: translateY(800px);
            opacity: 0;
          }
        }
      `}</style>
    </span>
  );
}
