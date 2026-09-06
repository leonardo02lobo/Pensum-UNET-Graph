import { UC_TOTALES, gateEnUC, type Materia } from '../data/types'
import {
  intentosDe,
  otorgaCreditos,
  pesaEnIndice,
  type Historial,
  type Intento,
} from './tipos'

/**
 * Cálculo del índice académico (C-3, Capítulo VII, Artículos 46–55).
 *
 * Puro: no importa React, DOM ni nada de visualización. Las reglas del Art. 49
 * y las banderas del Art. 48 son justo lo que hay que cubrir con pruebas, y no
 * deberían necesitar un navegador para correr.
 */

/** Calificaciones que entran al índice, en orden de intento. */
export function notasComputables(intentos: readonly Intento[]): number[] {
  return intentos.filter(pesaEnIndice).map((i) => i.nota as number)
}

/**
 * Nota efectiva de una materia según el Artículo 49.
 *
 * La norma parece decir dos cosas — «la calificación obtenida elimina la
 * anterior» y «a la tercera o más veces se promedian todas excepto la primera»
 * — pero es UNA sola regla: «elimina la anterior» es el promedio de un solo
 * elemento. Implementarlas por separado invita a que divergan.
 *
 *   [3]          → 3
 *   [3, 6]       → 6      (promedio de [6])
 *   [3, 4, 6]    → 5      (promedio de [4, 6])
 *   [3, 4, 6, 8] → 6      (promedio de [4, 6, 8])
 *
 * Solo cuentan los intentos que pesan en el índice, así que un retiro con
 * desincorporación no gasta una «vez cursada» (ver design.md, D4 — es
 * interpretación nuestra, no cita literal).
 */
export function notaEfectiva(intentos: readonly Intento[]): number | null {
  const notas = notasComputables(intentos)
  if (notas.length === 0) return null
  if (notas.length === 1) return notas[0]
  const posteriores = notas.slice(1)
  return posteriores.reduce((a, b) => a + b, 0) / posteriores.length
}

/**
 * Redondeo a medio hacia arriba, corrigiendo antes el error de coma flotante.
 *
 * `(6.715 * 100)` da 671.4999999999999, así que `Math.round` bajaría a 671 y
 * `toFixed(2)` devolvería "6.71". El Art. 55 exige 6,72. `toPrecision(15)`
 * recupera el valor decimal que el usuario escribió antes de redondear.
 */
function redondearMedioArriba(valor: number, decimales: number): number {
  const factor = 10 ** decimales
  const escalado = Number((valor * factor).toPrecision(15))
  return Math.round(escalado) / factor
}

/**
 * Artículo 55: «se calculará con tres decimales y se registrará con dos. Cinco
 * o más milésimas se aproximarán a una centésima más.» Son dos redondeos
 * encadenados, no uno.
 */
export function redondearNormativo(valor: number): number {
  return redondearMedioArriba(redondearMedioArriba(valor, 3), 2)
}

export interface DetalleIndice {
  /** Índice ya registrado con dos decimales (Art. 55), o `null` si no aplica. */
  readonly indice: number | null
  /** Valor sin redondear, para depurar y para mostrar la precisión de cálculo. */
  readonly crudo: number | null
  /** Unidades de crédito que entraron al denominador. */
  readonly ucComputadas: number
  /** Materias que aportaron al cálculo. */
  readonly materiasComputadas: number
}

/**
 * Índice académico acumulado (Art. 47): suma de nota efectiva por unidades de
 * crédito, dividida entre el total de unidades de crédito de esas materias.
 */
export function detalleIndice(
  historial: Historial,
  materias: ReadonlyMap<string, Materia>,
): DetalleIndice {
  let numerador = 0
  let ucComputadas = 0
  let materiasComputadas = 0

  for (const [id, materia] of materias) {
    const nota = notaEfectiva(intentosDe(historial, id))
    if (nota === null) continue
    materiasComputadas += 1
    numerador += nota * materia.uc
    ucComputadas += materia.uc
  }

  // Sin materias computables no hay índice. Con materias de cero créditos el
  // denominador puede ser cero: tampoco hay índice, y no se divide por cero.
  if (materiasComputadas === 0 || ucComputadas === 0) {
    return { indice: null, crudo: null, ucComputadas, materiasComputadas }
  }

  const crudo = numerador / ucComputadas
  return {
    indice: redondearNormativo(crudo),
    crudo,
    ucComputadas,
    materiasComputadas,
  }
}

export function indiceAcumulado(
  historial: Historial,
  materias: ReadonlyMap<string, Materia>,
): number | null {
  return detalleIndice(historial, materias).indice
}

/** ¿La materia quedó acreditada por alguno de sus intentos? */
export function estaAprobada(historial: Historial, id: string): boolean {
  return intentosDe(historial, id).some(otorgaCreditos)
}

/**
 * Unidades de crédito aprobadas. Conjunto DISTINTO del que pesa en el índice:
 * una equivalencia suma aquí y no allá; un intento reprobado, al revés.
 */
export function ucAprobadas(
  historial: Historial,
  materias: ReadonlyMap<string, Materia>,
): number {
  let total = 0
  for (const [id, materia] of materias) {
    if (estaAprobada(historial, id)) total += materia.uc
  }
  return total
}

export interface EstadoCompuerta {
  readonly cumplida: boolean
  /** Unidades de crédito que faltan. Cero cuando ya está cumplida. */
  readonly faltan: number
  /** Umbral resuelto a unidades de crédito, con los porcentajes ya aplicados. */
  readonly umbral: number
}

/** Evalúa la compuerta por créditos de una materia contra el avance real. */
export function evaluarCompuerta(materia: Materia, uc: number): EstadoCompuerta | null {
  if (materia.gate === null) return null
  const umbral = gateEnUC(materia.gate)
  return { cumplida: uc >= umbral, faltan: Math.max(0, umbral - uc), umbral }
}

export type Umbral =
  | 'sin-indice'
  /** Art. 51: índice acumulado inferior a 3,60 → pierde la inscripción. */
  | 'pierde-inscripcion'
  /** Por debajo del 5,10 de graduación (Art. 54). */
  | 'insuficiente'
  /** Cumple el mínimo de graduación. */
  | 'apto'
  /** C-19, Art. 4: índice acumulado mayor de 6,00. */
  | 'cuadro-de-honor'

export const INDICE_PERMANENCIA = 3.6
export const INDICE_GRADUACION = 5.1
export const INDICE_CUADRO_HONOR = 6.0

export function umbralNormativo(indice: number | null): Umbral {
  if (indice === null) return 'sin-indice'
  if (indice < INDICE_PERMANENCIA) return 'pierde-inscripcion'
  if (indice < INDICE_GRADUACION) return 'insuficiente'
  if (indice > INDICE_CUADRO_HONOR) return 'cuadro-de-honor'
  return 'apto'
}

export interface Resumen {
  readonly indice: number | null
  readonly umbral: Umbral
  readonly ucAprobadas: number
  readonly ucTotales: number
  readonly avance: number
}

/** Todo lo que la cabecera necesita, de una sola pasada. */
export function resumen(
  historial: Historial,
  materias: ReadonlyMap<string, Materia>,
): Resumen {
  const { indice } = detalleIndice(historial, materias)
  const aprobadas = ucAprobadas(historial, materias)
  return {
    indice,
    umbral: umbralNormativo(indice),
    ucAprobadas: aprobadas,
    ucTotales: UC_TOTALES,
    avance: aprobadas / UC_TOTALES,
  }
}
