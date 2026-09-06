import type { Materia, Pensum, Sector } from './types'
import { SECTORES, UC_TOTALES } from './types'

/**
 * Validación de integridad del dataset (spec `pensum-dataset`).
 *
 * Corre en `npm run validate` y en la suite de tests. Es la red que evita que
 * un error de transcripción llegue al grafo: si el JSON miente, el layout
 * dibuja una carrera que no existe y nadie se entera.
 *
 * No depende de graphology — la detección de ciclos es propia para que la
 * validación de datos no arrastre la capa de modelo.
 */

export interface Problema {
  readonly regla: string
  readonly mensaje: string
}

/** Distribución esperada por sector, fijada en la spec. */
export const CONTEO_POR_SECTOR: Readonly<Record<Sector, number>> = {
  matematica: 11,
  formacion: 10,
  deportiva: 10,
  programacion: 8,
  sistemas: 7,
  ciencias: 6,
  datos: 5,
  grado: 4,
  gestion: 3,
}

export const TOTAL_MATERIAS = 68
export const TOTAL_SECTORIZADAS = 64

function idsUnicos(materias: readonly Materia[]): Problema[] {
  const problemas: Problema[] = []
  const vistos = new Set<string>()
  for (const m of materias) {
    if (vistos.has(m.id)) {
      problemas.push({
        regla: 'ids-unicos',
        mensaje: `Id duplicado: "${m.id}" (${m.nombre})`,
      })
    }
    vistos.add(m.id)
  }
  return problemas
}

function referenciasResueltas(materias: readonly Materia[]): Problema[] {
  const problemas: Problema[] = []
  const existe = new Set(materias.map((m) => m.id))
  for (const m of materias) {
    for (const p of m.prelaciones) {
      if (!existe.has(p)) {
        problemas.push({
          regla: 'referencias-resueltas',
          mensaje: `"${m.nombre}" (${m.id}) prela de un id inexistente: "${p}"`,
        })
      }
    }
    for (const c of m.correquisitos) {
      if (!existe.has(c)) {
        problemas.push({
          regla: 'referencias-resueltas',
          mensaje: `"${m.nombre}" (${m.id}) declara un correquisito inexistente: "${c}"`,
        })
      }
    }
  }
  return problemas
}

/** DFS con marcado tricolor. Devuelve el ciclo encontrado, si lo hay. */
function sinCiclos(materias: readonly Materia[]): Problema[] {
  const porId = new Map(materias.map((m) => [m.id, m]))
  const estado = new Map<string, 'visitando' | 'listo'>()
  const pila: string[] = []
  const problemas: Problema[] = []

  const visitar = (id: string): boolean => {
    const actual = estado.get(id)
    if (actual === 'listo') return false
    if (actual === 'visitando') {
      const desde = pila.indexOf(id)
      const ciclo = [...pila.slice(desde), id].join(' → ')
      problemas.push({ regla: 'sin-ciclos', mensaje: `Ciclo detectado: ${ciclo}` })
      return true
    }
    estado.set(id, 'visitando')
    pila.push(id)
    for (const p of porId.get(id)?.prelaciones ?? []) {
      if (visitar(p)) break
    }
    pila.pop()
    estado.set(id, 'listo')
    return false
  }

  for (const m of materias) visitar(m.id)
  return problemas
}

function coherenciaTemporal(materias: readonly Materia[]): Problema[] {
  const problemas: Problema[] = []
  const porId = new Map(materias.map((m) => [m.id, m]))
  for (const m of materias) {
    for (const p of m.prelaciones) {
      const req = porId.get(p)
      if (req && req.semestre >= m.semestre) {
        problemas.push({
          regla: 'coherencia-temporal',
          mensaje:
            `"${m.nombre}" (S${m.semestre}) prela de "${req.nombre}" (S${req.semestre}), ` +
            `que no está en un semestre anterior`,
        })
      }
    }
  }
  return problemas
}

