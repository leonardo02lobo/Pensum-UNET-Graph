import { esNotaDeEscala, notaDePorcentaje } from '../data/tablaConversion'

/**
 * Plan de evaluación de una materia (C-3, Capítulo IV).
 *
 * Puro: sin React, sin DOM. Las reglas del Artículo 32 son normativas, no de
 * criterio nuestro, y cada rama lleva su literal citado.
 *
 * El plan es papel de borrador: no se persiste (design.md, D7). Lo que perdura
 * es su resultado, si el usuario decide registrarlo en el historial.
 */

export interface Parcial {
  /** Ponderación en porcentaje del total de la materia. */
  readonly peso: number
  /**
   * Calificación de 1,0 a 9,0 en décimas (Art. 40), o `null` si no la tiene.
   * Es SIEMPRE el valor canónico: si el parcial llegó en puntos, esta es su
   * conversión por la Tabla 1.
   */
  readonly nota: number | null
  /**
   * Puntos de 0 a 100 tal como los reportó el profesor.
   *
   * El Art. 31 define la sumatoria de un parcial «en la escala de uno a cien
   * puntos», que es como el estudiante suele recibirla; el Art. 42 la convierte
   * a la escala de 1,0 a 9,0 del Art. 40. Se conserva el valor original para no
   * perder lo que el estudiante tecleó al reabrir el plan.
   *
   * `undefined` significa que el parcial se maneja en la escala 1,0–9,0;
   * `null`, que se maneja en puntos pero aún no se ha escrito ninguno.
   */
  readonly puntos?: number | null
  /** Art. 31 P.1: no presentó. Excluyente con `nota`. */
  readonly np?: boolean
  readonly nombre?: string
}

/**
 * Construye un parcial a partir de puntos de 0 a 100, convirtiéndolos con la
 * Tabla 1 (Art. 42). Es la vía natural: así es como llegan las notas.
 */
export function parcialDesdePuntos(peso: number, puntos: number): Parcial {
  return { peso, puntos, nota: notaDePorcentaje(puntos), np: false }
}

export interface PlanEvaluacion {
  readonly materiaId: string
  readonly parciales: readonly Parcial[]
}

/** Un parcial ya evaluado: tiene calificación o está en condición NP. */
export function estaEvaluado(p: Parcial): boolean {
  return p.np === true || p.nota !== null
}

export function estaPendiente(p: Parcial): boolean {
  return !estaEvaluado(p)
}

// ─── Validación de un parcial ───────────────────────────────────────────────

export type ProblemaParcial =
  | 'nota-fuera-de-escala'
  | 'np-con-nota'
  | 'peso-fuera-de-rango'
  | 'puntos-fuera-de-rango'
  /** Los puntos y la calificación no se corresponden por la Tabla 1. */
  | 'puntos-no-concuerdan'

export function validarParcial(p: Parcial): ProblemaParcial[] {
  const problemas: ProblemaParcial[] = []
  // Art. 31 P.1: la condición NP significa que no hubo calificación.
  if (p.np === true && p.nota !== null) problemas.push('np-con-nota')
  // Art. 40: enteros y décimas desde 1,0 hasta 9,0.
  if (p.nota !== null && !esNotaDeEscala(p.nota)) problemas.push('nota-fuera-de-escala')
  if (!Number.isFinite(p.peso) || p.peso < 0 || p.peso > 100) {
    problemas.push('peso-fuera-de-rango')
  }
  if (p.puntos !== undefined && p.puntos !== null) {
    // Art. 31: la sumatoria del parcial va en la escala de 1 a 100 puntos.
    if (!Number.isFinite(p.puntos) || p.puntos < 0 || p.puntos > 100) {
      problemas.push('puntos-fuera-de-rango')
    } else if (p.nota !== null && p.nota !== notaDePorcentaje(p.puntos)) {
      // `nota` es siempre la conversión de `puntos`: si divergen, alguien
      // construyó el parcial saltándose la Tabla 1.
      problemas.push('puntos-no-concuerdan')
    }
  }
  return problemas
}

// ─── Ponderaciones ──────────────────────────────────────────────────────────

export interface EstadoPonderaciones {
  readonly suma: number
  readonly completo: boolean
  /** Puntos porcentuales que faltan por asignar. Cero si sobra o cuadra. */
  readonly falta: number
  /** Puntos porcentuales de más. Cero si falta o cuadra. */
  readonly sobra: number
}

