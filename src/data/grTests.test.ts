import { describe, it, expect } from 'vitest';
import { BODIES, C, G } from './celestial';
import { REDSHIFT_TESTS, SHAPIRO_TESTS, FRAME_DRAG_TESTS } from './grTests';

const MAS = (180 / Math.PI) * 3600e3 * 365.25 * 86400; // rad/s -> mas/yr
const earth = BODIES.find((b) => b.id === 'earth')!;
const ids = new Set(BODIES.map((b) => b.id));
const rel = (x: number, y: number) => Math.abs(x - y) / Math.abs(y);

describe('grTests data', () => {
  it('central bodies exist, uncertainties positive', () => {
    for (const t of [...REDSHIFT_TESTS, ...SHAPIRO_TESTS, ...FRAME_DRAG_TESTS]) expect(ids.has(t.centralId)).toBe(true);
    for (const t of [...REDSHIFT_TESTS, ...SHAPIRO_TESTS]) {
      expect(t.observed.uncertainty ?? 1).toBeGreaterThan(0);
      expect(t.r1M).toBeGreaterThan(0);
    }
    for (const t of FRAME_DRAG_TESTS) {
      expect(t.observed.geodetic.uncertainty).toBeGreaterThan(0);
      expect(t.observed.frameDragging.uncertainty).toBeGreaterThan(0);
    }
  });
  it('GP-B predictions from formulas', () => {
    const t = FRAME_DRAG_TESTS[0], a = t.orbitRadiusM, gm = earth.gm;
    expect(rel(1.5 * gm ** 1.5 / (C ** 2 * a ** 2.5) * MAS, t.predicted.geodetic)).toBeLessThan(0.005);
    const J = earth.angularMomentum!;
    expect(rel(G * J / (2 * C ** 2 * a ** 3) * MAS, t.predicted.frameDragging)).toBeLessThan(0.05); // ~4% high: formula is the idealised polar-orbit value (40.8); 39.2 includes the IM Peg geometry
  });
  it('Pound-Rebka gh/c^2 and Sirius B redshift', () => {
    expect(rel(9.80665 * 22.5 / C ** 2, 2.46e-15)).toBeLessThan(0.01);
    const sb = bodyOf('sirius-b'), t = REDSHIFT_TESTS.find((x) => x.id === 'sirius-b')!;
    expect(rel(sb.gm / (t.r1M * C) / 1e3, 80)).toBeLessThan(0.05);
  });
});
function bodyOf(id: string) { return BODIES.find((b) => b.id === id)!; }
