import { state, resetState } from './state.js';
import { bus } from './eventBus.js';
import { getDate, isFinished } from './clock.js';
import { CLOCK, WATER } from '../config/sim.js';
import { LABOR } from '../config/economy.js';
import { allocateWater } from '../sim/water.js';
import { updateSoil } from '../sim/soil.js';
import { evaluatePlantHealth } from '../sim/plantHealth.js';
import { stepDisease, initStems } from '../sim/disease.js';
import { produceWeek, estimateYield } from '../sim/yield.js';
import { runWeeklyTasks, chargeWeekly, sellStock, closeMonthLedger, isBroke, stockTotals } from '../sim/economy.js';
import { accrueOrders, resolveOrders, reservedStock } from '../sim/orders.js';
import { stepScenario } from '../scenario/script.js';
import { QUALITIES } from '../config/qualities.js';
import { evaluateQuality } from '../sim/quality.js';
import { formatCOP, formatNum } from '../utils/format.js';

export function getSimulationSnapshot() {
  const beds = (state.beds ?? []).map((bed) => {
    const quality = evaluateQuality(bed);
    const yieldEstimate = estimateYield(bed, quality.score);
    return {
      id: bed.id,
      zone: bed.zone,
      health: Number(bed.health ?? 100),
      waterStress: Number(bed.waterStress ?? 0),
      overWater: Number(bed.overWater ?? 0),
      fertilizer: Number(bed.fertilizer ?? 0),
      disease: Number(bed.disease ?? 0),
      damaged: !!bed.damaged,
      quality: quality.quality,
      qualityScore: quality.score,
      yieldEstimate,
    };
  });

  return {
    week: state.week ?? 0,
    date: getDate(state.week ?? 0),
    tankM3: state.tankM3 ?? 0,
    creekFlow: state.creekFlow ?? 1,
    water: { ...(state.water ?? { demand: 0, delivered: 0, short: 0 }) },
    beds,
  };
}

export function newGame(seed = state.seed ?? 2026) {
  resetState(seed);
  initStems();
  bus.emit('state:changed');
}

const CAUSE_TEXT = {
  thirst: 'estrés hídrico (falta de agua)',
  over: 'exceso de agua (riesgo de pudrición)',
  burn: 'exceso de abono (CE alta, quema)',
  lack: 'falta de abono',
  disease: 'enfermedad sin tratar',
};

const pct = (value) => `${Math.round(value * 100)} %`;

