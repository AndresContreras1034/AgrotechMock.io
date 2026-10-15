// Cambia `enabled` para activar o desactivar eventos. Todo ficticio.
export const EVENTS = {
  brote: { enabled: true, week: 4, minTreatmentsJan: 3, beds: 6, stemsPerBed: 2, severity: 35 },
  arbolCaido: {
    enabled: true,
    week: 8,
    zone: 'B',
    repairCost: 3_500_000,
    repairJornales: 6,
    repairWeeks: 2,
    ignoreProdFactor: 0.5,
    ignoreHealthLoss: 3,
  },
  fallaBomba: { enabled: false, week: 6, weeks: 2, factor: 0.5 },
  caidaPrecio: { enabled: false, week: 9, weeks: 4, factor: 0.75 },
  plagaTrips: { enabled: false, week: 10, beds: 8, stemsPerBed: 2, severity: 30 },
};

export const EXTRA_EVENTS = [];
export const EVENT_FLAGS = {
  pumpFailure: false,
  priceDrop: false,
  tripsPlague: false,
};
