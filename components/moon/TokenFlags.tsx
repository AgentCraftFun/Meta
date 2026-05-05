'use client';

import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { FILTER_ACCENT, type MoonFilter } from '@/lib/moonFlags';
import { getFlagPosition } from '@/lib/moonFlagPlacement';
import { playTick } from '@/lib/sound';
import { useMetaStore } from '@/lib/store';
import type { Token } from '@/lib/types/token';
import Flag from './Flag';

type Props = {
  tokens: Token[];
  filter: MoonFilter;
};

type FlagState = {
  token: Token;
  position: THREE.Vector3;
  /**
   * Negative values represent "stagger countdown" — at -0.4 the flag is
   * waiting 400ms before starting to grow. From 0 → 1 it grows; visible
   * scale is max(0, fade).
   */
  fade: number;
  target: number;
};

const FADE_IN_MS = 400;
const FADE_OUT_MS = 300;
const STAGGER_PER_RANK_MS = 15;

/**
 * Container for all flags currently planted on the moon. Owns:
 *  - the per-token state map (entering / leaving / fade values)
 *  - the per-frame fade loop (mutates each flag group's scale directly,
 *    no React re-render churn)
 *  - hover + click events feeding the zustand store so the side-panel
 *    list can highlight and auto-scroll bidirectionally
 *
 * Top-rank flags get prime placement (north pole of the visible
 * hemisphere); lower-ranked spiral around via golden angle. New flags
 * fade in with rank-staggered delay; departed flags fade out and unmount
 * once their fade hits 0.
 */
export default function TokenFlags({ tokens, filter }: Props) {
  const setSelectedToken = useMetaStore((s) => s.setSelectedToken);
  const setHoveredToken = useMetaStore((s) => s.setHoveredToken);
  const hoveredTokenId = useMetaStore((s) => s.hoveredTokenId);
  const filterColor = FILTER_ACCENT[filter];

  // Persistent flag state across renders. Mutated in useFrame.
  const flagStates = useRef<Map<string, FlagState>>(new Map());
  // Group refs by token id so the per-frame loop can mutate scale.
  const groupRefs = useRef<Map<string, THREE.Group>>(new Map());

  // Mirror the union of (entering + visible + leaving) tokens to React
  // state so Flag components mount/unmount cleanly.
  const [displayed, setDisplayed] = useState<Token[]>([]);

  // Reconcile the incoming token list with the flag state map.
  useEffect(() => {
    const incoming = new Map(tokens.map((t, i) => [t.id, { token: t, rank: i }]));

    // Mark removed tokens to fade out.
    for (const [id, state] of flagStates.current) {
      if (!incoming.has(id)) state.target = 0;
    }

    // Add or refresh tokens.
    let needsDisplayRefresh = false;
    for (const [id, { token, rank }] of incoming) {
      const existing = flagStates.current.get(id);
      const position = getFlagPosition(rank, tokens.length);
      if (existing) {
        existing.target = 1;
        existing.token = token;
        existing.position = position;
      } else {
        // Stagger new flags by rank — fade starts at -stagger so it has to
        // count up to 0 before becoming visible.
        const stagger = (rank * STAGGER_PER_RANK_MS) / FADE_IN_MS;
        flagStates.current.set(id, {
          token,
          position,
          fade: -stagger,
          target: 1,
        });
        needsDisplayRefresh = true;
      }
    }

    // Make sure displayed list contains everything currently in flagStates
    // (entering + leaving). Removals happen in useFrame when fade hits 0.
    if (needsDisplayRefresh || displayed.length !== flagStates.current.size) {
      setDisplayed(
        Array.from(flagStates.current.values()).map((s) => s.token)
      );
    }
    // We deliberately re-run only on tokens prop change — internal mutations
    // of flagStates don't need to re-trigger this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  useFrame((_, delta) => {
    const stepIn = (delta * 1000) / FADE_IN_MS;
    const stepOut = (delta * 1000) / FADE_OUT_MS;

    let removalScheduled: string[] | null = null;

    for (const [id, state] of flagStates.current) {
      // Step toward target.
      if (state.target > state.fade) {
        state.fade = Math.min(state.target, state.fade + stepIn);
      } else if (state.target < state.fade) {
        state.fade = Math.max(state.target, state.fade - stepOut);
      }

      // Update the group's scale. Pre-stagger (fade < 0) renders nothing.
      const visualScale = Math.max(0, state.fade);
      const group = groupRefs.current.get(id);
      if (group) group.scale.setScalar(visualScale);

      if (state.fade <= 0 && state.target === 0) {
        if (!removalScheduled) removalScheduled = [];
        removalScheduled.push(id);
      }
    }

    if (removalScheduled) {
      for (const id of removalScheduled) {
        flagStates.current.delete(id);
        groupRefs.current.delete(id);
      }
      // Sync displayed list — drives unmount of fully-faded Flag components.
      setDisplayed((prev) => prev.filter((t) => !removalScheduled!.includes(t.id)));
    }
  });

  const stableHandlers = useMemo(() => {
    return {
      over: (id: string) => (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        setHoveredToken(id);
        document.body.style.cursor = 'pointer';
      },
      out: (id: string) => (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation();
        // Only clear if we're still the active hovered token; another
        // flag's pointerOver may have already replaced us.
        if (useMetaStore.getState().hoveredTokenId === id) {
          setHoveredToken(null);
        }
        document.body.style.cursor = 'auto';
      },
      click: (id: string) => (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation();
        if (!useMetaStore.getState().muted) playTick();
        const cur = useMetaStore.getState().selectedTokenId;
        setSelectedToken(cur === id ? null : id);
      },
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <group>
      {displayed.map((token) => {
        const state = flagStates.current.get(token.id);
        if (!state) return null;
        return (
          <Flag
            key={token.id}
            ref={(el) => {
              if (el) groupRefs.current.set(token.id, el);
              else groupRefs.current.delete(token.id);
            }}
            token={token}
            position={state.position}
            filterColor={filterColor}
            highlighted={hoveredTokenId === token.id}
            onPointerOver={stableHandlers.over(token.id)}
            onPointerOut={stableHandlers.out(token.id)}
            onClick={stableHandlers.click(token.id)}
          />
        );
      })}
    </group>
  );
}
