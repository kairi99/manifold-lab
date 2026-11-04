import { SurfacePicker } from '../panels/SurfacePicker';
import { Tex, fmt, coordText } from '../panels/Tex';
import { divergence, lieBracket, lieDerivativeMetric, flowCommutator, EULER_CHARACTERISTIC } from '../math/fields';
import { FieldsScene, indexLabel, useFieldSel, zeroIndices } from '../scene/FieldScene';
import { useStore } from '../state/store';

export { FieldsScene };

const pmatrix = (m: number[][]) =>
  String.raw`\begin{pmatrix}${m.map((r) => r.map((x) => fmt(x, 3)).join(' & ')).join(String.raw` \\ `)}\end{pmatrix}`;

export function FieldsPanel() {
  const { surface: s, all, X, Y } = useFieldSel();
  const { surfaceId, uv, fieldId, fieldId2, showFibers, flowPlaying, commT, set } = useStore();
  const [cu, cv] = s.coords;
  const xv = X.X(uv[0], uv[1]);
  const g = s.metric(uv[0], uv[1]);
  const len = Math.sqrt(xv[0] * (g[0][0] * xv[0] + g[0][1] * xv[1]) + xv[1] * (g[1][0] * xv[0] + g[1][1] * xv[1]));
  const div = divergence(s, X, uv[0], uv[1]);
  const L = lieDerivativeMetric(s, X, uv[0], uv[1]);
  const killingHere = Math.abs(L[0][0]) + Math.abs(L[0][1]) + Math.abs(L[1][1]) < 1e-6;

  const ind = zeroIndices(s, X);
  const sum = ind.reduce((a, b) => a + b, 0);
  const chi = EULER_CHARACTERISTIC[surfaceId] ?? null;
  const br = Y ? lieBracket(X, Y, uv[0], uv[1]) : null;
  const gap = Y ? flowCommutator(s, X, Y, uv, commT).gap : null;
  const select = (value: string, key: 'fieldId' | 'fieldId2', none = false) => (
    <select value={value} onChange={(e) => set({ [key]: e.target.value })}>
      {none && <option value="">none</option>}
      {all.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
    </select>
  );

  return (
    <div>
      <SurfacePicker />
      <label className="field"><span>Field X</span>{select(fieldId || all[0]!.id, 'fieldId')}</label>
      <label className="field"><span>Field Y (for the bracket)</span>{select(fieldId2, 'fieldId2', true)}</label>
      <label className="check"><input type="checkbox" checked={showFibers} onChange={(e) => set({ showFibers: e.target.checked })} /> show fibres <Tex>{"T_qM"}</Tex></label>
      <label className="check"><input type="checkbox" checked={flowPlaying} onChange={(e) => set({ flowPlaying: e.target.checked })} /> animate the flow</label>

      <h2>Tangent bundle</h2>
      <p>
        The tangent bundle <Tex>{String.raw`TM=\bigsqcup_p T_pM`}</Tex> glues all tangent planes into one space with projection <Tex>{String.raw`\pi:TM\to M`}</Tex>.
        A vector field is a section <Tex>{String.raw`X:M\to TM`}</Tex> with <Tex>{String.raw`\pi\circ X=\mathrm{id}`}</Tex>: one vector chosen in each fibre.
        The translucent discs are the fibres <Tex>{String.raw`T_qM\cong\mathbb R^2`}</Tex>; the particles follow the flow <Tex>{String.raw`\varphi_t`}</Tex>.
      </p>

      <h2>Field and values at p</h2>
      <Tex block>{X.latex}</Tex>
      <div className="readout">
        <span>X^{coordText(cu)}</span><span>{fmt(xv[0])}</span>
        <span>X^{coordText(cv)}</span><span>{fmt(xv[1])}</span>
        <span>|X|_g</span><span>{fmt(len)}</span>
        <span>div X</span><span>{fmt(div)}</span>
      </div>
      <Tex block>{String.raw`(\mathcal L_X g)_{ij}=${pmatrix(L)}`}</Tex>
      <p>{killingHere ? '✓ Killing at p' : '✗ not Killing at p'}{X.killing ? ' (Killing everywhere)' : ''}. Killing fields (<Tex>{String.raw`\mathcal L_Xg=0`}</Tex>) generate isometries: their flows preserve g. By Noether, each gives a conserved quantity along geodesics (see Clairaut in the geodesics module).</p>

      <h2 data-tour="poincare-hopf">Poincar&eacute;&ndash;Hopf</h2>
      {X.zeros.length === 0 ? <p>No zeros.</p> : (
        <table className="readout" style={{ display: 'table' }}>
          <tbody>{X.zeros.map((z, k) => <tr key={k}><td>{z.name}</td><td>{indexLabel(ind[k])}</td></tr>)}</tbody>
        </table>
      )}
      <div className="readout">
        <span>&Sigma; ind</span><span>{sum}</span>
        <span>&chi;(M)</span><span>{chi ?? 'n/a'}</span>
      </div>
      {chi !== null ? (
        <p><Tex>{String.raw`\sum_i \operatorname{ind}_{p_i}X=\chi(M)`}</Tex>: here {sum} = {chi}. Hairy ball: the sphere (&chi;=2&ne;0) has no nowhere-vanishing field, while the torus (&chi;=0) does: <Tex>{String.raw`\partial_u`}</Tex>.</p>
      ) : (
        <p>This graph is non-compact (with boundary), so the theorem does not apply as stated; the shown zeros need not sum to anything.</p>
      )}

      <h2>Lie bracket</h2>
      {!Y || !br || !gap ? <p>Choose a second field Y to see <Tex>{String.raw`[X,Y]`}</Tex> and the flow commutator.</p> : (
        <>
          <Tex block>{String.raw`[X,Y]^k=X^i\partial_iY^k-Y^i\partial_iX^k=(${fmt(br[0])},\ ${fmt(br[1])})`}</Tex>
          <label className="field">
            <span>t = {fmt(commT, 2)}</span>
            <input type="range" min={0.02} max={0.6} step={0.01} value={commT} onChange={(e) => set({ commT: +e.target.value })} />
          </label>
          <div className="readout">
            <span>gap</span><span>({fmt(gap[0], 4)}, {fmt(gap[1], 4)})</span>
            <span>gap / t&sup2;</span><span>({fmt(gap[0] / commT ** 2)}, {fmt(gap[1] / commT ** 2)})</span>
            <span>[X,Y]</span><span>({fmt(br[0])}, {fmt(br[1])})</span>
          </div>
          <p>Flow along X, Y, &minus;X, &minus;Y for time t. The parallelogram fails to close by about <Tex>{String.raw`t^2[X,Y]`}</Tex> (magenta arrow): the flows commute iff the bracket vanishes.</p>
          {surfaceId === 'sphere' && <p>On the sphere <Tex>{String.raw`[L_x,L_y]=-L_z`}</Tex> and cyclic (chart frame, z = polar axis): the Lie algebra <Tex>{String.raw`\mathfrak{so}(3)`}</Tex>; with <Tex>{String.raw`\hat L_i=-i\hbar L_i`}</Tex> it becomes the angular-momentum algebra <Tex>{String.raw`[\hat L_x,\hat L_y]=i\hbar\hat L_z`}</Tex>.</p>}
        </>
      )}
    </div>
  );
}
