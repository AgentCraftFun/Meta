'use client';

type Props = {
  index: string;
  label: string;
  align?: 'left' | 'center';
};

export default function SectionLabel({ index, label, align = 'left' }: Props) {
  return (
    <div
      // Near-plane parallax accent for the section-snap depth effect — the
      // eyebrow rushes slightly faster than the content block. Inert when snap
      // is off (no inline transform is ever written).
      data-snap-depth="1.2"
      className={[
        'flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.42em] text-accent-400/85',
        align === 'center' ? 'justify-center' : '',
      ].join(' ')}
    >
      <span className="text-accent-400/55">{index}</span>
      <span aria-hidden className="h-px w-10 bg-accent-400/35" />
      <span>{label}</span>
    </div>
  );
}
