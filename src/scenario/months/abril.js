import { info, planStep, laborStep } from '../builders.js';

export default function abril() {
  return [
    info('Abril: cierre de temporada y meta del Día de la Madre', [
      'La fecha de entrega ya está cerca y la entrega requiere calidad y volumen en las mejores camas.',
      'La última decisión antes de la entrega puede definir si se cumple la meta o si se pagan multas.',
    ]),
    planStep('Acércate a la fecha objetivo: cuida la calidad y el volumen sin sobrecargar el sistema.'),
    laborStep('La cosecha y la clasificación de tallos deben ser consistentes para no perder calidad premium.'),
  ];
}
