'use client';

const LINKS = [
  { label: 'Twitter', href: 'https://x.com' },
  { label: 'Terminal', href: '/terminal' },
  { label: 'API', href: '/api/health' },
];

export default function Footer() {
  return (
    <footer className="w-full border-t border-[#1E293B] px-6 py-[60px] md:px-10">
      <div className="mx-auto flex max-w-[1240px] flex-col items-start gap-8 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-1">
          <span className="font-sans text-[16px] font-black uppercase tracking-[0.32em] text-white">
            MetaMap
          </span>
          <span className="font-mono text-[10px] uppercase tracking-[0.32em] text-slate-500">
            © 2026 · All rights reserved
          </span>
        </div>

        <nav className="flex flex-wrap items-center gap-6">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('http') ? '_blank' : undefined}
              rel={link.href.startsWith('http') ? 'noreferrer' : undefined}
              className="group relative inline-block font-mono text-[11px] uppercase tracking-[0.32em] text-slate-400 transition-colors hover:text-cyan-300"
            >
              {link.label}
              {/* underline grows left→right on hover (0.2s powerOut) */}
              <span
                aria-hidden
                className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-cyan-300 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100"
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 border border-[#1E293B] bg-[#0B1220] px-3 py-2 font-mono text-[10px] uppercase tracking-[0.32em] text-slate-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
          All Systems Operational
        </div>
      </div>
    </footer>
  );
}