export function sumaDePonderaciones(plan: PlanEvaluacion): EstadoPonderaciones {
  // Se redondea a dos decimales para que 33,33 × 3 = 99,99 no se confunda con
  // un error de coma flotante, y siga siendo un plan incompleto de verdad.
  const suma = Math.round(plan.parciales.reduce((a, p) => a + p.peso, 0) * 100) / 100
  return {
    suma,
    completo: suma === 100,
    falta: Math.max(0, 100 - suma),
    sobra: Math.max(0, suma - 100),
  }
}

// ─── Artículo 32 ────────────────────────────────────────────────────────────

export interface ReglaArticulo32 {
  readonly literal: 'a' | 'b' | 'c'
  readonly parciales: number
  readonly pesoMinimo: number
  readonly pesoMaximo: number
  /** El literal c admite 3 parciales con autorización de la Unidad de Evaluación. */
  readonly admiteExcepcion: boolean
}

/**
 * Regla que el Artículo 32 fija según las unidades de crédito.
 *
 * Devuelve `null` para materias de 0 U.C. (los nodos de Servicio Comunitario):
 * no tienen parciales que ponderar, y inventarles una regla sería peor que
 * decir que no aplica.
 */
export function reglaArticulo32(uc: number): ReglaArticulo32 | null {
  if (uc <= 0) return null
  // a) unidades curriculares de una (1) unidad crédito
  if (uc === 1) {
    return { literal: 'a', parciales: 2, pesoMinimo: 40, pesoMaximo: 60, admiteExcepcion: false }
  }
  // b) unidades curriculares de dos (2) ó tres (3) unidades crédito
  if (uc <= 3) {
    return { literal: 'b', parciales: 3, pesoMinimo: 20, pesoMaximo: 40, admiteExcepcion: false }
  }
  // c) unidades curriculares de cuatro (4) o más créditos
  return { literal: 'c', parciales: 4, pesoMinimo: 10, pesoMaximo: 35, admiteExcepcion: true }
}

export type Discrepancia =
  | {
      readonly tipo: 'numero-de-parciales'
      readonly literal: 'a' | 'b' | 'c'
      readonly esperados: number
      readonly declarados: number
      readonly admiteExcepcion: boolean
    }
  | {
      readonly tipo: 'peso-fuera-de-norma'
      readonly literal: 'a' | 'b' | 'c'
      /** Índice del parcial concreto, para señalarlo en la interfaz. */
      readonly indice: number
      readonly peso: number
      readonly minimo: number
      readonly maximo: number
    }

/**
 * Compara el plan contra el Artículo 32.
 *
 * Devuelve avisos, nunca un bloqueo (design.md, D5). El literal c admite
 * autorización de la Unidad de Evaluación para usar tres parciales, y la
 * aplicación no puede saber si esa autorización existe: impedir el cálculo
 * dejaría al estudiante sin herramienta justo cuando su curso real se aparta
 * del papel.
 */
export function validarArticulo32(plan: PlanEvaluacion, uc: number): Discrepancia[] {
  const regla = reglaArticulo32(uc)
  if (regla === null) return []

  const discrepancias: Discrepancia[] = []

  if (plan.parciales.length !== regla.parciales) {
    discrepancias.push({
      tipo: 'numero-de-parciales',
      literal: regla.literal,
      esperados: regla.parciales,
      declarados: plan.parciales.length,
      admiteExcepcion: regla.admiteExcepcion,
    })
  }

  plan.parciales.forEach((p, indice) => {
    if (p.peso < regla.pesoMinimo || p.peso > regla.pesoMaximo) {
      discrepancias.push({
        tipo: 'peso-fuera-de-norma',
        literal: regla.literal,
        indice,
        peso: p.peso,
        minimo: regla.pesoMinimo,
        maximo: regla.pesoMaximo,
      })
    }
  })

  return discrepancias
}

/**
 * Plan conforme al Artículo 32 con las ponderaciones repartidas por igual.
 *
 * El reparto se ajusta en el último parcial para que la suma dé exactamente
 * 100: con 3 parciales, 33,33 × 3 son 99,99 y el plan quedaría incompleto de
 * salida, que es una forma tonta de recibir al usuario.
 */
export function planSugerido(materiaId: string, uc: number): PlanEvaluacion {
  const regla = reglaArticulo32(uc)
  if (regla === null) return { materiaId, parciales: [] }

  const n = regla.parciales
  const base = Math.floor((100 / n) * 100) / 100
  const parciales: Parcial[] = Array.from({ length: n }, (_, i) => ({
    peso: i === n - 1 ? Math.round((100 - base * (n - 1)) * 100) / 100 : base,
    nota: null,
  }))
  return { materiaId, parciales }
}
