'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { useSceneStore } from '@/components/sitenew/system/useSceneStore';
import { color, dur, ease, easeCss, z } from '@/components/sitenew/system/motion';

const LINES = ['IGNITION SEQUENCE', 'LIQUIDITY LOCKED', 'WE HAVE LIFTOFF'];
const SESSION_KEY = 'sm-booted';

/**
 * One-time power-on. Three mono lines resolve (opacity 0→1 + y 6→0, 0.18s
 * each, 0.22s stagger), brief hold, then a cyan clip-path wipe (0.5s quartIO)
 * sweeps the panel away. Total ≤ 1.3s. Skippable. Runs once per session.
 *
 * REDUCED-MOTION (or already-booted-this-session): does not render; sets
 * store.booted = true immediately.
 */
export default function BootSequence() {
  const reducedMotion = useSceneStore((s) => s.reducedMotion);
  const setBooted = useSceneStore((s) => s.setBooted);
  const [phase, setPhase] = useState<'init' | 'lines' | 'wipe' | 'done'>('init');
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  const finish = () => {
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* sessionStorage may be unavailable; boot just replays */
    }
    setBooted(true);
    setPhase('done');
  };

  useEffect(() => {
    const alreadyBooted = (() => {
      try {
        return sessionStorage.getItem(SESSION_KEY) === '1';
      } catch {
        return false;
      }
    })();

    if (reducedMotion || alreadyBooted) {
      setBooted(true);
      setPhase('done');
      return;
    }

    setPhase('lines');
    // lines: last starts at 2*0.22, runs 0.18 → done ~0.62s. Hold to 0.7s.
    const wipeAt = 700;
    const wipeDur = 500;
    const t1 = setTimeout(() => setPhase('wipe'), wipeAt);
    const t2 = setTimeout(finish, wipeAt + wipeDur);
    timers.current.push(t1, t2);

    return () => {
      timers.current.forEach(clearTimeout);
      timers.current = [];
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reducedMotion]);

  const skip = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    finish();
  };

  return (
    <AnimatePresence>
      {phase !== 'done' && phase !== 'init' && (
        <motion.div
          key="boot"
          aria-hidden
          className="fixed inset-0 flex items-center justify-center"
          style={{ background: color.bg, zIndex: z.boot }}
          initial={{ clipPath: 'inset(0 0 0 0)' }}
          animate={
            phase === 'wipe'
              ? { clipPath: 'inset(0 0 0 100%)' }
              : { clipPath: 'inset(0 0 0 0)' }
          }
          transition={{ duration: dur.fast + 0.3, ease: ease.quartIO }}
        >
          {/* cyan scan line riding the wipe front */}
          {phase === 'wipe' && (
            <span
              className="absolute inset-y-0 right-0 w-px"
              style={{
                background: color.cyan,
                boxShadow: `0 0 18px 2px ${color.cyan}`,
              }}
            />
          )}

          <div className="flex flex-col items-center gap-3 font-mono text-[12px] uppercase tracking-[0.42em] text-accent-300">
            {LINES.map((line, i) => (
              <motion.div
                key={line}
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18, delay: i * 0.22, ease: ease.expoOut }}
              >
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ background: color.cyan, boxShadow: `0 0 10px ${color.cyan}` }}
                />
                {line}
              </motion.div>
            ))}
          </div>

          <button
            type="button"
            onClick={skip}
            className="absolute bottom-8 right-8 font-mono text-[10px] uppercase tracking-[0.4em] text-slate-500 transition-colors hover:text-accent-300"
            style={{ transitionTimingFunction: easeCss.powerOut }}
          >
            Skip →
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
