import { WORLD, ROAD, STORE, WAREHOUSE, WATER_SUPPLIER } from '../config/world.js';
import { camera } from './camera.js';

function label(ctx, text, x, y, px) {
  ctx.fillStyle = '#1f2a1f';
  ctx.font = `${Math.max(5, 11 * px)}px system-ui, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.fillText(text, x, y);
}

function building(ctx, b, wall, roof, px) {
  ctx.fillStyle = wall;
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.fillStyle = roof;
  ctx.fillRect(b.x, b.y, b.w, b.h * 0.35);
  ctx.strokeStyle = '#3b2f22';
  ctx.lineWidth = 1.5 * px;
  ctx.strokeRect(b.x, b.y, b.w, b.h);
  label(ctx, b.label, b.x + b.w / 2, b.y + b.h + 3 * px, px);
}

export function drawTerrain(ctx) {
  const px = 1 / camera.zoom;

  ctx.fillStyle = '#d9e8c4';
  ctx.fillRect(0, 0, WORLD.width, WORLD.height);

  ctx.save();
  ctx.strokeStyle = 'rgba(31, 58, 43, 0.14)';
  ctx.lineWidth = Math.max(0.5, 1.2 * px);
  const step = 10;
  ctx.beginPath();
  for (let x = 0; x <= WORLD.width; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, WORLD.height);
  }
  for (let y = 0; y <= WORLD.height; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(WORLD.width, y);
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(31, 58, 43, 0.25)';
  ctx.lineWidth = Math.max(1, 2 * px);
  ctx.beginPath();
  ctx.moveTo(0, WORLD.height / 2);
  ctx.lineTo(WORLD.width, WORLD.height / 2);
  ctx.moveTo(WORLD.width / 2, 0);
  ctx.lineTo(WORLD.width / 2, WORLD.height);
  ctx.stroke();
  ctx.restore();

  // Camino
  ctx.fillStyle = '#c9b48a';
  ctx.fillRect(0, ROAD.y, WORLD.width, ROAD.h);
  ctx.strokeStyle = '#a8946b';
  ctx.lineWidth = px;
  ctx.setLineDash([8, 8]);
  ctx.beginPath();
  ctx.moveTo(0, ROAD.y + ROAD.h / 2);
  ctx.lineTo(WORLD.width, ROAD.y + ROAD.h / 2);
  ctx.stroke();
  ctx.setLineDash([]);

  // Zona de compras y bodega
  building(ctx, STORE, '#d8b58a', '#b5651d', px);
  building(ctx, WAREHOUSE, '#cfcfcf', '#7d7d7d', px);

  // Proveedor de agua (tanque)
  ctx.fillStyle = '#5aa3d6';
  ctx.strokeStyle = '#2b5f86';
  ctx.lineWidth = 1.5 * px;
  ctx.beginPath();
  ctx.arc(WATER_SUPPLIER.x, WATER_SUPPLIER.y, WATER_SUPPLIER.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  label(ctx, WATER_SUPPLIER.label, WATER_SUPPLIER.x, WATER_SUPPLIER.y + WATER_SUPPLIER.r + 3 * px, px);

  // Borde del lote
  ctx.strokeStyle = '#2f5d2a';
  ctx.lineWidth = 3 * px;
  ctx.strokeRect(0, 0, WORLD.width, WORLD.height);
}