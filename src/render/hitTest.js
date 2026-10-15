import { state, bedPoint } from '../core/state.js';
import { BED } from '../config/beds.js';
import { bedCenterV, PAD_Y } from '../config/layout.js';
import { SENSOR_MODEL as M } from '../config/sensors.js';
import { STEMS } from '../config/diseases.js';
import { stemPoint } from '../sim/disease.js';
import { camera, screenToWorld, worldToScreen } from './camera.js';
import { worldToLocal } from '../utils/math.js';
import { STORE } from '../config/world.js';

const SENSOR_RADIUS_PX = 10;

// Devuelve { type: 'sensor'|'bed'|'stem', bed, sensor?, stem? } o null.
export function hitTest(sx, sy) {
  let bestStem = null;
  let sd = STEMS.hitRadiusPx;
  for (const s of state.stems) {
    const p = stemPoint(s);
    const sc = worldToScreen(p.x, p.y);
    const d = Math.hypot(sc.x - sx, sc.y - sy);
    if (d < sd) { sd = d; bestStem = s; }
  }
  if (bestStem) return { type: 'stem', bed: bestStem.bed, stem: bestStem.id };

  const worldPoint = screenToWorld(sx, sy);
  if (worldPoint.x >= STORE.x && worldPoint.x <= STORE.x + STORE.w &&
      worldPoint.y >= STORE.y && worldPoint.y <= STORE.y + STORE.h) {
    return { type: 'store' };
  }

  if (camera.zoom >= M.zoomShowSensors) {
    let best = null;
    let bestD = SENSOR_RADIUS_PX;
    for (const b of state.beds) {
      for (let i = 0; i < b.sensorCount; i++) {
        const w = bedPoint(b, i * BED.sensorSpacingM);
        const s = worldToScreen(w.x, w.y);
        const d = Math.hypot(s.x - sx, s.y - sy);
        if (d < bestD) {
          bestD = d;
          best = { type: 'sensor', bed: b.index, sensor: i };
        }
      }
    }
    if (best) return best;
  }

  const w = worldPoint;
  for (let gi = 0; gi < state.greenhouses.length; gi++) {
    const g = state.greenhouses[gi];
    const l = worldToLocal(g, w.x, w.y);
    if (Math.abs(l.u) > BED.lengthM / 2) continue;
    const k = Math.floor((l.v - (-g.h / 2 + PAD_Y)) / BED.pitchM);
    if (k < 0 || k >= g.bedCount) continue;
    if (Math.abs(l.v - bedCenterV(g, k)) > BED.pitchM / 2) continue;
    const bed = state.beds.find((b) => b.ghIndex === gi && b.slot === k);
    if (bed) return { type: 'bed', bed: bed.index };
  }
  return null;
}
