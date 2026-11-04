import { SurfacePicker } from '../panels/SurfacePicker';
import { Tex, fmt, coordText } from '../panels/Tex';
import { divergence, lieBracket, lieDerivativeMetric, flowCommutator, EULER_CHARACTERISTIC } from '../math/fields';
import { FieldsScene, indexLabel, useFieldSel, zeroIndices } from '../scene/FieldScene';
import { useStore } from '../state/store';
import { T, useTr } from '../i18n';

export { FieldsScene };

const pmatrix = (m: number[][]) =>
  String.raw`\begin{pmatrix}${m.map((r) => r.map((x) => fmt(x, 3)).join(' & ')).join(String.raw` \\ `)}\end{pmatrix}`;

export function FieldsPanel() {
  const t = useTr();
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
      {none && <option value="">{t('none', 'ninguno')}</option>}
      {all.map((f) => <option key={f.id} value={f.id}>{t(f.name, f.nameEs ?? f.name)}</option>)}
    </select>
  );

  return (
    <div>
      <SurfacePicker />
      <label className="field"><span>{t('Field X', 'Campo X')}</span>{select(fieldId || all[0]!.id, 'fieldId')}</label>
      <label className="field"><span>{t('Field Y (for the bracket)', 'Campo Y (para el corchete)')}</span>{select(fieldId2, 'fieldId2', true)}</label>
      <label className="check"><input type="checkbox" checked={showFibers} onChange={(e) => set({ showFibers: e.target.checked })} /> <T en={<>show fibres <Tex>{"T_qM"}</Tex></>} es={<>mostrar fibras <Tex>{"T_qM"}</Tex></>} /></label>
      <label className="check"><input type="checkbox" checked={flowPlaying} onChange={(e) => set({ flowPlaying: e.target.checked })} /> {t('animate the flow', 'animar el flujo')}</label>

      <h2><T en="Tangent bundle" es="Fibrado tangente" /></h2>
      <p><T
        en={<>
          The tangent bundle <Tex>{String.raw`TM=\bigsqcup_p T_pM`}</Tex> glues all tangent planes into one space with projection <Tex>{String.raw`\pi:TM\to M`}</Tex>.
          A vector field is a section <Tex>{String.raw`X:M\to TM`}</Tex> with <Tex>{String.raw`\pi\circ X=\mathrm{id}`}</Tex>: one vector chosen in each fibre.
          The translucent discs are the fibres <Tex>{String.raw`T_qM\cong\mathbb R^2`}</Tex>; the particles follow the flow <Tex>{String.raw`\varphi_t`}</Tex>.
        </>}
        es={<>
          El fibrado tangente <Tex>{String.raw`TM=\bigsqcup_p T_pM`}</Tex> reúne todos los planos tangentes en un único espacio con la proyección <Tex>{String.raw`\pi:TM\to M`}</Tex>.
          Un campo vectorial es una sección <Tex>{String.raw`X:M\to TM`}</Tex> con <Tex>{String.raw`\pi\circ X=\mathrm{id}`}</Tex>: un vector elegido en cada fibra.
          Los discos translúcidos son las fibras <Tex>{String.raw`T_qM\cong\mathbb R^2`}</Tex>; las partículas siguen el flujo <Tex>{String.raw`\varphi_t`}</Tex>.
        </>} /></p>

      <h2><T en="Field and values at p" es="Campo y valores en p" /></h2>
      <Tex block>{X.latex}</Tex>
      <div className="readout">
        <span>X<sup>{coordText(cu)}</sup></span><span>{fmt(xv[0])}</span>
        <span>X<sup>{coordText(cv)}</sup></span><span>{fmt(xv[1])}</span>
        <span>|X|<sub>g</sub></span><span>{fmt(len)}</span>
        <span>div X</span><span>{fmt(div)}</span>
      </div>
      <Tex block>{String.raw`(\mathcal L_X g)_{ij}=${pmatrix(L)}`}</Tex>
      <p>{killingHere ? t('✓ Killing at p', '✓ Killing en p') : t('✗ not Killing at p', '✗ no es Killing en p')}{X.killing ? t(' (Killing everywhere)', ' (Killing en todas partes)') : ''}. <T
        en={<>Killing fields (<Tex>{String.raw`\mathcal L_Xg=0`}</Tex>) generate isometries: their flows preserve g. By Noether, each gives a conserved quantity along geodesics (see Clairaut in the geodesics module).</>}
        es={<>Los campos de Killing (<Tex>{String.raw`\mathcal L_Xg=0`}</Tex>) generan isometrías: sus flujos preservan g. Por Noether, cada uno da una cantidad conservada a lo largo de las geodésicas (véase Clairaut en el módulo de geodésicas).</>} /></p>

      <h2 data-tour="poincare-hopf">Poincar&eacute;&ndash;Hopf</h2>
      {X.zeros.length === 0 ? <p>{t('No zeros.', 'Sin ceros.')}</p> : (
        <table className="readout" style={{ display: 'table' }}>
          <tbody>{X.zeros.map((z, k) => <tr key={k}><td>{t(z.name, z.nameEs ?? z.name)}</td><td>{t(indexLabel(ind[k]), indexLabel(ind[k], true))}</td></tr>)}</tbody>
        </table>
      )}
      <div className="readout">
        <span>&Sigma; {t('ind', 'índ')}</span><span>{sum}</span>
        <span>&chi;(M)</span><span>{chi ?? t('n/a', 'n/d')}</span>
      </div>
      {chi !== null ? (
        <p><T
          en={<><Tex>{String.raw`\sum_i \operatorname{ind}_{p_i}X=\chi(M)`}</Tex>: here {sum} = {chi}. Hairy ball: the sphere (&chi;=2&ne;0) has no nowhere-vanishing field, while the torus (&chi;=0) does: <Tex>{String.raw`\partial_u`}</Tex>.</>}
          es={<><Tex>{String.raw`\sum_i \operatorname{ind}_{p_i}X=\chi(M)`}</Tex>: aquí {sum} = {chi}. Teorema de la bola peluda: la esfera (&chi;=2&ne;0) no admite ningún campo sin ceros, mientras que el toro (&chi;=0) sí: <Tex>{String.raw`\partial_u`}</Tex>.</>} /></p>
      ) : surfaceId === 'custom' ? (
        <p><T
          en={<>Poincar&eacute;&ndash;Hopf needs a closed surface and <em>all</em> zeros of X. For a custom surface the zeros are not searched for (only the chart-centre zero of the rotation field is listed), so there is no &chi; check here. Use the sphere or torus to see the theorem at work.</>}
          es={<>Poincar&eacute;&ndash;Hopf necesita una superficie cerrada y <em>todos</em> los ceros de X. En una superficie personalizada no se buscan los ceros (solo se muestra el cero del campo de rotación en el centro de la carta), así que aquí no hay comprobación de &chi;. Usa la esfera o el toro para ver el teorema en acción.</>} /></p>
      ) : (
        <p>{t('This graph is non-compact (with boundary), so the theorem does not apply as stated; the shown zeros need not sum to anything.', 'Esta gráfica no es compacta (tiene borde), así que el teorema no se aplica tal como está enunciado; los ceros mostrados no tienen por qué sumar nada concreto.')}</p>
      )}

      <h2><T en="Lie bracket" es="Corchete de Lie" /></h2>
      {!Y || !br || !gap ? <p><T en={<>Choose a second field Y to see <Tex>{String.raw`[X,Y]`}</Tex> and the flow commutator.</>} es={<>Elige un segundo campo Y para ver <Tex>{String.raw`[X,Y]`}</Tex> y el conmutador de flujos.</>} /></p> : (
        <>
          <Tex block>{String.raw`[X,Y]^k=X^i\partial_iY^k-Y^i\partial_iX^k=(${fmt(br[0])},\ ${fmt(br[1])})`}</Tex>
          <label className="field">
            <span>t = {fmt(commT, 2)}</span>
            <input type="range" min={0.02} max={0.6} step={0.01} value={commT} onChange={(e) => set({ commT: +e.target.value })} />
          </label>
          <div className="readout">
            <span>{t('gap', 'brecha')}</span><span>({fmt(gap[0], 4)}, {fmt(gap[1], 4)})</span>
            <span>gap / t&sup2;</span><span>({fmt(gap[0] / commT ** 2)}, {fmt(gap[1] / commT ** 2)})</span>
            <span>[X,Y]</span><span>({fmt(br[0])}, {fmt(br[1])})</span>
          </div>
          <p><T
            en={<>Flow along X, Y, &minus;X, &minus;Y for time t. The parallelogram fails to close by about <Tex>{String.raw`t^2[X,Y]`}</Tex> (magenta arrow): the flows commute iff the bracket vanishes.</>}
            es={<>Fluye a lo largo de X, Y, &minus;X, &minus;Y durante un tiempo t. El paralelogramo no llega a cerrarse en unos <Tex>{String.raw`t^2[X,Y]`}</Tex> (flecha magenta): los flujos conmutan si y solo si el corchete se anula.</>} /></p>
          {surfaceId === 'sphere' && <p><T
            en={<>On the sphere <Tex>{String.raw`[L_x,L_y]=-L_z`}</Tex> and cyclic (chart frame, z = polar axis): the Lie algebra <Tex>{String.raw`\mathfrak{so}(3)`}</Tex>; with <Tex>{String.raw`\hat L_i=-i\hbar L_i`}</Tex> it becomes the angular-momentum algebra <Tex>{String.raw`[\hat L_x,\hat L_y]=i\hbar\hat L_z`}</Tex>.</>}
            es={<>En la esfera <Tex>{String.raw`[L_x,L_y]=-L_z`}</Tex> y cíclicamente (referencia de la carta, z = eje polar): el álgebra de Lie <Tex>{String.raw`\mathfrak{so}(3)`}</Tex>; con <Tex>{String.raw`\hat L_i=-i\hbar L_i`}</Tex> se convierte en el álgebra del momento angular <Tex>{String.raw`[\hat L_x,\hat L_y]=i\hbar\hat L_z`}</Tex>.</>} /></p>}
        </>
      )}
    </div>
  );
}
