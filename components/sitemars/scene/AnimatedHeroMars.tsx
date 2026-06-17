'use client';

import { z, rgba } from '@/components/sitenew/system/motion';

/**
 * MOBILE / reduced-motion / no-WebGL hero globe — a tasteful, GPU-cheap ANIMATED
 * CSS Mars (no WebGL, no travelling stage). The equirectangular surface scrolls
 * under a FIXED spherical shadow + warm rim, so the planet reads as slowly
 * rotating; a soft atmosphere breathes, a tilted satellite sweeps an orbital
 * ring, and a faint starfield twinkles. Every animation is GPU-composited
 * (transform / opacity only) and is disabled under prefers-reduced-motion.
 *
 * This replaces the dead static frame so phones get real "wow" without the
 * desktop WebGL stage that mobile can't reliably run.
 */

const RIM = '#E8794A';

export default function AnimatedHeroMars() {
  return (
    <div
      aria-hidden
      className="amars pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: z.earth, background: '#05080F' }}
    >
      <div className="amars__stars absolute inset-0" />

      <div className="amars__system absolute">
        {/* atmosphere halo (behind the disc) */}
        <div className="amars__glow absolute" />
        {/* planet — clipped circle with a scrolling surface */}
        <div className="amars__planet absolute">
          <div className="amars__surface absolute" />
        </div>
        {/* fixed spherical shading + warm rim (sell the sphere) */}
        <div className="amars__shadow absolute" />
        <div className="amars__rim absolute" />
        {/* orbital ring + satellite (on top) */}
        <div className="amars__orbit absolute">
          <span className="amars__sat" />
        </div>
      </div>

      <div className="amars__grade absolute inset-0" />

      <style jsx>{`
        .amars__system {
          right: -14%;
          top: 50%;
          width: min(88vh, 92vw);
          height: min(88vh, 92vw);
          transform: translateY(-50%);
          opacity: 0.86;
          perspective: 900px;
        }
        .amars__planet {
          inset: 0;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: inset 0 0 70px 12px rgba(2, 6, 15, 0.45);
        }
        .amars__surface {
          inset: 0;
          width: 200%;
          background-image: url('/textures/4k_mars.jpg');
          background-size: 50% 100%;
          background-repeat: repeat-x;
          filter: saturate(1.06) brightness(0.85);
          will-change: transform;
        }
        .amars__shadow {
          inset: 0;
          border-radius: 50%;
          background: radial-gradient(
            circle at 64% 36%,
            rgba(0, 0, 0, 0) 30%,
            rgba(2, 6, 15, 0.92) 82%
          );
        }
        .amars__rim {
          inset: 0;
          border-radius: 50%;
          box-shadow: inset 16px 12px 48px ${rgba(RIM, 0.28)},
            0 0 80px ${rgba(RIM, 0.22)};
        }
        .amars__glow {
          inset: -14%;
          border-radius: 50%;
          background: radial-gradient(
            circle at 50% 50%,
            ${rgba(RIM, 0.18)} 56%,
            transparent 72%
          );
          filter: blur(16px);
          will-change: opacity, transform;
        }
        .amars__orbit {
          inset: -9%;
          border-radius: 50%;
          border: 1px solid ${rgba(RIM, 0.16)};
          transform: rotate3d(1, 0.18, 0, 76deg) rotateZ(0deg);
          will-change: transform;
        }
        .amars__sat {
          position: absolute;
          top: -4px;
          left: 50%;
          width: 7px;
          height: 7px;
          margin-left: -3.5px;
          border-radius: 50%;
          background: ${RIM};
          box-shadow: 0 0 12px 2px ${rgba(RIM, 0.8)};
        }
        .amars__stars {
          background-image:
            radial-gradient(1.5px 1.5px at 18% 28%, rgba(255, 255, 255, 0.75), transparent),
            radial-gradient(1px 1px at 68% 58%, rgba(255, 255, 255, 0.5), transparent),
            radial-gradient(1.5px 1.5px at 38% 82%, rgba(255, 255, 255, 0.6), transparent),
            radial-gradient(1px 1px at 84% 22%, rgba(255, 255, 255, 0.55), transparent),
            radial-gradient(1px 1px at 52% 12%, rgba(255, 255, 255, 0.45), transparent),
            radial-gradient(1px 1px at 8% 66%, rgba(255, 255, 255, 0.5), transparent),
            radial-gradient(1px 1px at 90% 78%, rgba(255, 255, 255, 0.5), transparent);
          background-repeat: no-repeat;
        }
        .amars__grade {
          background: radial-gradient(
            ellipse at center,
            rgba(5, 8, 15, 0) 42%,
            rgba(5, 8, 15, 0.66) 100%
          );
        }

        @media (prefers-reduced-motion: no-preference) {
          .amars__surface {
            animation: amars-rotate 60s linear infinite;
          }
          .amars__glow {
            animation: amars-breathe 7s ease-in-out infinite;
          }
          .amars__orbit {
            animation: amars-orbit 16s linear infinite;
          }
          .amars__stars {
            animation: amars-twinkle 6s ease-in-out infinite;
          }
        }

        @keyframes amars-rotate {
          to {
            transform: translateX(-50%);
          }
        }
        @keyframes amars-breathe {
          0%,
          100% {
            opacity: 0.72;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.045);
          }
        }
        @keyframes amars-orbit {
          from {
            transform: rotate3d(1, 0.18, 0, 76deg) rotateZ(0deg);
          }
          to {
            transform: rotate3d(1, 0.18, 0, 76deg) rotateZ(360deg);
          }
        }
        @keyframes amars-twinkle {
          0%,
          100% {
            opacity: 0.55;
          }
          50% {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
