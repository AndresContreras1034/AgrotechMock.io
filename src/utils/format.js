export function formatCOP(n) {
  const sign = n < 0 ? '-' : '';
  return sign + '$' + Math.abs(Math.round(n)).toLocaleString('es-CO');
}

export const formatPct = (n, d = 0) => `${(n * 100).toFixed(d).replace('.', ',')} %`;
export const formatNum = (n) => Math.round(n).toLocaleString('es-CO');