import { state } from '../core/state.js';
import { bus } from '../core/eventBus.js';
import { getDate } from '../core/clock.js';
import { activeOrder } from '../sim/orders.js';
import { QUALITIES } from '../config/qualities.js';
import { formatNum, formatCOP, formatPct } from '../utils/format.js';

export function initGoalsBanner(el) {
  const render = () => {
    const order = activeOrder();
    if (!order) {
      const results = state.orders.filter((item) => item.result).map((item) => item.result);
      el.innerHTML = results.length
        ? results.map((result) => `${result.name}: ${result.ok ? `cumplida (+${formatCOP(result.revenue)})` : 'sin cumplir'}`).join(' · ')
        : 'Sin metas activas.';
      return;
    }
    const quality = QUALITIES.find((entry) => entry.id === order.minQuality);
    const shown = Math.min(order.progress, order.qty);
    const progress = shown / order.qty;
    const waiting = state.week < order.countFromWeek;
    el.innerHTML = `
      <div class="goal">
        <strong>Puedes sacar ${formatNum(order.qty)} tallos para ${order.name}</strong>
        <span>calidad mínima ${quality.short} · prima +${Math.round(order.premium * 100)} % · entrega: ${order.dateLabel}</span>
        <span class="bar"><i style="width:${progress * 100}%"></i></span>
        <b>${waiting ? `Cuentan los tallos desde ${getDate(order.countFromWeek).label}` : `${formatNum(shown)} / ${formatNum(order.qty)} (${formatPct(progress)})`}</b>
      </div>`;
  };
  bus.on('state:changed', render);
  render();
}
