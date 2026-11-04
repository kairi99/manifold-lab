import { useMemo } from 'react';
import { useStore } from '../state/store';
import { Label } from './Label';
import { CosmoLine, apply, type P2, type Xf } from './CosmoLine';
import { diagramFor, objById, useCosmoParams, validity } from '../panels/CosmoModel';
import { age, comovingDistance, mpcToGly } from '../math/cosmology';
import { useTr } from '../i18n';

export const COSMO_COLORS = { observer: '#ffffff', cone: '#ffd24a', particle: '#6cb6ff', event: '#ff8a8a', hubble: '#5fe08a', galaxy: '#8a8f98', pick: '#ff4fd8' };
const W = 4.2, H = 2.3, OX = 0.2;

const niceStep = (range: number) => { const raw = range / 5, p = 10 ** Math.floor(Math.log10(raw)); return [1, 2, 5, 10].map((m) => m * p).find((s) => s >= raw)!; };
/** Points inside the plot box (the curves are monotone, so the kept points form one run). */
const clip = (pts: P2[], xMax: number, yTop: number): P2[] => pts.filter((p) => Math.abs(p[0]) <= xMax && p[1] <= yTop);
const mirror = (pts: P2[]): P2[] => pts.map(([x, y]) => [-x, y]);

export function CosmoScene() {
  const p = useCosmoParams(), time = useStore((s) => s.csTime), objId = useStore((s) => s.csObj);
  const t = useTr();
  const bad = validity(p);
  const d = useMemo(() => (bad ? null : diagramFor(p, time)), [p.H0, p.Om, p.Or, p.OL, time, bad]); // eslint-disable-line react-hooks/exhaustive-deps
  const obj = objById(objId);
  const geo = useMemo(() => {
    if (!d) return null;
    const eta0 = d.particleHorizon.find((q) => q[1] >= d.now[1] - 1e-9)?.[0] ?? d.now[1]; // comoving particle horizon today
    const xMax = 1.35 * eta0;
    const yTop = time === 'conformal' ? 1.4 * d.now[1] : 2.5 * d.now[1];
    const sx = W / (2 * xMax), sy = time === 'conformal' ? sx : H / yTop;
    return { xMax, yTop, xf: { sx, sy, ox: OX, oy: -(sy * yTop) / 2 } as Xf };
  }, [d, time]);
  if (!d || !geo) return null;
  const { xMax, yTop, xf } = geo;
  const c = (pts: P2[]) => clip(pts, xMax, yTop);
  const both = (pts: P2[]) => [c(pts), c(mirror(pts))];
  const dCg = mpcToGly(comovingDistance(obj.z, p));
  const yEm = time === 'conformal' ? d.now[1] - dCg : age(obj.z, p);
  const nowY = d.now[1];
  const xs = niceStep(xMax), ys = niceStep(yTop);
  const xTicks = Array.from({ length: Math.floor(xMax / xs) * 2 + 1 }, (_, i) => (i - Math.floor(xMax / xs)) * xs);
  const yTicks = Array.from({ length: Math.floor(yTop / ys) + 1 }, (_, i) => i * ys);
  const L = (x: number, y: number): [number, number, number] => apply(xf, [x, y]);
  const ph = d.particleHorizon, lc = d.lightCone;
  const labelPt = (pts: P2[], yy: number): P2 | undefined => c(pts).reduce<P2 | undefined>((best, q) => (!best || Math.abs(q[1] - yy) < Math.abs(best[1] - yy) ? q : best), undefined);
  const phL = labelPt(ph, yTop * 0.8), ehL = labelPt(d.eventHorizon, yTop * 0.9), hsL = labelPt(d.hubbleSphere, yTop * 0.55), lcL = labelPt(lc, nowY * 0.35);
  return (
    <group>
      {/* axes and ticks */}
      <CosmoLine pts={[[-xMax, 0], [xMax, 0]]} xf={xf} color="#8a8f98" width={1} />
      <CosmoLine pts={[[-xMax, 0], [-xMax, yTop]]} xf={xf} color="#8a8f98" width={1} />
      {xTicks.map((x) => <Label key={`x${x}`} text={`${Math.abs(x)}`} position={L(x, 0).map((v, i) => (i === 1 ? v - 0.09 : v)) as [number, number, number]} height={0.12} color="#b8bcc4" />)}
      {yTicks.map((y) => <Label key={`y${y}`} text={`${y}`} position={L(-xMax, y).map((v, i) => (i === 0 ? v - 0.13 : v)) as [number, number, number]} height={0.12} color="#b8bcc4" />)}
      <Label text={t('comoving distance (Gly)', 'distancia comóvil (Gly)')} position={L(0, 0).map((v, i) => (i === 1 ? v - 0.24 : v)) as [number, number, number]} height={0.13} color="#e6e6e6" />
      <Label text={time === 'conformal' ? t('conformal time cη (Gly)', 'tiempo conforme cη (Gly)') : t('cosmic time t (Gyr)', 'tiempo cósmico t (Gyr)')} position={[OX - W / 2 + 0.95, L(0, yTop)[1] + 0.14, 0]} height={0.13} color="#e6e6e6" />
      <CosmoLine pts={[[-xMax, nowY], [xMax, nowY]]} xf={xf} color="#8a8f98" width={1} dashed />
      <Label text={t('now', 'hoy')} position={L(xMax - 0.05 / xf.sx, nowY).map((v, i) => (i === 1 ? v + 0.07 : i === 0 ? v - 0.1 : v)) as [number, number, number]} height={0.12} color="#b8bcc4" />
      {/* galaxy worldlines */}
      {d.galaxies.map((g) => <CosmoLine key={g.z} pts={c(g.pts)} xf={xf} color={g.z === obj.z ? COSMO_COLORS.pick : COSMO_COLORS.galaxy} width={g.z === obj.z ? 2.5 : 1} opacity={g.z === obj.z ? 1 : 0.6} />)}
      {d.galaxies.map((g) => g.z === obj.z ? null : <CosmoLine key={`m${g.z}`} pts={c(mirror(g.pts))} xf={xf} color={COSMO_COLORS.galaxy} width={1} opacity={0.6} />)}
      {/* horizons, cone, observer */}
      {both(ph).map((l, i) => <CosmoLine key={`p${i}`} pts={l} xf={xf} color={COSMO_COLORS.particle} width={2} />)}
      {both(d.eventHorizon).map((l, i) => <CosmoLine key={`e${i}`} pts={l} xf={xf} color={COSMO_COLORS.event} width={2} />)}
      {both(d.hubbleSphere).map((l, i) => <CosmoLine key={`h${i}`} pts={l} xf={xf} color={COSMO_COLORS.hubble} width={2} dashed />)}
      {both(lc).map((l, i) => <CosmoLine key={`l${i}`} pts={l} xf={xf} color={COSMO_COLORS.cone} width={2.5} />)}
      <CosmoLine pts={c(d.observer)} xf={xf} color={COSMO_COLORS.observer} width={2.5} />
      {/* labels along curves */}
      {phL && <Label text={t('particle horizon', 'horizonte de partículas')} position={L(phL[0] - 0.4 / xf.sx, phL[1])} height={0.13} color={COSMO_COLORS.particle} />}
      {ehL && <Label text={t('event horizon', 'horizonte de sucesos')} position={L(ehL[0] + 0.45 / xf.sx, ehL[1])} height={0.13} color={COSMO_COLORS.event} />}
      {hsL && <Label text={t('Hubble sphere', 'esfera de Hubble')} position={L(hsL[0] + 0.45 / xf.sx, hsL[1])} height={0.13} color={COSMO_COLORS.hubble} />}
      {lcL && <Label text={t('past light cone', 'cono de luz pasado')} position={L(-lcL[0] - 0.42 / xf.sx, lcL[1])} height={0.13} color={COSMO_COLORS.cone} />}
      <Label text={t('observer', 'observador')} position={L(0.0, yTop + 0.0 / xf.sy).map((v, i) => (i === 1 ? v + 0.12 : v)) as [number, number, number]} height={0.13} color="#ffffff" />
      {/* selected object's emission event */}
      {yEm > 0 && yEm < yTop && dCg < xMax && (
        <>
          <mesh position={L(dCg, yEm)}><sphereGeometry args={[0.05, 16, 12]} /><meshBasicMaterial color={COSMO_COLORS.pick} /></mesh>
          <Label text={`${obj.name} (z = ${obj.z})`} position={L(dCg, yEm).map((v, i) => (i === 1 ? v + 0.12 : v)) as [number, number, number]} height={0.13} color={COSMO_COLORS.pick} />
        </>
      )}
      <mesh position={L(0, nowY)}><sphereGeometry args={[0.045, 16, 12]} /><meshBasicMaterial color="#ffffff" /></mesh>
    </group>
  );
}
