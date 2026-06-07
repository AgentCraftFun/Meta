'use client';

const SIZE = 18;

function Bracket({
  className,
  d,
}: {
  className: string;
  d: string;
}) {
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
    >
      <path d={d} />
    </svg>
  );
}

/**
 * Cyan command-center corner brackets framing the hero. Stays in the page's
 * coordinate space (absolute, not fixed) so it lives only over the hero.
 */
export default function CornerBrackets() {
  return (
    <div
      aria-hidden
      // Nearest-plane parallax accent — the command-center frame rushes past the
      // camera fastest during a section-snap transition. Inert when snap is off.
      data-snap-depth="1.28"
      className="pointer-events-none absolute inset-5 z-30 text-cyan-400/70"
    >
      <Bracket
        className="absolute left-0 top-0"
        d={`M0 6 V0 H6`}
      />
      <Bracket
        className="absolute right-0 top-0"
        d={`M${SIZE - 6} 0 H${SIZE} V6`}
      />
      <Bracket
        className="absolute bottom-0 left-0"
        d={`M0 ${SIZE - 6} V${SIZE} H6`}
      />
      <Bracket
        className="absolute bottom-0 right-0"
        d={`M${SIZE - 6} ${SIZE} H${SIZE} V${SIZE - 6}`}
      />
    </div>
  );
}
