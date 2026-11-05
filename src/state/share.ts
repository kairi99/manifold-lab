// Shareable view state: a whitelisted, compact, URL-safe snapshot of the visible configuration.
// Decoding treats the string as hostile: only known keys, every value type-checked, finite and clamped;
// custom-surface expressions are re-parsed by the safe expression parser (src/math/expr.ts, never eval).
import { SURFACES } from '../math';
import { compileSpec, makeCustomSurface, validateSurface, type CustomSpec } from '../math/surfaces/custom';
import type { Surface, Vec2 } from '../math/types';
import type { AppState, ModuleId, PathKind } from './store';

type Rec = Record<string, unknown>;
const MAX_ENCODED = 6000;

const MODULE_IDS: ModuleId[] = ['curves', 'metric', 'transport', 'geodesics', 'curvature', 'fields', 'relativity', 'spacetime', 'cosmos'];
const SURFACE_IDS = ['sphere', 'torus', 'saddle', 'paraboloid', 'custom'];

/* ---------- value checkers: return the cleaned value or undefined (= drop the key) ---------- */

type Check<T> = (v: unknown) => T | undefined;
const round = (x: number) => Math.round(x * 1e4) / 1e4;
const num = (lo: number, hi: number): Check<number> => (v) => (typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : undefined);
const int = (lo: number, hi: number): Check<number> => (v) => { const n = num(lo, hi)(v); return n === undefined ? undefined : Math.round(n); };
const bool: Check<boolean> = (v) => (typeof v === 'boolean' ? v : undefined);
const oneOf = <T extends string>(xs: readonly T[]): Check<T> => (v) => (typeof v === 'string' && (xs as readonly string[]).includes(v) ? (v as T) : undefined);
/** catalogue ids (bodies, orbits, fields…): short, restricted charset; consumers already fall back for unknown ids */
const id: Check<string> = (v) => (typeof v === 'string' && /^[A-Za-z0-9_.+-]{0,40}$/.test(v) ? v : undefined);
const pair = (lo: number, hi: number): Check<Vec2> => (v) => {
  if (!Array.isArray(v) || v.length !== 2) return undefined;
  const a = num(lo, hi)(v[0]), b = num(lo, hi)(v[1]);
  return a === undefined || b === undefined ? undefined : [a, b];
};
const stParams: Check<Record<string, number>> = (v) => {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out: Record<string, number> = {};
  for (const [k, x] of Object.entries(v as Rec).slice(0, 12)) {
    const n = num(-1e6, 1e6)(x);
    if (/^[A-Za-z][A-Za-z0-9_]{0,11}$/.test(k) && k !== 'constructor' && n !== undefined) out[k] = n;
  }
  return out;
};
const stEvent: Check<number[] | null> = (v) => {
  if (v === null) return null;
  if (!Array.isArray(v) || v.length !== 4) return undefined;
  const xs = v.map(num(-1e6, 1e6));
  return xs.every((x) => x !== undefined) ? (xs as number[]) : undefined;
};
const freePoints: Check<Vec2[]> = (v) => {
  if (!Array.isArray(v)) return undefined;
  return v.slice(0, 64).map(pair(-1e3, 1e3)).filter((p): p is Vec2 => p !== undefined);
};
const showFlags: Check<AppState['curvShow']> = (v) => {
  const n = int(0, 7)(v);
  return n === undefined ? undefined : { heatmap: !!(n & 1), principal: !!(n & 2), circle: !!(n & 4) };
};

