import type { Gate } from '../data/types'
import { conoAncestros, conoDescendientes, correquisitosDe, type PensumGraph } from './graph'

/**
 * Qué se ilumina cuando el usuario apunta a una materia (spec `graph-interaction`).
 *
 * Ancestros y descendientes se devuelven por separado: el diseño los distingue
 * visualmente, porque «lo que necesito antes» y «lo que desbloqueo después» son
 * preguntas distintas.
 *
 * Puro y sin React, para poder probarlo en Node.
 */

export interface Resaltado {
  readonly activo: string
  readonly ancestros: ReadonlySet<string>
  readonly descendientes: ReadonlySet<string>
  readonly correquisitos: ReadonlySet<string>
  /** Claves `desde→hasta` de las aristas que pertenecen al cono. */
  readonly aristas: ReadonlySet<string>
  readonly gate: Gate | null
}

export function claveArista(desde: string, hasta: string): string {
  return `${desde}→${hasta}`
}

export function calcularResaltado(g: PensumGraph, id: string): Resaltado {
  const atras = conoAncestros(g, id)
  const adelante = conoDescendientes(g, id)
  const aristas = new Set<string>()
  for (const a of [...atras.aristas, ...adelante.aristas]) {
    aristas.add(claveArista(a.desde, a.hasta))
  }
  return {
    activo: id,
    ancestros: new Set(atras.materias),
    descendientes: new Set(adelante.materias),
    correquisitos: new Set(correquisitosDe(g, id)),
    aristas,
    gate: atras.gate,
  }
}

/** Toda materia que forma parte del cono, incluida la propia. */
export function enElCono(r: Resaltado, id: string): boolean {
  return (
    id === r.activo ||
    r.ancestros.has(id) ||
    r.descendientes.has(id) ||
    r.correquisitos.has(id)
  )
}

export type RolEnCono = 'activo' | 'ancestro' | 'descendiente' | 'correquisito' | 'fuera'

export function rolEnCono(r: Resaltado | null, id: string): RolEnCono {
  if (r === null) return 'activo' // sin resaltado, todo se dibuja en pleno
  if (id === r.activo) return 'activo'
  if (r.ancestros.has(id)) return 'ancestro'
  if (r.descendientes.has(id)) return 'descendiente'
  if (r.correquisitos.has(id)) return 'correquisito'
  return 'fuera'
}
