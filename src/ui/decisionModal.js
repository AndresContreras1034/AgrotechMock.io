import { state } from '../core/state.js';
import { bus } from '../core/eventBus.js';
import { CLOCK } from '../config/sim.js';
import { getMonthSteps, optionCosts, canApply, chooseOption } from '../scenario/script.js';
import { formatCOP } from '../utils/format.js';
import { toast } from './toast.js';

let modal;
let month = 0;
let steps = [];
let pos = 0;

export const isDecisionOpen = () => !!modal && modal.style.display === 'flex';
const pending = (step, monthIndex) => step.kind === 'decision' && !state.decisions[`${monthIndex}:${step.id}`];

export function closeDecisions() {
  if (modal) modal.style.display = 'none';
  bus.emit('state:changed');
}

export function openMonth(index, { resume = false } = {}) {
  month = index;
  steps = getMonthSteps(index);
  pos = 0;
  if (resume) {
    pos = steps.findIndex((step) => pending(step, index));
    if (pos < 0) return toast('No tienes decisiones pendientes este mes.');
  }
  render();
}

export function resumeDecisions() {
  if (state.week >= CLOCK.totalWeeks) return;
  openMonth(Math.floor(state.week / CLOCK.weeksPerMonth), { resume: true });
}

function ensure() {
  if (modal) return;
  modal = document.createElement('div');
  modal.id = 'decision-modal';
  document.body.appendChild(modal);
  modal.addEventListener('click', (event) => {
    const button = event.target.closest('[data-act]');
    if (!button || button.disabled) return;
    const action = button.dataset.act;
    if (action === 'close') return closeDecisions();
    if (action === 'next') {
      pos += 1;
      return render();
    }
    if (action === 'pick') {
      const current = steps[pos];
      const option = current.options.find((entry) => entry.id === button.dataset.opt);
      const result = chooseOption(month, current, option);
      if (!result.ok) return toast(result.reason);
      toast(`Decisión: ${option.label}`);
      pos += 1;
      render();
    }
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isDecisionOpen()) closeDecisions();
  });
}

function render() {
  ensure();
  const current = steps[pos];
  if (!current) return closeDecisions();
  let body;
  if (current.kind === 'info') {
    body = `<h2>${current.title}</h2>${current.paragraphs.map((text) => `<p>${text}</p>`).join('')}
      <button class="primary" data-act="next">Continuar →</button>`;
  } else {
    const done = state.decisions[`${month}:${current.id}`];
    const options = current.options.map((option) => {
      const costs = optionCosts(option);
      const can = canApply(option);
      const chosen = done === option.id;
      return `<div class="opt ${chosen ? 'chosen' : ''}">
        <strong>${option.label}</strong><p>${option.desc}</p>
        <div class="costs">Costo: <b>${costs.money ? formatCOP(costs.money) : 'sin costo inmediato'}</b> · Mano de obra: <b>${costs.jornales} jornal(es)</b></div>
        <div class="hint">${option.hint}</div>
        <button class="primary" data-act="pick" data-opt="${option.id}" ${can.ok && !done ? '' : 'disabled'}>${chosen ? 'Elegida' : 'Elegir'}</button>
        ${!can.ok && !done ? `<div class="warn-text">${can.reason}</div>` : ''}
      </div>`;
    }).join('');
    body = `<h2>${current.title}</h2><p>${current.text}</p><div class="opts">${options}</div>
      ${done ? '<button class="primary" data-act="next">Continuar →</button>' : ''}`;
  }
  modal.innerHTML = `<div class="dm-box">
    <div class="dm-head"><span>${CLOCK.monthNames[month]} · paso ${pos + 1}/${steps.length}</span>
      <span>${formatCOP(state.money)} · ${state.jornales} jornales</span>
      <button data-act="close" aria-label="Cerrar">Cerrar</button></div>
    ${body}
    <small>Datos ilustrativos, no reales · Esc = decidir después (tecla D para reabrir)</small></div>`;
  modal.style.display = 'flex';
}

bus.on('month:started', ({ monthIndex }) => openMonth(monthIndex));
