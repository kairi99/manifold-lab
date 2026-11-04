import { describe, expect, it } from 'vitest';
import { PRESETS } from '../math/surfaces/presets';
import { decodeShare, encodeShare, parseShareHash } from './share';
import { useStore } from './store';

const enc = (s: string) => btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64 = (o: unknown) => enc(JSON.stringify(o));
const base = () => useStore.getState();

describe('share round trip', () => {
  it('surface module', () => {
    const s = { ...base(), module: 'geodesics' as const, surfaceId: 'torus', uv: [1.23456789, 2.5] as [number, number], vector: [0.3, -0.7] as [number, number], geoCount: 5, geoSpread: 0.4, geoLength: 6 };
    const d = decodeShare(encodeShare(s));
    expect(d).toMatchObject({ module: 'geodesics', surfaceId: 'torus', uv: [1.2346, 2.5], vector: [0.3, -0.7], geoCount: 5, geoSpread: 0.4, geoLength: 6 });
    expect(d).not.toHaveProperty('grView');
  });
  it('URL-safe', () => expect(encodeShare({ ...base(), module: 'cosmos' })).toMatch(/^[A-Za-z0-9_-]+$/));
  it('relativity, spacetime, cosmos', () => {
    expect(decodeShare(encodeShare({ ...base(), module: 'relativity', grView: 'kerr', grSpin: 0.5, grBody: 'sun' }))).toMatchObject({ grView: 'kerr', grSpin: 0.5, grBody: 'sun' });
    expect(decodeShare(encodeShare({ ...base(), module: 'spacetime', stView: 'tidal', stParams: { M: 2 }, stEvent: [0, 10, 1.5, 0] }))).toMatchObject({ stView: 'tidal', stParams: { M: 2 }, stEvent: [0, 10, 1.5, 0] });
    expect(decodeShare(encodeShare({ ...base(), module: 'cosmos', csH0: 70, csView: 'cosmology' }))).toMatchObject({ csH0: 70, csView: 'cosmology' });
  });
  it('curvature flags and free points', () => {
    expect(decodeShare(encodeShare({ ...base(), module: 'curvature', curvShow: { heatmap: false, principal: true, circle: true } })).curvShow).toEqual({ heatmap: false, principal: true, circle: true });
    expect(decodeShare(encodeShare({ ...base(), module: 'transport', freePoints: [[1, 1], [1.5, 1.2], [1.2, 1.6]], pathKind: 'free' }))).toMatchObject({ pathKind: 'free', freePoints: [[1, 1], [1.5, 1.2], [1.2, 1.6]] });
  });
  it('custom surface incl. Möbius twist', () => {
    const spec = PRESETS.find((p) => p.id === 'mobius')!.spec;
    const d = decodeShare(encodeShare({ ...base(), module: 'metric', surfaceId: 'custom', customSpec: spec }));
    expect(d.surfaceId).toBe('custom');
    expect(d.customSpec).toEqual(spec);
  });
});

describe('share hostile input', () => {
  it('garbage never throws and yields {}', () => {
    for (const s of ['', '!!!', 'A', '%%', 'e30', 'W10', 'bnVsbA', '"><script>alert(1)</script>', 'x'.repeat(7000), 'bm90IGpzb24'])
      expect(decodeShare(s)).toEqual({});
  });
  it('wrong types and non-finite numbers are dropped', () => {
    const d = decodeShare(b64({ m: 7, sf: ['sphere'], uv: ['a', 1], v: [1e999, 0], la: '3', gc: null, fb: 'yes', sv: 'drop table', f1: '<img src=x onerror=alert(1)>' }));
    expect(d).toEqual({});
  });
  it('NaN/Infinity serialised as null are dropped; huge numbers are clamped', () => {
    expect(decodeShare(b64({ uv: [null, 1], la: null }))).toEqual({});
    const d = decodeShare(b64({ gc: 1e12, gl: -5, rp: 1e300, v: [99, -99], sp: 7 }));
    expect(d).toMatchObject({ geoCount: 15, geoLength: 0.5, grRp: 60, vector: [5, -5], grSpin: 0.998 });
  });
  it('unknown keys and prototype pollution are ignored', () => {
    const d = decodeShare(enc('{"__proto__":{"polluted":1},"constructor":1,"evil":1,"m":"metric"}'));
    expect(d).toEqual({ module: 'metric' });
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });
  it('uv is clamped into the surface domain', () => {
    const d = decodeShare(b64({ sf: 'torus', uv: [100, -100] }));
    expect(d.uv![0]).toBeLessThanOrEqual(2 * Math.PI + 1e-9);
    expect(d.uv![1]).toBeGreaterThanOrEqual(0);
  });
  it('custom spec: script-like or unparsable expressions are rejected', () => {
    const spec = (x: string) => ({ n: 'n', md: 'p', x, y: 'v', z: '0', f: '0', ur: ['0', '1'], vr: ['0', '1'], pu: 0, pv: 0, c: ['u', 'v'], p: [1, 0] });
    for (const x of ['alert(1)', 'constructor.constructor("x")()', 'u;process.exit()', '`${1}`', 'u u', 'x'.repeat(400)]) {
      const d = decodeShare(b64({ sf: 'custom', cs: spec(x) }));
      expect(d.customSpec).toBeUndefined();
      expect(d.surfaceId).toBeUndefined();
    }
    expect(decodeShare(b64({ sf: 'custom', cs: spec('u*2') })).customSpec?.x).toBe('u*2');
  });
  it('custom spec: non-finite surface rejected, hostile name/coords sanitised or rejected', () => {
    const s = { n: '<b>hi</b>\u0000', md: 'p', x: 'u', y: 'v', z: 'log(0)', f: '0', ur: ['0', '1'], vr: ['0', '1'], pu: 0, pv: 0, c: ['u', 'v'], p: [1, 0] };
    expect(decodeShare(b64({ sf: 'custom', cs: s })).customSpec).toBeUndefined();
    const ok = { ...s, z: '0' };
    expect(decodeShare(b64({ sf: 'custom', cs: ok })).customSpec?.name).toBe('bhi/b');
    expect(decodeShare(b64({ sf: 'custom', cs: { ...ok, c: ['<script>', 'v'] } })).customSpec).toBeUndefined();
  });
  it('parseShareHash', () => {
    expect(parseShareHash('#metric?s=abc_-1')).toEqual({ module: 'metric', s: 'abc_-1' });
    expect(parseShareHash('#nope?s=abc')).toBeNull();
    expect(parseShareHash('#metric?s=a<b')).toBeNull();
  });
});
