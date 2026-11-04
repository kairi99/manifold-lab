# Manifold Lab

An interactive explorer for differential geometry and general relativity. Every 3D object on screen is tied to the equations that govern it: drag a point or a vector and the metric, Christoffel symbols, curvature and conserved quantities update live.

**Live site:** https://kairi99.github.io/manifold-lab/

## Modules

- **Metric & tangent spaces** — tangent plane $T_pM$, coordinate basis $\partial_i$, the induced metric $g_{ij}$ and Christoffel symbols at a draggable point.
- **Parallel transport** — RK4 transport of a vector around latitude, lune and hand-drawn loops; holonomy compared with $\iint K\,dA$ (Gauss–Bonnet).
- **Geodesics** — fans of geodesics, conjugate points, Clairaut's constant, geodesic deviation.
- **Curvature** — Gaussian-curvature heatmap, Theorema Egregium (intrinsic $R_{1212}/\det g$ vs extrinsic $\kappa_1\kappa_2$), principal directions, geodesic circles.
- **Vector fields & the tangent bundle** — flows, Killing fields, Lie brackets ($[L_x, L_y] = -L_z$), Poincaré–Hopf.
- **Relativity: Schwarzschild & Kerr** — Flamm's paraboloid, timelike and null geodesics, effective potential, perihelion precession and light bending, with real objects (Mercury, S2 around Sgr A\*, the Hulse–Taylor pulsar, GPS, M87\* and Sgr A\* shadows). Kerr: horizons, ergosphere, ISCO and photon orbits vs spin, frame dragging, radiative efficiency. A ray-traced black-hole image (thin disk + lensed sky) checked against Bardeen's shadow curve. Clocks & delays: gravitational redshift (Pound–Rebka, Gravity Probe A, Sirius B), Shapiro delay (Cassini) and Gravity Probe B frame dragging.
- **Curvature in 4D** — exact $g_{\mu\nu}$, $\Gamma^\rho_{\mu\nu}$, Riemann, Ricci, Einstein tensors and invariants (Kretschmann, Weyl²) for Minkowski, Schwarzschild, Kerr, Reissner–Nordström, de Sitter and ΛCDM, computed with second-order jets and checked against $G_{\mu\nu}=8\pi T_{\mu\nu}$. Tidal: geodesic deviation of a ring falling into real black holes. Waves: + and × polarisations and the measured GW150914 strain (LIGO/GWOSC) with the NR template.
- **Causal structure & cosmology** — Penrose diagrams of Minkowski and maximally extended Schwarzschild with light cones and an infalling observer; the conformal diagram of our universe (Planck 2018) with past light cone, particle/event horizons, Hubble sphere and real high-redshift objects.
- **Accessibility** — keyboard control of the 3D point and vector (arrows, `[` `]`, `+` `−`), screen-reader descriptions, reduced-motion support.

Surfaces: sphere, torus, saddle, paraboloid, and Custom: type your own parametric surface or graph (`+ - * / ^`, `sin cos tan exp log sqrt abs sinh cosh tanh asin acos atan`, constants `pi e`, sliders `a b`) or load a classic (catenoid, helicoid, pseudosphere, ellipsoid, Enneper, monkey saddle, Möbius band, Dini, bumpy sphere); g, Γ and K are derived exactly by automatic differentiation. All closed-form geometry is checked against finite differences and known results in the test suite.

The site opens on a start page that describes each simulation; links such as `#metric` or `#cosmos` open one directly. Each simulation has its own short, skippable guide that opens on its first visit; press `?` to replay it.

## Development

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # vitest unit tests
npm run test:e2e # Playwright browser tests (drags, readouts, phone layout)
npm run build
```

Built with React, TypeScript, Vite, react-three-fiber and KaTeX. Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`.
