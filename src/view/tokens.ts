import type { Sector } from '../data/types'
import { SECTORES } from '../data/types'

/**
 * Puente entre Tailwind y WebGL (D7).
 *
 * Tailwind no puede estilizar la escena 3D, así que los colores viven una sola
 * vez como variables CSS en `src/index.css` y se leen aquí al montar. Cambiar
 * un token mueve la leyenda 2D y los nodos 3D a la vez.
 */

export interface Tokens {
  readonly sector: Readonly<Record<Sector, string>>
  readonly sinSector: string
  readonly gate: string
  readonly edgeIntra: string
  readonly edgeCross: string
  readonly edgeCorreq: string
  readonly void: string
}

const FALLBACK: Tokens = {
  sector: {
    matematica: '#fbbf24',
    formacion: '#60a5fa',
    programacion: '#22d3ee',
    sistemas: '#34d399',
    ciencias: '#fb7185',
    datos: '#c084fc',
    grado: '#f472b6',
    gestion: '#a3e635',
    deportiva: '#fb923c',
  },
  sinSector: '#94a3b8',
  gate: '#64748b',
  edgeIntra: '#334155',
  edgeCross: '#64748b',
  edgeCorreq: '#475569',
  void: '#05060a',
}

function leer(estilo: CSSStyleDeclaration, nombre: string, porDefecto: string): string {
  const v = estilo.getPropertyValue(nombre).trim()
  if (v === '') {
    // Si esto salta, el puente Tailwind↔WebGL está roto y hay dos definiciones
    // del mismo color en circulación. Ver `@theme static` en index.css.
    console.warn(`[tokens] ${nombre} no está en el CSS; se usa el valor de respaldo`)
    return porDefecto
  }
  return v
}

/** Lee los tokens del documento. En Node (tests) devuelve los de respaldo. */
export function leerTokens(): Tokens {
  if (typeof window === 'undefined' || typeof getComputedStyle !== 'function') {
    return FALLBACK
  }
  const estilo = getComputedStyle(document.documentElement)
  const sector = Object.fromEntries(
    SECTORES.map((s) => [s, leer(estilo, `--color-sector-${s}`, FALLBACK.sector[s])]),
  ) as Record<Sector, string>

  return {
    sector,
    sinSector: leer(estilo, '--color-sector-none', FALLBACK.sinSector),
    gate: leer(estilo, '--color-gate', FALLBACK.gate),
    edgeIntra: leer(estilo, '--color-edge-intra', FALLBACK.edgeIntra),
    edgeCross: leer(estilo, '--color-edge-cross', FALLBACK.edgeCross),
    edgeCorreq: leer(estilo, '--color-edge-correq', FALLBACK.edgeCorreq),
    void: leer(estilo, '--color-void', FALLBACK.void),
  }
}

export function colorDeSector(tokens: Tokens, sector: Sector | null): string {
  return sector === null ? tokens.sinSector : tokens.sector[sector]
}

export const NOMBRE_SECTOR: Readonly<Record<Sector, string>> = {
  programacion: 'Programación y Software',
  datos: 'Datos e Información',
  sistemas: 'Sistemas, Hardware y Redes',
  matematica: 'Matemática y Modelado',
  ciencias: 'Ciencias Básicas',
  gestion: 'Gestión y Economía',
  formacion: 'Formación Integral',
  grado: 'Trabajo de Grado',
  deportiva: 'Actividad Deportiva',
}
