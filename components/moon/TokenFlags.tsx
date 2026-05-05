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

/** Top-N rank → base scale multiplier. Hierarchy is the whole point. */
function getRankScale(rank: number): number {
  if (rank === 0) return 1.6;
  if (rank < 3) return 1.3;
  if (rank < 10) return 1.1;
  return 1.0;
}

const PLANT_DURATION_MS = 600;
const PLANT_STAGGER_PER_RANK_MS = 50;
const FADE_OUT_MS = 300;
const HOVER_SCALE_BOOST = 0.15;
const HOVER_LERP_SPEED = 12; // 1/seconds; ~80ms to reach full hover

type Phase = 'entering' | 'visible' | 'leaving';

type FlagState = {
  token: Token;
  rank: number;
  position: THREE.Vector3;
  baseScale: number;
  phase: Phase;
  /** When the entering phase started. */
  enterStart: number;
  /** Stagger offset relative to enterStart, in ms. */
  stagger: number;
  /** Set when phase flips to 'leaving'. */
  exitStart: number;
  /** Smoothed hover state, 0..1. */
  hoverFade: number;
};

/**
 * easeOutBack — eases past 1 then settles, gives a "plant with a thunk" feel.
 * c1/c3 are the standard CSS values for the curve.
 */
function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function lerp(from: number, to: number, t: number): number {
  return from + (to - from) * Math.min(1, Math.max(0, t));
}

/**
 * Container for all flags currently planted on the moon. Owns:
 *  - the per-token state map (entering / visible / leaving)
 *  - the per-frame scale loop (ease-out-back plant + hover boost) which
 *    mutates each flag group's scale directly without re-rendering
 *  - hover + click events feeding the zustand store
 */
export default function TokenFlags({ tokens, filter }: Props) {
  const setSelectedToken = useMetaStore((s) => s.setSelectedToken);
  const setHoveredToken = useMetaStore((s) => s.setHoveredToken);
  const hoveredTokenId = useMetaStore((s) => s.hoveredTokenId);
  const filterColor = FILTER_ACCENT[filter];

  const flagStates = useRef<Map<string, FlagState>>(new Map());
  const groupRefs = useRef<Map<string, THREE.Group>>(new Map());

  const [displayed, setDisplayed] = useState<Token[]>([]);

  useEffect(() => {
    const incoming = new Map(tokens.map((t, i) => [t.id, { token: t, rank: i }]));
    const now = performance.now();

    // Mark removed tokens for fade-out.
    for (const [id, state] of flagStates.current) {
      if (!incoming.has(id) && state.phase !== 'leaving') {
        state.phase = 'leaving';
        state.exitStart = now;
      }
    }

    // Add or refresh tokens.
    let needsDisplayRefresh = false;
    for (const [id, { token, rank }] of incoming) {
      const existing = flagStates.current.get(id);
      const position = getFlagPosition(rank, tokens.length);
      const baseScale = getRankScale(rank);
      if (existing) {
        // Already on the moon — refresh metadata + cancel any pending exit.
        if (existing.phase === 'leaving') {
          existing.phase = 'entering';
          existing.enterStart = now;
        }
        existing.token = token;
        existing.rank = rank;
        existing.position = position;
        existing.baseScale = baseScale;
        existing.stagger = rank * PLANT_STAGGER_PER_RANK_MS;
      } else {
        flagStates.current.set(id, {
          token,
          rank,
          position,
          baseScale,
          phase: 'entering',
          enterStart: now,
          stagger: rank * PLANT_STAGGER_PER_RANK_MS,
          exitStart: 0,
          hoverFade: 0,
        });
        needsDisplayRefresh = true;
      }
    }

    if (needsDisplayRefresh || displayed.length !== flagStates.current.size) {
      setDisplayed(Array.from(flagStates.current.values()).map((s) => s.token));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokens]);

  useFrame((_, delta) => {
    const now = performance.now();
    const hoverId = useMetaStore.getState().hoveredTokenId;
    const removals: string[] = [];

    for (const [id, state] of flagStates.current) {
      // Compute the visible scale based on phase.
      let phaseScale = 0;
      if (state.phase === 'entering') {
        const dt = Math.max(0, now - state.enterStart - state.stagger);
        const t = Math.min(1, dt / PLANT_DURATION_MS);
        phaseScale = easeOutBack(t);
        if (t >= 1) state.phase = 'visible';
      } else if (state.phase === 'visible') {
        phaseScale = 1;
      } else {
        const dt = now - state.exitStart;
        const t = Math.min(1, dt / FADE_OUT_MS);
        phaseScale = 1 - t;
        if (t >= 1) removals.push(id);
      }

      // Smooth hover scale boost.
      const hoverTarget = hoverId === id ? 1 : 0;
      state.hoverFade = lerp(state.hoverFade, hoverTarget, delta * HOVER_LERP_SPEED);
      const hoverMul = 1 + HOVER_SCALE_BOOST * state.hoverFade;

      const finalScale = state.baseScale * Math.max(0, phaseScale) * hoverMul;
      const group = groupRefs.current.get(id);
      if (group) group.scale.setScalar(finalScale);
    }

    if (removals.length) {
      for (const id of removals) {
        flagStates.current.delete(id);
        groupRefs.current.delete(id);
      }
      setDisplayed((prev) => prev.filter((t) => !removals.includes(t.id)));
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
