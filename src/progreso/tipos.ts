/**
 * Historial académico del estudiante.
 *
 * Capa mutable y personal, encima del pensum estático. No lo modifica nunca:
 * referencia las materias solo por su `id`.
 *
 * Norma aplicable: C-3, Normas para la Evaluación del Rendimiento Estudiantil
 * de la UNET. Cada regla lleva citado su artículo, porque son decisiones
 * normativas y no de diseño: si cambian, cambia la ley, no nuestro criterio.
 */

/** Escala del Artículo 39: enteros de 1 a 9. */
export const NOTA_MINIMA = 1
export const NOTA_MAXIMA = 9
/** Aprobatorias 5–9, reprobatorias 1–4 (Art. 39). */
export const NOTA_APROBATORIA = 5

export type TipoIntento =
  /** Cursada normal, con calificación definitiva. */
  | 'regular'
  /** Acreditada por traslado o equivalencia (Art. 48). */
  | 'equivalencia'
  /** Aprobada por evaluación de suficiencia (Art. 34–38). */
  | 'suficiencia'
  /** Retiro formalizado (Art. 21). */
  | 'retiro'
  /** Inscrita, sin calificación definitiva todavía. */
  | 'en-curso'

export interface Intento {
  readonly tipo: TipoIntento
  /** Entera de 1 a 9, o `null` cuando el tipo no lleva calificación. */
  readonly nota: number | null
  /**
   * Solo para `retiro`. Decide si la nota pesa en el índice (Art. 21,
   * Parágrafo Primero): con desincorporación las notas no afectan el historial;
   * sin desincorporación sí lo afectan.
   */
  readonly desincorporado?: boolean
  /** Etiqueta libre del lapso, para que el estudiante se ubique. Opcional. */
  readonly periodo?: string
}

/** Intentos por id de materia. Una materia ausente equivale a lista vacía. */
export type Historial = Readonly<Record<string, readonly Intento[]>>

export const HISTORIAL_VACIO: Historial = {}

export function intentosDe(historial: Historial, id: string): readonly Intento[] {
  return historial[id] ?? []
}

function tieneNotaAprobatoria(i: Intento): boolean {
  return i.nota !== null && i.nota >= NOTA_APROBATORIA
}

/**
 * ¿Este intento otorga las unidades de crédito de la materia?
 *
 * Es independiente de si pesa en el índice: los dos conjuntos NO coinciden
 * (una equivalencia da crédito sin mover el índice; un intento reprobado mueve
 * el índice sin dar crédito).
 */
export function otorgaCreditos(i: Intento): boolean {
  switch (i.tipo) {
    case 'regular':
      return tieneNotaAprobatoria(i)
    // Art. 48: la equivalencia acredita la unidad curricular.
    case 'equivalencia':
      return true
    // Art. 37, Parágrafo Segundo: la suficiencia aprobada es nota definitiva.
    case 'suficiencia':
      return tieneNotaAprobatoria(i)
    // Art. 21: un retiro no acredita nada, se haya desincorporado o no.
    case 'retiro':
      return false
    case 'en-curso':
      return false
  }
}

/** ¿Este intento entra al cálculo del índice académico? */
export function pesaEnIndice(i: Intento): boolean {
  switch (i.tipo) {
    // Art. 47a: se computa cada unidad curricular CURSADA, aprobada o no.
    case 'regular':
      return i.nota !== null
    // Art. 48: lo aprobado por equivalencia no se considera para el índice.
    case 'equivalencia':
      return false
    // Art. 37, Parágrafo Tercero: la suficiencia REPROBADA no se toma en
    // cuenta para el índice. La aprobada sí.
    case 'suficiencia':
      return tieneNotaAprobatoria(i)
    // Art. 21, Parágrafo Primero: con desincorporación las notas no afectan el
    // historial; sin desincorporación sí.
    case 'retiro':
      return i.desincorporado !== true && i.nota !== null
    case 'en-curso':
      return false
  }
}

export function esNotaValida(n: unknown): n is number {
  return typeof n === 'number' && Number.isInteger(n) && n >= NOTA_MINIMA && n <= NOTA_MAXIMA
}

/** ¿El tipo de intento requiere calificación? */
export function requiereNota(tipo: TipoIntento): boolean {
  return tipo === 'regular' || tipo === 'suficiencia'
}

/** ¿El tipo admite calificación, aunque pueda omitirse? */
export function admiteNota(tipo: TipoIntento): boolean {
  return requiereNota(tipo) || tipo === 'retiro'
}
