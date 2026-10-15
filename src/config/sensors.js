export const SENSOR_VARS = [
  { key: 'temperature', label: 'Temperatura', unit: '°C', min: 12, max: 26, decimals: 1 },
  { key: 'humidity', label: 'Humedad relativa', unit: '%', min: 60, max: 85, decimals: 0 },
  { key: 'soilMoisture', label: 'Humedad del suelo', unit: '%', min: 40, max: 70, decimals: 0 },
  { key: 'ph', label: 'pH', unit: '', min: 5.5, max: 7.0, decimals: 2 },
  { key: 'ec', label: 'Conductividad eléctrica', unit: 'dS/m', min: 0.8, max: 2.5, decimals: 2 },
];

// Modelo ilustrativo: todo ajustable aquí.
export const SENSOR_MODEL = {
  warnMargin: 0.15,
  nominal: { temperature: 19, humidity: 72, soilMoisture: 55, ph: 6.3, ec: 1.6 },
  noise: { temperature: 0.8, humidity: 2.5, soilMoisture: 2.5, ph: 0.06, ec: 0.08 },
  perWaterStress: { temperature: 0.06, humidity: -0.12, soilMoisture: -0.35 },
  fertilizerNeutral: 50,
  perFertilizerOver: { ec: 0.03, ph: -0.005 },
  perDisease: { humidity: 0.08 },
  alongBed: { temperature: 0.8, soilMoisture: -3 },
  offlineChance: 0.02,
  zoomShowSensors: 2.2,
};
