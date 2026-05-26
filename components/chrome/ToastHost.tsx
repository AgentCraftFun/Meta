'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect } from 'react';
import { useToastStore } from '@/lib/useToast';

const TONE_CLASSES: Record<'info' | 'success' | 'error', string> = {
  info: 'border-ds-accent-cyan/50 text-ds-accent-cyan',
  success: 'border-ds-accent-bull/50 text-ds-accent-bull',
  error: 'border-ds-accent-bear/50 text-ds-accent-bear',
};

/** Globally-mounted toast renderer. Lives in app/layout.tsx so any
 *  component can call useToastStore().show() without bolting a ref
 *  through the tree. */
export default function ToastHost() {
  const toast = useToastStore((s) => s.toast);
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    if (!toast) return;
    const id = window.setTimeout(dismiss, toast.durationMs);
    return () => window.clearTimeout(id);
  }, [toast, dismiss]);

  return (
    <div
      aria-live="polite"
      aria-atomic="true"
      className="pointer-events-none fixed bottom-ds5 left-1/2 z-[75] -translate-x-1/2"
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.18, ease: [0, 0, 0.2, 1] }}
            role="status"
            className={[
              'pointer-events-auto rounded-ds-sm border bg-ds-bg-surface px-ds4 py-ds2 font-ds-mono text-[11px] uppercase tracking-[0.32em] shadow-[0_12px_30px_-8px_rgba(0,0,0,0.55)]',
              TONE_CLASSES[toast.tone],
            ].join(' ')}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
