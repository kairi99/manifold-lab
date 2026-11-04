import { useEffect, useRef, type ReactNode } from 'react';
import { useStore } from '../state/store';
import { T, useTr } from '../i18n';
import { Tex } from '../panels/Tex';
import '../tour/tour.css';

const REPO = 'https://github.com/kairi99/manifold-lab';
const A = ({ href, children }: { href: string; children: ReactNode }) => <a href={href} target="_blank" rel="noreferrer">{children}</a>;

function Technical() {
  return <>
    <h3><T en="Conventions" es="Convenciones" /></h3>
    <p><T en={<>Geometric units <Tex>G=c=1</Tex> with lengths in units of the mass <Tex>M</Tex>, unless a quantity is shown in SI units. Spacetime signature <Tex>(-,+,+,+)</Tex> and the sign conventions of Misner, Thorne &amp; Wheeler: <Tex>{String.raw`\Gamma^\rho_{\mu\nu}=\tfrac12g^{\rho\lambda}(\partial_\mu g_{\lambda\nu}+\partial_\nu g_{\lambda\mu}-\partial_\lambda g_{\mu\nu})`}</Tex>, <Tex>{String.raw`R^\rho{}_{\sigma\mu\nu}=\partial_\mu\Gamma^\rho_{\nu\sigma}-\partial_\nu\Gamma^\rho_{\mu\sigma}+\Gamma^\rho_{\mu\lambda}\Gamma^\lambda_{\nu\sigma}-\Gamma^\rho_{\nu\lambda}\Gamma^\lambda_{\mu\sigma}`}</Tex>. All arithmetic is IEEE double precision.</>}
      es={<>Unidades geométricas <Tex>G=c=1</Tex> con longitudes en unidades de la masa <Tex>M</Tex>, salvo cuando una magnitud se muestra en unidades SI. Signatura del espaciotiempo <Tex>(-,+,+,+)</Tex> y convenciones de signo de Misner, Thorne y Wheeler: <Tex>{String.raw`\Gamma^\rho_{\mu\nu}=\tfrac12g^{\rho\lambda}(\partial_\mu g_{\lambda\nu}+\partial_\nu g_{\lambda\mu}-\partial_\lambda g_{\mu\nu})`}</Tex>, <Tex>{String.raw`R^\rho{}_{\sigma\mu\nu}=\partial_\mu\Gamma^\rho_{\nu\sigma}-\partial_\nu\Gamma^\rho_{\mu\sigma}+\Gamma^\rho_{\mu\lambda}\Gamma^\lambda_{\nu\sigma}-\Gamma^\rho_{\nu\lambda}\Gamma^\lambda_{\mu\sigma}`}</Tex>. Toda la aritmética es en doble precisión IEEE.</>} /></p>

    <h3><T en="Surfaces: symbolic model" es="Superficies: modelo simbólico" /></h3>
    <p><T en={<>The built-in surfaces (sphere, torus, saddle, paraboloid) have hand-derived closed forms for the parametrisation, the metric <Tex>{'g_{ij}'}</Tex>, the Christoffel symbols and the Gaussian curvature <Tex>K</Tex>. The Riemann component <Tex>{'R_{1212}'}</Tex> used for the intrinsic <Tex>K</Tex> differentiates <Tex>\Gamma</Tex> by central differences; the extrinsic <Tex>{String.raw`K=\kappa_1\kappa_2`}</Tex> comes from the shape operator. The test suite checks every closed form against finite differences and known results.</>}
      es={<>Las superficies predefinidas (esfera, toro, silla, paraboloide) tienen formas cerradas deducidas a mano para la parametrización, la métrica <Tex>{'g_{ij}'}</Tex>, los símbolos de Christoffel y la curvatura de Gauss <Tex>K</Tex>. La componente de Riemann <Tex>{'R_{1212}'}</Tex> usada para la <Tex>K</Tex> intrínseca deriva <Tex>\Gamma</Tex> por diferencias centradas; la <Tex>{String.raw`K=\kappa_1\kappa_2`}</Tex> extrínseca sale del operador de forma. Las pruebas comparan cada forma cerrada con diferencias finitas y resultados conocidos.</>} /></p>
    <p><T en={<>Custom surfaces are parsed by a tokenizer and a recursive-descent parser into a syntax tree; nothing you type is executed as code (no <code>eval</code>). The tree is evaluated over second-order jets (value, gradient and Hessian: forward-mode automatic differentiation), which gives <Tex>{String.raw`\partial_i\mathbf x`}</Tex> and <Tex>{String.raw`\partial_i\partial_j\mathbf x`}</Tex> exactly, and from them <Tex>g</Tex>, <Tex>\Gamma</Tex>, <Tex>K</Tex> and the principal curvatures.</>}
      es={<>Las superficies personalizadas se analizan con un tokenizador y un analizador sintáctico descendente recursivo que produce un árbol sintáctico; nada de lo que escribes se ejecuta como código (sin <code>eval</code>). El árbol se evalúa sobre jets de segundo orden (valor, gradiente y hessiana: diferenciación automática en modo directo), lo que da <Tex>{String.raw`\partial_i\mathbf x`}</Tex> y <Tex>{String.raw`\partial_i\partial_j\mathbf x`}</Tex> de forma exacta y, a partir de ellas, <Tex>g</Tex>, <Tex>\Gamma</Tex>, <Tex>K</Tex> y las curvaturas principales.</>} /></p>

    <h3><T en="Numerical integration" es="Integración numérica" /></h3>
    <p><T en={<>Parallel transport, geodesics on surfaces, vector-field flows and Schwarzschild and Kerr geodesics are integrated with the classical fourth-order Runge–Kutta method (RK4). Except for parallel transport, which uses a fixed step, the step is controlled by step doubling: one full step is compared with two half steps and halved until they agree. Near chart singularities (the poles of the sphere) the step is reduced further.</>}
      es={<>El transporte paralelo, las geodésicas sobre superficies, los flujos de campos vectoriales y las geodésicas de Schwarzschild y Kerr se integran con el método clásico de Runge–Kutta de cuarto orden (RK4). Salvo en el transporte paralelo, que usa un paso fijo, el paso se controla duplicándolo: un paso completo se compara con dos medios pasos y se reduce a la mitad hasta que coinciden. Cerca de singularidades de la carta (los polos de la esfera) el paso se reduce aún más.</>} /></p>
    <p><T en={<>The black-hole image is a backward ray tracer: null geodesics are integrated from the camera with the Hamiltonian <Tex>{String.raw`F=\Delta p_r^2+p_\theta^2-\frac{(r^2+a^2-aL)^2}{\Delta}+\frac{(L-a\sin^2\theta)^2}{\sin^2\theta}=0`}</Tex> in Boyer–Lindquist coordinates (RK4, step proportional to the distance from the hole), and the shadow edge is checked against Bardeen's (1973) critical curve.</>}
      es={<>La imagen del agujero negro es un trazador de rayos hacia atrás: las geodésicas nulas se integran desde la cámara con el hamiltoniano <Tex>{String.raw`F=\Delta p_r^2+p_\theta^2-\frac{(r^2+a^2-aL)^2}{\Delta}+\frac{(L-a\sin^2\theta)^2}{\sin^2\theta}=0`}</Tex> en coordenadas de Boyer–Lindquist (RK4, paso proporcional a la distancia al agujero), y el borde de la sombra se compara con la curva crítica de Bardeen (1973).</>} /></p>

    <h3><T en="Closed-form relativity" es="Relatividad en forma cerrada" /></h3>
    <p><T en={<>Orbits are set by their apsides through the conserved <Tex>E</Tex> and <Tex>L</Tex>; precession uses the Binet equation. Kerr horizons, ergosphere, ISCO and photon orbits use the formulas of Bardeen, Press &amp; Teukolsky (1972). Clock rates and delays use the weak-field formulas shown in the panel.</>}
      es={<>Las órbitas se fijan por sus ápsides mediante las constantes <Tex>E</Tex> y <Tex>L</Tex>; la precesión usa la ecuación de Binet. Los horizontes, la ergosfera, la ISCO y las órbitas de fotones de Kerr usan las fórmulas de Bardeen, Press y Teukolsky (1972). Los ritmos de reloj y los retrasos usan las fórmulas de campo débil que muestra el panel.</>} /></p>

    <h3><T en="Curvature in 4D" es="Curvatura en 4D" /></h3>
    <p><T en={<>Each metric component is evaluated as a second-order jet in <Tex>{String.raw`(t,r,\theta,\varphi)`}</Tex>, so <Tex>\Gamma</Tex>, its derivatives and the Riemann, Ricci and Einstein tensors, the Kretschmann scalar and <Tex>{String.raw`C_{\alpha\beta\gamma\delta}C^{\alpha\beta\gamma\delta}`}</Tex> are exact up to rounding. The panel compares <Tex>{String.raw`G_{\mu\nu}`}</Tex> with <Tex>{String.raw`8\pi T_{\mu\nu}`}</Tex> of the matter model. The tidal tensor <Tex>{String.raw`E_{ij}=R_{\alpha\beta\gamma\delta}e_i^\alpha u^\beta e_j^\gamma u^\delta`}</Tex> is taken in the frame of a radial free fall.</>}
      es={<>Cada componente de la métrica se evalúa como un jet de segundo orden en <Tex>{String.raw`(t,r,\theta,\varphi)`}</Tex>, de modo que <Tex>\Gamma</Tex>, sus derivadas y los tensores de Riemann, Ricci y Einstein, el escalar de Kretschmann y <Tex>{String.raw`C_{\alpha\beta\gamma\delta}C^{\alpha\beta\gamma\delta}`}</Tex> son exactos salvo redondeo. El panel compara <Tex>{String.raw`G_{\mu\nu}`}</Tex> con <Tex>{String.raw`8\pi T_{\mu\nu}`}</Tex> del modelo de materia. El tensor de marea <Tex>{String.raw`E_{ij}=R_{\alpha\beta\gamma\delta}e_i^\alpha u^\beta e_j^\gamma u^\delta`}</Tex> se toma en el sistema de una caída libre radial.</>} /></p>

    <h3><T en="Causal structure and cosmology" es="Estructura causal y cosmología" /></h3>
    <p><T en={<>Penrose diagrams use Kruskal–Szekeres coordinates, with <Tex>r(U,V)</Tex> from the principal branch of the Lambert <Tex>W</Tex> function, compactified with <Tex>\arctan</Tex>. The universe is flat ΛCDM with radiation (Planck 2018). Distances and times are computed by adaptive Simpson quadrature, with a substitution <Tex>a=s^2</Tex> that keeps the early radiation era smooth; the scale factor at a given age is found by bisection. The conformal diagram follows Davis &amp; Lineweaver (2004).</>}
      es={<>Los diagramas de Penrose usan coordenadas de Kruskal–Szekeres, con <Tex>r(U,V)</Tex> obtenida de la rama principal de la función <Tex>W</Tex> de Lambert, compactificadas con <Tex>\arctan</Tex>. El universo es ΛCDM plano con radiación (Planck 2018). Las distancias y los tiempos se calculan por cuadratura de Simpson adaptativa, con el cambio <Tex>a=s^2</Tex> que suaviza la era de radiación temprana; el factor de escala a una edad dada se obtiene por bisección. El diagrama conforme sigue a Davis y Lineweaver (2004).</>} /></p>

    <h3><T en="Gravitational waves" es="Ondas gravitacionales" /></h3>
    <p><T en={<>The particle ring moves with the first-order TT-gauge displacement. The GW150914 strain is the band-passed (35–350 Hz) data of the GWOSC release P150914 for Hanford and Livingston, decimated to 4096 Hz; the numerical-relativity template from the same release is shown and labelled as a model. The chirp mass uses the leading-order (quadrupole) formula; the ringdown frequency uses the Berti–Cardoso–Will fit.</>}
      es={<>El anillo de partículas se mueve con el desplazamiento de primer orden en gauge TT. La deformación de GW150914 son los datos filtrados (35–350 Hz) de la publicación P150914 de GWOSC para Hanford y Livingston, diezmados a 4096 Hz; la plantilla de relatividad numérica de la misma publicación se muestra y se indica como modelo. La masa de chirp usa la fórmula de orden dominante (cuadrupolar); la frecuencia de ringdown usa el ajuste de Berti, Cardoso y Will.</>} /></p>

    <h3><T en="Data, verification and limits" es="Datos, verificación y límites" /></h3>
    <p><T en={<>Every observed value in the panels cites its source next to it; values not yet checked against a primary source are marked as such. Unit tests (vitest) and browser tests (Playwright, with software WebGL) run before every deploy. Known limits: chart singularities at the poles, the Möbius band seam is not glued, the black-hole image uses an illustrative thin disc, and scenes marked "schematic" are not to scale.</>}
      es={<>Cada valor observado en los paneles cita su fuente junto a él; los valores aún no comprobados con una fuente primaria se indican como tales. Antes de cada publicación se ejecutan pruebas unitarias (vitest) y pruebas en navegador (Playwright, con WebGL por software). Límites conocidos: singularidades de la carta en los polos, la costura de la banda de Möbius no está unida, la imagen del agujero negro usa un disco fino ilustrativo y las escenas marcadas como «esquemáticas» no están a escala.</>} /></p>
    <p><T en={<>Built with React, TypeScript, three.js (react-three-fiber) and KaTeX. Source code: <A href={REPO}>{REPO}</A>.</>}
      es={<>Hecho con React, TypeScript, three.js (react-three-fiber) y KaTeX. Código fuente: <A href={REPO}>{REPO}</A>.</>} /></p>
  </>;
}

function Legal() {
  return <>
    <h3><T en="License" es="Licencia" /></h3>
    <p><T en={<>Manifold Lab is free software under the <A href={`${REPO}/blob/main/LICENSE`}>MIT License</A>. Copyright © 2026 nightwing (GitHub: kairi99). You may use, copy, modify and distribute it, including commercially, provided the copyright and license notice are kept.</>}
      es={<>Manifold Lab es software libre bajo la <A href={`${REPO}/blob/main/LICENSE`}>licencia MIT</A>. Copyright © 2026 nightwing (GitHub: kairi99). Puedes usarlo, copiarlo, modificarlo y distribuirlo, también con fines comerciales, siempre que conserves el aviso de copyright y de licencia.</>} /></p>

    <h3><T en="No warranty" es="Sin garantía" /></h3>
    <p><T en={<>The software is provided "as is", without warranty of any kind. It is an educational tool: results are computed with care and tested, but must not be used for navigation, engineering, medical or safety decisions. Illustrations are marked as such.</>}
      es={<>El software se proporciona «tal cual», sin garantía de ningún tipo. Es una herramienta educativa: los resultados se calculan con cuidado y se prueban, pero no deben usarse para decisiones de navegación, ingeniería, medicina o seguridad. Las ilustraciones se indican como tales.</>} /></p>

    <h3><T en="Privacy" es="Privacidad" /></h3>
    <p><T en={<>The app has no accounts, cookies, analytics or trackers, and sends nothing you do or type to any server. It stores only these preferences in your browser's local storage, on your device: theme and language (<code>manifoldlab.theme</code>, <code>manifoldlab.lang</code>), which guides you have seen (<code>manifoldlab.tourSeen.*</code>), completed tasks (<code>manifoldlab.tasksDone</code>) and your custom surface (<code>manifoldlab.customSurface</code>). Clearing the site data in your browser removes them.</>}
      es={<>La aplicación no tiene cuentas, cookies, analítica ni rastreadores, y no envía a ningún servidor nada de lo que haces o escribes. Solo guarda estas preferencias en el almacenamiento local de tu navegador, en tu dispositivo: tema e idioma (<code>manifoldlab.theme</code>, <code>manifoldlab.lang</code>), las guías ya vistas (<code>manifoldlab.tourSeen.*</code>), las tareas completadas (<code>manifoldlab.tasksDone</code>) y tu superficie personalizada (<code>manifoldlab.customSurface</code>). Borrar los datos del sitio en el navegador las elimina.</>} /></p>
    <p><T en={<>The site is hosted on GitHub Pages. GitHub may log technical data such as your IP address when it serves the pages; see the <A href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">GitHub General Privacy Statement</A>.</>}
      es={<>El sitio está alojado en GitHub Pages. GitHub puede registrar datos técnicos, como tu dirección IP, al servir las páginas; consulta la <A href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement">declaración de privacidad de GitHub</A>.</>} /></p>

    <h3><T en="Third-party software" es="Software de terceros" /></h3>
    <p><T en="All under the MIT License:" es="Todo bajo la licencia MIT:" /></p>
    <ul>
      <li>React, React DOM — Meta Platforms, Inc. and affiliates</li>
      <li>three.js — three.js authors</li>
      <li>@react-three/fiber, @react-three/drei — Poimandres</li>
      <li>zustand — Paul Henschel and contributors</li>
      <li><T en="KaTeX, including its fonts — Khan Academy and contributors" es="KaTeX, incluidas sus fuentes — Khan Academy y colaboradores" /></li>
    </ul>

    <h3><T en="Data and acknowledgements" es="Datos y agradecimientos" /></h3>
    <ul>
      <li><T en={<>GW150914 strain and template: <A href="https://gwosc.org">Gravitational Wave Open Science Center</A>, licensed CC BY 4.0. This app uses data obtained from the Gravitational Wave Open Science Center (gwosc.org), a service of the LIGO Scientific Collaboration, the Virgo Collaboration and KAGRA.</>}
        es={<>Deformación y plantilla de GW150914: <A href="https://gwosc.org">Gravitational Wave Open Science Center</A>, con licencia CC BY 4.0. Esta aplicación usa datos obtenidos del Gravitational Wave Open Science Center (gwosc.org), un servicio de la LIGO Scientific Collaboration, la Virgo Collaboration y KAGRA.</>} /></li>
      <li><T en={<>Redshifts of galaxies and quasars: this app has made use of the NASA/IPAC Extragalactic Database (NED), which is funded by NASA and operated by the California Institute of Technology.</>}
        es={<>Desplazamientos al rojo de galaxias y cuásares: esta aplicación ha usado la NASA/IPAC Extragalactic Database (NED), financiada por la NASA y operada por el California Institute of Technology.</>} /></li>
      <li><T en="Cosmological parameters: Planck Collaboration, A&A 641, A6 (2020). Other observed values are cited next to each one in the panels."
        es="Parámetros cosmológicos: Planck Collaboration, A&A 641, A6 (2020). Los demás valores observados se citan junto a cada uno en los paneles." /></li>
    </ul>

    <h3><T en="Contact" es="Contacto" /></h3>
    <p><T en={<>Questions, corrections and bug reports: <A href={`${REPO}/issues`}>GitHub issues</A>.</>}
      es={<>Preguntas, correcciones e informes de errores: <A href={`${REPO}/issues`}>issues de GitHub</A>.</>} /></p>
  </>;
}

export function InfoDialog() {
  const page = useStore((s) => s.infoOpen), set = useStore((s) => s.set);
  const t = useTr();
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!page) return;
    const opener = document.activeElement as HTMLElement | null;
    box.current?.focus();
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') set({ infoOpen: null }); };
    window.addEventListener('keydown', h);
    return () => { window.removeEventListener('keydown', h); opener?.focus?.(); };
  }, [page, set]);
  if (!page) return null;
  const close = () => set({ infoOpen: null });
  return (
    <div className="theory-overlay" onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div ref={box} className="theory" role="dialog" aria-modal="true" aria-labelledby="info-title" tabIndex={-1}>
        <header>
          <h2 id="info-title">{page === 'technical' ? t('Technical details', 'Detalles técnicos') : t('Legal information', 'Información legal')}</h2>
          <button onClick={close} aria-label={t('Close', 'Cerrar')}>✕</button>
        </header>
        <div className="theory-body info-body">{page === 'technical' ? <Technical /> : <Legal />}</div>
      </div>
    </div>
  );
}
