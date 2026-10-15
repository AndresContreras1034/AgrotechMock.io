import { beforeEach, describe, expect, it } from 'vitest';
import { resetState, state } from '../src/core/state.js';
import { addStem } from '../src/sim/disease.js';
import { applySupply, buySupply, SUPPLIES } from '../src/sim/supplies.js';

describe('shop supplies', () => {
  beforeEach(() => resetState(42));

  it('buys a zone fertilizer kit and applies it to beds in the selected zone', () => {
    const price = SUPPLIES.find((item) => item.id === 'abono').price;
    const purchase = buySupply('abono');

    expect(purchase.ok).toBe(true);
    expect(state.money).toBe(60_000_000 - price);
    expect(state.supplies.abono).toBe(1);

    const result = applySupply('abono', 'A');

    expect(result.ok).toBe(true);
    expect(result.affected).toBe(9);
    expect(state.beds.filter((bed) => bed.zone === 'A').every((bed) => bed.fertilizer === 70)).toBe(true);
    expect(state.beds.filter((bed) => bed.zone !== 'A').every((bed) => bed.fertilizer === 50)).toBe(true);
    expect(state.supplies.abono).toBe(0);
  });

  it('uses a purchased disease kit only on matching outbreaks in its selected zone', () => {
    const stem = addStem(0, { disease: 'mancha', severity: 20 });
    const otherZoneStem = addStem(state.beds.find((bed) => bed.zone === 'B').index, { disease: 'mancha', severity: 20 });
    buySupply('mancha');

    const result = applySupply('mancha', 'A');

    expect(result.ok).toBe(true);
    expect(result.cleared).toBe(1);
    expect(state.stems).not.toContain(stem);
    expect(state.stems).toContain(otherZoneStem);
    expect(state.supplies.mancha).toBe(0);
  });

  it('does not charge for invalid purchases or consume stock when application cannot proceed', () => {
    state.money = 0;
    expect(buySupply('abono').ok).toBe(false);
    expect(state.supplies.abono).toBe(0);

    state.money = 60_000_000;
    buySupply('mancha');
    const money = state.money;
    expect(applySupply('mancha', 'B').ok).toBe(false);
    expect(state.supplies.mancha).toBe(1);
    expect(state.money).toBe(money);
  });
});
