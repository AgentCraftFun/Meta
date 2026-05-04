'use client';

import { useEffect } from 'react';
import { useMetaStore } from '@/lib/store';

/**
 * Esc closes the country panel; 1/2/3 switch the time window. No-op when
 * the user is typing in an input/textarea/contenteditable.
 */
export default function KeyboardShortcuts() {
  useEffect(() => {
    const isTextTarget = (t: EventTarget | null) => {
      if (!(t instanceof HTMLElement)) return false;
      if (t.isContentEditable) return true;
      const tag = t.tagName;
      return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTextTarget(e.target)) return;

      const store = useMetaStore.getState();
      switch (e.key) {
        case 'Escape':
          if (store.selectedCountry) {
            e.preventDefault();
            store.setSelectedCountry(null);
          }
          break;
        case '1':
          e.preventDefault();
          store.setTimeWindow('1h');
          break;
        case '2':
          e.preventDefault();
          store.setTimeWindow('24h');
          break;
        case '3':
          e.preventDefault();
          store.setTimeWindow('7d');
          break;
        case 'm':
        case 'M':
          e.preventDefault();
          store.toggleMuted();
          break;
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return null;
}
