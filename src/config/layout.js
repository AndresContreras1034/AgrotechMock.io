import { BED, ZONES } from './beds.js';

export const LAYOUT_MODE = 'horizontal'; // 'horizontal' | 'vertical' | 'diagonal'
export const PAD_X = 10;
export const PAD_Y = 5;
const D = Math.PI / 180;

// Centro (cx, cy) y ángulo de cada invernadero, en metros de mundo.
const PRESETS = {
  horizontal: {
    A: { cx: 185, cy: 110, angle: 0 },
    B: { cx: 185, cy: 250, angle: 0 },
    C: { cx: 695, cy: 170, angle: 0 },
  },
  vertical: {
    A: { cx: 110, cy: 190, angle: 90 * D },
    B: { cx: 230, cy: 190, angle: 90 * D },
    C: { cx: 700, cy: 190, angle: 90 * D },
  },
  diagonal: {
    A: { cx: 180, cy: 115, angle: 20 * D },
    B: { cx: 180, cy: 270, angle: 20 * D },
    C: { cx: 700, cy: 200, angle: 20 * D },
  },
};

export function buildGreenhouses(mode = LAYOUT_MODE) {
  const preset = PRESETS[mode] ?? PRESETS.horizontal;
  return ZONES.map((z) => ({
    id: z.id,
    name: z.name,
    bedCount: z.beds,
    ...preset[z.id],
    w: BED.lengthM + 2 * PAD_X,
    h: z.beds * BED.pitchM + 2 * PAD_Y,
  }));
}

// Coordenada local "v" del eje de la cama k dentro del invernadero g.
export function bedCenterV(g, k) {
  return -g.h / 2 + PAD_Y + BED.pitchM * (k + 0.5);
}