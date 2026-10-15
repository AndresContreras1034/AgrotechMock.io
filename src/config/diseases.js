// Todo ficticio.
export const DISEASES = [
  { id: 'mancha', name: 'Mancha foliar Ruscus-X', kind: 'Hongo (ficticio)', treatment: 'Fungicida preventivo F-1', cost: 180_000, jornales: 1, growthPerWeek: 9, spreadChance: 0.25 },
  { id: 'pudricion', name: 'Pudrición de rizoma Rz-2', kind: 'Hongo de suelo (ficticio)', treatment: 'Drench fungicida + drenaje D-2', cost: 320_000, jornales: 2, growthPerWeek: 7, spreadChance: 0.18 },
  { id: 'trips', name: 'Trips del follaje Tp-1', kind: 'Plaga (ficticia)', treatment: 'Insecticida biológico I-3', cost: 140_000, jornales: 1, growthPerWeek: 11, spreadChance: 0.3 },
];

export const STEMS = {
  initialPerBed: [1, 3],
  initialSeverity: [6, 20],
  newSeverity: [4, 10],
  maxPerBed: 14,
  lateralM: 2.2,
  severityPerLevel: 4,
  hitRadiusPx: 9,
};

export const TREATMENT = { clearsIfSeverityBelow: 70, partialFactor: 0.5 };
export const OUTBREAK = { newPerBedWeek: 0.03, spreadMinSeverity: 25, neighborScale: 0.4 };
export const RISK = { severityWeight: 0.7, perWeek: 3, weeksCap: 8, mid: 30, high: 55 };

export const QUALITY_IMPACT = [
  { below: 25, text: 'Premium baja a Primera' },
  { below: 50, text: 'Primera baja a Segunda' },
  { below: 75, text: 'Pasa a Nacional' },
  { below: 101, text: 'Descarte' },
];
