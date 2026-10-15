import { state } from '../core/state.js';
import { CLOCK, YIELD } from '../config/sim.js';
import { QUALITIES } from '../config/qualities.js';
import { clamp } from '../utils/math.js';
import { qualityMix, splitByQuality, zeroQ, sumQ } from './quality.js';

export function estimateYield(bed, qualityScore = 0.75) {
  const healthFactor = clamp((bed.health ?? 100) / 100, 0, 1);
  const stressFactor = clamp(1 - (bed.waterStress ?? 0) / 100, 0.2, 1);
  const overFactor = clamp(1 - (bed.overWater ?? 0) / 100, 0.2, 1);
  const diseaseFactor = clamp(1 - (bed.disease ?? 0) / 100, 0.2, 1);
  const qualityFactor = 0.4 + clamp(qualityScore ?? 0.75, 0, 1) * 1.1;
  const area = Number(bed.areaM2 ?? 1);
  const base = area * YIELD.baseStemsPerM2Month;

  return Number((base * healthFactor * stressFactor * overFactor * diseaseFactor * qualityFactor).toFixed(2));
}

export function produceWeek(bed, closeMonth) {
  let total = 0;
  if (bed.estado === 'sembrada' && !bed.damaged) {
    const zd = state.zoneDamage?.[bed.zone];
    const factor =
      clamp((bed.health ?? 100) / 100, 0, 1) * (1 - (bed.disease ?? 0) / 200) *
      (state.taskFactor?.harvest ?? 1) * (zd ? zd.prodFactor : 1);
    total = Math.round(((YIELD.baseStemsPerM2Month * bed.areaM2) / CLOCK.weeksPerMonth) * factor);
  }
  const split = splitByQuality(total, qualityMix(bed));
  for (const q of QUALITIES) {
    bed.stock[q.id] += split[q.id];
    bed.totalQ[q.id] += split[q.id];
    bed.monthTally[q.id] += split[q.id];
  }
  bed.lastWeekTotal = total;
  bed.yieldM2 = (total * CLOCK.weeksPerMonth) / bed.areaM2;
  if (closeMonth) {
    bed.history.push({ total: sumQ(bed.monthTally), byQuality: { ...bed.monthTally } });
    bed.monthTally = zeroQ();
  }
  return total;
}

export const computeYield = estimateYield;
export const simulateYield = estimateYield;
export const calculateYield = estimateYield;
