import { describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { applyShareExt, decodeShare, encodeShare, num, oneOf, parseShareHash, registerShare } from './share';
import { useStore } from './store';
import { catmullRomLoop, nearestImage, unwrapPath } from '../math/curves';
import type { Vec2 } from '../math/types';

const b64 = (o: unknown) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

describe('module-owned stores in share links', () => {
  it('limits and frontiers links parse', () => {
    expect(parseShareHash('#limits?s=abc')).toEqual({ module: 'limits', s: 'abc' });
    expect(parseShareHash('#frontiers?s=abc')).toEqual({ module: 'frontiers', s: 'abc' });
    expect(decodeShare(b64({ m: 'frontiers' }))).toEqual({ module: 'frontiers' });
  });

  it('round trip, small values keep their digits, hostile values dropped, link queued until the module registers', () => {
    const useA = create<{ mode: string; a0: number; k: number }>(() => ({ mode: 'x', a0: 1.2e-10, k: 2 }));
    // link arrives before the module loads: queued, applied on register, with bad fields dropped
    applyShareExt('curves', b64({ m: 'curves', x: { a: { mode: 'y', a0: 'NaN', k: 1e9, junk: 1 } } }));
    const fields = { mode: oneOf(['x', 'y'] as const), a0: num(1e-11, 1e-9), k: num(0, 5) };
    registerShare('curves', { a: { store: useA, fields } });
    expect(useA.getState()).toEqual({ mode: 'y', a0: 1.2e-10, k: 5 });

    useA.setState({ mode: 'x', a0: 1.23456e-10, k: 3 });
    const s = encodeShare({ ...useStore.getState(), module: 'curves' });
    useA.setState({ mode: 'y', a0: 5e-10, k: 0 });
    applyShareExt('curves', s);
    expect(useA.getState()).toEqual({ mode: 'x', a0: 1.23456e-10, k: 3 });
  });
});

describe('free loops across a periodic seam', () => {
  const P = 2 * Math.PI, per: Vec2 = [0, P];
  it('nearest image and unwrapping', () => {
    expect(nearestImage([1, 0.1], [1, 6.2], per)[1]).toBeCloseTo(0.1 + P, 12);
    expect(unwrapPath([[1, 6.0], [1.2, 0.2], [1.4, 0.5]], per).map((p) => p[1])).toEqual([6.0, 0.2 + P, 0.5 + P]);
  });
  it('a loop winding once around closes smoothly through the shifted first point', () => {
    const pts: Vec2[] = [[1, 0], [1.2, 1.6], [1, 3.2], [0.8, 4.8]];
    const c = catmullRomLoop(pts, per);
    const end = c.point(1), start = c.point(0);
    expect(end[0]).toBeCloseTo(start[0], 12);
    expect(end[1]).toBeCloseTo(start[1] + P, 12); // one full turn in φ, no jump back
    // no backward jump anywhere: φ increases monotonically along this loop
    let prev = -Infinity;
    for (let i = 0; i <= 200; i++) { const v = c.point(i / 200)[1]; expect(v).toBeGreaterThan(prev - 1e-9); prev = v; }
  });
  it('share decode keeps unwrapped points continuous on the torus', () => {
    const fp: Vec2[] = [[1, 6.0], [1.2, 0.2 + P], [1.4, 0.5 + P]];
    const d = decodeShare(encodeShare({ ...useStore.getState(), module: 'transport', surfaceId: 'torus', pathKind: 'free', freePoints: fp }));
    const got = d.freePoints!;
    for (let i = 1; i < got.length; i++) expect(Math.abs(got[i][1] - got[i - 1][1])).toBeLessThan(1);
  });
});
