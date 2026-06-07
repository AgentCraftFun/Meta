'use client';

type Props = {
  index: string;
  label: string;
  align?: 'left' | 'center';
};

export default function SectionLabel({ index, label, align = 'left' }: Props) {
  return (
    <div
      className={[
        'flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.42em] text-cyan-400/85',
        align === 'center' ? 'justify-center' : '',
      ].join(' ')}
    >
      <span className="text-cyan-400/55">{index}</span>
      <span aria-hidden className="h-px w-10 bg-cyan-400/35" />
      <span>{label}</span>
    </div>
  );
}
