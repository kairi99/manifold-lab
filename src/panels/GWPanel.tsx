import { useStore } from '../state/store';
import { Tex, fmt } from './Tex';
import { T, useTr, useLang } from '../i18n';
import { GW150914_PRL, GW150914_GWTC1, GW150914_PARAMS_SOURCES, GW150914_WAVEFORM_SOURCE, type Quantity } from '../data/gw150914';
import { fIsco } from '../math/gw';
import { Note, Seg, Src, Transport, sci } from './SpacetimeUi';
import { GWPlot, ChirpPlot } from './GWPlot';
import { gwDisplay, gwDerived, gwTime, sample, TPL_MAX } from './GWModel';
import { GW150914_H1_TEMPLATE as TPL } from '../data/gw150914';

const q = (v: Quantity, d = 1) => `${fmt(v.value, d)} +${fmt(v.plus, d)} −${fmt(v.minus, d)}`;
const ROWS: [string, keyof typeof GW150914_PRL & keyof typeof GW150914_GWTC1, number, string][] = [
  ['m1 (Msun)', 'm1', 1, 'm1 (Msun)'], ['m2 (Msun)', 'm2', 1, 'm2 (Msun)'], ['final mass (Msun)', 'mFinal', 1, 'masa final (Msun)'], ['final spin', 'spinFinal', 2, 'espín final'],
  ['distance (Mpc)', 'distance', 0, 'distancia (Mpc)'], ['redshift z', 'z', 2, 'desplazamiento al rojo z'], ['E radiated (Msun c²)', 'energyRadiated', 1, 'E radiada (Msun c²)'],
];

