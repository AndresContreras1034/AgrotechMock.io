export const BED = {
  lengthM: 250,
  widthM: 1.2,
  visualWidthM: 6,
  pitchM: 10,
  sensorSpacingM: 20,
};
export const BED_AREA_M2 = BED.lengthM * BED.widthM;
export const SENSORS_PER_BED = Math.floor(BED.lengthM / BED.sensorSpacingM) + 1;

export const ZONES = [
  { id: 'A', name: 'Zona A', beds: 9 },
  { id: 'B', name: 'Zona B', beds: 8 },
  { id: 'C', name: 'Zona C', beds: 8 },
];

export const BED_STATES = ['disponible', 'sembrada', 'cosechada', 'en descanso'];