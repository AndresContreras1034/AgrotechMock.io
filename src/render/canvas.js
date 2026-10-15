import { setViewSize, zoomAt, panBy, fitToWorld, applyTransform } from './camera.js';

const layers = []; // dibujan en coordenadas de mundo
const overlays = []; // dibujan sin transformación (minimapa, etc.)
let canvas;
let ctx;
let dpr = 1;
let dirty = true;

export const input = { onHover: null, onClick: null, onContext: null };
export const addLayer = (fn) => layers.push(fn);
export const addOverlay = (fn) => overlays.push(fn);
export const requestRedraw = () => { dirty = true; };
export const getCanvas = () => canvas;

export function initCanvas(el) {
  canvas = el;
  ctx = canvas.getContext('2d');
  canvas.style.cursor = 'grab';
  resize();
  fitToWorld();
  window.addEventListener('resize', resize);
  bindInput();
  requestAnimationFrame(frame);
}

function resize() {
  dpr = window.devicePixelRatio || 1;
  const r = canvas.getBoundingClientRect();
  canvas.width = Math.round(r.width * dpr);
  canvas.height = Math.round(r.height * dpr);
  setViewSize(r.width, r.height);
  dirty = true;
}

function bindInput() {
  let dragging = false;
  let moved = 0;
  let sx0 = 0;
  let sy0 = 0;
  let lx = 0;
  let ly = 0;
  const local = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const host = canvas.parentElement || canvas;
  host.addEventListener(
    'wheel',
    (e) => {
      if (e.target && e.target.closest && e.target.closest('#minimap')) return;
      const rect = canvas.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right || e.clientY < rect.top || e.clientY > rect.bottom) return;
      e.preventDefault();
      const p = local(e);
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0015));
      dirty = true;
    },
    { passive: false }
  );

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0) return;
    dragging = true;
    moved = 0;
    lx = sx0 = e.clientX;
    ly = sy0 = e.clientY;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  });

  canvas.addEventListener('pointermove', (e) => {
    if (dragging) {
      panBy(e.clientX - lx, e.clientY - ly);
      moved = Math.max(moved, Math.hypot(e.clientX - sx0, e.clientY - sy0));
      lx = e.clientX;
      ly = e.clientY;
      dirty = true;
      return;
    }
    const p = local(e);
    const over = input.onHover?.(p.x, p.y);
    canvas.style.cursor = over ? 'pointer' : 'grab';
  });

  canvas.addEventListener('pointerleave', () => { if (!dragging) input.onHover?.(-9999, -9999); });

  const end = (e) => {
    if (!dragging) return;
    dragging = false;
    canvas.style.cursor = 'grab';
    if (e.type === 'pointerup' && moved < 4) {
      const p = local(e);
      input.onClick?.(p.x, p.y);
    }
  };
  canvas.addEventListener('pointerup', end);
  canvas.addEventListener('pointercancel', end);

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    const p = local(e);
    input.onContext?.(p.x, p.y, e.clientX, e.clientY);
  });
}

function frame() {
  if (dirty) {
    dirty = false;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    applyTransform(ctx, dpr);
    for (const draw of layers) draw(ctx);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const draw of overlays) draw(ctx);
  }
  requestAnimationFrame(frame);
}