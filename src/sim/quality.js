import { QUALITIES, QUALITY_MODEL } from '../config/qualities.js';
import { clamp } from '../utils/math.js';

export function zeroQ() {
  return Object.fromEntries(QUALITIES.map((q) => [q.id, 0]));
}

export function qualityMix(bed) {
  const mix = zeroQ();
  const health = clamp((bed?.health ?? 100) / 100, 0, 1);
  const disease = clamp((bed?.disease ?? 0) / 100, 0, 1);
  const weights = {
    premium: 0.12 + health * 0.12 - disease * 0.04,
    primera: 0.38 + health * 0.18 - disease * 0.06,
    segunda: 0.28 + health * 0.08 - disease * 0.04,
    nacional: 0.16 + (1 - health) * 0.12 + disease * 0.08,
    descarte: Math.max(0.02, 0.06 + (1 - health) * 0.08 + disease * 0.15),
  };
  const total = Object.values(weights).reduce((a, b) => a + b, 0) || 1;
  for (const q of QUALITIES) mix[q.id] = weights[q.id] / total;
  return mix;
}

export function splitByQuality(total, mix) {
  const out = zeroQ();
  let remaining = Math.max(0, total);
  const ids = QUALITIES.map((q) => q.id);
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i];
    const raw = Math.floor(total * (mix[id] ?? 0));
    out[id] = i === ids.length - 1 ? remaining : raw;
    remaining -= out[id];
  }
  return out;
}

export function sumQ(q) {
  return Object.values(q ?? {}).reduce((a, b) => a + Number(b || 0), 0);
}

export function evaluateQuality(bed) {
  const waterStress = Number(bed.waterStress ?? 0);
  const overWater = Number(bed.overWater ?? 0);
  const fertilizer = Number(bed.fertilizer ?? 50);
  const disease = Number(bed.disease ?? 0);

  let score = 1;
  score -= waterStress * QUALITY_MODEL.perWaterStress;
  score -= overWater * QUALITY_MODEL.perOverWater;
  score -= Math.max(0, fertilizer - QUALITY_MODEL.fertOverAbove) * QUALITY_MODEL.perFertOver;
  score -= disease * QUALITY_MODEL.perDisease;
  score = clamp(score, 0, 1);

  const quality = QUALITIES.reduce((best, candidate) => {
    const previousDelta = Math.abs(best.center - score);
    const nextDelta = Math.abs(candidate.center - score);
    return nextDelta < previousDelta ? candidate : best;
  }, QUALITIES[0]);

  return {
    score,
    quality: quality.id,
    name: quality.name,
    price: quality.price,
    qualityIndex: QUALITIES.findIndex((q) => q.id === quality.id),
  };
}

export const computeQuality = evaluateQuality;
export const gradeQuality = evaluateQuality;
export const classifyQuality = evaluateQuality;
