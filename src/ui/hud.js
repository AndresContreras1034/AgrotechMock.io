import { state } from '../core/state.js';
import { getDate } from '../core/clock.js';

export function buildHudState(currentState = state) {
  const date = getDate(currentState.week ?? 0);
  return {
    week: currentState.week ?? 0,
    date,
    money: currentState.money ?? 0,
    tankM3: currentState.tankM3 ?? 0,
    creekFlow: currentState.creekFlow ?? 1,
  };
}

export function updateHud(root = document.getElementById('hud'), currentState = state) {
  if (!root) return null;
  const model = buildHudState(currentState);
  const dateEl = root.querySelector('[data-role="date"]');
  const moneyEl = root.querySelector('[data-role="money"]');
  const waterEl = root.querySelector('[data-role="water"]');

  if (dateEl) dateEl.textContent = model.date.label;
  if (moneyEl) moneyEl.textContent = `$${model.money.toLocaleString('es-CO')}`;
  if (waterEl) waterEl.textContent = `Agua: ${model.tankM3.toFixed(1)} m3 / caudal ${model.creekFlow.toFixed(2)}`;

  return root;
}

export const renderHud = updateHud;
