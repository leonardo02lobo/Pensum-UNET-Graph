import type { Materia, Sector } from '../data/types'
import { SECTORES } from '../data/types'

/**
 * Layout sunburst orbital (D3, D4 — spec `orbital-graph-view`).
 *
 *   radio     = semestre    → los anillos concéntricos son el tiempo
 *   ángulo    = sector      → cada brazo es un área de conocimiento
 *   elevación = desempate   → separa materias que caen en la misma celda
 *
 * Es una función PURA de coordenadas. No sabe qué es three.js. El render la
 * consume y fija las posiciones; ningún solver las mueve después.
 *
 * Consecuencia buscada: como el radio crece con el semestre y toda prelación
 * va de un semestre anterior a uno posterior, TODA arista apunta hacia afuera.
 * La dirección se lee sin flechas.
 */

export interface Punto3D {
  readonly x: number
  readonly y: number
  readonly z: number
}

export interface NodoUbicado extends Punto3D {
  readonly id: string
  /** Radio en el plano XZ. */
  readonly radio: number
  /** Ángulo en radianes. */
  readonly angulo: number
}

export interface OpcionesLayout {
  /** Radio del anillo del semestre 1. */
  readonly radioBase: number
  /** Incremento de radio por semestre. */
  readonly radioPaso: number
  /** Separación vertical entre materias que comparten celda. */
  readonly pasoElevacion: number
  /** Desplazamiento vertical de la órbita libre (materias sin sector). */
  readonly elevacionOrbitaLibre: number
  /** Fracción del arco de un sector que se deja como margen entre brazos. */
  readonly margenSector: number
  /**
   * Ángulo donde arranca el primer sector, en radianes. Sitúa la costura del
   * sunburst — el único ángulo garantizado sin materias — y por tanto dónde
   * pueden colgarse las etiquetas de semestre sin pisar nada.
   */
  readonly anguloInicial: number
}

export const OPCIONES_POR_DEFECTO: OpcionesLayout = {
  // El anillo del semestre 1 arranca lejos del centro a propósito: su
  // circunferencia es lo que limita cuánto pueden separarse las materias de
  // los primeros semestres, y por tanto cuán grandes pueden dibujarse los
  // nodos. Un radio base pequeño amontona el núcleo sin ahorrar espacio real.
  radioBase: 130,
  radioPaso: 52,
  pasoElevacion: 26,
  elevacionOrbitaLibre: 150,
  margenSector: 0.12,
  // 270° deja la costura en la parte alta de la pantalla con la cámara inicial,
  // que es zona libre de cromo.
  anguloInicial: (3 * Math.PI) / 2,
}

/**
 * Orden cíclico de los sectores (D4).
 *
 * Elegido para dejar adyacentes los pares que realmente se cruzan:
 * gestion↔formacion (Economía → Legislación), matematica↔gestion (Mat II →
 * Economía), matematica↔ciencias (Mat I → Física I), ciencias↔sistemas
 * (Física II → Lógica Digital), sistemas↔programacion (S.O. → Compiladores),
 * programacion↔datos (Prog II → BD I). Queda un solo cruce largo aceptado:
 * Matemática Discreta → Programación I.
 *
 * `deportiva` se inserta entre `grado` y `formacion` porque `grado` es el único
 * sector sin aristas cruzadas: meterlo ahí no separa ningún par que las tenga.
 */
export const ORDEN_SECTORES: readonly Sector[] = [
  'formacion',
  'gestion',
  'matematica',
  'ciencias',
  'sistemas',
  'programacion',
  'datos',
  'grado',
  'deportiva',
]

export interface ArcoSector {
  readonly sector: Sector
  /** Ángulo inicial en radianes. */
  readonly desde: number
  /** Ángulo final en radianes. */
  readonly hasta: number
  readonly materias: number
}

const TAU = Math.PI * 2

/**
 * Reparte los 360° entre los sectores, con amplitud proporcional al número de
 * materias de cada uno. Que `matematica` (11) sea el brazo más ancho de la
 * carrera es información, no decoración.
 */
