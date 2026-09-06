import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ForceGraph3D, { type ForceGraphMethods } from "react-force-graph-3d";
import * as THREE from "three";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { formatearUmbral, type Materia, type Sector } from "../data/types";
import { aristas as aristasDe, type PensumGraph } from "../model/graph";
import { claveArista, rolEnCono, type Resaltado } from "../model/resaltado";
import type { EstadoMateria } from "../progreso/estados";
import {
  calcularLayout,
  distanciaDeCamara,
  radioEnvolvente,
  referencias,
  separacionMinima,
  type Anillo,
} from "../layout/orbital";
import { CapaEtiquetas, type ItemEtiqueta } from "./CapaEtiquetas";
import { NOMBRE_SECTOR, colorDeSector, leerTokens } from "./tokens";

/**
 * Render 3D del sunburst orbital (spec `orbital-graph-view`).
 *
 * Consume coordenadas ya calculadas por `layout/orbital` y las fija con
 * fx/fy/fz. La simulación de fuerzas queda desactivada (`cooldownTicks={0}`):
 * los nodos aparecen en su sitio en el primer frame, sin converger ni temblar.
 *
 * Los objetos three.js se construyen UNA vez y se mutan al resaltar, en vez de
 * regenerarse. Evita el parpadeo al mover el cursor.
 */

interface NodoGrafo {
  id: string;
  materia: Materia;
  fx: number;
  fy: number;
  fz: number;
  x: number;
  y: number;
  z: number;
}

interface EnlaceGrafo {
  source: string;
  target: string;
  tipo: "intra-sector" | "cruce-sector" | "correquisito";
}

/** Órdenes de cámara que la UI puede pedir. `nonce` fuerza la repetición. */
export type OrdenCamara =
  | { tipo: "inicial"; nonce: number }
  | { tipo: "cenital"; nonce: number }
  | { tipo: "enfocar"; id: string; nonce: number };

interface Props {
  readonly grafo: PensumGraph;
  readonly resaltado: Resaltado | null;
  readonly sectorFiltrado: Sector | null;
  readonly semestreFiltrado: number | null;
  readonly estadoFiltrado: EstadoMateria | null;
  readonly estados: ReadonlyMap<string, EstadoMateria>;
  /** Falso mientras el historial esté vacío: sin datos no se atenúa nada. */
  readonly progresoActivo: boolean;
  readonly girando: boolean;
  readonly panelAbierto: boolean;
  readonly onHover: (id: string | null) => void;
  readonly onSelect: (id: string | null) => void;
  readonly orden: OrdenCamara | null;
}

/**
 * Radio del nodo como fracción de la separación mínima del layout. En 0.5 los
 * nodos más cercanos se tocarían; por debajo de 0.3 quedan claramente sueltos.
 * Derivarlo así evita que un cambio en el layout deje los nodos diminutos o
 * solapados sin que nadie se entere.
 */
const FRACCION_RADIO_NODO = 0.29;
/** Las materias con compuerta se dibujan algo menores: no están ancladas. */
const FRACCION_RADIO_GATE = 0.23;
/** Separación cámara-nodo al enfocar, como fracción del encuadre completo. */
const FRACCION_ENFOQUE = 0.78;
/** Ancho del panel de detalle (22rem + margen), para que las etiquetas lo esquiven. */
const ANCHO_PANEL = 368;

/**
 * Cuánto se apaga cada estado.
 *
 * `disponible` se queda con toda la luz porque es la respuesta a «qué inscribo
 * ahora»; lo ya aprobado cede protagonismo sin desaparecer — está hecho, ya no
 * es una decisión. Lo bloqueado se retira, y el bloqueo por crédito queda algo
 * más presente que el de prelación porque está más cerca de abrirse.
 */
const OPACIDAD_ESTADO: Readonly<Record<EstadoMateria, number>> = {
  aprobada: 0.7,
  "en-curso": 0.85,
  disponible: 1,
  "bloqueada-prelacion": 0.16,
  "bloqueada-credito": 0.28,
};

const TAU = Math.PI * 2;

interface Tamano {
  readonly ancho: number;
  readonly alto: number;
}

/**
 * Mide el contenedor y lo sigue.
 *
 * `react-force-graph-3d` mide su contenedor UNA vez al montar y no observa
 * cambios: al maximizar la ventana el canvas se queda con el tamaño viejo
 * mientras la capa de etiquetas —que sí mide— proyecta sobre el nuevo, y las
 * etiquetas se despegan de sus nodos. Controlando `width`/`height` a mano el
 * canvas, la cámara y las etiquetas comparten siempre las mismas dimensiones.
 */
