import { Line } from '@react-three/drei';
import { useStore } from '../state/store';
import { coordText } from '../panels/Tex';
import { stModel } from '../panels/SpacetimeModel';
import { sci } from '../panels/SpacetimeUi';
import { Label } from './Label';

const PLANES = [[0, 1], [0, 2], [0, 3], [1, 2], [1, 3], [2, 3]];

/** Six bars: sectional curvature of each coordinate plane at the event (height linear in K, normalised to max |K|). */
export function TensorScene() {
  const id = useStore((s) => s.stMetric), params = useStore((s) => s.stParams), event = useStore((s) => s.stEvent);
  const m = stModel(id, params, event), names = m.metric.coords.map(coordText);
  const ks = PLANES.map(([a, b]) => m.K[a][b]), kmax = Math.max(...ks.map(Math.abs));
  const flat = kmax < 1e-12;
  return (
    <group scale={0.5} position={[0, -0.2, 0]}>
      <Line points={[[-3.2, 0, 0], [3.2, 0, 0]]} color="#8a8f98" lineWidth={1} />
      {PLANES.map(([a, b], i) => {
        const h = flat ? 0 : (ks[i] / kmax) * 1.8, X = -2.5 + i, col = ks[i] >= 0 ? '#6cb6ff' : '#ff9f43';
        return (
          <group key={i}>
            {!flat && <mesh position={[X, h / 2, 0]}><boxGeometry args={[0.6, Math.max(Math.abs(h), 0.01), 0.6]} /><meshStandardMaterial color={col} /></mesh>}
            <Label text={`${names[a]}${names[b]}`} position={[X, -0.35, 0.4]} height={0.34} />
            <Label text={sci(ks[i], 3)} position={[X, h + (h >= 0 ? 0.25 : -0.25), 0]} color={col} height={0.24} />
          </group>
        );
      })}
      <Label text={`${m.metric.name}: sectional curvatures K`} position={[0, 3.2, 0]} height={0.3} />
      <Label text={flat ? 'all zero: flat spacetime' : 'blue: K > 0, orange: K < 0; heights normalised to max |K|'} position={[0, -1.7, 0]} color={flat ? '#35e0c2' : '#8a8f98'} height={0.24} />
    </group>
  );
}
