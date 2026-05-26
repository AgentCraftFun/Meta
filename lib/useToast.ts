'use client';

import { create } from 'zustand';

/**
 * Tiny global toast queue. One slot at a time — the TopBar / Toast
 * mount picks it up and renders. Auto-dismisses after `durationMs`
 * if no new toast pushes it out.
 */

export type Toast = {
  id: string;
  message: string;
  tone: 'info' | 'success' | 'error';
  durationMs: number;
};

type State = {
  toast: Toast | null;
};

type Actions = {
  show: (message: string, opts?: { tone?: Toast['tone']; durationMs?: number }) => void;
  dismiss: () => void;
};

let counter = 0;

export const useToastStore = create<State & Actions>((set) => ({
  toast: null,
  show: (message, opts) => {
    counter += 1;
    set({
      toast: {
        id: `t-${Date.now()}-${counter}`,
        message,
        tone: opts?.tone ?? 'success',
        durationMs: opts?.durationMs ?? 2200,
      },
    });
  },
  dismiss: () => set({ toast: null }),
}));
