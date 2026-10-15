// Ficticio. Semanas: Ene 0-3, Feb 4-7, Mar 8-11, Abr 12-15.
export const ORDERS = [
  {
    id: 'sanvalentin',
    name: 'San Valentín',
    dateLabel: '14 de febrero',
    appearsWeek: 0,
    countFromWeek: 0,
    deliverWeek: 5,
    qty: 10_000,
    minQuality: 'primera',
    premium: 0.3,
    penalty: 3_000_000,
    client: 'Floristería Aurora (ficticia)',
  },
  {
    id: 'madre',
    name: 'Día de la Madre',
    dateLabel: 'entrega a inicios de mayo',
    appearsWeek: 6,
    countFromWeek: 12,
    deliverWeek: 15,
    qty: 12_000,
    minQuality: 'primera',
    premium: 0.25,
    penalty: 4_000_000,
    client: 'Distribuidora Andina (ficticia)',
  },
];