function useTamanoDe(ref: React.RefObject<HTMLElement | null>): Tamano {
  const [tamano, setTamano] = useState<Tamano>({ ancho: 0, alto: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = (ancho: number, alto: number) =>
      setTamano((previo) =>
        previo.ancho === ancho && previo.alto === alto
          ? previo
          : { ancho, alto },
      );
    medir(el.clientWidth, el.clientHeight);
    const observador = new ResizeObserver(([entrada]) => {
      const { width, height } = entrada.contentRect;
      medir(Math.round(width), Math.round(height));
    });
    observador.observe(el);
    return () => observador.disconnect();
  }, [ref]);

  return tamano;
}

/** Anillos guía en el plano: hacen visible que el radio es el semestre. */
function crearAnillos(anillos: readonly Anillo[], color: string): THREE.Group {
  const grupo = new THREE.Group();
  for (const a of anillos) {
    const puntos: THREE.Vector3[] = [];
    for (let i = 0; i <= 160; i++) {
      const t = (i / 160) * TAU;
      puntos.push(
        new THREE.Vector3(a.radio * Math.cos(t), 0, a.radio * Math.sin(t)),
      );
    }
    grupo.add(
      new THREE.LineLoop(
        new THREE.BufferGeometry().setFromPoints(puntos),
        new THREE.LineBasicMaterial({
          color: new THREE.Color(color),
          transparent: true,
          opacity: 0.18,
        }),
      ),
    );
  }
  return grupo;
}

