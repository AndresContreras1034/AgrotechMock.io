import { evaluateQuality } from '../sim/quality.js';
import { estimateYield } from '../sim/yield.js';

export function getBedStats(bed) {
  const quality = evaluateQuality(bed ?? { waterStress: 0, overWater: 0, fertilizer: 50, disease: 0, health: 100 });
  const yieldEstimate = estimateYield(bed ?? { areaM2: 30, waterStress: 0, overWater: 0, fertilizer: 50, disease: 0, health: 100 }, quality.score);
  return {
    id: bed?.id ?? 'N/A',
    health: bed?.health ?? 100,
    waterStress: bed?.waterStress ?? 0,
    overWater: bed?.overWater ?? 0,
    fertilizer: bed?.fertilizer ?? 50,
    disease: bed?.disease ?? 0,
    quality: quality.quality,
    score: quality.score,
    yieldEstimate,
  };
}

export function renderBedStats(root, bed) {
  if (!root) return null;
  const stats = getBedStats(bed);
  root.innerHTML = `
    <h3>Estadísticas de cama</h3>
    <div class="big-label">${stats.id}</div>
    <ul class="stat-list">
      <li><span>Salud</span><strong>${stats.health.toFixed(0)}%</strong></li>
      <li><span>Estrés</span><strong>${stats.waterStress.toFixed(0)}</strong></li>
      <li><span>Riego</span><strong>${stats.overWater.toFixed(0)}</strong></li>
      <li><span>Fertilizante</span><strong>${stats.fertilizer.toFixed(0)}</strong></li>
      <li><span>Calidad</span><strong>${stats.quality}</strong></li>
      <li><span>Rendimiento</span><strong>${stats.yieldEstimate.toFixed(1)}</strong></li>
    </ul>
  `;
  return root;
}

export const updateBedStats = renderBedStats;
