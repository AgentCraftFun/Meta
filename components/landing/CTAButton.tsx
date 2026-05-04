'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';

type Props = {
  href: string;
  children: ReactNode;
  size?: 'md' | 'lg';
};

export default function CTAButton({ href, children, size = 'md' }: Props) {
  const padding = size === 'lg' ? 'px-12 py-6 text-[18px]' : 'px-8 py-[18px] text-[14px]';
  return (
    <Link
      href={href}
      className={[
        'group relative inline-flex items-center gap-3 overflow-hidden border border-cyan-400/70 font-mono uppercase tracking-[0.32em] text-cyan-300 transition-all duration-200',
        'hover:-translate-y-1 hover:border-cyan-300 hover:bg-cyan-300 hover:text-[#05080F] hover:shadow-[0_8px_30px_-8px_rgba(34,211,238,0.55)]',
        padding,
      ].join(' ')}
    >
      <span className="relative z-10">{children}</span>
      <span
        aria-hidden
        className="relative z-10 transition-transform duration-200 group-hover:translate-x-1"
      >
        →
      </span>
    </Link>
  );
}
