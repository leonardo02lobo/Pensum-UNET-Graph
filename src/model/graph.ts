import { DirectedGraph } from 'graphology'
import { topologicalSort } from 'graphology-dag'
import type { Gate, Materia, Pensum, Sector } from '../data/types'

/**
 * Modelo de grafo (spec `graph-model`).
 *
 * Frontera dura (D6): este módulo no importa React ni nada de visualización.
 * Corre en Node sin DOM. El render consume lo que aquí se calcula, nunca al revés.
 *
 * Decisiones que se materializan aquí:
 *   - Las prelaciones son aristas dirigidas `requisito → materia`, de modo que
 *     recorrer hacia adelante es "qué desbloqueo" y hacia atrás "qué necesito".
 *   - Los correquisitos viven FUERA del DAG (D8): son bidireccionales y del
 *     mismo semestre, así que ensuciarían el orden topológico.
 *   - Las compuertas por créditos no generan aristas (D2): se devuelven aparte
 *     en las consultas de cono.
 */

export type TipoArista = 'intra-sector' | 'cruce-sector'

export interface Arista {
  readonly desde: string
  readonly hasta: string
  readonly tipo: TipoArista
}

export interface Correquisito {
  readonly a: string
  readonly b: string
}

export interface Cono {
  /** Ids alcanzados, sin incluir la materia de partida. */
  readonly materias: readonly string[]
  readonly aristas: readonly Arista[]
  /** Compuerta de la materia de partida. Se devuelve aparte porque NO es un
   *  nodo del cono: es una condición sobre créditos acumulados. */
  readonly gate: Gate | null
}

export interface PensumGraph {
  /** Solo aristas de prelación. Acíclico. */
  readonly dag: DirectedGraph
  readonly materias: ReadonlyMap<string, Materia>
  readonly correquisitos: readonly Correquisito[]
  readonly pensum: Pensum
}

function tipoDeArista(desde: Materia, hasta: Materia): TipoArista {
  if (desde.sector === null || hasta.sector === null) return 'cruce-sector'
  return desde.sector === hasta.sector ? 'intra-sector' : 'cruce-sector'
}

export function construirGrafo(pensum: Pensum): PensumGraph {
  const dag = new DirectedGraph()
  const materias = new Map<string, Materia>()

  for (const m of pensum.materias) {
    materias.set(m.id, m)
    dag.addNode(m.id, { sector: m.sector, semestre: m.semestre })
  }

  for (const m of pensum.materias) {
    for (const p of m.prelaciones) {
      const requisito = materias.get(p)
      if (!requisito) throw new Error(`Prelación no resuelta: ${m.id} ← ${p}`)
      // Sentido requisito → materia.
      dag.addDirectedEdge(p, m.id, { tipo: tipoDeArista(requisito, m) })
    }
  }

  // Los correquisitos se recogen una sola vez por par, fuera del DAG.
  const vistos = new Set<string>()
  const correquisitos: Correquisito[] = []
  for (const m of pensum.materias) {
    for (const c of m.correquisitos) {
      const clave = [m.id, c].sort().join('::')
      if (vistos.has(clave)) continue
      vistos.add(clave)
      correquisitos.push({ a: m.id, b: c })
    }
  }

  return { dag, materias, correquisitos, pensum }
}

function materiaDe(g: PensumGraph, id: string): Materia {
  const m = g.materias.get(id)
  if (!m) throw new Error(`Materia desconocida: ${id}`)
  return m
}

function recorrer(
  g: PensumGraph,
  id: string,
  vecinos: (n: string) => string[],
  orientar: (vecino: string, actual: string) => Arista,
): Cono {
  materiaDe(g, id) // valida que exista
  const alcanzados = new Set<string>()
  const aristas: Arista[] = []
  const cola = [id]

  while (cola.length > 0) {
    const actual = cola.shift()!
    for (const vecino of vecinos(actual)) {
      aristas.push(orientar(vecino, actual))
      if (alcanzados.has(vecino)) continue
      alcanzados.add(vecino)
      cola.push(vecino)
    }
  }

  return {
    materias: [...alcanzados],
    aristas,
    gate: materiaDe(g, id).gate,
  }
}

/** Todo lo que hay que aprobar antes, transitivamente. */
export function conoAncestros(g: PensumGraph, id: string): Cono {
  return recorrer(
    g,
    id,
    (n) => g.dag.inNeighbors(n),
    (vecino, actual) => ({
      desde: vecino,
      hasta: actual,
      tipo: g.dag.getEdgeAttribute(vecino, actual, 'tipo') as TipoArista,
    }),
  )
}

/** Todo lo que se desbloquea al aprobarla, transitivamente. */
export function conoDescendientes(g: PensumGraph, id: string): Cono {
  return recorrer(
    g,
    id,
    (n) => g.dag.outNeighbors(n),
    (vecino, actual) => ({
      desde: actual,
      hasta: vecino,
      tipo: g.dag.getEdgeAttribute(actual, vecino, 'tipo') as TipoArista,
    }),
  )
}

export function ordenTopologico(g: PensumGraph): string[] {
  return topologicalSort(g.dag)
}

/**
 * Profundidad de cada materia: número de aristas del camino más largo desde
 * cualquier materia sin prelaciones. Una raíz tiene profundidad 0.
 */
export function profundidades(g: PensumGraph): ReadonlyMap<string, number> {
  const d = new Map<string, number>()
  for (const id of ordenTopologico(g)) {
    const entradas = g.dag.inNeighbors(id)
    d.set(id, entradas.length === 0 ? 0 : Math.max(...entradas.map((p) => d.get(p)! + 1)))
  }
  return d
}

export function profundidad(g: PensumGraph, id: string): number {
  const d = profundidades(g).get(id)
  if (d === undefined) throw new Error(`Materia desconocida: ${id}`)
  return d
}

export function profundidadMaxima(g: PensumGraph): number {
  return Math.max(...profundidades(g).values())
}

export function clasificarArista(g: PensumGraph, desde: string, hasta: string): TipoArista {
  return tipoDeArista(materiaDe(g, desde), materiaDe(g, hasta))
}

/** Todas las aristas de prelación con su clasificación. */
export function aristas(g: PensumGraph): Arista[] {
  return g.dag.mapDirectedEdges((_e, attr, desde, hasta) => ({
    desde,
    hasta,
    tipo: attr.tipo as TipoArista,
  }))
}

/** Prelaciones y desbloqueos directos, para el panel de detalle. */
export function prelacionesDirectas(g: PensumGraph, id: string): string[] {
  return g.dag.inNeighbors(id)
}

export function desbloqueaDirecto(g: PensumGraph, id: string): string[] {
  return g.dag.outNeighbors(id)
}

export function correquisitosDe(g: PensumGraph, id: string): string[] {
  return g.correquisitos
    .filter((c) => c.a === id || c.b === id)
    .map((c) => (c.a === id ? c.b : c.a))
}

export function materiasPorSector(g: PensumGraph, sector: Sector | null): Materia[] {
  return [...g.materias.values()].filter((m) => m.sector === sector)
}

function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
}

/** Búsqueda por nombre o código, insensible a acentos y mayúsculas. */
export function buscar(g: PensumGraph, texto: string): Materia[] {
  const q = normalizar(texto.trim())
  if (q === '') return []
  return [...g.materias.values()].filter(
    (m) => normalizar(m.nombre).includes(q) || (m.codigo !== null && m.codigo.toLowerCase().includes(q)),
  )
}
