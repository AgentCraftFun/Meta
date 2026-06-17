import Link from 'next/link';
import MarsStage from '@/components/marstracker/MarsStage';
import TrackerConsole from '@/components/marstracker/TrackerConsole';

export { metadata } from './metadata';

/**
 * /MarsTracker — the Starship Protocol $SPCX rewards tracker (dApp).
 *
 * A standalone, read-only experience (no scroll-snap site system): paste a
 * wallet, read its on-chain $SPCX straight from Ethereum, see what it has
 * accrued. Scoped to `.theme-mars` so it inherits the /siteMARS palette + glass.
 */
export default function MarsTrackerPage() {
  return (
    <div className="theme-mars relative min-h-screen w-full overflow-hidden bg-[#05080F] text-slate-100">
      {/* Branded ambient backdrop — live spinning 3D Mars (same grade as
          /siteMARS), starfield, atmosphere, contrast vignette. */}
      <MarsStage />

      {/* Foreground */}
      <div className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="flex items-center justify-between px-6 py-6 md:px-10">
          <Link href="/siteMARS" className="group flex items-center gap-3">
            <img
              src="/Starship_Protocol_Logo.png"
              alt="Starship Protocol"
              className="h-9 w-9 object-contain drop-shadow-[0_0_18px_rgb(var(--accent-400)_/_0.4)]"
            />
            <span className="font-display text-[15px] font-bold tracking-[-0.01em] text-white">
              Starship Protocol
            </span>
          </Link>
          <Link
            href="/siteMARS"
            className="flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.32em] text-slate-400 transition-colors hover:text-accent-300"
          >
            <span aria-hidden>←</span>
            Back to site
          </Link>
        </header>

        {/* Console — top-aligned so the copy uses the upper space and clears
            the planet rising from below; the card floats over the planet. */}
        <main className="flex flex-1 items-start justify-center px-6 pt-[3vh] pb-20 md:pt-[5vh]">
          <TrackerConsole />
        </main>
      </div>
    </div>
  );
}