function simetriaCorrequisitos(materias: readonly Materia[]): Problema[] {
  const problemas: Problema[] = []
  const porId = new Map(materias.map((m) => [m.id, m]))
  for (const m of materias) {
    for (const c of m.correquisitos) {
      const otra = porId.get(c)
      if (!otra) continue
      if (!otra.correquisitos.includes(m.id)) {
        problemas.push({
          regla: 'simetria-correquisitos',
          mensaje: `"${m.nombre}" declara correquisito con "${otra.nombre}", que no lo declara de vuelta`,
        })
      }
      if (otra.semestre !== m.semestre) {
        problemas.push({
          regla: 'simetria-correquisitos',
          mensaje:
            `"${m.nombre}" (S${m.semestre}) y "${otra.nombre}" (S${otra.semestre}) ` +
            `son correquisitos pero están en semestres distintos`,
        })
      }
    }
  }
  return problemas
}

function conteos(materias: readonly Materia[]): Problema[] {
  const problemas: Problema[] = []

  if (materias.length !== TOTAL_MATERIAS) {
    problemas.push({
      regla: 'conteos',
      mensaje: `Se esperaban ${TOTAL_MATERIAS} materias, hay ${materias.length}`,
    })
  }

  const sectorizadas = materias.filter((m) => m.sector !== null)
  if (sectorizadas.length !== TOTAL_SECTORIZADAS) {
    problemas.push({
      regla: 'conteos',
      mensaje: `Se esperaban ${TOTAL_SECTORIZADAS} materias sectorizadas, hay ${sectorizadas.length}`,
    })
  }

  for (const sector of SECTORES) {
    const n = materias.filter((m) => m.sector === sector).length
    const esperado = CONTEO_POR_SECTOR[sector]
    if (n !== esperado) {
      problemas.push({
        regla: 'conteos',
        mensaje: `El sector "${sector}" debería tener ${esperado} materias, tiene ${n}`,
      })
    }
  }

  return problemas
}

/**
 * El dataset llegó a declarar 155 U.C. con materias que sumaban 155: coherente
 * consigo mismo y equivocado, porque nada ataba ese total a la carrera real.
 * Esta regla no habría atrapado aquel error, pero impide que el total vuelva a
 * desfasarse al añadir o corregir materias.
 */
function creditosCuadran(materias: readonly Materia[]): Problema[] {
  const suma = materias.reduce((a, m) => a + m.uc, 0)
  if (suma === UC_TOTALES) return []
  return [
    {
      regla: 'creditos-cuadran',
      mensaje:
        `Las materias suman ${suma} U.C. pero la carrera declara ${UC_TOTALES} ` +
        `(diferencia de ${suma - UC_TOTALES})`,
    },
  ]
}

function camposBasicos(materias: readonly Materia[]): Problema[] {
  const problemas: Problema[] = []
  for (const m of materias) {
    if (m.semestre < 1 || m.semestre > 10 || !Number.isInteger(m.semestre)) {
      problemas.push({
        regla: 'campos-basicos',
        mensaje: `"${m.nombre}" tiene un semestre fuera de rango: ${m.semestre}`,
      })
    }
    if (m.uc < 0) {
      problemas.push({
        regla: 'campos-basicos',
        mensaje: `"${m.nombre}" tiene unidades de crédito negativas: ${m.uc}`,
      })
    }
    if (m.prelaciones.includes(m.id) || m.correquisitos.includes(m.id)) {
      problemas.push({
        regla: 'campos-basicos',
        mensaje: `"${m.nombre}" se referencia a sí misma`,
      })
    }
    if (m.sector !== null && !SECTORES.includes(m.sector)) {
      problemas.push({
        regla: 'campos-basicos',
        mensaje: `"${m.nombre}" tiene un sector desconocido: "${m.sector}"`,
      })
    }
  }
  return problemas
}

/** Corre todas las reglas y devuelve los problemas encontrados. Vacío = válido. */
export function validarPensum(p: Pensum): Problema[] {
  const m = p.materias
  return [
    ...idsUnicos(m),
    ...referenciasResueltas(m),
    ...sinCiclos(m),
    ...coherenciaTemporal(m),
    ...simetriaCorrequisitos(m),
    ...conteos(m),
    ...creditosCuadran(m),
    ...camposBasicos(m),
  ]
}
