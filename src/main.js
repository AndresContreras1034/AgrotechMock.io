import './styles/main.css';
import { resetState, state } from './core/state.js';
import { advanceWeek } from './core/engine.js';
import { getDate } from './core/clock.js';
import { updateHud } from './ui/hud.js';
import { renderMonthPanel } from './ui/monthPanel.js';
import { renderBedStats } from './ui/bedStats.js';
import { initCanvas, addLayer, addOverlay, requestRedraw, input } from './render/canvas.js';
import { fitToWorld, zoomAt } from './render/camera.js';
import { drawTerrain } from './render/drawTerrain.js';
import { drawCreek } from './render/drawCreek.js';
import { drawGreenhouses } from './render/drawGreenhouses.js';
import { drawSensors } from './render/drawSensors.js';
import { drawStems } from './render/drawStems.js';
import { drawEvents } from './render/drawEvents.js';
import { initMinimap, drawMinimap } from './render/minimap.js';
import { hitTest } from './render/hitTest.js';
import { showMenu, hideMenu } from './ui/contextMenu.js';
import { openSensorCard, closeSensorCard } from './ui/sensorCard.js';
import { openPlantCard, closePlantCard } from './ui/plantCard.js';
import { toast } from './ui/toast.js';
import { sensorInfo } from './sim/sensors.js';
import { initStems } from './sim/disease.js';
import { initGoalsBanner } from './ui/goalsBanner.js';
import { resumeDecisions } from './ui/decisionModal.js';
import { cureAllDiseasedStems } from './sim/disease.js';
import { openShop } from './ui/shopPanel.js';

const fit = () => { fitToWorld(); requestRedraw(); };
const zoom = (factor) => {
  const world = document.getElementById('world');
  const rect = world.getBoundingClientRect();
  zoomAt(rect.width / 2, rect.height / 2, factor);
  requestRedraw();
};

function refreshPanels() {
  const date = getDate(state.week ?? 0);
  const panel = document.getElementById('month-panel');
  const stats = document.getElementById('bed-stats');
  updateHud(document.getElementById('hud'), state);
  renderMonthPanel(panel, state);

  const bed = state.hover && state.hover.bed !== undefined ? state.beds[state.hover.bed] : state.beds[0];
  renderBedStats(stats, bed);

  const title = document.querySelector('[data-role="date"]');
  if (title) title.textContent = date.label;
}

resetState();
initStems();
initCanvas(document.getElementById('world'));
initMinimap(document.getElementById('minimap'));

addLayer(drawTerrain);
addLayer(drawCreek);
addLayer(drawGreenhouses);
addLayer(drawSensors);
addLayer(drawStems);
addLayer(drawEvents);
addOverlay(drawMinimap);

let hoverKey = '';
initGoalsBanner(document.getElementById('goals'));

input.onHover = (sx, sy) => {
  const hit = hitTest(sx, sy);
  const key = hit ? `${hit.type}:${hit.bed}:${hit.sensor ?? hit.stem ?? ''}` : '';
  if (key !== hoverKey) {
    hoverKey = key;
    state.hover = hit;
    refreshPanels();
    requestRedraw();
  }
  return !!hit;
};

input.onClick = (sx, sy) => {
  hideMenu();
  const hit = hitTest(sx, sy);
  if (!hit) return;
  if (hit.type === 'store') return openShop();
  if (hit.type === 'stem') {
    closeSensorCard();
    return openPlantCard(hit.stem);
  }
  if (hit.type === 'sensor') {
    closePlantCard();
    openSensorCard(hit.bed, hit.sensor);
    return;
  }
  toast(`Cama ${state.beds[hit.bed].id}: panel de estadísticas activo.`);
};

input.onContext = (sx, sy, cx, cy) => {
  const hit = hitTest(sx, sy);
  if (!hit) return hideMenu();
  const bed = state.beds[hit.bed];
  if (hit.type === 'stem') {
    return showMenu(cx, cy, [
      { label: `Ver ficha del tallo ${hit.stem}`, action: () => { closeSensorCard(); openPlantCard(hit.stem); } },
    ]);
  }

  if (hit.type === 'sensor') {
    const code = sensorInfo(bed, hit.sensor).code;
    showMenu(cx, cy, [
      { label: `Ver ficha del sensor ${code}`, action: () => openSensorCard(hit.bed, hit.sensor) },
      { label: `Resumen de la cama ${bed.id}`, action: () => toast('Panel de estadísticas de la cama activo.') },
    ]);
  } else {
    showMenu(cx, cy, [
      { label: `Resumen de la cama ${bed.id}`, action: () => toast('Panel de estadísticas de la cama activo.') },
    ]);
  }
};

document.getElementById('btn-fit').addEventListener('click', fit);
document.getElementById('btn-shop')?.addEventListener('click', openShop);
document.getElementById('btn-zoom-in')?.addEventListener('click', () => zoom(1.2));
document.getElementById('btn-zoom-out')?.addEventListener('click', () => zoom(1 / 1.2));
document.getElementById('btn-reset').addEventListener('click', () => {
  resetState(state.seed);
  initStems();
  closeSensorCard();
  closePlantCard();
  hideMenu();
  hoverKey = '';
  refreshPanels();
  fit();
});

document.getElementById('btn-cure-all')?.addEventListener('click', () => {
  const result = cureAllDiseasedStems();
  if (!result.ok) return toast(result.reason);
  toast(`Se curaron ${result.cured} focos.`, 2600);
  refreshPanels();
  requestRedraw();
});

document.getElementById('btn-next-week')?.addEventListener('click', () => {
  advanceWeek(1);
  refreshPanels();
  requestRedraw();
});

window.addEventListener('keydown', (e) => {
  if (e.key === '0') fit();
  if (e.key === '+' || e.key === '=') zoom(1.2);
  if (e.key === '-' || e.key === '_') zoom(1 / 1.2);
  if (e.key.toLowerCase() === 'd') resumeDecisions();
  if (e.key === 'ArrowRight') {
    advanceWeek(1);
    refreshPanels();
    requestRedraw();
  }
});

refreshPanels();
requestRedraw();
