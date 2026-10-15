import { info, planStep, laborStep } from '../builders.js';

export default function febrero() {
  return [
    info('Febrero: consolidación del lote', [
      'La producción se está estabilizando y se toman decisiones clave para sostener el volumen.',
      'La calidad y la salud de las camas se vuelven más sensibles a la escasez de agua y al exceso de abono.',
    ]),
    planStep('En este punto del ciclo, el plan de riego da resultados visible a corto plazo en salud y calidad.'),
    laborStep('La cosecha y el tratamiento de focos requieren coordinación para no perder tallos.'),
  ];
}
