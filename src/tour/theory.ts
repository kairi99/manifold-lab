import type { ModuleId } from '../state/store';

export interface TheorySection { heading: string; body: string }
export interface Theory { motivation: string; sections: TheorySection[]; refs: string[] }

// Prose with $inline$ math; a paragraph that is exactly $$...$$ renders as display math. Paragraphs split on blank lines.
const r = String.raw;

export const THEORY: Record<ModuleId, Theory> = {
  metric: {
    motivation: r`How do you measure length, angle and area on a curved surface using only its coordinates? The answer is the metric tensor $g_{ij}$, the single object from which all intrinsic geometry follows. In general relativity the same object, $g_{\mu\nu}$, is the gravitational field.`,
    sections: [
      { heading: 'Tangent spaces', body: r`A surface $M\subset\mathbb{R}^3$ is described by a parametrisation $\mathbf{x}(u,v)$. At each point $p$ the partial derivatives $\partial_u=\partial\mathbf{x}/\partial u$ and $\partial_v=\partial\mathbf{x}/\partial v$ span the tangent plane $T_pM$. A tangent vector is a combination $V=V^i\partial_i$; its components $V^i$ depend on the chart, the vector does not.` },
      { heading: 'The metric (first fundamental form)', body: r`The inner product of the basis vectors defines the metric:

$$g_{ij}=\partial_i\cdot\partial_j,\qquad ds^2=g_{ij}\,du^i du^j.$$

It gives the length $|V|^2=g_{ij}V^iV^j$, the angle between two vectors, and the area element $dA=\sqrt{\det g}\,du\,dv$. On the unit sphere $g=\mathrm{diag}(1,\sin^2\theta)$: the $\varphi$ direction shrinks towards the poles, which is why lines of longitude converge.` },
      { heading: 'Christoffel symbols', body: r`Moving $p$ changes the basis. The part of that change which stays in the tangent plane is described by the Christoffel symbols, computed from the metric alone:

$$\Gamma^k_{ij}=\tfrac12 g^{kl}\left(\partial_i g_{jl}+\partial_j g_{il}-\partial_l g_{ij}\right).$$

They are not a tensor: Cartesian coordinates on a plane give $\Gamma=0$, polar coordinates on the same plane do not. They are the ingredient of parallel transport and of the geodesic equation.` },
      { heading: 'What to look for', body: r`Drag $p$ and watch the basis arrows stretch and tilt, and the metric circle $\{W: g(W,W)=1\}$ deform. Compare $g_{ij}V^iV^j$ with the Euclidean length of the arrow: they agree, because $g$ is the pull-back of the dot product of $\mathbb{R}^3$. Near the sphere's poles $\det g\to 0$: the coordinates fail there, not the surface.` },
    ],
    refs: ['do Carmo, Differential Geometry of Curves and Surfaces, §2-5 (first fundamental form) and §4-3 (Christoffel symbols)', 'Lee, Introduction to Riemannian Manifolds (2nd ed.), ch. 2', 'Carroll, Spacetime and Geometry, ch. 2-3'],
  },

  transport: {
    motivation: r`On a curved surface there is no global notion of "the same direction" at two different points. Parallel transport defines it along a path, and the failure of a vector to return unchanged around a loop is the most direct measurement of curvature. Foucault's pendulum and the Berry phase are both holonomies.`,
    sections: [
      { heading: 'The transport equation', body: r`A vector field $V$ along a curve $u(t)$ is parallel if its covariant derivative vanishes:

$$\frac{dV^k}{dt}+\Gamma^k_{ij}\,V^i\frac{du^j}{dt}=0.$$

Seen from $\mathbb{R}^3$, the vector changes only in the direction normal to the surface: it does not turn within the surface. Parallel transport preserves lengths and angles, $g(V,W)$ is constant.` },
      { heading: 'Holonomy and Gauss–Bonnet', body: r`Transport a vector around a closed loop bounding a simply connected region $R$. It returns rotated by the angle

$$\Delta\alpha=\iint_R K\,dA.$$

On the unit sphere a latitude circle at polar angle $\theta_0$ encloses the cap area $2\pi(1-\cos\theta_0)$, so the holonomy is $2\pi(1-\cos\theta_0)$: $180^\circ$ at $\theta_0=60^\circ$, and zero (mod $2\pi$) at the equator, which is a geodesic.` },
      { heading: 'Geodesic triangles', body: r`For a triangle with geodesic sides the same theorem gives the angle excess $\alpha+\beta+\gamma-\pi=\iint K\,dA$. On a sphere triangles have more than $180^\circ$; on the saddle, where $K<0$, less. Curvature is thus measurable from inside the surface, with no reference to the embedding.` },
      { heading: 'What to look for', body: r`Play a latitude loop and compare the measured holonomy with $\iint K\,dA$. Draw your own loop: only the enclosed curvature matters, not its shape. On the torus, loops on the outer ($K>0$) and inner ($K<0$) sides rotate the vector in opposite senses.` },
    ],
    refs: ['do Carmo, Differential Geometry of Curves and Surfaces, §4-4 (parallel transport) and §4-5 (Gauss–Bonnet)', 'Lee, Introduction to Riemannian Manifolds (2nd ed.), ch. 4 and 9', 'Misner, Thorne & Wheeler, Gravitation (1973), ch. 10-11'],
  },

  geodesics: {
    motivation: r`Geodesics are the straightest possible curves: they never turn within the surface. They are great circles on a sphere, shortest flight routes on the Earth, and, in spacetime, the worldlines of freely falling bodies and light rays.`,
    sections: [
      { heading: 'The geodesic equation', body: r`A geodesic parallel-transports its own velocity, $\nabla_{\dot\gamma}\dot\gamma=0$. In coordinates:

$$\ddot u^k+\Gamma^k_{ij}\,\dot u^i\dot u^j=0.$$

The speed $g_{ij}\dot u^i\dot u^j$ is conserved, so the parameter is proportional to arc length. Locally, geodesics are the curves of extremal length between nearby points.` },
      { heading: 'Conserved quantities', body: r`Every symmetry gives a constant of motion. On a surface of revolution, rotation about the axis gives Clairaut's relation $\rho\cos\psi=\text{const}$, where $\rho$ is the distance from the axis and $\psi$ the angle with the parallel. This explains why geodesics on a torus or paraboloid oscillate between two parallels; it is the surface analogue of angular-momentum conservation.` },
      { heading: 'Geodesic deviation and conjugate points', body: r`The separation $J$ of neighbouring geodesics obeys the Jacobi equation $\ddot J+K J=0$. For $K>0$ the geodesics refocus: on the unit sphere all geodesics from $p$ meet again at the antipode, at distance $\pi$ (a conjugate point). For $K<0$ they diverge exponentially. In relativity the same equation, with the Riemann tensor in place of $K$, describes tidal forces.` },
      { heading: 'What to look for', body: r`Fan out several geodesics from $p$. On the sphere they reconverge; on the saddle they spread. Shorten or lengthen the fan to see where neighbouring geodesics first cross.` },
    ],
    refs: ['do Carmo, Differential Geometry of Curves and Surfaces, §4-4 (geodesics), §4-6 and §5-5 (Jacobi fields)', 'Lee, Introduction to Riemannian Manifolds (2nd ed.), ch. 4 and 10 (Jacobi fields)', 'Misner, Thorne & Wheeler, Gravitation (1973), ch. 11 (geodesic deviation)'],
  },

  curvature: {
    motivation: r`Is a surface curved in itself, or only bent in space? A sheet of paper rolled into a cylinder is bent but intrinsically flat; a sphere cannot be flattened without stretching. Gauss's Theorema Egregium says the Gaussian curvature $K$ can be measured by an inhabitant who never leaves the surface, the idea that lets general relativity speak of curved spacetime without any space to embed it in.`,
    sections: [
      { heading: 'Extrinsic curvature', body: r`The shape operator measures how the unit normal turns as $p$ moves. Its eigenvalues are the principal curvatures $\kappa_1,\kappa_2$, with orthogonal principal directions. Their product and mean are

$$K=\kappa_1\kappa_2,\qquad H=\tfrac12(\kappa_1+\kappa_2).$$

$K>0$: the surface curves the same way in all directions (sphere). $K<0$: a saddle. $K=0$: at least one direction is straight (cylinder, plane).` },
      { heading: 'Theorema Egregium', body: r`Gauss proved that $K$ depends on the metric alone:

$$K=\frac{R_{1212}}{\det g},$$

with $R_{1212}$ built from $g_{ij}$ and its first and second derivatives. Bending a surface without stretching (an isometry) leaves $K$ unchanged, even though $\kappa_1$ and $\kappa_2$ change.` },
      { heading: 'Geodesic circles', body: r`A third, purely intrinsic measurement: the circumference of a geodesic circle of radius $\rho$ is

$$C(\rho)=2\pi\rho\left(1-\tfrac{K}{6}\rho^2+O(\rho^4)\right).$$

Positive curvature makes circles shorter than $2\pi\rho$, negative curvature longer.` },
      { heading: 'What to look for', body: r`The panel computes $K$ both ways at $p$ and they agree to rounding, on every surface including the ones you type. On the torus the outer half has $K>0$, the inner half $K<0$, and the top and bottom circles $K=0$; the total $\iint K\,dA=2\pi\chi=0$.` },
    ],
    refs: ['do Carmo, Differential Geometry of Curves and Surfaces, §3-2, §3-3 and §4-3 (Theorema Egregium)', 'Gauss, Disquisitiones generales circa superficies curvas (1827)', 'Lee, Introduction to Riemannian Manifolds (2nd ed.), ch. 8'],
  },

  fields: {
    motivation: r`Vector fields describe flows, symmetries and physical fields such as velocity and force. Collecting all tangent planes into one space, the tangent bundle $TM$, turns a field into a single geometric object, and its topology constrains which fields can exist: you cannot comb a hairy ball flat.`,
    sections: [
      { heading: 'Sections of the tangent bundle', body: r`The tangent bundle $TM=\bigsqcup_p T_pM$ has the projection $\pi:TM\to M$. A vector field is a section $X:M\to TM$ with $\pi\circ X=\mathrm{id}$, i.e. a choice of one tangent vector at every point. Its integral curves solve $\dot u=X(u)$; their collection is the flow $\phi_t$.` },
      { heading: 'Killing fields', body: r`A field whose flow is an isometry satisfies Killing's equation

$$\mathcal{L}_X g=0\iff\nabla_iX_j+\nabla_jX_i=0.$$

Killing fields are infinitesimal symmetries. Each gives a conserved quantity $g(X,\dot\gamma)$ along every geodesic; in the Schwarzschild spacetime, $\partial_t$ and $\partial_\varphi$ give the energy and angular momentum of an orbit.` },
      { heading: 'Lie brackets', body: r`The bracket $[X,Y]=XY-YX$ measures the failure of two flows to commute: flow along $X$ for time $t$, then $Y$, then back along each, and the gap is $t^2[X,Y]+O(t^3)$. The rotation fields of the sphere satisfy $[L_x,L_y]=-L_z$ and cyclic: the Lie algebra $\mathfrak{so}(3)$, which quantum mechanics knows as angular momentum.` },
      { heading: 'Poincaré–Hopf', body: r`At an isolated zero the field winds around by an integer, its index. The theorem states

$$\sum_{\text{zeros}}\operatorname{ind}=\chi(M).$$

The sphere has $\chi=2$, so every field on it vanishes somewhere (hairy ball theorem); the torus has $\chi=0$ and admits nowhere-vanishing fields.` },
    ],
    refs: ['Lee, Introduction to Smooth Manifolds (2nd ed.), ch. 8-9 (vector fields, flows, Lie derivatives)', 'Milnor, Topology from the Differentiable Viewpoint (1965), §6 (Poincaré–Hopf)', 'Carroll, Spacetime and Geometry, §3.8 (Killing vectors)'],
  },

  relativity: {
    motivation: r`General relativity replaces the gravitational force by spacetime curvature: free bodies and light follow geodesics of the metric. The Schwarzschild and Kerr solutions describe the field outside any non-rotating or rotating mass, and their predictions, from Mercury's perihelion to black-hole shadows, are among the best tested results in physics.`,
    sections: [
      { heading: 'The Schwarzschild metric', body: r`Outside a spherical, non-rotating mass $M$ (units $G=c=1$):

$$ds^2=-\Big(1-\frac{2M}{r}\Big)dt^2+\frac{dr^2}{1-2M/r}+r^2d\Omega^2.$$

The Killing fields $\partial_t$ and $\partial_\varphi$ give a conserved energy $E$ and angular momentum $L$ per unit mass. The horizon is at $r_s=2M$; the Flamm paraboloid embeds the spatial slice $t=\text{const}$ in $\mathbb{R}^3$.` },
      { heading: 'Effective potential and orbits', body: r`For equatorial timelike geodesics,

$$\dot r^2=E^2-\Big(1-\frac{2M}{r}\Big)\Big(1+\frac{L^2}{r^2}\Big).$$

The extra $-2ML^2/r^3$ term relative to Newton makes orbits precess by $6\pi M/[a(1-e^2)]$ per orbit (about $43''$ per century for Mercury) and removes stable circular orbits inside the ISCO at $r=6M$. Light has a circular orbit at the photon sphere $r=3M$ and is captured for impact parameter $b<3\sqrt3\,M$; for large $b$ it is deflected by $4M/b$.` },
      { heading: 'Kerr: spinning black holes', body: r`With spin $a=J/M$ the horizon moves to $r_+=M+\sqrt{M^2-a^2}$ and an ergosphere appears, where frame dragging forces everything to co-rotate. The prograde ISCO shrinks from $6M$ at $a=0$ to $M$ as $a\to M$, so the binding energy $1-E_{\rm ISCO}$ radiated by a thin accretion disc rises from $5.7\%$ to $42\%$ (about $32\%$ at $a=0.998$).` },
      { heading: 'Images and clocks', body: r`Tracing null geodesics back from a camera gives the lensed image of a disc and the shadow, whose edge for Schwarzschild has radius $3\sqrt3\,M$ in impact parameter, close to what the EHT measured for M87* and Sgr A*. Static clocks tick at the rate $\sqrt{1-2M/r}$, giving the gravitational redshift (Pound–Rebka, Gravity Probe A, GPS); light passing the Sun is delayed (Shapiro, Cassini), and a gyroscope in orbit precesses (Gravity Probe B).` },
    ],
    refs: ['Misner, Thorne & Wheeler, Gravitation (1973), ch. 25 (Schwarzschild orbits) and ch. 33 (Kerr)', 'Bardeen, Press & Teukolsky, ApJ 178, 347 (1972)', 'Will, Living Rev. Relativ. 17, 4 (2014)', 'Event Horizon Telescope Collaboration, ApJL 875, L1 (2019)'],
  },

  spacetime: {
    motivation: r`In four dimensions curvature is no longer one number. The Riemann tensor has 20 independent components; Einstein's equations fix only its trace part, the Ricci tensor, through the matter present. The rest, the Weyl tensor, is free: it is the tidal field of a black hole and the gravitational wave that travels through empty space.`,
    sections: [
      { heading: 'From metric to curvature', body: r`From $g_{\mu\nu}$ follow the Christoffel symbols and the Riemann tensor

$$R^\rho{}_{\sigma\mu\nu}=\partial_\mu\Gamma^\rho_{\nu\sigma}-\partial_\nu\Gamma^\rho_{\mu\sigma}+\Gamma^\rho_{\mu\lambda}\Gamma^\lambda_{\nu\sigma}-\Gamma^\rho_{\nu\lambda}\Gamma^\lambda_{\mu\sigma},$$

its trace $R_{\mu\nu}=R^\rho{}_{\mu\rho\nu}$, the scalar $R$, and $G_{\mu\nu}=R_{\mu\nu}-\tfrac12Rg_{\mu\nu}$. Invariants such as the Kretschmann scalar $R_{\alpha\beta\gamma\delta}R^{\alpha\beta\gamma\delta}=48M^2/r^6$ (Schwarzschild) separate real singularities from coordinate ones.` },
      { heading: "Einstein's equations", body: r`$$G_{\mu\nu}+\Lambda g_{\mu\nu}=8\pi T_{\mu\nu}.$$

Schwarzschild and Kerr are vacuum, $R_{\mu\nu}=0$, but their Riemann tensor is not zero: curvature without matter. Reissner–Nordström carries the stress-energy of an electric field, de Sitter a cosmological constant, ΛCDM dust and dark energy. The panel checks the equation component by component at the chosen event.` },
      { heading: 'Tidal forces', body: r`Two nearby free particles separated by $\xi$ accelerate apart according to geodesic deviation,

$$\frac{D^2\xi^i}{d\tau^2}=-R^i{}_{0j0}\,\xi^j.$$

For a radial fall into Schwarzschild, $E_{rr}=-2M/r^3$ stretches along the radius and $E_{\theta\theta}=E_{\varphi\varphi}=+M/r^3$ squeezes sideways: spaghettification. At the horizon the stretch scales as $1/M^2$, lethal for a stellar black hole, gentle for Sgr A*.` },
      { heading: 'Gravitational waves', body: r`Linearising $g=\eta+h$ in vacuum gives waves travelling at $c$ with two transverse-traceless polarisations, $h_+$ and $h_\times$. A ring of free particles is squeezed and stretched with strain $h\sim10^{-21}$ at Earth. GW150914, the first detection, came from two black holes of about $36$ and $29\,M_\odot$ merging 410 Mpc away; the chirp mass $\mathcal{M}=(m_1m_2)^{3/5}/(m_1+m_2)^{1/5}\approx28\,M_\odot$ fixes how fast the frequency sweeps up.` },
    ],
    refs: ['Misner, Thorne & Wheeler, Gravitation (1973), ch. 11, 14 and 35', 'Carroll, Spacetime and Geometry, ch. 3, 4 and 7', 'Abbott et al. (LIGO/Virgo), PRL 116, 061102 (2016)', 'Wald, General Relativity (1984), ch. 3'],
  },

  cosmos: {
    motivation: r`Which events can influence which? In relativity this causal structure is set by light cones, and in spacetimes with horizons or a Big Bang it is hard to see in ordinary coordinates. Conformal (Penrose) diagrams compress infinity to a finite picture while keeping light rays at $45^\circ$, so horizons, singularities and the limits of what we can observe become visible at a glance.`,
    sections: [
      { heading: 'Conformal compactification', body: r`A conformal rescaling $\tilde g=\Omega^2g$ changes distances but not light cones. For Minkowski space, null coordinates $u=t-r$, $v=t+r$ and the map $U=\arctan u$, $V=\arctan v$ bring infinity to finite values: future and past timelike infinity $i^\pm$, null infinity $\mathscr{I}^\pm$ and spatial infinity $i^0$.` },
      { heading: 'Schwarzschild and black holes', body: r`Kruskal–Szekeres coordinates cover the full vacuum solution with light at $45^\circ$; compactifying them gives four regions: our exterior, the black-hole interior, a white hole and a second exterior. Inside $r=2M$ every future-directed path reaches $r=0$. An observer falling from rest at $r_0$ gets there in proper time

$$\tau=\pi\sqrt{r_0^3/8M},$$

about 35 M from $r_0=10M$, while a distant observer never sees them cross.` },
      { heading: 'Our universe', body: r`A flat FLRW universe $ds^2=a(\eta)^2(-d\eta^2+d\chi^2+\chi^2d\Omega^2)$ is conformally flat, so comoving distance against conformal time $\eta=\int dt/a$ is a causal diagram. With Planck 2018 ΛCDM parameters the universe is about 13.8 Gyr old; our past light cone reaches the CMB at $z\approx1100$; the particle horizon is about 46 Gly comoving and the event horizon about 16 Gly, because Λ makes the expansion accelerate.` },
      { heading: 'Recession faster than light', body: r`Hubble's law $v=H_0D$ uses proper distance, and $v$ exceeds $c$ beyond the Hubble sphere, $D=c/H$. Galaxies we see today at $z\gtrsim1.5$ are receding faster than light now. This breaks no rule: special relativity limits only local velocities, and the light we receive was emitted when the galaxies sat inside our past light cone.` },
    ],
    refs: ['Hawking & Ellis, The Large Scale Structure of Space-Time (1973), ch. 5', 'Misner, Thorne & Wheeler, Gravitation (1973), ch. 31 (Kruskal–Szekeres)', 'Davis & Lineweaver, PASA 21, 97 (2004)', 'Planck Collaboration, A&A 641, A6 (2020)'],
  },
};
