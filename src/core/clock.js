import { CLOCK } from '../config/sim.js';
import { state } from './state.js';

export const isFinished = () => state.week >= CLOCK.totalWeeks;

export function getDate(week = state.week) {
  if (week >= CLOCK.totalWeeks) return { finished: true, label: 'Fin de temporada', monthIndex: 3, weekInMonth: 4, week };
  const monthIndex = Math.floor(week / CLOCK.weeksPerMonth);
  const weekInMonth = (week % CLOCK.weeksPerMonth) + 1;
  return { finished: false, monthIndex, weekInMonth, week, label: `${CLOCK.monthNames[monthIndex]} · Semana ${weekInMonth}` };
}
