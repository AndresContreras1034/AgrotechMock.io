import { describe, expect, it } from 'vitest';
import { resetState, state } from '../src/core/state.js';
import { advanceWeek, getSimulationSnapshot } from '../src/core/engine.js';
import { getDate } from '../src/core/clock.js';
import { evaluateQuality } from '../src/sim/quality.js';
import { evaluatePlantHealth } from '../src/sim/plantHealth.js';
import { initStems } from '../src/sim/disease.js';

describe('stage 5 engine', () => {
  it('initializes a valid simulation state', () => {
    resetState(42);
    expect(state.week).toBe(0);
    expect(state.tankM3).toBeGreaterThan(0);
    expect(state.plan.irrigation).toBe('normal');
    expect(state.beds.length).toBeGreaterThan(0);
  });

  it('advances the week and keeps the snapshot coherent', () => {
    resetState(42);
    const before = getSimulationSnapshot();
    const after = advanceWeek(2);

    expect(after.week).toBe(before.week + 2);
    expect(after.date.label).toContain('Semana');
    expect(after.tankM3).toBeGreaterThanOrEqual(0);
  });

  it('keeps quality scores within the valid range', () => {
    const bed = { waterStress: 22, overWater: 8, fertilizer: 78, disease: 12, health: 82 };
    const quality = evaluateQuality(bed);

    expect(quality.score).toBeGreaterThanOrEqual(0);
    expect(quality.score).toBeLessThanOrEqual(1);
    expect(quality.quality).toBeTruthy();
  });

  it('applies the configured disease penalty without instantly killing infected beds', () => {
    const health = evaluatePlantHealth({
      health: 100,
      waterStress: 0,
      overWater: 0,
      fertilizer: 50,
      disease: 50,
    });

    expect(health.health).toBe(96);
    expect(health.status).toBe('ok');
  });

  it('keeps beds alive during the first month with the seeded starting disease load', () => {
    resetState(42);
    initStems();

    advanceWeek(4);

    expect(state.beds.some((bed) => bed.health > 0)).toBe(true);
    expect(state.beds.every((bed) => bed.health > 0)).toBe(true);
  });

  it('builds a valid date label for week zero', () => {
    const date = getDate(0);
    expect(date.finished).toBe(false);
    expect(date.label).toContain('Enero');
  });
});
