export const clamp = (v, a, b) => Math.min(Math.max(v, a), b);
export const lerp = (a, b, t) => a + (b - a) * t;

const toRgb = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));

export function lerpColor(c1, c2, t) {
  const a = toRgb(c1);
  const b = toRgb(c2);
  const k = clamp(t, 0, 1);
  return `rgb(${a.map((v, i) => Math.round(lerp(v, b[i], k))).join(',')})`;
}

// Invernadero (centro + ángulo) <-> mundo
export function localToWorld(g, u, v) {
  const c = Math.cos(g.angle);
  const s = Math.sin(g.angle);
  return { x: g.cx + u * c - v * s, y: g.cy + u * s + v * c };
}

export function worldToLocal(g, x, y) {
  const c = Math.cos(g.angle);
  const s = Math.sin(g.angle);
  const dx = x - g.cx;
  const dy = y - g.cy;
  return { u: dx * c + dy * s, v: -dx * s + dy * c };
}