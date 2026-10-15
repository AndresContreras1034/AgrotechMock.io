import { state } from '../core/state.js';
import { hash01 } from '../core/rng.js';
import { BED } from '../config/beds.js';
import { SENSOR_VARS, SENSOR_MODEL as M } from '../config/sensors.js';

const RANK = { ok: 0, warn: 1, crit: 2 };
export const worst = (a, b) => (RANK[a] >= RANK[b] ? a : b);

export function statusOf(value, v) {
  if (value >= v.min && value <= v.max) return 'ok';
  const margin = (v.max - v.min) * M.warnMargin;
  return value >= v.min - margin && value <= v.max + margin ? 'warn' : 'crit';
}

function baseValue(bed, key, meters) {
  let val = M.nominal[key];
  val += (M.perWaterStress[key] ?? 0) * bed.waterStress;
  val += (M.perFertilizerOver[key] ?? 0) * (bed.fertilizer - M.fertilizerNeutral);
  val += (M.perDisease[key] ?? 0) * bed.disease;
  val += (M.alongBed[key] ?? 0) * (meters / bed.lengthM);
  return val;
}

const fmt = (n, d) => n.toFixed(d).replace('.', ',');

// Lectura del sensor `i` de una cama, calculada bajo demanda (nada se guarda).
export function sensorInfo(bed, i) {
  const meters = i * BED.sensorSpacingM;
  const offline = hash01(state.seed, bed.index, i, 999) < M.offlineChance;

  const readings = SENSOR_VARS.map((v, vi) => {
    const noise = (hash01(state.seed, bed.index, i, state.week * 10 + vi) - 0.5) * 2 * M.noise[v.key];
    const value = baseValue(bed, v.key, meters) + noise;
    return {
      key: v.key,
      label: v.label,
      value,
      text: `${fmt(value, v.decimals)} ${v.unit}`.trim(),
      range: `${fmt(v.min, v.decimals)} – ${fmt(v.max, v.decimals)} ${v.unit}`.trim(),
      status: statusOf(value, v),
    };
  });

  const status = readings.reduce((acc, r) => worst(acc, r.status), 'ok');
  return {
    code: `S-${bed.id.slice(2)}-${String(i + 1).padStart(2, '0')}`,
    bed,
    index: i,
    meters,
    status,
    visual: offline ? 'off' : status,
    state: offline ? 'offline' : status === 'ok' ? 'activo' : 'alerta',
    readings,
  };
}

// Semáforo de la cama (sin ruido): peor variable en el centro + salud.
export function bedStatus(bed) {
  let st = 'ok';
  for (const v of SENSOR_VARS) st = worst(st, statusOf(baseValue(bed, v.key, bed.lengthM / 2), v));
  if (bed.health < 40) st = worst(st, 'crit');
  else if (bed.health < 70) st = worst(st, 'warn');
  return st;
}
