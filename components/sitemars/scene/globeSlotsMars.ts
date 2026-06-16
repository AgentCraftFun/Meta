import { SLOTS, type Slot } from '@/components/sitenew/scene/globeSlots';

/**
 * /siteMARS slot table. Inherits every /siteNEW slot, overriding the two that
 * must sit inside a centred content box so they centre on the locked 1512×752
 * stage (see StageLock):
 *   §3 The Token — globe centres in the product-mock cutout cell.
 *     mock cell centre ≈ 976px at vw 1512  →  cx 976/1512 ≈ 0.645
 *   §5 Tokenomics — globe centres in the left "Burn" card.
 *     card-1 centre  ≈ 336px at vw 1512  →  cx 336/1512 ≈ 0.222
 * Passed via <GlobeStageController slots={SLOTS_MARS} /> so /siteNEW keeps SLOTS.
 */
export const SLOTS_MARS: Slot[] = SLOTS.map((s, i) => {
  if (i === 3) return { ...s, cx: 0.645 };
  if (i === 5) return { ...s, cx: 0.222 };
  return s;
});
