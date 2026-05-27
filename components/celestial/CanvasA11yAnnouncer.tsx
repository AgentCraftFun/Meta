'use client';

import { useEffect, useMemo, useState } from 'react';
import centroidsRaw from '@/public/data/country-centroids.json';
import { narrativeToTag } from '@/lib/narrativeTagger';
import { useMetaStore } from '@/lib/store';
import { useNarratives } from '@/lib/useNarratives';
import { useTokens } from '@/lib/useTokens';

type Centroid = { name: string };
const CENTROIDS = centroidsRaw as Record<string, Centroid>;

type Props = {
  surface: 'earth' | 'moon';
};

/**
 * Screen-reader announcer for the canvas surfaces. The WebGL canvas
 * itself can't expose its state to assistive tech, so this hidden
 * polite-live region reflects the current selection + filter set as
 * a plain-text sentence. Speech screen readers announce diffs only,
 * so changing this string drives a fresh announcement.
 *
 * Also labels the underlying canvas via the data-canvas-label
 * attribute (set on the parent), which Stage.tsx forwards into the
 * `<canvas>` element's `aria-label`.
 */
export default function CanvasA11yAnnouncer({ surface }: Props) {
  const window_ = useMetaStore((s) => s.timeWindow);
  const selectedCountry = useMetaStore((s) => s.selectedCountry);
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);
  const narrativeIds = useMetaStore((s) => s.narrativeIds);
  const chain = useMetaStore((s) => s.chain);
  const { data: narrativesData } = useNarratives(window_);
  const { data: tokensData } = useTokens(window_);

  const sentence = useMemo(() => {
    const parts: string[] = [];

    if (surface === 'earth') {
      parts.push('Earth scene.');
      if (selectedCountry) {
        const name = CENTROIDS[selectedCountry]?.name ?? selectedCountry;
        parts.push(`Country selected: ${name}.`);
      }
    } else {
      parts.push('Moon scene.');
      if (selectedTokenId) {
        const tok = (tokensData?.tokens ?? []).find(
          (t) => t.id === selectedTokenId
        );
        if (tok) parts.push(`Token selected: ${tok.symbol}.`);
      }
    }

    if (chain !== 'all') parts.push(`Chain filter: ${chain}.`);

    if (narrativeIds.length > 0) {
      const labels = narrativeIds
        .map((id) => {
          const n = (narrativesData?.narratives ?? []).find(
            (x) => x.id === id
          );
          return n ? narrativeToTag(n).label : id;
        })
        .join(', ');
      parts.push(`Narrative filter: ${labels}.`);
    }

    if (parts.length === 1) {
      parts.push(
        surface === 'earth'
          ? 'No filters active. Click a country pin to focus.'
          : 'No filters active. Click a crater to focus.'
      );
    }

    return parts.join(' ');
  }, [
    surface,
    selectedCountry,
    selectedTokenId,
    chain,
    narrativeIds,
    narrativesData,
    tokensData,
  ]);

  // Set the canvas's aria-label by walking the DOM. We can't touch
  // the <canvas> element through r3f's render tree, so this is the
  // pragmatic option that doesn't require a Stage refactor.
  const [, setBump] = useState(0);
  useEffect(() => {
    const id = window.setTimeout(() => {
      const canvas = document.querySelector('main canvas');
      if (canvas) {
        canvas.setAttribute('aria-label', sentence);
        canvas.setAttribute('role', 'img');
      }
      setBump((b) => b + 1);
    }, 50);
    return () => window.clearTimeout(id);
  }, [sentence]);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    >
      {sentence}
    </div>
  );
}
