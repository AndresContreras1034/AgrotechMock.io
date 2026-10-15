import { info, planStep, waterStep, arbolStep } from '../builders.js';

export default function marzo() {
  return [
    info('Marzo: presión de clima y operación', [
      'La demanda del mercado y la presión climática hacen que cada decisión cuente.',
      'Se intuye que el follaje y la raíz comienzan a responder al plan de la última quincena.',
    ]),
    planStep('La temporada exige mantener la productividad sin disparar el riesgo de pudrición o quemaduras.'),
    waterStep('La quebrada se complica; decide si la operación requiere más agua o un corte más estricto.'),
    arbolStep(),
  ];
}
