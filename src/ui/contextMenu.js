let menu;

function ensure() {
  if (!menu) {
    menu = document.createElement('div');
    menu.id = 'ctx-menu';
    document.body.appendChild(menu);
    window.addEventListener('pointerdown', (e) => { if (!menu.contains(e.target)) hideMenu(); }, true);
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') hideMenu(); });
  }
  return menu;
}

export function showMenu(x, y, items) {
  const m = ensure();
  m.innerHTML = '';
  for (const it of items) {
    const b = document.createElement('button');
    b.textContent = it.label;
    b.onclick = () => { hideMenu(); it.action(); };
    m.appendChild(b);
  }
  m.style.left = `${Math.min(x, window.innerWidth - 200)}px`;
  m.style.top = `${Math.min(y, window.innerHeight - (items.length * 36 + 12))}px`;
  m.style.display = 'block';
}

export function hideMenu() {
  if (menu) menu.style.display = 'none';
}
