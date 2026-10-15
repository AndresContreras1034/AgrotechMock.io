import { info, planStep, waterStep, laborStep } from '../builders.js';

export default function enero() {
  return [
    info('Enero: arranque de la temporada', [
      'Las camas salen de la fase de siembra y se define el ritmo del año.',
      'Hay que equilibrar disponibilidad de agua, abono y mano de obra para no perder calidad.',
    ]),
    planStep('El primer mes define el balance entre riego y abono para evitar estrés y brotes tempranos.'),
    waterStep('La quebrada puede caer en la siguiente semana; decide si compras o alquilas agua.'),
    laborStep('El equipo actual puede sostener la semana, pero un aumento de rotación también exige más jornales.'),
  ];
}
