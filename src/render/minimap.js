import { WORLD, CREEK } from '../config/world.js';
import { state } from '../core/state.js';
import { camera, view, centerOn } from './camera.js';
import { requestRedraw } from './canvas.js';

const W = 200; // ancho CSS del minimapa
let mc;
let mctx;
let dpr = 1;

export function initMinimap(el) {
  mc = el;
  mctx = mc.getContext('2d');
  dpr = window.devicePixelRatio || 1;
  const h = Math.round((W * WORLD.height) / WORLD.width);
  mc.style.width = `${W}px`;
  mc.style.height = `${h}px`;
  mc.width = Math.round(W * dpr);
  mc.height = Math.round(h * dpr);

  let drag = false;
  const go = (e) => {
    const r = mc.getBoundingClientRect();
    const s = W / WORLD.width;
    centerOn((e.clientX - r.left) / s, (e.clientY - r.top) / s);
    requestRedraw();
  };
  mc.addEventListener('pointerdown', (e) => { drag = true; mc.setPointerCapture(e.pointerId); go(e); });
  mc.addEventListener('pointermove', (e) => { if (drag) go(e); });
  mc.addEventListener('pointerup', () => { drag = false; });
  mc.addEventListener('contextmenu', (e) => e.preventDefault());
}

export function drawMinimap() {
  if (!mctx) return;
  const s = W / WORLD.width;
  mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  mctx.clearRect(0, 0, mc.width, mc.height);

  mctx.fillStyle = '#d9e8c4';
  mctx.fillRect(0, 0, WORLD.width * s, WORLD.height * s);

  // Quebrada
  mctx.strokeStyle = '#4a90c8';
  mctx.lineWidth = 3;
  mctx.beginPath();
  CREEK.points.forEach(([x, y], i) => (i ? mctx.lineTo(x * s, y * s) : mctx.moveTo(x * s, y * s)));
  mctx.stroke();

  // Invernaderos
  mctx.fillStyle = '#4b6b4f';
  for (const g of state.greenhouses) {
    mctx.save();
    mctx.translate(g.cx * s, g.cy * s);
    mctx.rotate(g.angle);
    mctx.fillRect((-g.w * s) / 2, (-g.h * s) / 2, g.w * s, g.h * s);
    mctx.restore();
  }

  // Rectángulo de la vista actual
  const vw = view.w / camera.zoom;
  const vh = view.h / camera.zoom;
  mctx.strokeStyle = '#c0392b';
  mctx.lineWidth = 2;
  mctx.strokeRect((camera.x - vw / 2) * s, (camera.y - vh / 2) * s, vw * s, vh * s);
}