export function arcosDeSectores(
  materias: readonly Materia[],
  opciones: OpcionesLayout = OPCIONES_POR_DEFECTO,
): ArcoSector[] {
  const conteo = new Map<Sector, number>(SECTORES.map((s) => [s, 0]))
  for (const m of materias) {
    if (m.sector !== null) conteo.set(m.sector, conteo.get(m.sector)! + 1)
  }

  const total = [...conteo.values()].reduce((a, b) => a + b, 0)
  const arcos: ArcoSector[] = []
  let cursor = opciones.anguloInicial

  for (const sector of ORDEN_SECTORES) {
    const n = conteo.get(sector) ?? 0
    const amplitud = total === 0 ? 0 : (n / total) * TAU
    arcos.push({ sector, desde: cursor, hasta: cursor + amplitud, materias: n })
    cursor += amplitud
  }

  return arcos
}

export function radioDeSemestre(semestre: number, o: OpcionesLayout): number {
  return o.radioBase + (semestre - 1) * o.radioPaso
}

/**
 * Reparte `n` posiciones uniformemente dentro de `[desde, hasta]`, dejando un
 * margen a cada lado para que los brazos vecinos no se toquen. Una sola materia
 * queda centrada en su arco.
 */
function repartirEnArco(desde: number, hasta: number, n: number, margen: number): number[] {
  const amplitud = hasta - desde
  const borde = amplitud * margen * 0.5
  const util = amplitud - borde * 2
  if (n <= 1) return [desde + amplitud / 2]
  return Array.from({ length: n }, (_, i) => desde + borde + (util * i) / (n - 1))
}

/** Escalonamiento simétrico respecto al plano del anillo: 0, ±1, ±2… */
function elevaciones(n: number, paso: number): number[] {
  return Array.from({ length: n }, (_, i) => (i - (n - 1) / 2) * paso)
}

/**
 * Calcula la posición de cada materia. Determinista: mismas materias, mismas
 * coordenadas, siempre. El orden de entrada no altera el resultado — se ordena
 * por id antes de repartir.
 */
export function calcularLayout(
  materias: readonly Materia[],
  opciones: OpcionesLayout = OPCIONES_POR_DEFECTO,
): Map<string, NodoUbicado> {
  const arcos = new Map(arcosDeSectores(materias, opciones).map((a) => [a.sector, a]))
  const resultado = new Map<string, NodoUbicado>()

  // Agrupar por celda (sector, semestre). `null` es la órbita libre.
  const celdas = new Map<string, Materia[]>()
  for (const m of materias) {
    const clave = `${m.sector ?? '·libre'}::${m.semestre}`
    const celda = celdas.get(clave)
    if (celda) celda.push(m)
    else celdas.set(clave, [m])
  }

  for (const [clave, integrantes] of celdas) {
    // Orden estable para que el reparto no dependa del orden del dataset.
    const orden = [...integrantes].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    const esOrbitaLibre = clave.startsWith('·libre::')
    const radio = radioDeSemestre(orden[0].semestre, opciones)

    // Las materias sin sector no pertenecen a ningún brazo: se reparten en la
    // circunferencia completa, elevadas fuera del plano principal.
    const [desde, hasta] = esOrbitaLibre
      ? [opciones.anguloInicial, opciones.anguloInicial + TAU]
      : (() => {
          const arco = arcos.get(orden[0].sector as Sector)!
          return [arco.desde, arco.hasta]
        })()

    const angulos = esOrbitaLibre
      ? Array.from(
          { length: orden.length },
          (_, i) => opciones.anguloInicial + (TAU * i) / orden.length,
        )
      : repartirEnArco(desde, hasta, orden.length, opciones.margenSector)

    const ys = elevaciones(orden.length, opciones.pasoElevacion)
    const base = esOrbitaLibre ? opciones.elevacionOrbitaLibre : 0

    orden.forEach((m, i) => {
      const angulo = angulos[i]
      resultado.set(m.id, {
        id: m.id,
        radio,
        angulo,
        x: radio * Math.cos(angulo),
        y: base + ys[i],
        z: radio * Math.sin(angulo),
      })
    })
  }

  return resultado
}

export function distancia(a: Punto3D, b: Punto3D): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)
}

/**
 * Distancia entre las dos materias más cercanas del layout.
 *
 * Es el presupuesto de tamaño de los nodos: dibujarlos con un radio menor que
 * la mitad de esto garantiza que ninguna pareja se solape. El render deriva su
 * tamaño de aquí en vez de llevar un número fijo, así que si el layout cambia,
 * los nodos se ajustan solos y nunca se pisan.
 */
