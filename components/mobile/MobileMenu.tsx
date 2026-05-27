'use client';

import { useState } from 'react';
import { useMetaStore } from '@/lib/store';
import { useToastStore } from '@/lib/useToast';

type Props = {
  onClose: () => void;
};

/**
 * Menu sheet — pulled in from the menu button in the top bar. Hosts
 * the "Map view is desktop-only" notice with email capture, plus a
 * sound toggle. No real backend for the email; we just toast a
 * confirmation and keep the address in localStorage so we can wire
 * a notify service later without changing UX.
 */
export default function MobileMenu({ onClose }: Props) {
  const muted = useMetaStore((s) => s.muted);
  const toggleMuted = useMetaStore((s) => s.toggleMuted);
  const showToast = useToastStore((s) => s.show);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      showToast("That doesn't look like an email", { tone: 'error' });
      return;
    }
    try {
      window.localStorage.setItem('metamap.mobileNotify.v1', email.trim());
    } catch {
      /* localStorage blocked — still acknowledge the user */
    }
    setSent(true);
    showToast("We'll ping you when mobile Map ships", { tone: 'success' });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Menu"
      className="fixed inset-0 z-[80] flex flex-col bg-ds-bg-base"
    >
      <header className="flex items-center justify-between border-b border-ds-border-subtle px-ds4 py-ds3 font-ds-mono">
        <span className="text-[11px] uppercase tracking-[0.4em] text-ds-text-primary">
          Menu
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-11 items-center rounded-ds-sm px-ds3 text-[11px] uppercase tracking-[0.32em] text-ds-text-secondary active:text-ds-text-primary"
        >
          Close
        </button>
      </header>

      <div className="flex-1 overflow-y-auto px-ds4 py-ds5 font-ds-mono">
        <section
          aria-label="Map availability"
          className="relative overflow-hidden rounded-ds-md border border-ds-border-subtle bg-ds-bg-surface p-ds5"
        >
          <span
            aria-hidden
            className="absolute left-0 top-0 h-full w-[4px] bg-ds-accent-cyan"
            style={{ boxShadow: '0 0 12px rgba(77, 212, 255, 0.55)' }}
          />
          <h2 className="text-[12px] uppercase tracking-[0.4em] text-ds-text-primary">
            Map view is desktop-only
          </h2>
          <p className="mt-ds3 text-[13px] leading-relaxed text-ds-text-secondary">
            The Earth + Moon scenes need a larger screen and a real GPU to
            feel right. Open MetaMap on a laptop or desktop browser for the
            full experience.
          </p>

          {sent ? (
            <p className="mt-ds4 text-[12px] leading-relaxed text-ds-accent-bull">
              ✓ You're on the list. We'll only email when there's something
              real to tell you.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-ds4 flex flex-col gap-ds2">
              <label
                htmlFor="notify-email"
                className="text-[10px] uppercase tracking-[0.36em] text-ds-text-tertiary"
              >
                Notify me on mobile?
              </label>
              <div className="flex gap-ds2">
                <input
                  id="notify-email"
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="h-11 flex-1 rounded-ds-sm border border-ds-border-strong bg-ds-bg-base px-ds3 text-[13px] text-ds-text-primary placeholder:text-ds-text-tertiary focus:border-ds-accent-cyan/60 focus:outline-none"
                />
                <button
                  type="submit"
                  className="h-11 rounded-ds-sm bg-ds-accent-cyan/15 px-ds4 text-[11px] uppercase tracking-[0.32em] text-ds-accent-cyan active:bg-ds-accent-cyan/25"
                >
                  Notify me
                </button>
              </div>
            </form>
          )}
        </section>

        <section
          aria-label="Settings"
          className="mt-ds5 flex flex-col gap-ds2 rounded-ds-md border border-ds-border-subtle bg-ds-bg-surface p-ds4"
        >
          <h3 className="text-[10px] uppercase tracking-[0.4em] text-ds-text-tertiary">
            Settings
          </h3>
          <div className="flex items-center justify-between">
            <span className="text-[13px] text-ds-text-primary">
              Sound on high-impact alerts
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={!muted}
              onClick={() => toggleMuted()}
              className={[
                'inline-flex h-7 w-12 items-center rounded-full border transition-colors duration-ds-fast ease-ds-standard',
                muted
                  ? 'border-ds-border-strong bg-ds-bg-base'
                  : 'border-ds-accent-bull/60 bg-ds-accent-bull/20',
              ].join(' ')}
            >
              <span
                aria-hidden
                className={[
                  'block h-5 w-5 rounded-full bg-ds-text-primary transition-transform duration-ds-fast ease-ds-standard',
                  muted ? 'translate-x-[2px]' : 'translate-x-[22px]',
                ].join(' ')}
              />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
