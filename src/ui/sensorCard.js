import { state } from '../core/state.js';
import { sensorInfo } from '../sim/sensors.js';

const STATE_LABEL = { activo: 'Activo', offline: 'Offline', alerta: 'En alerta' };
let card;
let current = null;

export function openSensorCard(bedIndex, sensorIndex) {
  current = { bedIndex, sensorIndex };
  render();
}

export function closeSensorCard() {
  current = null;
  if (card) card.style.display = 'none';
}

export function refreshSensorCard() {
  if (current) render();
}

function render() {
  if (!card) {
    card = document.createElement('aside');
    card.id = 'sensor-card';
    document.body.appendChild(card);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeSensorCard(); });
  }
  const bed = state.beds[current.bedIndex];
  const info = sensorInfo(bed, current.sensorIndex);
  const off = info.state === 'offline';
  const stateDot = off ? 'off' : info.status;

  const rows = info.readings
    .map(
      (r) => `<tr>
        <td>${r.label}<br><span class="rng">Óptimo: ${r.range}</span></td>
        <td class="val">${off ? '—' : r.text}</td>
        <td><span class="dot ${off ? 'off' : r.status}"></span></td>
      </tr>`
    )
    .join('');

  card.innerHTML = `
    <header><strong>Sensor ${info.code}</strong><button id="sc-close" aria-label="Cerrar">X</button></header>
    <div class="meta">Cama ${bed.id} · Zona ${bed.zone} · Posición ${info.meters} m</div>
    <div class="meta">Estado: <span class="dot ${stateDot}"></span> ${STATE_LABEL[info.state]}</div>
    <table>${rows}</table>
    <small>Datos ilustrativos, no reales</small>`;
  card.querySelector('#sc-close').onclick = closeSensorCard;
  card.style.display = 'block';
}
