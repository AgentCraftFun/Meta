import { SLOTS, type Slot } from '@/components/sitenew/scene/globeSlots';

/**
 * /siteMARS slot table. Inherits every hand-tuned /siteNEW slot, overriding ONLY
 * §5 (Vision / Tokenomics) so the Mars body centres in the left "Burn" card on
 * the centre-locked stage. Passed to <GlobeStageController slots={SLOTS_MARS} />
 * so /siteNEW's slots stay untouched.
 *
 * §5 cx = 0.5 − 420/STAGE_LOCK_W ≈ 0.257 puts the globe on the first of three
 * centred cards (content max-w-1240, 3-col gap-5 → card-1 centre is ~420px left
 * of the stage centre). cy/scale unchanged.
 */
export const SLOTS_MARS: Slot[] = SLOTS.map((s, i) =>
  i === 5 ? { ...s, cx: 0.257 } : s
);
