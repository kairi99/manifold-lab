# Manifold Lab

An interactive explorer for differential geometry and general relativity. Every 3D object on screen is tied to the equations that govern it: drag a point or a vector and the metric, Christoffel symbols, curvature and conserved quantities update live.

**Live site:** https://kairi99.github.io/manifold-lab/

## Modules

- **Curves & charts** (start here) — Frenet–Serret frame, curvature and torsion of space curves with the osculating circle; the sphere covered by spherical and stereographic charts with the transition map and its Jacobian.
- **Metric & tangent spaces** — tangent plane $T_pM$, coordinate basis $\partial_i$, the induced metric $g_{ij}$ and Christoffel symbols at a draggable point.
- **Parallel transport** — RK4 transport of a vector around latitude, lune and hand-drawn loops; holonomy compared with $\iint K\,dA$ (Gauss–Bonnet).
- **Geodesics** — fans of geodesics, conjugate points, Clairaut's constant, geodesic deviation.
- **Curvature** — Gaussian-curvature heatmap, Theorema Egregium (intrinsic $R_{1212}/\det g$ vs extrinsic $\kappa_1\kappa_2$), principal directions, geodesic circles.
- **Vector fields & the tangent bundle** — flows, Killing fields, Lie brackets ($[L_x, L_y] = -L_z$), Poincaré–Hopf.
- **Relativity: Schwarzschild & Kerr** — Flamm's paraboloid, timelike and null geodesics, effective potential, perihelion precession and light bending, with real objects (Mercury, S2 around Sgr A\*, the Hulse–Taylor pulsar, GPS, M87\* and Sgr A\* shadows). Kerr: horizons, ergosphere, ISCO and photon orbits vs spin, frame dragging, radiative efficiency. A ray-traced black-hole image (thin disk + lensed sky) checked against Bardeen's shadow curve. Clocks & delays: gravitational redshift (Pound–Rebka, Gravity Probe A, Sirius B), Shapiro delay (Cassini) and Gravity Probe B frame dragging.
- **Curvature in 4D** — exact $g_{\mu\nu}$, $\Gamma^\rho_{\mu\nu}$, Riemann, Ricci, Einstein tensors and invariants (Kretschmann, Weyl²) for Minkowski, Schwarzschild, Kerr, Reissner–Nordström, de Sitter and ΛCDM, computed with second-order jets and checked against $G_{\mu\nu}=8\pi T_{\mu\nu}$. Tidal: geodesic deviation of a ring falling into real black holes. Waves: + and × polarisations and the measured GW150914 strain (LIGO/GWOSC) with the NR template.
- **Causal structure & cosmology** — Penrose diagrams of Minkowski and maximally extended Schwarzschild with light cones and an infalling observer; the conformal diagram of our universe (Planck 2018) with past light cone, particle/event horizons, Hubble sphere and real high-redshift objects.
- **Limits of relativity** — where general relativity stands as of Nov 2026: status cards (confirmed to high precision, open theory problems, observational tensions, claims under debate, resolved anomalies) with sources; galaxy rotation curves from SPARC against baryons only, dark-matter haloes and MOND; the Hubble, S₈ and DESI dark-energy tensions with the published measurements; a century of precision tests and a PPN explorer; Hawking temperature against the CMB, the cosmological-constant mismatch and the Planck scale.
- **Frontiers: open problems** (advanced) — cards for the Millennium Problems and open conjectures in geometry and relativity, each with its status, sources and the date it was checked; demos of curve-shortening flow (dA/dt = −2π), Ricci flow on a dumbbell sphere (rounds out in 2D, neck pinch in 3D), the Willmore energy of tori and their inversions (minimum 2π² at R/r = √2) with umbilics of the ellipsoid, the Penrose inequality for Kerr–Newman, and non-abelian SU(2) holonomy behind Yang–Mills.
- **Learning aids** — a numbered learning path with progress on the start page; a chart (u, v) inset beside every surface showing Tissot ellipses of the metric; equations colour-linked to the 3D objects (hover either); a "write sums out" toggle for Einstein's summation convention; a glossary with term pop-ups; tasks that tick themselves when you reach the goal and predict-then-check questions; worked Christoffel derivations; isometric bending (catenoid ↔ helicoid, rolling sheet); total curvature vs 2πχ; numerical-drift readouts; shareable links (Copy link) that restore a configuration.
- **Accessibility** — keyboard control of the 3D point and vector (arrows, `[` `]`, `+` `−`), screen-reader descriptions, reduced-motion support, colour-blind-safe palette (Okabe–Ito).

Surfaces: sphere, torus, saddle, paraboloid, and Custom: type your own parametric surface or graph (`+ - * / ^`, `sin cos tan exp log sqrt abs sinh cosh tanh asin acos atan`, constants `pi e`, sliders `a b`) or load a classic (catenoid, helicoid, pseudosphere, ellipsoid, Enneper, monkey saddle, Möbius band, Dini, bumpy sphere); g, Γ and K are derived exactly by automatic differentiation. All closed-form geometry is checked against finite differences and known results in the test suite.

A top bar switches between dark and light themes and between English and Spanish, and opens the technical notes (numerical and symbolic methods) and the legal page. The site opens on a start page that describes each simulation. Every simulation has a "Motivation & theory" button with the background, key equations and references; links such as `#metric` or `#cosmos` open one directly. Each simulation has its own short, skippable guide that opens on its first visit; press `?` to replay it.

## Development

```sh
npm install
npm run dev      # http://localhost:5173
npm test         # vitest unit tests
npm run test:e2e # Playwright browser tests (drags, readouts, phone layout)
npm run build
```

Built with React, TypeScript, Vite, react-three-fiber and KaTeX. Pushing to `main` deploys to GitHub Pages through `.github/workflows/deploy.yml`.

## License

MIT © 2026 nightwing (kairi99). See [LICENSE](LICENSE). GW150914 data: GWOSC, CC BY 4.0.