export function GWPanel() {
  const { stProgress: prog, stPlaying: playing, stPol: pol, stAmp: amp, gwDrive: drive, gwSet: pset, gwRawL1: raw } = useStore();
  const set = useStore((s) => s.set);
  const { hPlus, hCross } = gwDisplay(prog, drive, pol, amp);
  const t = gwTime(prog), d = gwDerived(pset);
  const hT = sample(TPL.t, TPL.h, t);
  const f = d.fChirp(t);
  const P = d.P;
  const tt = useTr(), lang = useLang();
  return (
    <div>
      <Seg label={tt('Wave source', 'Fuente de la onda')} value={drive} items={[['mono', tt('Monochromatic', 'Monocromática')], ['gw150914', tt('GW150914 template', 'Plantilla GW150914')]] as const} onPick={(v) => set({ gwDrive: v, stProgress: 0 })} />
      {drive === 'mono' && <Seg label={tt('Polarisation', 'Polarización')} value={pol} items={[['plus', '+'], ['cross', '×'], ['circ', 'Circular']] as const} onPick={(v) => set({ stPol: v })} />}
      {drive === 'gw150914' && <Note>{tt('Template mode drives the ring with the NR-template strain of H1 as h₊ (polarisation fixed to +), time slowed about 50×.', 'El modo plantilla mueve el anillo con la deformación de la plantilla de RN de H1 como h₊ (polarización fija en +), con el tiempo ralentizado unas 50×.')}</Note>}
      <label className="field"><span>{tt('Display amplitude', 'Amplitud mostrada')} h = {fmt(amp, 2)} {tt('(exaggerated; real strain is ~1e-21)', '(exagerada; la deformación real es ~1e-21)')}</span>
        <input type="range" min={0.05} max={1.2} step={0.01} value={amp} aria-label={tt('Display amplitude', 'Amplitud mostrada')} onChange={(e) => set({ stAmp: +e.target.value })} /></label>
      <Transport playing={playing} progress={prog} set={set} label={drive === 'mono' ? tt('wave phase', 'fase de la onda') : tt('GW150914 time', 'tiempo de GW150914')} />

      <h2>{tt('TT gauge and geodesic deviation', 'Gauge TT y desviación geodésica')}</h2>
      <Tex block>{'h_{ij}^{TT}=\\begin{pmatrix}h_+&h_\\times\\\\h_\\times&-h_+\\end{pmatrix}\\cos(\\omega t-kz)'}</Tex>
      <Tex block>{'\\frac{d^2\\xi^i}{dt^2}=\\tfrac12\\,\\ddot h_{ij}\\,\\xi^j,\\qquad \\xi^i(t)\\approx\\big(\\delta^i_j+\\tfrac12 h^i{}_j\\big)\\xi_0^j'}</Tex>
      <div className="readout" aria-label={tt('Strain matrix', 'Matriz de deformación')}>
        <span>h<sub>xx</sub> = −h<sub>yy</sub></span><span>{fmt(hPlus, 3)}</span>
        <span>h<sub>xy</sub> = h<sub>yx</sub></span><span>{fmt(hCross, 3)}</span>
        <span>{tt('units', 'unidades')}</span><span>{tt('display (real strain ~1e-21)', 'de visualización (deformación real ~1e-21)')}</span>
      </div>
      <Note><T en={<>Free particles keep their TT coordinates; it is the proper distance g<sub>ij</sub>(t) ξ<sup>i</sup> ξ<sup>j</sup> that oscillates. Ring area is preserved (det = 1) and the pattern is transverse and traceless; × is + rotated by 45°; circular is both with a quarter-period phase shift.</>} es={<>Las partículas libres conservan sus coordenadas TT; lo que oscila es la distancia propia g<sub>ij</sub>(t) ξ<sup>i</sup> ξ<sup>j</sup>. El área del anillo se conserva (det = 1) y el patrón es transversal y sin traza; × es + girado 45°; la circular combina ambas con un desfase de un cuarto de periodo.</>} /></Note>

      <h2>{tt('GW150914 strain', 'Deformación de GW150914')}</h2>
      <GWPlot t={t} rawL1={raw} />
      <label className="check"><input type="checkbox" checked={raw} onChange={(e) => set({ gwRawL1: e.target.checked })} /> {tt('Show L1 as recorded (unshifted, not inverted)', 'Mostrar L1 tal como se registró (sin desplazar ni invertir)')}</label>
      <Note><T en={<>Blue: measured Hanford strain. Orange: measured Livingston strain; the signal reached L1 about 6.9 ms before H1, and, as in Fig. 1 of the LIGO paper, L1 is shifted by +6.9 ms and inverted (the detectors are nearly anti-aligned) so it overlays H1 (bottom row). Dashed pink: numerical-relativity template for the best-fit parameters, a model, not data. All curves band-passed 35–350 Hz. Source: </>} es={<>Azul: deformación medida en Hanford. Naranja: deformación medida en Livingston; la señal llegó a L1 unos 6.9 ms antes que a H1 y, como en la Fig. 1 del artículo de LIGO, L1 se desplaza +6.9 ms y se invierte (los detectores están casi antialineados) para superponerla a H1 (fila inferior). Rosa discontinuo: plantilla de relatividad numérica para los parámetros de mejor ajuste, un modelo, no datos. Todas las curvas filtradas en 35–350 Hz. Fuente: </>} /><Src s={GW150914_WAVEFORM_SOURCE} /></Note>
      <div className="readout">
        <span>t − t<sub>merger</sub></span><span>{fmt(t * 1000, 1)} ms</span>
        <span>{tt('template strain', 'deformación de la plantilla')}</span><span>{fmt(hT, 3)} ×1e-21 ({tt('peak', 'pico')} {fmt(TPL_MAX, 2)})</span>
        <span>{tt('instantaneous f (illustrative)', 'f instantánea (ilustrativa)')}</span><span>{fmt(f, 0)} Hz</span>
      </div>

      <h2>{tt('Chirp frequency f(t)', 'Frecuencia de chirp f(t)')}</h2>
      <ChirpPlot f={d.fChirp} t={t} />
      <Note><T en={<>ILLUSTRATIVE merger–ringdown: leading-order inspiral f(τ) ∝ τ<sup>−3/8</sup> until it reaches the Kerr ringdown frequency, then constant. Not a fit to the data or to numerical relativity.</>} es={<>Fusión y ringdown ILUSTRATIVOS: espiral de orden dominante f(τ) ∝ τ<sup>−3/8</sup> hasta alcanzar la frecuencia de ringdown de Kerr, y luego constante. No es un ajuste a los datos ni a la relatividad numérica.</>} /></Note>

      <h2>{tt('Parameters', 'Parámetros')}</h2>
      <Seg label={tt('Parameter set', 'Conjunto de parámetros')} value={pset} items={[['prl', 'PRL 2016'], ['gwtc1', 'GWTC-1']] as const} onPick={(v) => set({ gwSet: v })} />
      <div role="table" aria-label={tt('GW150914 parameters', 'Parámetros de GW150914')} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '2px 8px', fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>
        <b>{tt('source frame', 'sistema de la fuente')}</b><b>PRL</b><b>GWTC-1</b>
        {ROWS.map(([n, k, dd, nEs]) => <span key={k} style={{ display: 'contents' }}><span>{lang === 'es' ? nEs : n}</span><span>{q(GW150914_PRL[k] as Quantity, dd)}</span><span>{q(GW150914_GWTC1[k] as Quantity, dd)}</span></span>)}
        <span>{tt('chirp mass (Msun)', 'masa de chirp (Msun)')}</span><span>{tt('(from m1, m2)', '(de m1, m2)')}</span><span>{q(GW150914_GWTC1.chirpMass)}</span>
      </div>
      <Note>{tt('Medians with 90% credible intervals. Sources: ', 'Medianas con intervalos de credibilidad del 90%. Fuentes: ')}{GW150914_PARAMS_SOURCES.map((s, i) => <span key={i}>{i ? '; ' : ''}<Src s={s} /></span>)}</Note>

      <h2>{tt('Derived', 'Derivados')} ({tt('medians', 'medianas')} {pset === 'prl' ? 'PRL' : 'GWTC-1'})</h2>
      <Tex block>{'\\mathcal M=\\frac{(m_1m_2)^{3/5}}{(m_1+m_2)^{1/5}},\\quad f_{\\rm ISCO}=\\frac{c^3}{6^{3/2}\\pi G M_{\\rm tot}},\\quad f_{\\rm ring}\\approx\\frac{1.5251-1.1568(1-\\chi)^{0.129}}{2\\pi\\,GM_f/c^3}'}</Tex>
      <div className="readout">
        <span>{tt('chirp mass from m1, m2', 'masa de chirp de m1, m2')}</span><span>{fmt(d.mc, 2)} Msun ({tt('source', 'fuente')}), {fmt(d.mc * (1 + d.z), 2)} ({tt('detector', 'detector')})</span>
        <span>{tt('total mass', 'masa total')}</span><span>{fmt(d.mTot, 1)} Msun</span>
        <span>f<sub>ISCO</sub> ({tt('inspiral ends', 'fin de la espiral')})</span><span>{fmt(fIsco(d.mTot), 0)} Hz {tt('source', 'fuente')}, {fmt(fIsco(d.mTot * (1 + d.z)), 0)} Hz {tt('observed', 'observada')}</span>
        <span>ringdown f<sub>220</sub></span><span>{fmt(d.qnm.f, 0)} Hz ({tt('observed frame', 'sistema observado')})</span>
        <span>{tt('ringdown damping τ', 'amortiguamiento del ringdown τ')}</span><span>{fmt(d.qnm.tauDamp * 1000, 2)} ms, Q = {fmt(d.qnm.q, 2)}</span>
        <span>{tt('peak strain', 'deformación de pico')}</span><span>{sci(GW150914_PRL.peakStrain)}</span>
      </div>
      <Note><T en={<>Ringdown uses the remnant mass and spin ({fmt(P.mFinal.value, 1)} Msun, χ = {fmt(P.spinFinal.value, 2)}), redshifted by 1+z = {fmt(1 + d.z, 2)}.</>} es={<>El ringdown usa la masa y el espín del remanente ({fmt(P.mFinal.value, 1)} Msun, χ = {fmt(P.spinFinal.value, 2)}), desplazados al rojo por 1+z = {fmt(1 + d.z, 2)}.</>} /></Note>
    </div>
  );
}
