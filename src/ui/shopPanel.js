import { state } from '../core/state.js';
import { ZONES } from '../config/beds.js';
import { formatCOP } from '../utils/format.js';
import { SUPPLIES, applySupply, buySupply } from '../sim/supplies.js';
import { toast } from './toast.js';
import { requestRedraw } from '../render/canvas.js';
import { renderBedStats } from './bedStats.js';

let modal;
let selectedZone = ZONES[0].id;

function render() {
  if (!modal) return;
  const products = SUPPLIES.map((product) => `
    <article class="shop-product">
      <div class="shop-product-copy">
        <h3>${product.name}</h3>
        <p>${product.description}</p>
        <small>${product.effect}${product.jornales ? ` Requiere ${product.jornales} jornales.` : ''}</small>
        <strong class="shop-price">${formatCOP(product.price)} · inventario: ${state.supplies?.[product.id] ?? 0}</strong>
      </div>
      <button type="button" class="primary shop-buy" data-buy="${product.id}" ${state.money < product.price ? 'disabled' : ''}>Comprar 1</button>
      <button type="button" class="secondary shop-apply" data-apply="${product.id}" ${(state.supplies?.[product.id] ?? 0) < 1 ? 'disabled' : ''}>Aplicar en zona</button>
    </article>
  `).join('');

  modal.innerHTML = `
    <section class="shop-dialog" role="dialog" aria-modal="true" aria-labelledby="shop-title">
      <header class="shop-header">
        <div><span class="shop-eyebrow">Tienda de insumos</span><h2 id="shop-title">Compra y aplica en tu finca</h2></div>
        <button type="button" class="shop-close" aria-label="Cerrar tienda">Cerrar</button>
      </header>
      <p class="shop-balance">Saldo disponible: <strong>${formatCOP(state.money)}</strong> · Jornales: <strong>${state.jornales}</strong></p>
      <label class="shop-zone">Zona de aplicación
        <select id="shop-zone">${ZONES.map((zone) => `<option value="${zone.id}" ${zone.id === selectedZone ? 'selected' : ''}>${zone.name}</option>`).join('')}</select>
      </label>
      <div class="shop-products">${products}</div>
      <p class="shop-footnote">Los insumos comprados quedan en inventario. La aplicación consume el kit y los jornales indicados.</p>
    </section>`;

  modal.querySelector('.shop-close').onclick = closeShop;
  modal.querySelector('#shop-zone').onchange = (event) => { selectedZone = event.target.value; };
  modal.querySelectorAll('[data-buy]').forEach((button) => {
    button.onclick = () => {
      const result = buySupply(button.dataset.buy);
      if (!result.ok) return toast(result.reason);
      toast(`Compra agregada al inventario: ${formatCOP(result.total)}.`);
      render();
    };
  });
  modal.querySelectorAll('[data-apply]').forEach((button) => {
    button.onclick = () => {
      const result = applySupply(button.dataset.apply, selectedZone);
      if (!result.ok) return toast(result.reason);
      toast(`Insumo aplicado en Zona ${selectedZone}: ${result.affected} cama(s) o foco(s).`);
      render();
      const bed = state.hover?.bed !== undefined ? state.beds[state.hover.bed] : state.beds[0];
      renderBedStats(document.getElementById('bed-stats'), bed);
      requestRedraw();
    };
  });
}

export function openShop() {
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'shop-modal';
    modal.className = 'shop-backdrop';
    modal.addEventListener('click', (event) => {
      if (event.target === modal) closeShop();
    });
    document.body.appendChild(modal);
    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && modal.classList.contains('open')) closeShop();
    });
  }
  render();
  modal.classList.add('open');
}

export function closeShop() {
  modal?.classList.remove('open');
}