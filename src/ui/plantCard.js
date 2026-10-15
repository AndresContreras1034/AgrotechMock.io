import { state } from '../core/state.js';
import { stemInfo, treatStem, cureAllDiseasedStems } from '../sim/disease.js';
import { formatCOP } from '../utils/format.js';
import { toast } from './toast.js';
import { requestRedraw } from '../render/canvas.js';

let card;
let currentId = null;

export function openPlantCard(stemId) { currentId = stemId; render(); }
export function closePlantCard() { currentId = null; if (card) card.style.display = 'none'; }
export function refreshPlantCard() { if (currentId) render(); }

function render() {
  const stem = state.stems.find((s) => s.id === currentId);
  if (!stem) return closePlantCard();
  if (!card) {
    card = document.createElement('aside');
    card.id = 'plant-card';
    document.body.appendChild(card);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closePlantCard(); });
  }
  const i = stemInfo(stem);
  const sevClass = stem.severity < 30 ? 'ok' : stem.severity < 60 ? 'warn' : 'crit';
  const riskClass = { Bajo: 'ok', Medio: 'warn', Alto: 'crit' }[i.risk];
  const noMoney = state.money < i.def.cost;
  const noLabor = state.jornales < i.def.jornales;
  const blocked = noMoney ? 'Dinero insuficiente' : noLabor ? 'Sin mano de obra esta semana' : '';
  const allAlert = state.stems.length > 0 ? '' : 'No hay focos para curar';

  card.innerHTML = `
    <header><strong>Planta enferma ${stem.id}</strong><button id="pc-close" aria-label="Cerrar">X</button></header>
    <div class="meta">Cama ${i.bed.id} · Zona ${i.bed.zone} · Posición ${stem.meters} m</div>
    <table>
      <tr><td>Enfermedad / plaga</td><td class="val">${i.def.name}<br><span class="rng">${i.def.kind}</span></td></tr>
      <tr><td>Severidad</td><td class="val"><span class="dot ${sevClass}"></span> ${Math.round(stem.severity)} / 100</td></tr>
      <tr><td>Días de infección</td><td class="val">${i.days}</td></tr>
      <tr><td>Riesgo de contagio</td><td class="val"><span class="dot ${riskClass}"></span> ${i.risk}<br><span class="rng">Vecinas: ${i.neighbors.join(', ') || '—'}</span></td></tr>
      <tr><td>Calidad afectada</td><td class="val">${i.impact}</td></tr>
      <tr><td>Tratamiento sugerido</td><td class="val">${i.def.treatment}<br><span class="rng">${formatCOP(i.def.cost)} · ${i.def.jornales} jornal(es)</span></td></tr>
    </table>
    <button id="pc-treat" class="primary" ${blocked ? 'disabled' : ''}>Aplicar tratamiento</button>
    <button id="pc-cure-all" class="secondary" ${state.stems.length === 0 ? 'disabled' : ''}>Curar todas</button>
    ${blocked ? `<div class="warn-text">${blocked}</div>` : ''}
    ${allAlert ? `<div class="warn-text">${allAlert}</div>` : ''}
    <small>Datos ilustrativos, no reales</small>`;
  card.querySelector('#pc-close').onclick = closePlantCard;
  card.querySelector('#pc-treat').onclick = () => {
    const r = treatStem(stem.id);
    if (!r.ok) return toast(r.reason);
    toast(r.cleared ? `Foco eliminado (${formatCOP(r.cost)})` : `Foco reducido a la mitad (${formatCOP(r.cost)}). Era muy avanzado: conviene repetir.`, 3200);
    requestRedraw();
    if (r.cleared) closePlantCard(); else render();
  };
  card.querySelector('#pc-cure-all').onclick = () => {
    const r = cureAllDiseasedStems();
    if (!r.ok) return toast(r.reason);
    toast(`Se curaron ${r.cured} focos por ${formatCOP(r.cost)}.`, 3200);
    requestRedraw();
    closePlantCard();
  };
  card.style.display = 'block';
}
