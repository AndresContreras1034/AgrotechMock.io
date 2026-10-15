import { WORLD } from '../config/world.js';

export const view = { w: 0, h: 0 };
export const camera = {
  x: WORLD.width / 2,
  y: WORLD.height / 2,
  zoom: 1,
  minZoom: 0.2,
  maxZoom: 14,
};

export function setViewSize(w, h) {
  view.w = w;
  view.h = h;
}

function clampCamera() {
  camera.x = Math.min(Math.max(camera.x, 0), WORLD.width);
  camera.y = Math.min(Math.max(camera.y, 0), WORLD.height);
}

export function fitToWorld() {
  camera.zoom = Math.min(view.w / WORLD.width, view.h / WORLD.height) * 0.95;
  camera.minZoom = camera.zoom * 0.6;
  camera.x = WORLD.width / 2;
  camera.y = WORLD.height / 2;
}

export function screenToWorld(sx, sy) {
  return {
    x: (sx - view.w / 2) / camera.zoom + camera.x,
    y: (sy - view.h / 2) / camera.zoom + camera.y,
  };
}

export function worldToScreen(wx, wy) {
  return {
    x: (wx - camera.x) * camera.zoom + view.w / 2,
    y: (wy - camera.y) * camera.zoom + view.h / 2,
  };
}

export function zoomAt(sx, sy, factor) {
  const before = screenToWorld(sx, sy);
  camera.zoom = Math.min(Math.max(camera.zoom * factor, camera.minZoom), camera.maxZoom);
  const after = screenToWorld(sx, sy);
  camera.x += before.x - after.x;
  camera.y += before.y - after.y;
  clampCamera();
}

export function panBy(dxScreen, dyScreen) {
  camera.x -= dxScreen / camera.zoom;
  camera.y -= dyScreen / camera.zoom;
  clampCamera();
}

export function centerOn(wx, wy) {
  camera.x = wx;
  camera.y = wy;
  clampCamera();
}

export function applyTransform(ctx, dpr) {
  const z = camera.zoom * dpr;
  ctx.setTransform(z, 0, 0, z, (dpr * view.w) / 2 - camera.x * z, (dpr * view.h) / 2 - camera.y * z);
}