import { state } from '../core/state.js';
import { camera } from './camera.js';

export function drawEvents(ctx) {
  const px = 1 / camera.zoom;

  for (const [zone, damage] of Object.entries(state.zoneDamage)) {
    const greenhouse = state.greenhouses.find((entry) => entry.id === zone);
    if (!greenhouse) continue;
    ctx.save();
    ctx.translate(greenhouse.cx, greenhouse.cy);
    ctx.rotate(greenhouse.angle);
    ctx.beginPath();
    ctx.rect(-greenhouse.w / 2, -greenhouse.h / 2, greenhouse.w, greenhouse.h);
    ctx.clip();
    ctx.fillStyle = damage.status === 'reparando' ? 'rgba(224,168,0,0.12)' : 'rgba(214,69,65,0.10)';
    ctx.fillRect(-greenhouse.w / 2, -greenhouse.h / 2, greenhouse.w, greenhouse.h);
    ctx.restore();
    ctx.save();
    ctx.translate(greenhouse.cx, greenhouse.cy);
    ctx.rotate(greenhouse.angle);
    ctx.strokeStyle = damage.status === 'reparando' ? '#c28a16' : '#c64b46';
    ctx.lineWidth = 2 * px;
    ctx.setLineDash([5 * px, 4 * px]);
    ctx.strokeRect(-greenhouse.w / 2, -greenhouse.h / 2, greenhouse.w, greenhouse.h);
    ctx.setLineDash([]);
    ctx.restore();
  }
}
