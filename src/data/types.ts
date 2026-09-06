/**
 * Esquema del dataset del pensum.
 *
 * Este módulo no importa nada. Es la frontera de datos (D6): el modelo, el
 * layout y el render dependen de estos tipos, nunca al revés.
 */

/** Los ocho sectores de conocimiento (D5). Derivados de los prefijos de código
 *  departamentales, con el bloque 41x/42x de Informática partido por tema. */
export const SECTORES = [
  'programacion',
  'datos',
  'sistemas',
  'matematica',
  'ciencias',
  'gestion',
  'formacion',
  'grado',
  'deportiva',
] as const

export type Sector = (typeof SECTORES)[number]

/**
 * Compuerta por créditos acumulados (D2).
 *
 * NO es una arista: es un atributo del nodo. Una materia puede tener compuerta
 * y prelaciones a la vez (Ecología, TAP Tesis), y ambas condiciones se
 * interpretan como conjunción.
 */
export type Gate =
  /** Umbral en unidades de crédito aprobadas. */
  | { readonly kind: 'uc'; readonly uc: number }
  /** Umbral como porcentaje del total de unidades de crédito de la carrera. */
  | { readonly kind: 'pct'; readonly pct: number }

/** Carga horaria semanal. */
export interface Horas {
  readonly teoria: number
  readonly practica: number
  readonly lab: number
}

/**
 * Procedencia del registro (D1).
 * - `control-estudios`: dato tomado del informe académico, que manda sobre las
 *   demás en códigos, unidades de crédito y existencia de materias.
 * - `canva`: solo aparece en el Canva del 06/05/2026.
 * - `pdf`: solo aparece en el PDF oficial de la UNET.
 * - `fusion`: contenido combinado de varias fuentes.
 */
export type Fuente = 'control-estudios' | 'canva' | 'pdf' | 'fusion'

export interface Materia {
  /** Identificador estable. Es el código cuando existe; kebab-case provisional
   *  cuando ninguna fuente lo provee (Automatización, las cuatro Electivas). */
  readonly id: string
  /** Código oficial de asignatura, o `null` si ninguna fuente lo registra. */
  readonly codigo: string | null
  readonly nombre: string
  readonly semestre: number
  readonly uc: number
  /** `null` cuando la fuente no desglosa la carga horaria. */
  readonly horas: Horas | null
  /** `null` para las materias que orbitan libres (las cuatro Electivas). */
  readonly sector: Sector | null
  /** Ids de las materias requeridas. Se interpretan como conjunción. */
  readonly prelaciones: readonly string[]
  /** Ids de materias del mismo semestre a cursar en paralelo. Simétrico. */
  readonly correquisitos: readonly string[]
  /** Umbral de créditos acumulados, o `null`. */
  readonly gate: Gate | null
  readonly fuente: Fuente
}

/** Una discrepancia entre las dos fuentes y cómo se resolvió (D1). */
export interface Discrepancia {
  readonly materia: string
  readonly campo: string
  readonly pdf: string
  readonly canva: string
  readonly adoptado: 'canva' | 'pdf'
  readonly nota?: string
}

/** Un dato que no aparece explícito en ninguna fuente y se dedujo. */
export interface Inferencia {
  readonly materia: string
  readonly campo: string
  readonly valor: string
  readonly razon: string
}

export interface PensumMeta {
  readonly carrera: string
  readonly universidad: string
  /** Fecha ISO de la última verificación del dataset contra las fuentes. */
  readonly verificado: string
  readonly fuentes: readonly {
    readonly id: Fuente
    readonly titulo: string
    readonly fecha: string | null
    readonly url: string | null
  }[]
  readonly discrepancias: readonly Discrepancia[]
  readonly inferencias: readonly Inferencia[]
}

export interface Pensum {
  readonly meta: PensumMeta
  readonly materias: readonly Materia[]
  /** Catálogo de electivas ofertadas. Es dato de referencia para la UI: estas
   *  NO son nodos del grafo — los nodos son las cuatro ranuras `Electiva`. */
  readonly catalogoElectivas: readonly string[]
}

/**
 * Total de unidades de crédito de la carrera, base de las compuertas `pct`.
 *
 *   155   lo que registraban el Canva y el PDF del sitio
 *   + 12   TAP Tesis y TAP Pasantía son 12 U.C. cada una, no 6
 *   +  1   Investigación de Operaciones I es de 4 U.C., no de 3
 *   + 10   la línea de Actividad Deportiva, que no estaba
 *   ───
 *   178   según el informe académico de Control de Estudios
 *
 * `validate.ts` comprueba que las materias sumen exactamente este valor: el
 * dataset llegó a declarar 155 con materias que sumaban 155, coherente consigo
 * mismo y equivocado, porque nada ataba ese total a la carrera real.
 */
export const UC_TOTALES = 178

export function totalHoras(horas: Horas | null): number | null {
  return horas === null ? null : horas.teoria + horas.practica + horas.lab
}

/** Expresa una compuerta en unidades de crédito, resolviendo los porcentajes. */
export function gateEnUC(gate: Gate): number {
  return gate.kind === 'uc' ? gate.uc : Math.ceil((gate.pct / 100) * UC_TOTALES)
}

/** Texto legible de una compuerta: "90 U.C." o "80% U.C.". */
export function formatearUmbral(gate: Gate | null): string {
  if (gate === null) return ''
  return gate.kind === 'uc' ? `${gate.uc} U.C.` : `${gate.pct}% U.C.`
}
