import { state } from '../core/state.js';
import { BED } from '../config/beds.js';
import { bedCenterV } from '../config/layout.js';
import { camera } from './camera.js';
import { lerpColor, localToWorld } from '../utils/math.js';

export function healthColor(h) {
  return h >= 50
    ? lerpColor('#c9a227', '#3f8f4a', (h - 50) / 50)
    : lerpColor('#8b3a2f', '#c9a227', h / 50);
}

export function drawGreenhouses(ctx) {
  const px = 1 / camera.zoom;

  // Estructuras
  for (const g of state.greenhouses) {
    ctx.save();
    ctx.translate(g.cx, g.cy);
    ctx.rotate(g.angle);
    ctx.fillStyle = 'rgba(233,243,226,0.92)';
    ctx.fillRect(-g.w / 2, -g.h / 2, g.w, g.h);
    ctx.strokeStyle = '#4b6b4f';
    ctx.lineWidth = 2 * px;
    ctx.strokeRect(-g.w / 2, -g.h / 2, g.w, g.h);
    ctx.restore();
  }

  // Camas (color según salud)
  const showCodes = camera.zoom >= 1.8;
  for (const b of state.beds) {
    const g = state.greenhouses[b.ghIndex];
    const vc = bedCenterV(g, b.slot);
    ctx.save();
    ctx.translate(g.cx, g.cy);
    ctx.rotate(g.angle);

    ctx.fillStyle = healthColor(b.health);
    ctx.fillRect(-BED.lengthM / 2, vc - BED.visualWidthM / 2, BED.lengthM, BED.visualWidthM);

    if (state.hover && state.hover.bed === b.index) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5 * px;
      ctx.strokeRect(-BED.lengthM / 2, vc - BED.visualWidthM / 2, BED.lengthM, BED.visualWidthM);
      ctx.strokeStyle = '#1f3d2b';
      ctx.lineWidth = px;
      ctx.strokeRect(-BED.lengthM / 2, vc - BED.visualWidthM / 2, BED.lengthM, BED.visualWidthM);
    }

    if (showCodes) {
      ctx.fillStyle = '#1f2a1f';
      ctx.font = '5px system-ui, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(b.id, -BED.lengthM / 2 - 1.5, vc);
    }
    ctx.restore();
  }

  // Nombres de zona (sin rotar, para que se lean)
  ctx.fillStyle = '#1f3d2b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  ctx.font = `bold ${Math.max(8, 13 * px)}px system-ui, sans-serif`;
  for (const g of state.greenhouses) {
    const p = localToWorld(g, 0, -g.h / 2 - 3);
    ctx.fillText(g.name, p.x, p.y);
  }
}