export function advanceWeek(steps = 1) {
  const totalSteps = Number.isFinite(steps) ? Math.max(0, Math.floor(steps)) : 1;
  if (totalSteps === 0 || isFinished()) return state.lastReport ?? null;

  let lastReport = null;
  for (let i = 0; i < totalSteps; i += 1) {
    if (isFinished()) break;
    const week = state.week;
    const { factor } = runWeeklyTasks();
    const { ratios } = allocateWater();

    let newlyDamaged = 0;
    for (const bed of state.beds) {
      if (bed.damaged || bed.estado !== 'sembrada') continue;
      const updated = updateSoil(bed, ratios.get(bed.index) ?? null);
      if (updated && updated.ratio !== undefined && updated.ratio < 0.6) newlyDamaged += 1;
      if (!bed.damaged) {
        const health = evaluatePlantHealth(bed);
        bed.health = health.health;
        const zoneDamage = state.zoneDamage?.[bed.zone];
        if (zoneDamage?.healthLoss) bed.health = Math.max(0, bed.health - zoneDamage.healthLoss);
      }
    }
    stepDisease();

    const closeMonth = (week + 1) % CLOCK.weeksPerMonth === 0;
    const before = stockTotals();
    let produced = 0;
    for (const bed of state.beds) produced += produceWeek(bed, closeMonth);
    const after = stockTotals();
    accrueOrders(week, Object.fromEntries(QUALITIES.map((quality) => [quality.id, (after[quality.id] ?? 0) - (before[quality.id] ?? 0)])));

    chargeWeekly();
    const resolved = resolveOrders(week);
    let sales = null;
    if (closeMonth) {
      sales = sellStock(reservedStock());
      closeMonthLedger(getDate(week).monthIndex);
    }

    state.week += 1;
    state.creekFlow = WATER.flowByWeek[Math.min(state.week, CLOCK.totalWeeks - 1)];
    state.jornales = state.workers * LABOR.jornalesPerWorker;
    const fired = stepScenario();
    state.broke = isBroke();

    const alerts = [];
    for (const result of resolved) {
      alerts.push(result.ok
        ? { level: 'ok', text: `Meta ${result.name} cumplida: ${formatCOP(result.revenue)} con prima.` }
        : { level: 'crit', text: `Meta ${result.name} no cumplida (${formatNum(result.progress)} de ${formatNum(result.qty)}).` });
    }
    for (const event of fired) alerts.push({ level: event.level, text: event.text });

    const counts = {};
    for (const bed of state.beds) {
      for (const cause of bed.causes ?? []) counts[cause] = (counts[cause] || 0) + 1;
    }
    const maxDry = Math.max(0, ...state.beds.filter((bed) => !bed.damaged).map((bed) => bed.dryWeeks ?? 0));
    const dry = state.beds.filter((bed) => !bed.damaged && (bed.dryWeeks ?? 0) > 0).length;
    if (state.broke) alerts.push({ level: 'crit', text: 'Riesgo de quiebra: sin dinero, las compras y tratamientos quedan bloqueados.' });
    if (dry) alerts.push({ level: 'crit', text: `${dry} camas sin agua suficiente (hasta ${maxDry} sem. seguidas; a las ${WATER.damageAfterWeeks} se pierden).` });
    if (newlyDamaged) alerts.push({ level: 'crit', text: `${newlyDamaged} cama(s) dañadas por 2 meses sin agua: producción perdida.` });
    if (factor.harvest < 1) alerts.push({ level: 'crit', text: `Mano de obra insuficiente: cosecha al ${pct(factor.harvest)}; los tallos sin cortar se pierden.` });
    if (factor.irrigation < 1 && state.plan.irrigation !== 'ninguno') alerts.push({ level: 'crit', text: `Mano de obra insuficiente: riego al ${pct(factor.irrigation)}.` });
    if (factor.fert < 1 && state.plan.fertilizer !== 'ninguno') alerts.push({ level: 'warn', text: `Abono al ${pct(factor.fert)} (faltaron jornales o dinero).` });
    for (const [cause, number] of Object.entries(counts)) {
      if (cause === 'thirst' && dry) continue;
      alerts.push({ level: cause === 'lack' ? 'warn' : 'crit', text: `${number} camas con ${CAUSE_TEXT[cause]}.` });
    }
    if (state.water.short > 0) alerts.push({ level: 'warn', text: `El agua no alcanza: faltaron ${Math.round(state.water.short)} m³ esta semana.` });
    if (state.water.trips > 0) alerts.push({ level: 'warn', text: `Agua alquilada: ${state.water.trips} viaje(s) esta semana.` });
    if (sales) alerts.push({ level: 'ok', text: `Ventas del mes: ${formatNum(sales.stems)} tallos por ${formatCOP(sales.amount)}.` });
    if (!alerts.length) alerts.push({ level: 'ok', text: 'Sin novedades críticas esta semana.' });

    state.lastReport = {
      week: state.week,
      date: getDate(state.week),
      produced,
      sales,
      resolved,
      alerts,
    };
    lastReport = state.lastReport;
    bus.emit('week:advanced', state.lastReport);
    bus.emit('state:changed');
    if (isFinished()) bus.emit('season:end', state.lastReport);
    else if (state.week % CLOCK.weeksPerMonth === 0) bus.emit('month:started', { monthIndex: state.week / CLOCK.weeksPerMonth });
  }

  return getSimulationSnapshot();
}

export function runOneWeek() {
  return advanceWeek();
}

export const simulateWeek = advanceWeek;
export const stepEngine = advanceWeek;
export const runSimulation = advanceWeek;
export const advanceSeason = advanceWeek;
export const initializeEngine = () => state;

