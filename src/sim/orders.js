import { state } from '../core/state.js';
import { bus } from '../core/eventBus.js';
import { QUALITIES } from '../config/qualities.js';
import { stockTotals, takeStock, earn, charge } from './economy.js';

const idx = (id) => QUALITIES.findIndex((q) => q.id === id);

export const eligibleQualities = (order) => QUALITIES.slice(0, idx(order.minQuality) + 1);

export const activeOrder = () =>
  state.orders.find((order) => order.status === 'pendiente' && state.week >= order.appearsWeek) ?? null;

export function accrueOrders(week, produced) {
  const order = activeOrder();
  if (!order || week < order.countFromWeek) return;
  order.progress += eligibleQualities(order).reduce((n, q) => n + (produced[q.id] ?? 0), 0);
}

export function reservedStock() {
  const keep = Object.fromEntries(QUALITIES.map((q) => [q.id, 0]));
  const order = activeOrder();
  if (!order) return keep;
  const totals = stockTotals();
  let need = Math.min(order.qty, order.progress);
  for (const q of [...eligibleQualities(order)].reverse()) {
    const k = Math.min(totals[q.id], need);
    keep[q.id] = k;
    need -= k;
  }
  return keep;
}

export function resolveOrders(week) {
  const out = [];
  for (const order of state.orders) {
    if (order.status !== 'pendiente' || week !== order.deliverWeek) continue;
    const ok = order.progress >= order.qty;
    let revenue = 0;
    let penalty = 0;
    if (ok) {
      let need = order.qty;
      for (const q of [...eligibleQualities(order)].reverse()) {
        const n = takeStock(q.id, need);
        need -= n;
        revenue += Math.round(n * q.price * (1 + order.premium));
      }
      earn(revenue, 'pedidos');
      order.status = 'cumplida';
    } else {
      penalty = order.penalty;
      charge(penalty, 'multas');
      order.status = 'incumplida';
    }
    order.result = { id: order.id, name: order.name, ok, qty: order.qty, progress: order.progress, revenue, penalty };
    out.push(order.result);
    bus.emit('order:resolved', order.result);
  }
  return out;
}
