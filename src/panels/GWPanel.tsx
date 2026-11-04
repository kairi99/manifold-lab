import { useStore } from '../state/store';
import { Tex, fmt } from './Tex';
import { GW150914_PRL, GW150914_GWTC1, GW150914_PARAMS_SOURCES, GW150914_WAVEFORM_SOURCE, type Quantity } from '../data/gw150914';
import { fIsco } from '../math/gw';
import { Note, Seg, Src, Transport, sci } from './SpacetimeUi';
import { GWPlot, ChirpPlot } from './GWPlot';
import { gwDisplay, gwDerived, gwTime, sample, TPL_MAX } from './GWModel';
import { GW150914_H1_TEMPLATE as TPL } from '../data/gw150914';

const q = (v: Quantity, d = 1) => `${fmt(v.value, d)} +${fmt(v.plus, d)} −${fmt(v.minus, d)}`;
const ROWS: [string, keyof typeof GW150914_PRL & keyof typeof GW150914_GWTC1, number, string][] = [
  ['m1 (Msun)', 'm1', 1, ''], ['m2 (Msun)', 'm2', 1, ''], ['final mass (Msun)', 'mFinal', 1, ''], ['final spin', 'spinFinal', 2, ''],
  ['distance (Mpc)', 'distance', 0, ''], ['redshift z', 'z', 2, ''], ['E radiated (Msun c²)', 'energyRadiated', 1, ''],
];