/** short key -> [AppState field, checker]; numbers are rounded on encode */
const FIELDS: Record<string, [keyof AppState, Check<unknown>]> = {
  m: ['module', oneOf(MODULE_IDS)],
  sf: ['surfaceId', oneOf(SURFACE_IDS)],
  uv: ['uv', pair(-1e3, 1e3)],
  v: ['vector', pair(-5, 5)],
  pk: ['pathKind', oneOf<PathKind>(['latitude', 'triangle', 'free'])],
  la: ['latitude', num(-10, 10)],
  fp: ['freePoints', freePoints],
  gc: ['geoCount', int(1, 15)], gs: ['geoSpread', num(0, Math.PI / 2)], gl: ['geoLength', num(0.5, 4 * Math.PI)],
  cr: ['curvRho', num(0.05, 1.5)], cv: ['curvShow', showFlags],
  f1: ['fieldId', id], f2: ['fieldId2', id], fb: ['showFibers', bool], ct: ['commT', num(0.02, 0.6)],
  gv: ['grView', oneOf(['orbits', 'light', 'flamm', 'kerr', 'image', 'clocks'] as const)],
  gb: ['grBody', id], go: ['grOrbit', id],
  rp: ['grRp', num(2.5, 60)], ra: ['grRa', num(2.5, 60)], gB: ['grB', num(2, 20)],
  fl: ['grShowFlamm', bool], sp: ['grSpin', num(0, 0.998)], rt: ['grRetro', bool], in: ['grIncl', num(1, 89)],
  it: ['grImgTarget', oneOf(['disk', 'sky', 'both'] as const)], cp: ['grClockPreset', id],
  sv: ['stView', oneOf(['tensors', 'tidal', 'waves'] as const)], sm: ['stMetric', id], sq: ['stParams', stParams], se: ['stEvent', stEvent],
  sb: ['stBody', id], sr: ['stR0', num(6, 60)], sl: ['stLen', num(0.5, 10)],
  so: ['stPol', oneOf(['plus', 'cross', 'circ'] as const)], sa: ['stAmp', num(0.05, 1.2)],
  wd: ['gwDrive', oneOf(['mono', 'gw150914'] as const)], ws: ['gwSet', oneOf(['prl', 'gwtc1'] as const)], wr: ['gwRawL1', bool],
  cs_v: ['csView', oneOf(['penrose', 'cosmology'] as const)], cs_s: ['csSpace', oneOf(['minkowski', 'schwarzschild'] as const)],
  cs_p: ['csPt', pair(-4, 4)], cs_r: ['csR0', num(2.5, 100)], cs_b: ['csBody', id], cs_t: ['csSet', id],
  cs_h: ['csH0', num(20, 120)], cs_m: ['csOm', num(0, 2)], cs_l: ['csOL', num(-1, 2)], cs_o: ['csObj', id], cs_i: ['csTime', oneOf(['conformal', 'cosmic'] as const)],
};

const SURFACE_COMMON = ['m', 'sf', 'uv', 'v'];
const BY_MODULE: Record<ModuleId, string[]> = {
  curves: ['m'],
  metric: SURFACE_COMMON,
  transport: [...SURFACE_COMMON, 'pk', 'la', 'fp'],
  geodesics: [...SURFACE_COMMON, 'gc', 'gs', 'gl'],
  curvature: [...SURFACE_COMMON, 'cr', 'cv'],
  fields: [...SURFACE_COMMON, 'f1', 'f2', 'fb', 'ct'],
  relativity: ['m', 'gv', 'gb', 'go', 'rp', 'ra', 'gB', 'fl', 'sp', 'rt', 'in', 'it', 'cp'],
  spacetime: ['m', 'sv', 'sm', 'sq', 'se', 'sb', 'sr', 'sl', 'so', 'sa', 'wd', 'ws', 'wr'],
  cosmos: ['m', 'cs_v', 'cs_s', 'cs_p', 'cs_r', 'cs_b', 'cs_t', 'cs_h', 'cs_m', 'cs_l', 'cs_o', 'cs_i'],
  limits: ['m'],
  frontiers: ['m'],
};

/* ---------- custom spec ---------- */

const EXPR = /^[0-9A-Za-z_+\-*/^().\s]{0,300}$/;
const TEX = /^[A-Za-z0-9\\{}_^ ]{1,24}$/;
const stripCtl = (s: string) => s.replace(/[\u0000-\u001f\u007f<>]/g, '').slice(0, 60);

const packSpec = (s: CustomSpec): Rec => ({
  n: s.name, md: s.mode === 'graph' ? 'g' : 'p', x: s.x, y: s.y, z: s.z, f: s.f, ur: s.uRange, vr: s.vRange,
  pu: s.periodicU ? 1 : 0, pv: s.periodicV ? 1 : 0, c: s.coords, p: [round(s.params.a), round(s.params.b)],
  ...(s.euler !== undefined ? { e: s.euler } : {}), ...(s.twistU ? { tw: 1 } : {}),
});

