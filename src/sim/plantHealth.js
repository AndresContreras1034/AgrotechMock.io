import { HEALTH } from '../config/sim.js';
import { clamp } from '../utils/math.js';

export function evaluatePlantHealth(bed) {
  const waterStress = Number(bed.waterStress ?? 0);
  const overWater = Number(bed.overWater ?? 0);
  const disease = Number(bed.disease ?? 0);
  const fertilizer = Number(bed.fertilizer ?? 50);

  let health = 100;
  health -= Math.max(0, waterStress - HEALTH.lackBelow) * HEALTH.lackRate * 30;
  health -= Math.max(0, waterStress - HEALTH.stressAbove) * HEALTH.stressRate * 25;
  health -= Math.max(0, overWater - HEALTH.overAbove) * HEALTH.overRate * 35;
  health -= disease * HEALTH.diseaseRate;
  health -= Math.max(0, fertilizer - 75) * 0.12;
  health = clamp(health, 0, 100);

  let status = 'ok';
  if (health < 45) status = 'crit';
  else if (health < 70) status = 'warn';

  return { health, status, waterStress, overWater, disease, fertilizer };
}

export const computePlantHealth = evaluatePlantHealth;
export const updatePlantHealth = evaluatePlantHealth;
export const applyPlantHealth = evaluatePlantHealth;
