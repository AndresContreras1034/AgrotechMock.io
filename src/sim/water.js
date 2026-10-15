import { state } from '../core/state.js';
import { WATER } from '../config/sim.js';
import { RENTED_WATER, OWNED_TANKER } from '../config/economy.js';

export function allocateWater() {
  const f = state.taskFactor;
  const need = WATER.baseDemandM3PerBedWeek * (WATER.planMultiplier[state.plan.irrigation] ?? 1) * f.irrigation;
  let creek = state.creekFlow * WATER.creekM3AtFullFlow * (state.pumpFactor ?? 1);
  let owned = state.assets.tanker ? OWNED_TANKER.m3PerWeek * f.tanker : 0;
  let rent = state.money > 0 ? state.rentTrips * RENTED_WATER.tripM3 : 0;
  const rentStart = rent;
  let tank = state.tankM3;
  const ratios = new Map();
  let demand = 0;
  let delivered = 0;
  for (const b of state.beds) {
    if (b.damaged || b.estado !== 'sembrada') continue;
    demand += need;
    let rem = need;
    for (const src of ['creek', 'owned', 'rent', 'tank']) {
      const have = { creek, owned, rent, tank }[src];
      const take = Math.min(rem, have);
      rem -= take;
      if (src === 'creek') creek -= take; else if (src === 'owned') owned -= take; else if (src === 'rent') rent -= take; else tank -= take;
    }
    delivered += need - rem;
    ratios.set(b.index, (need - rem) / WATER.baseDemandM3PerBedWeek);
  }
  state.tankM3 = Math.min(WATER.tankCapacityM3, tank + creek + owned);
  state.water = { demand, delivered, short: demand - delivered, rentedM3: rentStart - rent, trips: 0 };
  return { ratios };
}

export const applyWaterPlan = allocateWater;
export const computeWaterDelivery = allocateWater;
export const updateWater = allocateWater;
