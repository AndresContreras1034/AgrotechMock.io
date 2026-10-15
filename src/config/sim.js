export const CLOCK = {
  monthNames: ['Enero', 'Febrero', 'Marzo', 'Abril'],
  weeksPerMonth: 4,
  totalWeeks: 16,
};

export const WATER = {
  creekM3AtFullFlow: 420,
  tankCapacityM3: 50,
  tankStartM3: 50,
  baseDemandM3PerBedWeek: 12,
  flowByWeek: [1, 1, 1, 1, 0.85, 0.7, 0.6, 0.5, 0.4, 0.3, 0.2, 0.1, 0.1, 0.1, 0.15, 0.2],
  planMultiplier: { ninguno: 0, bajo: 0.5, normal: 1, alto: 1.8 },
  insufficientBelow: 0.6,
  damageAfterWeeks: 8,
};

export const SOIL = {
  stressGain: 30, stressRecover: 15, recoverAtRatio: 0.9,
  overAboveRatio: 1.3, overGain: 50, overRecover: 15,
};

export const FERT = {
  decayPerWeek: 5,
  plan: { ninguno: 0, normal: 5, exceso: 20 },
};

export const HEALTH = {
  recover: 3,
  stressAbove: 40, stressRate: 0.15,
  overAbove: 30, overRate: 0.2,
  burnAbove: 75, burnRate: 0.3,
  lackBelow: 15, lackRate: 0.1,
  diseaseRate: 0.08,
};

export const YIELD = { baseStemsPerM2Month: 2.0 };
