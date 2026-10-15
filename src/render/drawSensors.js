import { state, bedPoint } from '../core/state.js';
import { BED } from '../config/beds.js';
import { SENSOR_MODEL as M } from '../config/sensors.js';
import { camera } from './camera.js';
import { sensorInfo, bedStatus } from '../sim/sensors.js';
import { clamp } from '../utils/math.js';

export const STATUS_COLOR = { ok: '#2e9e4f', warn: '#e0a800', crit: '#d64541', off: '#8a8f8a' };

function drawIcon(ctx, p, r, color, hovered, px) {
  ctx.fillStyle = color;
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = Math.max(px, r * 0.25);
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#1f2a1f';
  ctx.lineWidth = Math.max(px, r * 0.2);
  ctx.beginPath();
  ctx.moveTo(p.x, p.y - r);
  ctx.lineTo(p.x, p.y - r * 2.2);
  ctx.stroke();

  if (hovered) {
    ctx.strokeStyle = '#111111';
    ctx.lineWidth = 2 * px;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r * 1.8, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawSensors(ctx) {
  const px = 1 / camera.zoom;

  // Vista general: un semáforo por cama
  if (camera.zoom < M.zoomShowSensors) {
    const r = Math.max(2.8, 6 * px);
    for (const b of state.beds) {
      const c = bedPoint(b, b.lengthM / 2);
      ctx.fillStyle = STATUS_COLOR[bedStatus(b)];
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5 * px;
      ctx.beginPath();
      ctx.arc(c.x, c.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }
    return;
  }

  // Zoom cercano: un sensor cada 20 m
  const r = clamp(4 * px, 1.2, 2.2);
  const h = state.hover;
  for (const b of state.beds) {
    for (let i = 0; i < b.sensorCount; i++) {
      const p = bedPoint(b, i * BED.sensorSpacingM);
      const info = sensorInfo(b, i);
      const hovered = h && h.type === 'sensor' && h.bed === b.index && h.sensor === i;
      drawIcon(ctx, p, r, STATUS_COLOR[info.visual], hovered, px);
    }
  }
}
