import { SECTORES, type Sector } from '../data/types'
import { ESTADOS, type EstadoMateria } from '../progreso/estados'

/**
 * La dirección de la aplicación: qué parte del estado vive en la URL.
 *
 * `useVista` ya había tomado la decisión buena —«se navega escribiendo el
 * fragmento, no el estado: así el botón atrás del navegador queda dentro del
 * mismo flujo y no hay dos fuentes de verdad»— pero la aplicaba a una sola cosa
 * de las cinco que la merecen. La materia seleccionada y los tres filtros
 * vivían en `useState` y se evaporaban al recargar.
 *
 * Forma del fragmento (design.md, D1):
 *
 *   #/grafo
 *   #/grafo/425401
 *   #/grafo/425401?sector=programacion&estado=disponible&semestre=4
 *   #/calculadora/425401
 *   #/plan?estado=disponible
 *
 * La materia es DE QUÉ va la pantalla y va en la ruta; los filtros son CÓMO la
 * estás mirando y van en parámetros. Un enlace a una materia sigue teniendo
 * sentido si se le quitan los parámetros, y uno con filtros y sin materia
 * también.
 *
 * El análisis es tolerante y parcial: un valor inválido se descarta sin
 * invalidar el resto. Lo hereda de `useVista`, que ya trataba el fragmento
 * desconocido cayendo en el grafo «sin error».
 */

export type Vista = 'grafo' | 'plan' | 'calculadora'

export interface Direccion {
  readonly vista: Vista
  readonly materia: string | null
  readonly sector: Sector | null
  readonly estado: EstadoMateria | null
  readonly semestre: number | null
}

export const DIRECCION_INICIAL: Direccion = {
  vista: 'grafo',
  materia: null,
  sector: null,
  estado: null,
  semestre: null,
}

const VISTAS: Readonly<Record<string, Vista>> = {
  '': 'grafo',
  grafo: 'grafo',
  plan: 'plan',
  calculadora: 'calculadora',
}

const ES_SECTOR = new Set<string>(SECTORES)
const ES_ESTADO = new Set<string>(ESTADOS)

function sectorValido(v: string | null): Sector | null {
  return v !== null && ES_SECTOR.has(v) ? (v as Sector) : null
}

function estadoValido(v: string | null): EstadoMateria | null {
  return v !== null && ES_ESTADO.has(v) ? (v as EstadoMateria) : null
}

function semestreValido(v: string | null): number | null {
  if (v === null) return null
  // Entero positivo y nada más: `4.5`, `-1`, `04` y `4abc` se descartan.
  if (!/^[1-9][0-9]*$/.test(v)) return null
  return Number(v)
}

/** Lee una dirección del fragmento. Nunca lanza; lo ilegible cae en el grafo. */
export function leerDireccion(fragmento: string): Direccion {
  const crudo = fragmento.startsWith('#') ? fragmento.slice(1) : fragmento
  const [ruta = '', consulta = ''] = crudo.split('?', 2)

  const partes = ruta.split('/').filter((p) => p !== '')
  const vista = VISTAS[partes[0] ?? ''] ?? 'grafo'
  // Solo se toma el segundo segmento si el primero era una vista conocida: de
  // otro modo `#/basura/425401` seleccionaría una materia por accidente.
  const reconocida = partes.length === 0 || VISTAS[partes[0]] !== undefined
  const materia = reconocida && partes[1] ? decodeURIComponent(partes[1]) : null

  let params: URLSearchParams
  try {
    params = new URLSearchParams(consulta)
  } catch {
    params = new URLSearchParams()
  }

  return {
    vista,
    materia,
    sector: sectorValido(params.get('sector')),
    estado: estadoValido(params.get('estado')),
    semestre: semestreValido(params.get('semestre')),
  }
}

/** Escribe el fragmento de una dirección, omitiendo lo que no está activo. */
export function escribirDireccion(d: Direccion): string {
  const ruta = d.materia ? `#/${d.vista}/${encodeURIComponent(d.materia)}` : `#/${d.vista}`

  const params = new URLSearchParams()
  if (d.sector !== null) params.set('sector', d.sector)
  if (d.estado !== null) params.set('estado', d.estado)
  if (d.semestre !== null) params.set('semestre', String(d.semestre))

  const consulta = params.toString()
  return consulta === '' ? ruta : `${ruta}?${consulta}`
}

/** ¿Hay algún filtro aplicado? */
export function hayFiltros(d: Direccion): boolean {
  return d.sector !== null || d.estado !== null || d.semestre !== null
}

/** La misma dirección sin filtros, conservando vista y materia. */
export function sinFiltros(d: Direccion): Direccion {
  return { ...d, sector: null, estado: null, semestre: null }
}
