export const QUALITIES = [
  { id: 'premium',  name: 'Premium (exportación)', short: 'Premium',  price: 900, center: 0.95, color: '#2e9e4f' },
  { id: 'primera',  name: 'Primera',               short: 'Primera',  price: 650, center: 0.80, color: '#7bbf4a' },
  { id: 'segunda',  name: 'Segunda',               short: 'Segunda',  price: 400, center: 0.60, color: '#e0a800' },
  { id: 'nacional', name: 'Nacional',              short: 'Nacional', price: 150, center: 0.40, color: '#e0742a' },
  { id: 'descarte', name: 'Descarte',              short: 'Descarte', price: 0,   center: 0.15, color: '#d64541' },
];

export const QUALITY_MODEL = {
  sigma: 0.18,
  ceiling: 0.9,
  perWaterStress: 0.002,
  perOverWater: 0.002,
  fertOverAbove: 75,
  perFertOver: 0.004,
  perDisease: 0.005,
};