function unpackSpec(o: unknown): CustomSpec | undefined {
  if (!o || typeof o !== 'object' || Array.isArray(o)) return undefined;
  const r = o as Rec;
  const expr = (v: unknown) => (typeof v === 'string' && EXPR.test(v) ? v : undefined);
  const range = (v: unknown): [string, string] | undefined => {
    if (!Array.isArray(v) || v.length !== 2) return undefined;
    const a = expr(v[0]), b = expr(v[1]);
    return a === undefined || b === undefined ? undefined : [a, b];
  };
  const x = expr(r.x), y = expr(r.y), z = expr(r.z), f = expr(r.f), ur = range(r.ur), vr = range(r.vr), p = pair(-3, 3)(r.p);
  const c = Array.isArray(r.c) && r.c.length === 2 && r.c.every((q) => typeof q === 'string' && TEX.test(q)) ? (r.c as [string, string]) : undefined;
  if (x === undefined || y === undefined || z === undefined || f === undefined || !ur || !vr || !p || !c) return undefined;
  const euler = r.e === undefined ? undefined : int(-20, 2)(r.e);
  const spec: CustomSpec = {
    name: typeof r.n === 'string' ? stripCtl(r.n) : 'Custom', mode: r.md === 'g' ? 'graph' : 'parametric',
    x, y, z, f, uRange: ur, vRange: vr, periodicU: r.pu === 1, periodicV: r.pv === 1, coords: c, params: { a: p[0], b: p[1] },
    ...(euler !== undefined ? { euler } : {}), ...(r.tw === 1 ? { twistU: true } : {}),
  };
  // re-validate with the real parser, then make sure the surface is drawable (no non-finite samples)
  if (!compileSpec(spec).c) return undefined;
  try { if (validateSurface(makeCustomSurface(spec)).errors.length) return undefined; } catch { return undefined; }
  return spec;
}

/* ---------- base64url JSON ---------- */

const toB64 = (s: string) => {
  const bytes = new TextEncoder().encode(s);
  let bin = '';
  bytes.forEach((b) => { bin += String.fromCharCode(b); });
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = (s: string) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

const roundDeep = (v: unknown): unknown =>
  typeof v === 'number' ? round(v) : Array.isArray(v) ? v.map(roundDeep) : v && typeof v === 'object' ? Object.fromEntries(Object.entries(v).map(([k, x]) => [k, roundDeep(x)])) : v;

/** URL-safe string (base64url of compact JSON) holding the visible configuration of the current module. */
export function encodeShare(state: Partial<AppState> & Pick<AppState, 'module'>): string {
  const out: Rec = {};
  for (const k of BY_MODULE[state.module] ?? ['m']) {
    const [field] = FIELDS[k];
    let v: unknown = state[field];
    if (v === undefined) continue;
    if (field === 'curvShow') { const c = v as AppState['curvShow']; v = (c.heatmap ? 1 : 0) | (c.principal ? 2 : 0) | (c.circle ? 4 : 0); }
    out[k] = roundDeep(v);
  }
  if (out.sf === 'custom' && state.customSpec) out.cs = packSpec(state.customSpec);
  return toB64(JSON.stringify(out));
}

/**
 * Inverse of encodeShare. Never throws: bad input yields {} (or the valid subset).
 * If the result has `customSpec`, the caller should `applyCustomSpec(res.customSpec, false)` before `set(rest)`.
 */
export function decodeShare(s: string): Partial<AppState> {
  if (typeof s !== 'string' || s.length === 0 || s.length > MAX_ENCODED || !/^[A-Za-z0-9_-]+$/.test(s)) return {};
  let raw: unknown;
  try { raw = JSON.parse(fromB64(s)); } catch { return {}; }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const r = raw as Rec;
  const out: Record<string, unknown> = {};
  for (const [k, [field, check]] of Object.entries(FIELDS)) {
    if (!Object.prototype.hasOwnProperty.call(r, k)) continue;
    const v = check(r[k]);
    if (v !== undefined) out[field] = v;
  }
  if (Object.prototype.hasOwnProperty.call(r, 'cs')) {
    const spec = unpackSpec(r.cs);
    if (spec) { out.customSpec = spec; out.surfaceId = 'custom'; }
  }
  if (out.surfaceId === 'custom' && !out.customSpec) delete out.surfaceId; // custom link without a valid spec: keep the user's surface
  // clamp point(s) into the surface's chart domain when it is known
  const sid = out.surfaceId as string | undefined;
  let surf: Surface | undefined;
  if (sid === 'custom') surf = makeCustomSurface(out.customSpec as CustomSpec);
  else if (sid) surf = SURFACES[sid];
  if (surf) {
    const { u, v } = surf.domain;
    const inDom = (p: Vec2): Vec2 => [Math.min(u[1], Math.max(u[0], p[0])), Math.min(v[1], Math.max(v[0], p[1]))];
    if (out.uv) out.uv = inDom(out.uv as Vec2);
    if (out.freePoints) out.freePoints = (out.freePoints as Vec2[]).map(inDom);
  }
  return out as Partial<AppState>;
}

/** `#metric?s=…` → { module, s }; null if the hash is not a share link. Lets the lead keep moduleFromHash for the module part. */
export function parseShareHash(hash: string): { module: ModuleId; s: string } | null {
  const m = /^#([a-z]+)\?s=([A-Za-z0-9_-]+)$/.exec(hash);
  return m && (MODULE_IDS as string[]).includes(m[1]) ? { module: m[1] as ModuleId, s: m[2] } : null;
}
