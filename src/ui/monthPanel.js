import { CLOCK } from '../config/sim.js';
import { getDate } from '../core/clock.js';

export function buildMonthPanelState(currentState) {
  const date = getDate(currentState.week ?? 0);
  const monthName = CLOCK.monthNames[date.monthIndex] ?? 'Mes';
  return {
    monthName,
    week: currentState.week ?? 0,
    totalWeeks: CLOCK.totalWeeks,
    date,
  };
}

export function renderMonthPanel(root = document.getElementById('month-panel'), currentState = {}) {
  if (!root) return null;
  const state = currentState && currentState.week !== undefined ? currentState : { week: 0 };
  const model = buildMonthPanelState(state);
  root.innerHTML = `
    <h3>Mes actual</h3>
    <div class="big-label">${model.monthName}</div>
    <div class="sub-label">Semana ${model.date.weekInMonth} · ${model.date.label}</div>
    <div class="progress"><span style="width:${((model.week + 1) / model.totalWeeks) * 100}%"></span></div>
  `;
  return root;
}

export const updateMonthPanel = renderMonthPanel;