export function separacionMinima(layout: ReadonlyMap<string, NodoUbicado>): number {
  const puntos = [...layout.values()]
  let min = Infinity
  for (let i = 0; i < puntos.length; i++) {
    for (let j = i + 1; j < puntos.length; j++) {
      const d = distancia(puntos[i], puntos[j])
      if (d < min) min = d
    }
  }
  return Number.isFinite(min) ? min : 0
}

/** Radio de la esfera centrada en el origen que contiene todo el layout. */
export function radioEnvolvente(layout: ReadonlyMap<string, NodoUbicado>): number {
  let r = 0
  for (const p of layout.values()) r = Math.max(r, Math.hypot(p.x, p.y, p.z))
  return r
}

/**
 * Distancia de cámara a la que la escena entera cabe en el encuadre.
 *
 * `zoomToFit` de react-force-graph depende del ciclo de simulación, que aquí
 * está desactivado (D3), así que el encuadre se calcula: para una esfera
 * envolvente de radio R y una cámara de campo vertical `fovGrados`, la
 * distancia mínima es R / sin(fov/2).
 *
 * El fov por defecto es 50 porque react-force-graph construye su cámara con
 * `new THREE.PerspectiveCamera()` sin argumentos, y ese es el valor por
 * defecto de three.js. En three el fov es SIEMPRE el vertical, así que en una
 * ventana más alta que ancha el campo que limita es el horizontal, y hay que
 * alejarse más para que la escena entre.
 */
export function distanciaDeCamara(
  radio: number,
  fovGrados = 50,
  margen = 1.12,
  aspecto = 1,
): number {
  const medioFovVertical = ((fovGrados / 2) * Math.PI) / 180
  const medioFov =
    aspecto >= 1
      ? medioFovVertical
      : Math.atan(Math.tan(medioFovVertical) * aspecto)
  return (radio / Math.sin(medioFov)) * margen
}

// ─── Referencias visibles de la geometría ──────────────────────────────────
//
// El diseño codifica el semestre en el radio y el sector en el ángulo, pero sin
// nada dibujado esas dos reglas son invisibles: el usuario tiene que creerse la
// explicación en vez de leerla de la escena. Estos anclajes se dibujan como
// anillos guía y nombres de brazo.

export interface Anillo {
  readonly semestre: number
  readonly radio: number
  /** Punto sobre la costura donde colgar la etiqueta "S1"…"S10". */
  readonly etiqueta: Punto3D
}

export interface Brazo {
  readonly sector: Sector
  /** Punto pasada la última materia del brazo, donde va su nombre. */
  readonly etiqueta: Punto3D
}

export interface Referencias {
  readonly anillos: readonly Anillo[]
  readonly brazos: readonly Brazo[]
}

export function referencias(
  materias: readonly Materia[],
  opciones: OpcionesLayout = OPCIONES_POR_DEFECTO,
): Referencias {
  const semestres = [...new Set(materias.map((m) => m.semestre))].sort((a, b) => a - b)

  // Las etiquetas de semestre cuelgan de la costura, el único ángulo sin
  // materias, así que nunca tapan un nodo.
  const costura = opciones.anguloInicial
  const anillos: Anillo[] = semestres.map((semestre) => {
    const radio = radioDeSemestre(semestre, opciones)
    return {
      semestre,
      radio,
      etiqueta: { x: radio * Math.cos(costura), y: 0, z: radio * Math.sin(costura) },
    }
  })

  // El nombre del brazo va justo fuera de su materia más lejana, en el centro
  // angular del sector.
  const arcos = arcosDeSectores(materias, opciones)
  const brazos: Brazo[] = []
  for (const arco of arcos) {
    const delSector = materias.filter((m) => m.sector === arco.sector)
    if (delSector.length === 0) continue
    const radioMax = Math.max(
      ...delSector.map((m) => radioDeSemestre(m.semestre, opciones)),
    )
    const radio = radioMax + opciones.radioPaso * 0.75
    const angulo = (arco.desde + arco.hasta) / 2
    brazos.push({
      sector: arco.sector,
      etiqueta: { x: radio * Math.cos(angulo), y: 0, z: radio * Math.sin(angulo) },
    })
  }

  return { anillos, brazos }
}
