export const START_MONEY = 60_000_000;
export const LOW_MONEY = 5_000_000; // el HUD se pone amarillo por debajo de este saldo

export const LABOR = {
  workers: 8,
  maxWorkers: 14,
  jornalesPerWorker: 5,
  jornalValue: 70_000,
  extraPack: 10,
  extraJornalPrice: 84_000,
  hireFee: 300_000,
};

export const TASKS = {
  harvest: 10,
  irrigation: { ninguno: 0, bajo: 6, normal: 10, alto: 14 },
  fertilizer: { ninguno: 0, normal: 5, exceso: 8 },
  tanker: 2,
};

export const COSTS = {
  payrollPerWorkerMonth: 600_000,
  maintenanceMonth: 1_200_000,
  waterFixedMonth: 400_000,
};

export const ABONO = {
  price: 30_000,
  bultosPerWeek: { ninguno: 0, normal: 10, exceso: 24 },
  packBultos: 40,
  packDiscount: 0.15,
};

export const RENTED_WATER = { tripM3: 15, tripCost: 250_000, maxTrips: 20 };
export const OWNED_TANKER = { price: 25_000_000, m3PerWeek: 160, weeklyCost: 250_000 };
export const PREVENTIVE = { cost: 2_400_000, jornales: 3, weeks: 4, outbreakFactor: 0.25, growthFactor: 0.6 };

export const COST_LABELS = {
  nomina: 'Nómina', agua: 'Agua', abonos: 'Abonos', tratamientos: 'Tratamientos',
  mantenimiento: 'Mantenimiento', reparaciones: 'Reparaciones', activos: 'Carro tanque',
  mano_obra_extra: 'Mano de obra extra', multas: 'Multas por pedidos',
};
