import { state } from '../core/state.js';
import { FERT, SOIL } from '../config/sim.js';
import { clamp } from '../utils/math.js';

export function updateSoil(bed, waterRatio = 1, fertilizerRatio = 1) {
  const currentStress = Number(bed.waterStress ?? 0);
  const currentOver = Number(bed.overWater ?? 0);
  const currentFertilizer = Number(bed.fertilizer ?? 50);
  const shortage = Math.max(0, 1 - Number(waterRatio ?? 1));
  const excess = Math.max(0, Number(waterRatio ?? 1) - 1.1);
  const nextStress = clamp(
    currentStress + shortage * SOIL.stressGain - (waterRatio >= SOIL.recoverAtRatio ? SOIL.stressRecover : 0),
    0,
    100,
  );
  const nextOver = clamp(
    currentOver + excess * SOIL.overGain - (waterRatio >= 1 ? SOIL.overRecover : 0),
    0,
    100,
  );
  const fertInput = (FERT.plan[state.plan.fertilizer] ?? 0) * state.taskFactor.fert * fertilizerRatio;
  const nextFertilizer = clamp(currentFertilizer + fertInput, 0, 100);

  bed.waterStress = nextStress;
  bed.overWater = nextOver;
  bed.fertilizer = nextFertilizer;

  return {
    waterStress: nextStress,
    overWater: nextOver,
    fertilizer: nextFertilizer,
    ratio: Number(waterRatio ?? 1),
  };
}

export const applySoil = updateSoil;
export const stepSoil = updateSoil;
