import { state } from '../core/state.js';
import { RENTED_WATER, OWNED_TANKER, LABOR } from '../config/economy.js';
import { EVENTS } from '../config/events.js';
import { formatCOP } from '../utils/format.js';

const NONE = [{ type: 'none' }];

export const info = (title, paragraphs) => ({ kind: 'info', title, paragraphs });
export const newsOf = (week) => state.eventLog.filter((event) => event.week === week);

export function planStep(text) {
  return {
    kind: 'decision',
    id: 'plan',
    title: 'Plan de riego y abono',
    text,
    options: [
      {
        id: 'normal',
        label: 'Plan normal',
        desc: 'Riego normal y abono normal.',
        hint: 'Riesgo bajo: es el plan equilibrado.',
        effects: [{ type: 'plan', irrigation: 'normal', fertilizer: 'normal' }],
      },
      {
        id: 'intensivo',
        label: 'Plan intensivo',
        desc: 'Riego alto y abono en exceso.',
        hint: 'Riesgo alto: el exceso de agua pudre la raíz y el exceso de abono sube la conductividad y quema la planta.',
        effects: [{ type: 'plan', irrigation: 'alto', fertilizer: 'exceso' }],
      },
      {
        id: 'ahorro',
        label: 'Plan de ahorro',
        desc: 'Riego bajo (50 %) y sin abono.',
        hint: 'Riesgo medio-alto: ahorras, pero la planta pasa sed y le falta nutrición.',
        effects: [{ type: 'plan', irrigation: 'bajo', fertilizer: 'ninguno' }],
      },
      {
        id: 'recorte',
        label: 'Recorte total',
        desc: 'Sin riego y sin abono.',
        hint: 'Riesgo muy alto: las camas pueden perderse.',
        effects: [{ type: 'plan', irrigation: 'ninguno', fertilizer: 'ninguno' }],
      },
    ],
  };
}

export function waterStep(text) {
  if (state.assets.tanker) return null;
  return {
    kind: 'decision',
    id: 'agua',
    title: 'Agua para el riego',
    text,
    options: [
      {
        id: 'comprar',
        label: 'Comprar carro tanque propio',
        desc: `Compra única. Aporta ${OWNED_TANKER.m3PerWeek} m³/semana y cuesta ${formatCOP(OWNED_TANKER.weeklyCost)} de operación semanal.`,
        hint: 'Costo alto de entrada, pero te da agua aunque la quebrada se seque.',
        effects: [{ type: 'buyTanker' }],
      },
      {
        id: 'alquilar',
        label: 'Alquilar agua por viajes',
        desc: `Hasta 10 viajes por semana de ${RENTED_WATER.tripM3} m³, a ${formatCOP(RENTED_WATER.tripCost)} cada uno (solo pagas los usados).`,
        hint: 'Más barato hoy, pero es un gasto que se repite y crece si la quebrada baja más.',
        effects: [{ type: 'rentTrips', n: 10 }],
      },
      {
        id: 'nada',
        label: 'No hacer nada',
        desc: 'Confiar en la quebrada y en el tanque de 50 m³.',
        hint: 'Riesgo alto si el caudal sigue bajando.',
        effects: NONE,
      },
    ],
  };
}

export function laborStep(text) {
  return {
    kind: 'decision',
    id: 'mano_obra',
    title: 'Mano de obra',
    text,
    options: [
      {
        id: 'contratar',
        label: 'Contratar 2 trabajadores fijos',
        desc: `+${2 * LABOR.jornalesPerWorker} jornales por semana. Nómina mensual más alta.`,
        hint: 'Riesgo bajo de tareas sin hacer, pero la nómina pesa aunque la producción caiga.',
        effects: [{ type: 'hire', n: 2 }],
      },
      {
        id: 'no',
        label: 'Mantener el equipo',
        desc: `${LABOR.workers} trabajadores.`,
        hint: 'Riesgo medio: si hay brotes o reparaciones, los jornales no alcanzan.',
        effects: NONE,
      },
    ],
  };
}

export function arbolStep() {
  const event = EVENTS.arbolCaido;
  const damage = state.zoneDamage[event.zone];
  if (!damage || damage.status !== 'pendiente') return null;
  return {
    kind: 'decision',
    id: 'arbol',
    title: `Árbol caído sobre el invernadero de la Zona ${event.zone}`,
    text: 'Un árbol se cayó con el viento y rompió la estructura. Mientras no se repare, la zona produce menos.',
    options: [
      {
        id: 'reparar',
        label: 'Reparar ahora',
        desc: `La Zona ${event.zone} no produce durante ${event.repairWeeks} semanas y luego se recupera.`,
        hint: 'Riesgo bajo a mediano plazo; pérdida segura de unas semanas de producción.',
        effects: [{ type: 'repairZone', zone: event.zone }],
      },
      {
        id: 'dejar',
        label: 'Dejarlo así',
        desc: `La Zona ${event.zone} produce solo el ${Math.round(event.ignoreProdFactor * 100)} % y las plantas se deterioran cada semana.`,
        hint: 'Ahorras hoy, pero las pérdidas pueden ser mayores y duran todo el resto de la temporada.',
        effects: [{ type: 'ignoreZone', zone: event.zone }],
      },
    ],
  };
}
