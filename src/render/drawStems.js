import { state } from '../core/state.js';
import { camera } from './camera.js';
import { stemPoint } from '../sim/disease.js';
import { clamp } from '../utils/math.js';

export function drawStems(ctx) {
  const px = 1 / camera.zoom;
  const r = clamp(4 * px, 1.1, 2.6);
  const h = state.hover;
  for (const s of state.stems) {
    const p = stemPoint(s);
    const hov = h && h.type === 'stem' && h.stem === s.id;
    const rr = hov ? r * 1.5 : r;
    ctx.fillStyle = '#d62828';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(px, rr * 0.3);
    ctx.beginPath();
    ctx.arc(p.x, p.y, rr, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (hov) {
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 2 * px;
      ctx.beginPath();
      ctx.arc(p.x, p.y, rr * 1.8, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}
