import { createRng } from './rng.js';
import { buildGreenhouses, bedCenterV } from '../config/layout.js';
import { BED, BED_AREA_M2, SENSORS_PER_BED } from '../config/beds.js';
import { START_MONEY, LABOR } from '../config/economy.js';
import { WATER } from '../config/sim.js';
import { QUALITIES } from '../config/qualities.js';
import { ORDERS } from '../config/orders.js';
import { localToWorld } from '../utils/math.js';

export const state = {};

function makeQualityBag() {
  return Object.fromEntries(QUALITIES.map((q) => [q.id, 0]));
}

export function resetState(seed = 2026) {
  const greenhouses = buildGreenhouses();
  const beds = [];
  let n = 0;
  greenhouses.forEach((g, ghIndex) => {
    for (let slot = 0; slot < g.bedCount; slot++) {
      n++;
      beds.push({
        id: `C-${String(n).padStart(3, '0')}`,
        index: n - 1,
        zone: g.id,
        ghIndex,
        slot,
        estado: 'sembrada',
        health: 100,
        waterStress: 0,
        fertilizer: 50,
        disease: 0,
        overWater: 0,
        damaged: false,
        yieldM2: 0,
        lengthM: BED.lengthM,
        areaM2: BED_AREA_M2,
        sensorCount: SENSORS_PER_BED,
        stemSeq: 0,
        treatments: [],
        stock: makeQualityBag(),
        totalQ: makeQualityBag(),
        monthTally: makeQualityBag(),
        history: [],
        lastWeekTotal: 0,
        causes: [],
        dryWeeks: 0,
      });
    }
  });

  Object.assign(state, {
    seed,
    rng: createRng(seed),
    week: 0,
    money: START_MONEY,
    creekFlow: 1,
    tankM3: WATER.tankStartM3,
    workers: LABOR.workers,
    plan: { irrigation: 'normal', fertilizer: 'normal' },
    greenhouses,
    beds,
    stems: [],
    jornales: LABOR.workers * LABOR.jornalesPerWorker,
    supplies: { abono: 0, mancha: 0, pudricion: 0, trips: 0 },
    assets: { tanker: false },
    rentTrips: 0,
    taskFactor: { harvest: 1, irrigation: 1, tanker: 1, fert: 1 },
    preventiveUntil: 0,
    priceMult: 1,
    broke: false,
    orders: ORDERS.map((o) => ({ ...o, status: 'pendiente', progress: 0, result: null })),
    zoneDamage: {},
    flags: {},
    eventLog: [],
    decisions: {},
    pumpFactor: 1,
    pumpWeeks: 0,
    priceWeeks: 0,
    ledger: { income: {}, costs: {}, month: { income: 0, costs: 0 }, months: [] },
    hover: null,
    water: { demand: 0, delivered: 0, short: 0, rentedM3: 0, trips: 0 },
    soil: { stress: 0, overWater: 0 },
  });
}

// Punto del mundo a `meters` metros del inicio de la cama.
export function bedPoint(bed, meters) {
  const g = state.greenhouses[bed.ghIndex];
  return localToWorld(g, -bed.lengthM / 2 + meters, bedCenterV(g, bed.slot));
}