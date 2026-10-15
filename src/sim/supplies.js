import { state } from '../core/state.js';
import { bus } from '../core/eventBus.js';
import { ABONO } from '../config/economy.js';
import { DISEASES, TREATMENT } from '../config/diseases.js';
import { ZONES } from '../config/beds.js';
import { canSpend, spend } from './economy.js';
import { recomputeDisease } from './disease.js';
import { clamp } from '../utils/math.js';

const DISEASE_BY_ID = new Map(DISEASES.map((disease) => [disease.id, disease]));

export const SUPPLIES = [
  {
    id: 'abono',
    name: 'Abono balanceado',
    description: 'Kit para una zona; eleva el nivel de fertilizante de sus camas.',
    price: Math.round(ABONO.price * ABONO.packBultos * (1 - ABONO.packDiscount)),
    jornales: 4,
    effect: 'Aumenta 20 puntos de fertilizante por cama.',
  },
  ...DISEASES.map((disease) => ({
    id: disease.id,
    name: disease.treatment,
    description: `Kit de aplicación para una zona contra ${disease.name}.`,
    price: disease.cost * 3,
    jornales: 0,
    disease: disease.id,
    effect: 'Trata los focos de esta enfermedad dentro de la zona.',
  })),
];

export function buySupply(id, quantity = 1) {
  const product = SUPPLIES.find((item) => item.id === id);
  const count = Number(quantity);
  if (!product) return { ok: false, reason: 'Insumo no disponible.' };
  if (!Number.isSafeInteger(count) || count < 1) return { ok: false, reason: 'La cantidad debe ser un entero positivo.' };

  const total = product.price * count;
  if (!Number.isSafeInteger(total)) return { ok: false, reason: 'La cantidad excede el límite permitido.' };
  if (!canSpend(total)) return { ok: false, reason: 'Dinero insuficiente para esta compra.' };

  spend(total, 'insumos');
  state.supplies ??= {};
  state.supplies[id] = (state.supplies[id] ?? 0) + count;
  bus.emit('state:changed');
  return { ok: true, quantity: count, total, stock: state.supplies[id] };
}

export function applySupply(id, zone) {
  const product = SUPPLIES.find((item) => item.id === id);
  if (!product) return { ok: false, reason: 'Insumo no disponible.' };
  if (!ZONES.some((item) => item.id === zone)) return { ok: false, reason: 'Selecciona una zona válida.' };
  if ((state.supplies?.[id] ?? 0) < 1) return { ok: false, reason: 'No tienes unidades de este insumo.' };

  const beds = state.beds.filter((bed) => bed.zone === zone && !bed.damaged && bed.estado === 'sembrada');
  if (!beds.length) return { ok: false, reason: 'No hay camas activas en esta zona.' };

  if (id === 'abono') {
    const applicable = beds.filter((bed) => (bed.fertilizer ?? 0) < 100);
    if (!applicable.length) return { ok: false, reason: 'Las camas de esta zona ya tienen el nivel máximo de fertilizante.' };
    if (state.jornales < product.jornales) return { ok: false, reason: 'Faltan jornales para aplicar el abono.' };

    state.supplies[id] -= 1;
    state.jornales -= product.jornales;
    for (const bed of applicable) bed.fertilizer = clamp((bed.fertilizer ?? 0) + 20, 0, 100);
    bus.emit('state:changed');
    return { ok: true, affected: applicable.length, remaining: state.supplies[id] };
  }

  const disease = DISEASE_BY_ID.get(product.disease);
  const affectedStems = state.stems.filter((stem) => beds.some((bed) => bed.index === stem.bed) && stem.disease === product.disease);
  if (!affectedStems.length) return { ok: false, reason: 'No hay focos de esta enfermedad en la zona seleccionada.' };

  const jornales = disease.jornales * affectedStems.length;
  if (state.jornales < jornales) return { ok: false, reason: `Faltan jornales: se necesitan ${jornales} para tratar esta zona.` };

  state.supplies[id] -= 1;
  state.jornales -= jornales;
  let cleared = 0;
  for (const stem of affectedStems) {
    const bed = state.beds[stem.bed];
    const stemCleared = stem.severity < TREATMENT.clearsIfSeverityBelow;
    if (stemCleared) {
      state.stems.splice(state.stems.indexOf(stem), 1);
      cleared += 1;
    } else {
      stem.severity *= TREATMENT.partialFactor;
    }
    bed.treatments.push({ week: state.week, name: disease.treatment, cost: 0, cleared: stemCleared });
    recomputeDisease(bed);
  }
  bus.emit('state:changed');
  return { ok: true, affected: affectedStems.length, cleared, remaining: state.supplies[id] };
}
