import type { Materia } from '../data/types'
import { prelacionesDirectas, type PensumGraph } from '../model/graph'
import { estaAprobada, evaluarCompuerta, ucAprobadas } from './indice'
import { intentosDe, type Historial } from './tipos'

/**
 * Estado de cada materia, DERIVADO del historial y del grafo (design.md, D6).
 *
 * Nunca se persiste. Guardarlo invitaría a que se desincronizara del historial,
 * que es la única fuente de verdad. Con 58 materias el recálculo completo es
 * instantáneo.
 */

export type EstadoMateria =
  | 'aprobada'
  | 'en-curso'
  /** Prelaciones cumplidas y compuerta cumplida: es lo inscribible. */
  | 'disponible'
  | 'bloqueada-prelacion'
  | 'bloqueada-credito'

export const ESTADOS: readonly EstadoMateria[] = [
  'aprobada',
  'en-curso',
  'disponible',
  'bloqueada-prelacion',
  'bloqueada-credito',
]

export const NOMBRE_ESTADO: Readonly<Record<EstadoMateria, string>> = {
  aprobada: 'Aprobada',
  'en-curso': 'En curso',
  disponible: 'Disponible',
  'bloqueada-prelacion': 'Falta prelación',
  'bloqueada-credito': 'Falta crédito',
}

function calcular(
  materia: Materia,
  historial: Historial,
  grafo: PensumGraph,
  uc: number,
  aprobada: (id: string) => boolean,
): EstadoMateria {
  if (aprobada(materia.id)) return 'aprobada'
  if (intentosDe(historial, materia.id).some((i) => i.tipo === 'en-curso')) return 'en-curso'

  // La prelación se comprueba antes que la compuerta: a una materia le puede
  // faltar todo, y lo que primero hay que resolver es la cadena de materias.
  const faltaPrelacion = prelacionesDirectas(grafo, materia.id).some((p) => !aprobada(p))
  if (faltaPrelacion) return 'bloqueada-prelacion'

  const compuerta = evaluarCompuerta(materia, uc)
  if (compuerta !== null && !compuerta.cumplida) return 'bloqueada-credito'

  return 'disponible'
}

export function estadoDeMateria(
  id: string,
  historial: Historial,
  grafo: PensumGraph,
  uc: number,
): EstadoMateria {
  const materia = grafo.materias.get(id)
  if (!materia) throw new Error(`Materia desconocida: ${id}`)
  return calcular(materia, historial, grafo, uc, (otro) => estaAprobada(historial, otro))
}

/** Mapa completo de estados, calculando el avance una sola vez. */
export function estadosDeTodas(
  historial: Historial,
  grafo: PensumGraph,
): ReadonlyMap<string, EstadoMateria> {
  const uc = ucAprobadas(historial, grafo.materias)
  // Se precalcula el conjunto aprobado: cada materia lo consulta una vez por
  // prelación, y recorrer los intentos cada vez sería cuadrático sin motivo.
  const aprobadas = new Set<string>()
  for (const id of grafo.materias.keys()) {
    if (estaAprobada(historial, id)) aprobadas.add(id)
  }

  const estados = new Map<string, EstadoMateria>()
  for (const [id, materia] of grafo.materias) {
    estados.set(id, calcular(materia, historial, grafo, uc, (otro) => aprobadas.has(otro)))
  }
  return estados
}

/** Las materias inscribibles ahora mismo: la respuesta a «qué veo el próximo semestre». */
export function materiasDisponibles(
  historial: Historial,
  grafo: PensumGraph,
): string[] {
  return [...estadosDeTodas(historial, grafo)]
    .filter(([, estado]) => estado === 'disponible')
    .map(([id]) => id)
}
