import { describe, expect, it } from 'vitest';
import { TASKS, TASKS_ES, kerrIsco, chirpMass } from './tasks';
import { useStore } from '../state/store';

const task = (id: string) => TASKS.find((t) => t.id === id)!;
const st = (p: object) => ({ ...useStore.getState(), ...p });

describe('task checks and predictions', () => {
  it('t-pi detects the 60 degree loop only when finished', () => {
    const c = task('t-pi').check!;
    expect(c(st({ surfaceId: 'sphere', pathKind: 'latitude', latitude: Math.PI / 3, progress: 1 }))).toBe(true);
    expect(c(st({ surfaceId: 'sphere', pathKind: 'latitude', latitude: Math.PI / 3, progress: 0.5 }))).toBe(false);
    expect(c(st({ surfaceId: 'sphere', pathKind: 'latitude', latitude: 1.2, progress: 1 }))).toBe(false);
  });
  it('m-pole detects a pole, not the default point', () => {
    const c = task('m-pole').check!;
    expect(c(st({ surfaceId: 'sphere', uv: [0.1, 0] }))).toBe(true);
    expect(c(st({ surfaceId: 'sphere', uv: [Math.PI / 3, 0] }))).toBe(false);
  });
  it('no check holds in the default state', () => {
    for (const t of TASKS) if (t.check) expect(t.check(useStore.getState()), t.id).toBe(false);
  });
  it('predictions match closed forms; ES keeps check/predict', () => {
    expect(kerrIsco(0)).toBeCloseTo(6, 10);
    expect(kerrIsco(0.998)).toBeCloseTo(1.237, 2);
    expect(chirpMass(36, 29)).toBeCloseTo(28.1, 1);
    expect(task('t-pi').predict!.answer(useStore.getState())).toBeCloseTo(105.4, 1);
    expect(TASKS_ES.filter((t) => t.predict).length).toBe(TASKS.filter((t) => t.predict).length);
    expect(TASKS.filter((t) => t.predict).length).toBeGreaterThanOrEqual(4);
  });
});
