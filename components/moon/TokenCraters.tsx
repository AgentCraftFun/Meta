'use client';

import { Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { HEAT_HDR, getCraterPosition } from '@/lib/craterPlacement';
import { computeActivity } from '@/lib/tokenActivity';
import { playTick } from '@/lib/sound';
import { useMetaStore } from '@/lib/store';
import type { Token } from '@/lib/types/token';
import CraterTooltip from './CraterTooltip';
import ImpactEvent from './ImpactEvent';
import TokenCrater from './TokenCrater';

const MAX_CRATERS = 40;
const FADE_OUT_MS = 300;
const HOVER_LERP_SPEED = 14;
const HOVER_SCALE_BOOST = 0.3; // 1.0 → 1.3 on hover
const IMPACT_STAGGER_MS = 100;

type Phase = 'pending-impact' | 'impacting' | 'visible' | 'leaving';

type CraterState = {
  token: Token;
  position: THREE.Vector3;
  activity: number;
  /** Fade in progresses 0 → 1 once 'impacting' completes (or instantly for
   *  non-impacted tokens). Visible scale = baseFade * hoverFade. */
  baseFade: number;
  hoverFade: number;
  phase: Phase;
  /** When 'pending-impact', this is the wall-clock time at which the
   *  ImpactEvent should mount (rank stagger). */
  impactStartAt: number;
  exitStart: number;
};

/**
 * Take the active filter's tokens and select the top N by activity for
 * the moon, returning them ranked. The right-side list still shows up
 * to 30 by filter rank — we deliberately diverge from the list ordering
 * here because the moon prioritises ACTIVITY (heat now), not market cap
 * rank.
 */
function pickTopByActivity(tokens: Token[]): Array<Token & { activity: number }> {
  return tokens
    .map((t) => ({ ...t, activity: computeActivity(t) }))
    .sort((a, b) => b.activity - a.activity)
    .slice(0, MAX_CRATERS);
}

type Props = {
  tokens: Token[];
};

/**
 * Orchestrates up to 40 craters on the moon. New craters arrive via the
 * meteor-impact animation (ImpactEvent), departed craters fade out. The
 * top N tokens by activity score are eligible at any time — that score
 * is recomputed when the underlying token list changes.
 */
export default function TokenCraters({ tokens }: Props) {
  const setSelectedToken = useMetaStore((s) => s.setSelectedToken);
  const setHoveredToken = useMetaStore((s) => s.setHoveredToken);
  const hoveredTokenId = useMetaStore((s) => s.hoveredTokenId);
  const selectedTokenId = useMetaStore((s) => s.selectedTokenId);

  const visible = useMemo(() => pickTopByActivity(tokens), [tokens]);

  const states = useRef<Map<string, CraterState>>(new Map());
  const groupRefs = useRef<Map<string, THREE.Group>>(new Map());
  const [displayed, setDisplayed] = useState<
    Array<Token & { activity: number }>
  >([]);

  // Reconcile incoming token set with the persistent state map.
  useEffect(() => {
    const incoming = new Map(visible.map((t, i) => [t.id, { token: t, rank: i }]));
    const now = performance.now();

    // Mark removed.
    for (const [id, state] of states.current) {
      if (!incoming.has(id) && state.phase !== 'leaving') {
        state.phase = 'leaving';
        state.exitStart = now;
      }
    }

    // Add new + refresh existing.
    let needsDisplay = false;
    for (const [id, { token, rank }] of incoming) {
      const existing = states.current.get(id);
      const position = getCraterPosition(token);
      const activity = token.activity;
      if (existing) {
        if (existing.phase === 'leaving') {
          // Was fading out — re-enter via impact.
          existing.phase = 'pending-impact';
          existing.impactStartAt = now + rank * IMPACT_STAGGER_MS;
          existing.baseFade = 0;
        }
        existing.token = token;
        existing.activity = activity;
        existing.position = position;
      } else {
        states.current.set(id, {
          token,
          position,
          activity,
          baseFade: 0,
          hoverFade: 0,
          phase: 'pending-impact',
          impactStartAt: now + rank * IMPACT_STAGGER_MS,
          exitStart: 0,
        });
        needsDisplay = true;
      }
    }

    if (needsDisplay || displayed.length !== states.current.size) {
      setDisplayed(
        Array.from(states.current.values()).map((s) => ({
          ...s.token,
          activity: s.activity,
        }))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  useFrame((_, delta) => {
    const now = performance.now();
    const hoverId = useMetaStore.getState().hoveredTokenId;
    const removals: string[] = [];

    for (const [id, s] of states.current) {
      // Phase transitions.
      if (s.phase === 'pending-impact' && now >= s.impactStartAt) {
        s.phase = 'impacting';
        s.impactStartAt = now; // reuse field as actual start
      }
      // 'impacting' → 'visible' is driven by ImpactEvent.onComplete

      // Fade-in once we're past the streak (after 700ms of impact).
      if (s.phase === 'impacting') {
        const tImpact = (now - s.impactStartAt) / 1500;
        // Crater visible from t≈0.65 onward
        s.baseFade = Math.min(1, Math.max(0, (tImpact - 0.65) / 0.35));
      } else if (s.phase === 'visible') {
        s.baseFade = 1;
      } else if (s.phase === 'leaving') {
        const t = (now - s.exitStart) / FADE_OUT_MS;
        s.baseFade = Math.max(0, 1 - t);
        if (t >= 1) removals.push(id);
      } else {
        // pending-impact — invisible
        s.baseFade = 0;
      }

      // Smooth hover scale boost.
      const hoverTarget = hoverId === id ? 1 : 0;
      s.hoverFade += (hoverTarget - s.hoverFade) * Math.min(1, delta * HOVER_LERP_SPEED);

      const finalScale = s.baseFade * (1 + HOVER_SCALE_BOOST * s.hoverFade);
      const grp = groupRefs.current.get(id);
      if (grp) grp.scale.setScalar(finalScale);
    }

    if (removals.length) {
      for (const id of removals) {
        states.current.delete(id);
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

  const onImpactComplete = (id: string) => {
    const s = states.current.get(id);
    if (s) s.phase = 'visible';
  };

  return (
    <group>
      {displayed.map((token) => {
        const s = states.current.get(token.id);
        if (!s) return null;
        const heatColor = colorFor(s.token.category);
        const showImpact = s.phase === 'impacting';
        const showCrater =
          s.phase === 'impacting' || s.phase === 'visible' || s.phase === 'leaving';
        const isActive =
          hoveredTokenId === token.id || selectedTokenId === token.id;

        return (
          <group key={token.id}>
            {showCrater && (
              <TokenCrater
                ref={(el) => {
                  if (el) groupRefs.current.set(token.id, el);
                  else groupRefs.current.delete(token.id);
                }}
                token={s.token}
                position={s.position}
                activity={s.activity}
                highlighted={isActive}
                onPointerOver={stableHandlers.over(token.id)}
                onPointerOut={stableHandlers.out(token.id)}
                onClick={stableHandlers.click(token.id)}
              />
            )}
            {showImpact && (
              <ImpactEvent
                target={s.position}
                color={heatColor}
                symbolSeed={token.symbol}
                onComplete={() => onImpactComplete(token.id)}
              />
            )}
            {isActive && showCrater && (
              <Html
                position={[s.position.x, s.position.y + 0.06, s.position.z]}
                zIndexRange={[40, 0]}
                style={{ pointerEvents: 'none' }}
                center
              >
                <CraterTooltip token={s.token} activity={s.activity} />
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}

/** Cache colour instances per heat tier so we don't allocate per render. */
const COLOR_CACHE = new Map<string, THREE.Color>();
function colorFor(category: keyof typeof HEAT_HDR): THREE.Color {
  let c = COLOR_CACHE.get(category);
  if (!c) {
    const [r, g, b] = HEAT_HDR[category];
    c = new THREE.Color(r, g, b);
    COLOR_CACHE.set(category, c);
  }
  return c;
}