export function GWPanel() {
  const { stProgress: prog, stPlaying: playing, stPol: pol, stAmp: amp, gwDrive: drive, gwSet: pset, gwRawL1: raw } = useStore();
  const set = useStore((s) => s.set);
  const { hPlus, hCross } = gwDisplay(prog, drive, pol, amp);
  const t = gwTime(prog), d = gwDerived(pset);
  const hT = sample(TPL.t, TPL.h, t);
  const f = d.fChirp(t);
  const P = d.P;
  return (
    <div>
      <Seg label="Wave source" value={drive} items={[['mono', 'Monochromatic'], ['gw150914', 'GW150914 template']] as const} onPick={(v) => set({ gwDrive: v, stProgress: 0 })} />
      {drive === 'mono' && <Seg label="Polarisation" value={pol} items={[['plus', '+'], ['cross', '×'], ['circ', 'Circular']] as const} onPick={(v) => set({ stPol: v })} />}
      {drive === 'gw150914' && <Note>Template mode drives the ring with the NR-template strain of H1 as h₊ (polarisation fixed to +), time slowed about 50×.</Note>}
      <label className="field"><span>Display amplitude h = {fmt(amp, 2)} (exaggerated; real strain is ~1e-21)</span>
        <input type="range" min={0.05} max={1.2} step={0.01} value={amp} aria-label="Display amplitude" onChange={(e) => set({ stAmp: +e.target.value })} /></label>
      <Transport playing={playing} progress={prog} set={set} label={drive === 'mono' ? 'wave phase' : 'GW150914 time'} />

      <h2>TT gauge and geodesic deviation</h2>
      <Tex block>{'h_{ij}^{TT}=\\begin{pmatrix}h_+&h_\\times\\\\h_\\times&-h_+\\end{pmatrix}\\cos(\\omega t-kz)'}</Tex>
      <Tex block>{'\\frac{d^2\\xi^i}{dt^2}=\\tfrac12\\,\\ddot h_{ij}\\,\\xi^j,\\qquad \\xi^i(t)\\approx\\big(\\delta^i_j+\\tfrac12 h^i{}_j\\big)\\xi_0^j'}</Tex>
      <div className="readout" aria-label="Strain matrix">
        <span>h<sub>xx</sub> = −h<sub>yy</sub></span><span>{fmt(hPlus, 3)}</span>
        <span>h<sub>xy</sub> = h<sub>yx</sub></span><span>{fmt(hCross, 3)}</span>
        <span>units</span><span>display (real strain ~1e-21)</span>
      </div>
      <Note>Free particles keep their TT coordinates; it is the proper distance g<sub>ij</sub>(t) ξ<sup>i</sup> ξ<sup>j</sup> that oscillates. Ring area is preserved (det = 1) and the pattern is transverse and traceless; × is + rotated by 45°; circular is both with a quarter-period phase shift.</Note>

      <h2>GW150914 strain</h2>
      <GWPlot t={t} rawL1={raw} />
      <label className="check"><input type="checkbox" checked={raw} onChange={(e) => set({ gwRawL1: e.target.checked })} /> Show L1 as recorded (unshifted, not inverted)</label>
      <Note>Blue: measured Hanford strain. Orange: measured Livingston strain; the signal reached L1 about 6.9 ms before H1, and, as in Fig. 1 of the LIGO paper, L1 is shifted by +6.9 ms and inverted (the detectors are nearly anti-aligned) so it overlays H1 (bottom row). Dashed pink: numerical-relativity template for the best-fit parameters, a model, not data. All curves band-passed 35–350 Hz. Source: <Src s={GW150914_WAVEFORM_SOURCE} /></Note>
      <div className="readout">
        <span>t − t<sub>merger</sub></span><span>{fmt(t * 1000, 1)} ms</span>
        <span>template strain</span><span>{fmt(hT, 3)} ×1e-21 (peak {fmt(TPL_MAX, 2)})</span>
        <span>instantaneous f (illustrative)</span><span>{fmt(f, 0)} Hz</span>
      </div>

      <h2>Chirp frequency f(t)</h2>
      <ChirpPlot f={d.fChirp} t={t} />
      <Note>ILLUSTRATIVE merger–ringdown: leading-order inspiral f(τ) ∝ τ<sup>−3/8</sup> until it reaches the Kerr ringdown frequency, then constant. Not a fit to the data or to numerical relativity.</Note>

      <h2>Parameters</h2>
      <Seg label="Parameter set" value={pset} items={[['prl', 'PRL 2016'], ['gwtc1', 'GWTC-1']] as const} onPick={(v) => set({ gwSet: v })} />
      <div role="table" aria-label="GW150914 parameters" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: '2px 8px', fontFamily: 'ui-monospace, monospace', fontSize: 11 }}>
        <b>source frame</b><b>PRL</b><b>GWTC-1</b>
        {ROWS.map(([n, k, dd]) => <span key={k} style={{ display: 'contents' }}><span>{n}</span><span>{q(GW150914_PRL[k] as Quantity, dd)}</span><span>{q(GW150914_GWTC1[k] as Quantity, dd)}</span></span>)}
        <span>chirp mass (Msun)</span><span>(from m1, m2)</span><span>{q(GW150914_GWTC1.chirpMass)}</span>
      </div>
      <Note>Medians with 90% credible intervals. Sources: {GW150914_PARAMS_SOURCES.map((s, i) => <span key={i}>{i ? '; ' : ''}<Src s={s} /></span>)}</Note>

      <h2>Derived ({pset === 'prl' ? 'PRL' : 'GWTC-1'} medians)</h2>
      <Tex block>{'\\mathcal M=\\frac{(m_1m_2)^{3/5}}{(m_1+m_2)^{1/5}},\\quad f_{\\rm ISCO}=\\frac{c^3}{6^{3/2}\\pi G M_{\\rm tot}},\\quad f_{\\rm ring}\\approx\\frac{1.5251-1.1568(1-\\chi)^{0.129}}{2\\pi\\,GM_f/c^3}'}</Tex>
      <div className="readout">
        <span>chirp mass from m1, m2</span><span>{fmt(d.mc, 2)} Msun (source), {fmt(d.mc * (1 + d.z), 2)} (detector)</span>
        <span>total mass</span><span>{fmt(d.mTot, 1)} Msun</span>
        <span>f<sub>ISCO</sub> (inspiral ends)</span><span>{fmt(fIsco(d.mTot), 0)} Hz source, {fmt(fIsco(d.mTot * (1 + d.z)), 0)} Hz observed</span>
        <span>ringdown f<sub>220</sub></span><span>{fmt(d.qnm.f, 0)} Hz (observed frame)</span>
        <span>ringdown damping τ</span><span>{fmt(d.qnm.tauDamp * 1000, 2)} ms, Q = {fmt(d.qnm.q, 2)}</span>
        <span>peak strain</span><span>{sci(GW150914_PRL.peakStrain)}</span>
      </div>
      <Note>Ringdown uses the remnant mass and spin ({fmt(P.mFinal.value, 1)} Msun, χ = {fmt(P.spinFinal.value, 2)}), redshifted by 1+z = {fmt(1 + d.z, 2)}.</Note>
    </div>
  );
}
