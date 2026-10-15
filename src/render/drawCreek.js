import { CREEK } from '../config/world.js';
import { state } from '../core/state.js';
import { lerp, lerpColor } from '../utils/math.js';

function creekPath(ctx) {
  const p = CREEK.points;
  ctx.beginPath();
  ctx.moveTo(p[0][0], p[0][1]);
  for (let i = 1; i < p.length - 1; i++) {
    const mx = (p[i][0] + p[i + 1][0]) / 2;
    const my = (p[i][1] + p[i + 1][1]) / 2;
    ctx.quadraticCurveTo(p[i][0], p[i][1], mx, my);
  }
  const last = p[p.length - 1];
  ctx.lineTo(last[0], last[1]);
}

export function drawCreek(ctx) {
  const f = state.creekFlow;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';

  // Lecho seco
  creekPath(ctx);
  ctx.strokeStyle = '#a98f63';
  ctx.lineWidth = CREEK.bedWidth;
  ctx.stroke();

  // Barro: aparece cuando el caudal baja de 0,5
  if (f < 0.5) {
    ctx.globalAlpha = (0.5 - f) / 0.5;
    creekPath(ctx);
    ctx.strokeStyle = '#7b6244';
    ctx.lineWidth = CREEK.bedWidth * 0.7;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // Agua: ancho y color según el caudal
  creekPath(ctx);
  ctx.strokeStyle = lerpColor('#6f8f86', '#2f80c8', f);
  ctx.lineWidth = lerp(CREEK.minWaterWidth, CREEK.maxWaterWidth, f);
  ctx.stroke();
}