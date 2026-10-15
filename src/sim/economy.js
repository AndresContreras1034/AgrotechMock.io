import { state } from '../core/state.js';
import { LABOR, COSTS, PREVENTIVE, OWNED_TANKER } from '../config/economy.js';
import { QUALITIES } from '../config/qualities.js';
import { WATER } from '../config/sim.js';
import { zeroQ } from './quality.js';

function ensureLedger() {
  state.ledger ??= { income: {}, costs: {}, month: { income: 0, costs: 0 }, months: [] };
  state.ledger.income ??= {};
  state.ledger.costs ??= {};
  state.ledger.month ??= { income: 0, costs: 0 };
}

export function hasCash(amount = 0) {
  const value = Number(amount ?? 0);
  return (state.money ?? 0) >= value;
}

export const canSpend = hasCash;

export function spend(amount = 0, concept = 'general') {
  const value = Number(amount ?? 0);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: true, amount: 0, money: state.money ?? 0 };
  }
  if ((state.money ?? 0) < value) {
    return { ok: false, amount: value, money: state.money ?? 0, reason: 'Dinero insuficiente.' };
  }

  state.money = (state.money ?? 0) - value;
  ensureLedger();
  state.ledger.costs[concept] = (state.ledger.costs[concept] ?? 0) + value;
  state.ledger.month.costs = (state.ledger.month.costs ?? 0) + value;
  return { ok: true, amount: value, money: state.money, concept };
}

export function charge(amount = 0, concept = 'general') {
  return spend(amount, concept);
}

export function receive(amount = 0, concept = 'general') {
  const value = Number(amount ?? 0);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: true, amount: 0, money: state.money ?? 0 };
  }

  state.money = (state.money ?? 0) + value;
  ensureLedger();
  state.ledger.income[concept] = (state.ledger.income[concept] ?? 0) + value;
  state.ledger.month.income = (state.ledger.month.income ?? 0) + value;
  return { ok: true, amount: value, money: state.money, concept };
}

export function earn(amount = 0, concept = 'general') {
  return receive(amount, concept);
}

export function recordCost(amount = 0, concept = 'general') {
  return spend(amount, concept);
}

export function recordIncome(amount = 0, concept = 'general') {
  return receive(amount, concept);
}

export function stockTotals() {
  const totals = zeroQ();
  for (const bed of state.beds ?? []) {
    for (const q of QUALITIES) {
      totals[q.id] = (totals[q.id] ?? 0) + Number(bed.stock?.[q.id] ?? 0);
    }
  }
  return totals;
}

export function takeStock(qid, need = Infinity) {
  const limit = Number.isFinite(Number(need)) ? Number(need) : Infinity;
  let used = 0;
  for (const bed of state.beds ?? []) {
    if (used >= limit) break;
    const available = Number(bed.stock?.[qid] ?? 0);
    if (available <= 0) continue;
    const take = Math.min(available, limit - used);
    bed.stock[qid] = Number((bed.stock?.[qid] ?? 0) - take);
    used += take;
  }
  return used;
}

export function sellStock(reserved = zeroQ()) {
  const totals = stockTotals();
  const keep = reserved ?? zeroQ();
  let stems = 0;
  let amount = 0;
  for (const q of QUALITIES) {
    const sellQty = Math.max(0, (totals[q.id] ?? 0) - (keep[q.id] ?? 0));
    if (sellQty <= 0) continue;
    stems += sellQty;
    amount += sellQty * q.price * (state.priceMult ?? 1);
    takeStock(q.id, sellQty);
  }
  if (amount > 0) receive(amount, 'ventas');
  return { stems, amount };
}

export function runWeeklyTasks() {
  const workers = state.workers ?? LABOR.workers;
  const totalJornales = workers * LABOR.jornalesPerWorker;
  const available = Math.max(0, Number(state.jornales ?? totalJornales));
  const ratio = totalJornales > 0 ? Math.min(1, available / totalJornales) : 0;
  const factor = {
    harvest: ratio,
    irrigation: ratio,
    tanker: ratio,
    fert: ratio,
  };
  state.taskFactor = { ...state.taskFactor, ...factor };
  return { factor };
}

export function chargeWeekly() {
  const workers = state.workers ?? LABOR.workers;
  const payroll = workers * LABOR.jornalValue * 0.25;
  const maintenance = COSTS.maintenanceMonth / 4;
  const water = COSTS.waterFixedMonth / 4;
  const total = payroll + maintenance + water + (state.rentTrips ?? 0) * 250_000;
  charge(total, 'gastos_semanales');
  return total;
}

export function closeMonthLedger(monthIndex) {
  ensureLedger();
  state.ledger.months.push({
    monthIndex,
    income: state.ledger.month.income,
    costs: state.ledger.month.costs,
    net: (state.ledger.month.income ?? 0) - (state.ledger.month.costs ?? 0),
  });
  state.ledger.month = { income: 0, costs: 0 };
  return state.ledger.months.at(-1);
}

export function isBroke() {
  return (state.money ?? 0) <= 0;
}

export function buyPreventive() {
  if (!canSpend(PREVENTIVE.cost)) return { ok: false, reason: 'Dinero insuficiente.' };
  if ((state.jornales ?? 0) < PREVENTIVE.jornales) return { ok: false, reason: 'Faltan jornales.' };
  spend(PREVENTIVE.cost, 'prevencion');
  state.jornales -= PREVENTIVE.jornales;
  state.preventiveUntil = (state.week ?? 0) + PREVENTIVE.weeks;
  return { ok: true };
}

export function buyTanker() {
  if (state.assets?.tanker) return { ok: false, reason: 'Ya tienes carro tanque.' };
  if (!canSpend(OWNED_TANKER.price)) return { ok: false, reason: 'Dinero insuficiente.' };
  spend(OWNED_TANKER.price, 'carro_tanque');
  state.assets.tanker = true;
  return { ok: true };
}

export function setRentTrips(n) {
  state.rentTrips = Math.max(0, Number(n ?? 0));
  return state.rentTrips;
}

export function hireWorker() {
  if ((state.workers ?? LABOR.workers) >= LABOR.maxWorkers) return { ok: false, reason: 'Máximo de trabajadores alcanzado.' };
  const fee = LABOR.hireFee;
  if (!canSpend(fee)) return { ok: false, reason: 'Dinero insuficiente.' };
  spend(fee, 'mano_obra_extra');
  state.workers = (state.workers ?? LABOR.workers) + 1;
  state.jornales = (state.jornales ?? 0) + LABOR.jornalesPerWorker;
  return { ok: true };
}

export const cashAvailable = hasCash;
export const canAfford = hasCash;
export const debit = spend;
export const credit = receive;
