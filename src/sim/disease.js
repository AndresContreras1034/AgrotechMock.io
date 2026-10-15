import { state } from '../core/state.js';
import { bus } from '../core/eventBus.js';
import { bedCenterV } from '../config/layout.js';
import { DISEASES, STEMS, TREATMENT, OUTBREAK, RISK, QUALITY_IMPACT } from '../config/diseases.js';
import { PREVENTIVE } from '../config/economy.js';
import { canSpend, spend } from './economy.js';
import { clamp, localToWorld } from '../utils/math.js';

const DEFS = Object.fromEntries(DISEASES.map((d) => [d.id, d]));
export const diseaseDef = (id) => DEFS[id];

export function stemPoint(s) {
  const bed = state.beds[s.bed];
  const g = state.greenhouses[bed.ghIndex];
  return localToWorld(g, -bed.lengthM / 2 + s.meters, bedCenterV(g, bed.slot) + s.lateral);
}

export function recomputeDisease(bed) {
  let sum = 0;
  for (const s of state.stems) if (s.bed === bed.index) sum += s.severity;
  bed.disease = clamp(sum / STEMS.severityPerLevel, 0, 100);
}

export function neighborsOf(bed) {
  return state.beds.filter((b) => b.ghIndex === bed.ghIndex && Math.abs(b.slot - bed.slot) === 1);
}

export function addStem(bedIndex, opts = {}) {
  const bed = state.beds[bedIndex];
  const rng = state.rng;
  const count = state.stems.reduce((n, s) => n + (s.bed === bedIndex ? 1 : 0), 0);
  if (count >= STEMS.maxPerBed) return null;
  bed.stemSeq += 1;
  const stem = {
    id: `T-${bed.id.slice(2)}-${String(bed.stemSeq).padStart(2, '0')}`,
    bed: bedIndex,
    meters: rng.int(0, bed.lengthM),
    lateral: rng.range(-STEMS.lateralM, STEMS.lateralM),
    disease: opts.disease ?? rng.pick(DISEASES).id,
    severity: opts.severity ?? rng.range(...STEMS.initialSeverity),
    weeks: opts.weeks ?? 0,
    extraDays: rng.int(0, 6),
  };
  state.stems.push(stem);
  recomputeDisease(bed);
  return stem;
}

export function initStems() {
  for (const b of state.beds) {
    const n = state.rng.int(...STEMS.initialPerBed);
    for (let i = 0; i < n; i++) addStem(b.index, { weeks: state.rng.int(0, 2) });
  }
}

export function spawnOutbreak(bedIndex, n, severity) {
  for (let i = 0; i < n; i++) addStem(bedIndex, { severity });
}

export function stemInfo(stem) {
  const bed = state.beds[stem.bed];
  const def = DEFS[stem.disease];
  const score = stem.severity * RISK.severityWeight + Math.min(stem.weeks, RISK.weeksCap) * RISK.perWeek;
  return {
    stem,
    bed,
    def,
    days: stem.weeks * 7 + stem.extraDays,
    risk: score < RISK.mid ? 'Bajo' : score < RISK.high ? 'Medio' : 'Alto',
    neighbors: neighborsOf(bed).map((b) => b.id),
    impact: QUALITY_IMPACT.find((q) => stem.severity < q.below)?.text ?? 'Descarte',
  };
}

export function cureAllDiseasedStems() {
  const candidates = state.stems.filter((stem) => stem.severity > 0);
  if (!candidates.length) return { ok: false, reason: 'No hay focos activos para curar.' };

  const totalCost = candidates.reduce((sum, stem) => sum + (DEFS[stem.disease]?.cost ?? 0), 0);
  const totalLabor = candidates.reduce((sum, stem) => sum + (DEFS[stem.disease]?.jornales ?? 0), 0);

  if (!canSpend(totalCost)) return { ok: false, reason: 'Dinero insuficiente para curar todas.' };
  if (state.jornales < totalLabor) return { ok: false, reason: 'No hay mano de obra suficiente para curar todas.' };

  let cured = 0;
  for (const stem of [...state.stems]) {
    const def = DEFS[stem.disease];
    if (!def || stem.severity <= 0) continue;
    const bed = state.beds[stem.bed];

    spend(def.cost, 'tratamientos');
    state.jornales -= def.jornales;
    const cleared = stem.severity < TREATMENT.clearsIfSeverityBelow;
    if (cleared) {
      const index = state.stems.findIndex((item) => item.id === stem.id);
      if (index >= 0) state.stems.splice(index, 1);
      cured += 1;
    } else {
      stem.severity *= TREATMENT.partialFactor;
    }
    bed.treatments.push({ week: state.week, name: def.treatment, cost: def.cost, cleared });
    recomputeDisease(bed);
  }

  bus.emit('state:changed');
  return { ok: true, cured, cost: totalCost, total: candidates.length };
}

export function treatStem(id) {
  const i = state.stems.findIndex((s) => s.id === id);
  if (i < 0) return { ok: false, reason: 'Ese foco ya no existe.' };
  const stem = state.stems[i];
  const def = DEFS[stem.disease];
  const bed = state.beds[stem.bed];
  if (!canSpend(def.cost)) return { ok: false, reason: state.money <= 0 ? 'Sin dinero: acciones con costo bloqueadas.' : 'Dinero insuficiente.' };
  if (state.jornales < def.jornales) return { ok: false, reason: 'No hay mano de obra suficiente esta semana.' };

  spend(def.cost, 'tratamientos');
  state.jornales -= def.jornales;
  const cleared = stem.severity < TREATMENT.clearsIfSeverityBelow;
  if (cleared) state.stems.splice(i, 1);
  else stem.severity *= TREATMENT.partialFactor;
  bed.treatments.push({ week: state.week, name: def.treatment, cost: def.cost, cleared });
  recomputeDisease(bed);
  bus.emit('state:changed');
  return { ok: true, cleared, cost: def.cost };
}

export function stepDisease() {
  const rng = state.rng;
  const born = [];
  for (const s of state.stems) {
    const def = DEFS[s.disease];
    const bed = state.beds[s.bed];
    s.weeks += 1;
    const prev = state.preventiveUntil > state.week ? PREVENTIVE.growthFactor : 1;
    s.severity = Math.min(100, s.severity + def.growthPerWeek * (0.7 + 0.6 * rng.next()) * (1 + (bed.overWater ?? 0) / 200) * prev);
    if (s.severity >= OUTBREAK.spreadMinSeverity) {
      const p = (def.spreadChance * s.severity) / 100;
      if (rng.next() < p) born.push({ bed: s.bed, disease: s.disease });
      const roll = rng.next();
      const nb = neighborsOf(bed);
      if (roll < p * OUTBREAK.neighborScale && nb.length) born.push({ bed: rng.pick(nb).index, disease: s.disease });
    }
  }
  for (const b of state.beds) {
    if (b.estado === 'sembrada' && !(b.damaged ?? false) && rng.next() < OUTBREAK.newPerBedWeek * (1 + (b.overWater ?? 0) / 50) * (state.preventiveUntil > state.week ? PREVENTIVE.outbreakFactor : 1)) {
      born.push({ bed: b.index });
    }
  }
  for (const n of born) addStem(n.bed, { disease: n.disease, severity: rng.range(...STEMS.newSeverity) });
  for (const b of state.beds) recomputeDisease(b);
}
