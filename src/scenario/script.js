import { state } from '../core/state.js';
import { bus } from '../core/eventBus.js';
import { EVENTS } from '../config/events.js';
import { LABOR, OWNED_TANKER, PREVENTIVE } from '../config/economy.js';
import { addStem } from '../sim/disease.js';
import { canSpend, spend, buyPreventive, buyTanker, setRentTrips, hireWorker } from '../sim/economy.js';
import enero from './months/enero.js';
import febrero from './months/febrero.js';
import marzo from './months/marzo.js';
import abril from './months/abril.js';

const MONTHS = [enero, febrero, marzo, abril];
export const getMonthSteps = (i) => MONTHS[i]?.().filter(Boolean) ?? [];

export function repairZone(zone) {
  const damage = state.zoneDamage[zone];
  const config = EVENTS.arbolCaido;
  if (!damage || damage.status === 'reparando') return { ok: false, reason: 'No hay nada que reparar.' };
  if (!canSpend(config.repairCost)) return { ok: false, reason: 'Dinero insuficiente.' };
  if (state.jornales < config.repairJornales) return { ok: false, reason: 'No hay mano de obra suficiente.' };
  spend(config.repairCost, 'reparaciones');
  state.jornales -= config.repairJornales;
  Object.assign(damage, { status: 'reparando', weeksLeft: config.repairWeeks, prodFactor: 0, healthLoss: 0 });
  return { ok: true };
}

const RUN = {
  none: () => {},
  plan: (event) => {
    if (event.irrigation) state.plan.irrigation = event.irrigation;
    if (event.fertilizer) state.plan.fertilizer = event.fertilizer;
  },
  preventive: () => buyPreventive(),
  buyTanker: () => buyTanker(),
  rentTrips: (event) => setRentTrips(event.n),
  hire: (event) => {
    for (let i = 0; i < event.n; i += 1) hireWorker();
  },
  repairZone: (event) => repairZone(event.zone),
  ignoreZone: (event) => {
    if (state.zoneDamage[event.zone]) state.zoneDamage[event.zone].status = 'ignorado';
  },
};

const EFFECT_COST = {
  preventive: () => ({ money: PREVENTIVE.cost, jornales: PREVENTIVE.jornales }),
  buyTanker: () => ({ money: OWNED_TANKER.price }),
  hire: (event) => ({ money: event.n * LABOR.hireFee }),
  repairZone: () => ({ money: EVENTS.arbolCaido.repairCost, jornales: EVENTS.arbolCaido.repairJornales }),
};

export function optionCosts(option) {
  return option.effects.reduce((total, effect) => {
    const costs = EFFECT_COST[effect.type]?.(effect) ?? {};
    return {
      money: total.money + (costs.money || 0),
      jornales: total.jornales + (costs.jornales || 0),
    };
  }, { money: 0, jornales: 0 });
}

export function canApply(option) {
  const cost = optionCosts(option);
  if (cost.money > 0 && !canSpend(cost.money)) return { ok: false, reason: state.money <= 0 ? 'Sin dinero.' : 'Dinero insuficiente.' };
  if (state.jornales < cost.jornales) return { ok: false, reason: 'Faltan jornales esta semana.' };
  return { ok: true };
}

export function chooseOption(month, step, option) {
  const key = `${month}:${step.id}`;
  if (state.decisions[key]) return { ok: false, reason: 'Ya tomaste esta decisión.' };
  const can = canApply(option);
  if (!can.ok) return can;
  for (const effect of option.effects) RUN[effect.type]?.(effect);
  state.decisions[key] = option.id;
  bus.emit('state:changed');
  return { ok: true };
}

export function applyOption(month, decisionId, optionId) {
  const step = getMonthSteps(month).find((entry) => entry.kind === 'decision' && entry.id === decisionId);
  const option = step?.options.find((entry) => entry.id === optionId);
  if (!option) return { ok: false, reason: 'Decisión u opción no disponible.' };
  return chooseOption(month, step, option);
}

const log = (id, text, level = 'warn') => {
  const entry = { week: state.week, id, text, level };
  state.eventLog.push(entry);
  return entry;
};

function pickBeds(count) {
  const pool = state.beds.filter((bed) => !bed.damaged).map((bed) => bed.index);
  const out = [];
  while (out.length < count && pool.length) {
    const index = state.rng.int(0, pool.length - 1);
    out.push(pool.splice(index, 1)[0]);
  }
  return out;
}

export function stepScenario() {
  const week = state.week;
  const config = EVENTS;
  const fired = [];

  for (const [zone, damage] of Object.entries(state.zoneDamage)) {
    if (damage.status !== 'reparando') continue;
    damage.weeksLeft -= 1;
    if (damage.weeksLeft <= 0) {
      delete state.zoneDamage[zone];
      fired.push(log('reparado', `Zona ${zone}: invernadero reparado, vuelve a producir.`, 'ok'));
    }
  }

  if (state.pumpWeeks > 0 && --state.pumpWeeks === 0) {
    state.pumpFactor = 1;
    fired.push(log('bomba-ok', 'La bomba de riego volvió a funcionar.', 'ok'));
  }
  if (state.priceWeeks > 0 && --state.priceWeeks === 0) {
    state.priceMult = 1;
    fired.push(log('precio-ok', 'El precio del ruscus se normalizó.', 'ok'));
  }

  if (config.brote.enabled && week === config.brote.week) {
    const treated = state.beds.reduce((total, bed) => total + bed.treatments.filter((t) => t.week < config.brote.week).length, 0);
    if (state.preventiveUntil === 0 && treated < config.brote.minTreatmentsJan) {
      state.flags.brote = true;
      for (const bedIndex of pickBeds(config.brote.beds)) {
        for (let k = 0; k < config.brote.stemsPerBed; k += 1) addStem(bedIndex, { severity: config.brote.severity });
      }
      fired.push(log('brote', 'Brote de enfermedad: los focos de enero no se atendieron y se propagaron a varias camas.'));
    }
  }

  if (config.arbolCaido.enabled && week === config.arbolCaido.week) {
    const event = config.arbolCaido;
    state.zoneDamage[event.zone] = { status: 'pendiente', prodFactor: event.ignoreProdFactor, healthLoss: event.ignoreHealthLoss, weeksLeft: 0 };
    fired.push(log('arbol', `Se cayó un árbol sobre el invernadero de la Zona ${event.zone}: hay que decidir si se repara.`, 'crit'));
  }

  if (config.fallaBomba.enabled && week === config.fallaBomba.week) {
    state.pumpFactor = config.fallaBomba.factor;
    state.pumpWeeks = config.fallaBomba.weeks;
    fired.push(log('bomba', 'Falla la bomba de riego: la quebrada aporta menos agua unas semanas.'));
  }
  if (config.caidaPrecio.enabled && week === config.caidaPrecio.week) {
    state.priceMult = config.caidaPrecio.factor;
    state.priceWeeks = config.caidaPrecio.weeks;
    fired.push(log('precio', 'Cae el precio del ruscus por exceso de oferta.'));
  }
  if (config.plagaTrips.enabled && week === config.plagaTrips.week) {
    for (const bedIndex of pickBeds(config.plagaTrips.beds)) {
      for (let k = 0; k < config.plagaTrips.stemsPerBed; k += 1) addStem(bedIndex, { disease: 'trips', severity: config.plagaTrips.severity });
    }
    fired.push(log('trips', 'Aparece una plaga de trips en varias camas.'));
  }

  return fired;
}