export function GrafoOrbital({
  grafo,
  resaltado,
  sectorFiltrado,
  semestreFiltrado,
  estadoFiltrado,
  estados,
  progresoActivo,
  girando,
  panelAbierto,
  onHover,
  onSelect,
  orden,
}: Props) {
  const fgRef = useRef<ForceGraphMethods<NodoGrafo, EnlaceGrafo> | undefined>(
    undefined,
  );
  const contenedor = useRef<HTMLDivElement>(null);
  const tamano = useTamanoDe(contenedor);
  const tokens = useMemo(() => leerTokens(), []);
  const objetos = useRef(
    new Map<string, { grupo: THREE.Group; esfera: THREE.Mesh }>(),
  );

  // Los accesores de enlace se evalúan en cada refresh; leen el estado desde
  // una ref para no tener que recrear las funciones.
  const resaltadoRef = useRef(resaltado);
  resaltadoRef.current = resaltado;

  const datos = useMemo(() => {
    const layout = calcularLayout(grafo.pensum.materias);
    const radio = radioEnvolvente(layout);
    const separacion = separacionMinima(layout);
    const radioNodo = separacion * FRACCION_RADIO_NODO;
    const radioGate = separacion * FRACCION_RADIO_GATE;
    const nodes: NodoGrafo[] = grafo.pensum.materias.map((m) => {
      const p = layout.get(m.id)!;
      return {
        id: m.id,
        materia: m,
        fx: p.x,
        fy: p.y,
        fz: p.z,
        x: p.x,
        y: p.y,
        z: p.z,
      };
    });
    const links: EnlaceGrafo[] = [
      ...aristasDe(grafo).map((a) => ({
        source: a.desde,
        target: a.hasta,
        tipo: a.tipo,
      })),
      ...grafo.correquisitos.map((c) => ({
        source: c.a,
        target: c.b,
        tipo: "correquisito" as const,
      })),
    ];
    return {
      nodes,
      links,
      layout,
      radio,
      radioNodo,
      radioGate,
      refs: referencias(grafo.pensum.materias),
    };
  }, [grafo]);

  // El encuadre se recalcula con el aspecto vigente en vez de quedar fijado al
  // del montaje: con la ventana más alta que ancha el campo que limita es el
  // horizontal.
  const tamanoRef = useRef(tamano);
  tamanoRef.current = tamano;
  const distanciaCamara = useCallback(() => {
    const { ancho, alto } = tamanoRef.current;
    return distanciaDeCamara(
      datos.radio,
      50,
      1.12,
      alto > 0 ? ancho / alto : 1,
    );
  }, [datos]);

  const estaFiltrada = useCallback(
    (m: Materia) =>
      (sectorFiltrado !== null && m.sector !== sectorFiltrado) ||
      (semestreFiltrado !== null && m.semestre !== semestreFiltrado) ||
      (estadoFiltrado !== null && estados.get(m.id) !== estadoFiltrado),
    [sectorFiltrado, semestreFiltrado, estadoFiltrado, estados],
  );

  // El estilado se aplica en dos momentos: al crear cada nodo y cuando cambia
  // algo. Solo con el efecto no basta — en el primer render `react-force-graph`
  // todavía no ha pedido los objetos, así que el mapa está vacío y un historial
  // ya cargado no se vería reflejado hasta la siguiente interacción.
  const entradas = useRef({ resaltado, estaFiltrada, estados, progresoActivo });
  entradas.current = { resaltado, estaFiltrada, estados, progresoActivo };

  const aplicarEstilo = useCallback(
    (id: string, obj: { esfera: THREE.Mesh }) => {
      const materia = grafo.materias.get(id);
      if (!materia) return;
      const e = entradas.current;

      const rol = rolEnCono(e.resaltado, id);
      const fuera = e.estaFiltrada(materia);
      const atenuado = (e.resaltado !== null && rol === "fuera") || fuera;

      const material = obj.esfera.material as THREE.MeshBasicMaterial;
      let base = materia.gate !== null ? 0.45 : 1;

      // El estado modula el color del sector en vez de sustituirlo: la materia
      // sigue diciendo a qué brazo pertenece. Con historial vacío no se atenúa
      // nada, para que la vista de partida sea la de siempre.
      const estado = e.estados.get(id);
      if (e.progresoActivo && estado) base *= OPACIDAD_ESTADO[estado];

      material.opacity = atenuado ? 0.06 : base;

      // Los descendientes se hinchan un poco: lo que se desbloquea "crece".
      // Y lo disponible destaca siempre, porque es la respuesta a qué inscribir.
      let escala =
        rol === "activo" && e.resaltado !== null
          ? 1.35
          : rol === "descendiente"
            ? 1.12
            : 1;
      if (e.progresoActivo && estado === "disponible") escala *= 1.3;
      obj.esfera.scale.setScalar(escala);
    },
    [grafo],
  );

  // ── Nodos: se construyen una vez y se conservan ────────────────────────────
  const nodeThreeObject = useCallback(
    (nodo: NodoGrafo) => {
      const cacheado = objetos.current.get(nodo.id);
      if (cacheado) return cacheado.grupo;

      const m = nodo.materia;
      const esGate = m.gate !== null;
      const color = new THREE.Color(
        esGate ? tokens.gate : colorDeSector(tokens, m.sector),
      );
      const radio = esGate ? datos.radioGate : datos.radioNodo;

      const grupo = new THREE.Group();
      const esfera = new THREE.Mesh(
        new THREE.SphereGeometry(radio, 24, 16),
        new THREE.MeshBasicMaterial({
          color,
          // Las compuertas por créditos se leen como "todavía no anclado".
          transparent: true,
          opacity: esGate ? 0.45 : 1,
        }),
      );
      grupo.add(esfera);

      objetos.current.set(nodo.id, { grupo, esfera });
      aplicarEstilo(nodo.id, { esfera });
      return grupo;
    },
    [tokens, datos, aplicarEstilo],
  );

  // Si el layout cambia, los objetos cacheados quedan con el radio viejo.
  useEffect(() => {
    objetos.current.clear();
  }, [datos]);

  // ── Reaplicar cuando cambia algo ──────────────────────────────────────────
  useEffect(() => {
    for (const [id, obj] of objetos.current) aplicarEstilo(id, obj);
    fgRef.current?.refresh();
  }, [resaltado, estaFiltrada, estados, progresoActivo, aplicarEstilo]);

  // ── Escena: anillos guía ──────────────────────────────────────────────────
  useEffect(() => {
    const fg = fgRef.current;
    if (!fg) return;
    const escena = fg.scene();
    const anillos = crearAnillos(datos.refs.anillos, tokens.edgeCross);
    escena.add(anillos);
    return () => {
      escena.remove(anillos);
    };
  }, [datos, tokens]);

  // ── Cámara ────────────────────────────────────────────────────────────────
  const encuadrado = useRef(false);
  useEffect(() => {
    const fg = fgRef.current;
    // Se espera a tener medida real: encuadrar con el contenedor a cero deja
    // la cámara en un sitio absurdo del que el usuario no sabe volver.
    if (!fg || tamano.ancho === 0 || tamano.alto === 0 || encuadrado.current)
      return;
    encuadrado.current = true;

    // El zoom se acota para que la estructura nunca se pierda de vista ni el
    // bloom se queme por acercarse demasiado a un nodo.
    const controles = fg.controls() as {
      minDistance?: number;
      maxDistance?: number;
    };
    controles.minDistance = 180;
    controles.maxDistance = distanciaCamara() * 2.2;

    // ~60° sobre el plano: cenital para leer anillos y brazos, inclinada para
    // que se note el relieve. La distancia sale de la esfera envolvente del
    // layout, no de un número a ojo.
    const d = distanciaCamara();
    fg.cameraPosition({ x: 0, y: d * 0.866, z: d * 0.5 });

    const composer = fg.postProcessingComposer();
    if (composer) {
      // Bloom deliberadamente contenido. La paleta tiene el doble de luminancia
      // entre el token más claro (amarillo, lima) y el más oscuro (morado,
      // rosa): cualquier ajuste que ilumine a los apagados funde a los
      // brillantes en cápsulas. Poco halo y umbral alto separa a todos.
      composer.addPass(
        new UnrealBloomPass(new THREE.Vector2(1, 1), 0.32, 0.25, 0.6),
      );
    }
  }, [datos, tamano, distanciaCamara]);

  useEffect(() => {
    const controles = fgRef.current?.controls() as
      { autoRotate?: boolean; autoRotateSpeed?: number } | undefined;
    if (!controles) return;
    controles.autoRotate = girando;
    controles.autoRotateSpeed = 0.45;
  }, [girando]);

  useEffect(() => {
    if (!orden) return;
    const fg = fgRef.current;
    if (!fg) return;
    const d = distanciaCamara();

    if (orden.tipo === "inicial") {
      fg.cameraPosition(
        { x: 0, y: d * 0.866, z: d * 0.5 },
        { x: 0, y: 0, z: 0 },
        700,
      );
      return;
    }
    if (orden.tipo === "cenital") {
      // Casi a plomo: la vista donde brazos y anillos se leen sin deformación,
      // a costa de perder el relieve.
      fg.cameraPosition({ x: 0, y: d, z: 0.001 }, { x: 0, y: 0, z: 0 }, 700);
      return;
    }

    const nodo = datos.nodes.find((n) => n.id === orden.id);
    if (!nodo) return;
    // La cámara se coloca a distancia fija del nodo, alejándose del origen por
    // su misma dirección radial: el nodo queda centrado pero su brazo sigue
    // visible. Enfocar no debe perder el contexto.
    const largo = Math.hypot(nodo.x, nodo.y, nodo.z) || 1;
    const s = d * FRACCION_ENFOQUE;
    fg.cameraPosition(
      {
        x: nodo.x + (nodo.x / largo) * s,
        y: nodo.y + (nodo.y / largo) * s + s * 0.45,
        z: nodo.z + (nodo.z / largo) * s,
      },
      { x: nodo.x, y: nodo.y, z: nodo.z },
      900,
    );
  }, [orden, datos, distanciaCamara]);

  // ── Etiquetas ─────────────────────────────────────────────────────────────
  const items = useMemo<ItemEtiqueta[]>(() => {
    const lista: ItemEtiqueta[] = [];

    // Referencias siempre visibles: hacen legible la geometría sin interacción.
    for (const a of datos.refs.anillos) {
      const apagado =
        semestreFiltrado !== null && semestreFiltrado !== a.semestre;
      lista.push({
        id: `anillo-${a.semestre}`,
        pos: a.etiqueta,
        texto: `S${a.semestre}`,
        clase: `text-[10px] font-medium tabular-nums ${
          apagado ? "text-slate-700" : "text-slate-500"
        }`,
        prioridad: 80,
        desplazamientoY: -7,
      });
    }
    for (const b of datos.refs.brazos) {
      const apagado = sectorFiltrado !== null && sectorFiltrado !== b.sector;
      lista.push({
        id: `brazo-${b.sector}`,
        pos: b.etiqueta,
        texto: NOMBRE_SECTOR[b.sector].toUpperCase(),
        clase: `text-[10px] font-semibold tracking-[0.14em] ${
          apagado ? "text-slate-700" : "text-slate-400"
        }`,
        prioridad: 60,
        desplazamientoY: -7,
      });
    }

    // Nombres de materia: solo donde aportan — cursor, selección y cono.
    if (resaltado !== null) {
      for (const [id, p] of datos.layout) {
        const materia = grafo.materias.get(id);
        if (!materia || estaFiltrada(materia)) continue;
        const rol = rolEnCono(resaltado, id);
        if (rol === "fuera") continue;
        const sufijo =
          materia.gate !== null ? `  ·  ${formatearUmbral(materia.gate)}` : "";
        lista.push({
          id,
          pos: p,
          texto: materia.nombre + sufijo,
          clase:
            rol === "activo"
              ? "text-[12px] font-semibold text-white"
              : rol === "ancestro"
                ? "text-[11px] text-sky-200"
                : rol === "descendiente"
                  ? "text-[11px] text-fuchsia-200"
                  : "text-[11px] text-slate-300",
          prioridad: rol === "activo" ? 0 : rol === "ancestro" ? 10 : 20,
        });
      }
    } else if (semestreFiltrado !== null) {
      // Recorriendo por semestre se etiqueta el anillo entero.
      for (const [id, p] of datos.layout) {
        const materia = grafo.materias.get(id);
        if (!materia || materia.semestre !== semestreFiltrado) continue;
        if (sectorFiltrado !== null && materia.sector !== sectorFiltrado)
          continue;
        lista.push({
          id,
          pos: p,
          texto: materia.nombre,
          clase: "text-[11px] text-slate-200",
          prioridad: 30,
        });
      }
    }

    return lista;
  }, [datos, resaltado, semestreFiltrado, sectorFiltrado, estaFiltrada, grafo]);

  const obtenerCamara = useCallback(() => fgRef.current?.camera(), []);

  // ── Accesores de enlace ───────────────────────────────────────────────────
  const enElConoArista = (l: EnlaceGrafo): boolean => {
    const r = resaltadoRef.current;
    if (r === null) return true;
    const desde = idDe(l.source);
    const hasta = idDe(l.target);
    if (l.tipo === "correquisito")
      return desde === r.activo || hasta === r.activo;
    return r.aristas.has(claveArista(desde, hasta));
  };

  const linkColor = (l: EnlaceGrafo): string => {
    if (l.tipo === "correquisito") return tokens.edgeCorreq;
    const r = resaltadoRef.current;
    if (r !== null && enElConoArista(l)) {
      // Hacia atrás y hacia adelante se distinguen por color.
      return r.ancestros.has(idDe(l.target)) || idDe(l.target) === r.activo
        ? "#38bdf8"
        : "#f0abfc";
    }
    return l.tipo === "cruce-sector" ? tokens.edgeCross : tokens.edgeIntra;
  };

  const linkWidth = (l: EnlaceGrafo): number => {
    // En proporción al nodo: si los nodos crecen, las aristas no deben quedar
    // como pelos al lado.
    const u = datos.radioNodo / 14;
    if (resaltadoRef.current !== null)
      return enElConoArista(l) ? 2.4 * u : 0.15 * u;
    // Las que cruzan brazos son los momentos interesantes del pensum.
    return (l.tipo === "cruce-sector" ? 1.1 : 0.6) * u;
  };

  return (
    <div ref={contenedor} className="relative h-full w-full">
      {/* Hasta tener medida real no se monta: con 0×0 WebGL dibuja sobre un
          framebuffer vacío y la cámara queda con aspecto NaN. `useLayoutEffect`
          mide antes del primer pintado, así que no se ve ningún salto. */}
      {tamano.ancho > 0 && tamano.alto > 0 && (
        <ForceGraph3D<NodoGrafo, EnlaceGrafo>
          ref={fgRef}
          width={tamano.ancho}
          height={tamano.alto}
          graphData={datos}
          backgroundColor={tokens.void}
          // Sin simulación: las posiciones ya vienen calculadas y fijadas.
          cooldownTicks={0}
          warmupTicks={0}
          enableNodeDrag={false}
          showNavInfo={false}
          nodeThreeObject={nodeThreeObject}
          nodeLabel={() => ""}
          linkColor={linkColor}
          linkOpacity={0.55}
          linkWidth={linkWidth}
          linkDirectionalArrowLength={(l) =>
            l.tipo === "correquisito" ? 0 : datos.radioNodo * 0.55
          }
          linkDirectionalArrowRelPos={1}
          linkDirectionalArrowColor={linkColor}
          onNodeHover={(n) => onHover(n ? n.id : null)}
          onNodeClick={(n) => onSelect(n.id)}
          onBackgroundClick={() => onSelect(null)}
        />
      )}
      <CapaEtiquetas
        obtenerCamara={obtenerCamara}
        items={items}
        bordeDerecho={panelAbierto ? window.innerWidth - ANCHO_PANEL : null}
      />
    </div>
  );
}

function idDe(extremo: string | { id: string }): string {
  return typeof extremo === "string" ? extremo : extremo.id;
}
