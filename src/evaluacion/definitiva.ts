import { NOTA_MAXIMA, NOTA_MINIMA } from '../data/tablaConversion'
import {
  estaPendiente,
  sumaDePonderaciones,
  type Parcial,
  type PlanEvaluacion,
} from './plan'

/**
 * Cálculo de la calificación definitiva (C-3, Art. 39, 40 y 41).
 *
 * Puro: sin React, sin DOM, probable en Node.
 *
 * La cadena que fija la norma:
 *
 *   nota del parcial (1,0–9,0)
 *        │  Art. 40 → × ponderación, aproximando a dos decimales
 *   aporte ponderado
 *        │  Art. 41 → Σ; cincuenta o más centésimas suben
 *   definitiva (entero 1–9, Art. 39)
 */

/** Calificación mínima aprobatoria (Art. 39). */
export const DEFINITIVA_APROBATORIA = 5

/**
 * Redondeo a medio hacia arriba, corrigiendo antes el error de coma flotante.
 * `toPrecision(15)` recupera el decimal que el usuario escribió antes de que
 * `Math.round` decida sobre un 4.999999999.
 */
function redondearMedioArriba(valor: number, decimales: number): number {
  const factor = 10 ** decimales
  return Math.round(Number((valor * factor).toPrecision(15))) / factor
}

/** Redondeo hacia arriba a la décima, para lo que HACE FALTA obtener. */
function techoDecima(valor: number): number {
  return Math.ceil(Number((valor * 10).toPrecision(15))) / 10
}

/**
 * Aporte ponderado de un parcial (Art. 40).
 *
 * «Las ponderaciones de cada evaluación se calcularán sobre esta base,
 * aproximando con dos dígitos decimales»: se aproxima CADA aporte antes de
 * sumar, no el total (design.md, D4 — es interpretación nuestra). Con pesos
 * como 33,33 % la diferencia son centésimas, y las centésimas deciden en la
 * frontera del 4,50.
 *
 * Un parcial en condición NP aporta cero y NO devuelve su peso al reparto
 * (Art. 31, Parágrafo Primero): no presentarse gasta la ponderación.
 */
export function aportePonderado(p: Parcial): number {
  if (p.np === true) return 0
  if (p.nota === null) return 0
  return redondearMedioArriba((p.nota * p.peso) / 100, 2)
}

/** Suma de los aportes de los parciales ya evaluados. */
export function acumulado(plan: PlanEvaluacion): number {
  return redondearMedioArriba(
    plan.parciales.reduce((a, p) => a + aportePonderado(p), 0),
    2,
  )
}

/** Ponderación total que aún está en juego. */
export function pesoPendiente(plan: PlanEvaluacion): number {
  return redondearMedioArriba(
    plan.parciales.filter(estaPendiente).reduce((a, p) => a + p.peso, 0),
    2,
  )
}

/**
 * Convierte una sumatoria ponderada en calificación definitiva.
 *
 * Art. 41: cincuenta o más centésimas suben a la unidad inmediata superior.
 * Art. 39: la escala es de 1 a 9.
 *
 * El acotado inferior a 1 absorbe el Art. 31, Parágrafo Segundo —si todas las
 * parciales son NP la suma es cero y la definitiva queda en uno— sin
 * necesidad de un caso especial.
 */
export function definitivaDeSuma(suma: number): number {
  const redondeada = Math.floor(Number((suma + 0.5).toPrecision(15)))
  return Math.min(NOTA_MAXIMA, Math.max(NOTA_MINIMA, redondeada))
}

/**
 * Calificación definitiva del plan.
 *
 * Devuelve `null` si las ponderaciones no suman 100: normalizarlas produciría
 * un número silenciosamente equivocado (design.md, D6). También devuelve
 * `null` mientras queden parciales pendientes — eso todavía es una proyección,
 * no una definitiva.
 */
export function definitiva(plan: PlanEvaluacion): number | null {
  if (!sumaDePonderaciones(plan).completo) return null
  if (plan.parciales.some(estaPendiente)) return null
  return definitivaDeSuma(acumulado(plan))
}

export type Desenlace =
  /** Ni con la calificación mínima en lo pendiente se pierde el objetivo. */
  | 'asegurado'
  /** Todavía depende de lo que falta. */
  | 'en-juego'
  /** Ni con 9,0 en todo lo pendiente se alcanza. */
  | 'inalcanzable'

export interface Necesario {
  readonly objetivo: number
  readonly desenlace: Desenlace
  /** Calificación mínima uniforme en lo pendiente. `null` si no aplica. */
  readonly nota: number | null
  /** Sumatoria que hay que alcanzar: objetivo − 0,50 (Art. 41). */
  readonly umbral: number
}

/**
 * Qué calificación hace falta, uniforme en todos los parciales pendientes,
 * para que la definitiva sea `objetivo`.
 *
 * El umbral es `objetivo − 0,50` y no `objetivo`: el Art. 41 redondea la
 * sumatoria, así que para sacar 5 basta con llegar a 4,50 (design.md, D2).
 * Es media unidad de margen que casi nadie considera al calcular a mano.
 */
export function necesarioPara(plan: PlanEvaluacion, objetivo: number): Necesario {
  const umbral = objetivo - 0.5
  const falta = umbral - acumulado(plan)
  const pendiente = pesoPendiente(plan)

  if (pendiente === 0) {
    // Nada por jugar: o ya se alcanzó o ya no.
    return {
      objetivo,
      desenlace: falta <= 0 ? 'asegurado' : 'inalcanzable',
      nota: null,
      umbral,
    }
  }

  const cruda = (falta * 100) / pendiente

  // Ni con la calificación mínima en todo lo pendiente se baja del objetivo.
  if (cruda <= NOTA_MINIMA) {
    return { objetivo, desenlace: 'asegurado', nota: NOTA_MINIMA, umbral }
  }
  // Ni con la máxima se llega.
  if (cruda > NOTA_MAXIMA) {
    return { objetivo, desenlace: 'inalcanzable', nota: null, umbral }
  }
  return { objetivo, desenlace: 'en-juego', nota: techoDecima(cruda), umbral }
}

/** Lo necesario para cada calificación objetivo de 5 a 9. */
export function tablaDeObjetivos(plan: PlanEvaluacion): Necesario[] {
  const objetivos = []
  for (let n = DEFINITIVA_APROBATORIA; n <= NOTA_MAXIMA; n++) {
    objetivos.push(necesarioPara(plan, n))
  }
  return objetivos
}

export interface Rango {
  readonly minima: number
  readonly maxima: number
}

/**
 * Definitiva mínima y máxima todavía alcanzables: la que saldría con 1,0 en
 * todo lo pendiente y la que saldría con 9,0.
 */
export function rangoAlcanzable(plan: PlanEvaluacion): Rango {
  const base = acumulado(plan)
  const pendiente = pesoPendiente(plan)
  return {
    minima: definitivaDeSuma(base + (NOTA_MINIMA * pendiente) / 100),
    maxima: definitivaDeSuma(base + (NOTA_MAXIMA * pendiente) / 100),
  }
}

export interface Resultado {
  /** Sumatoria de lo ya evaluado. */
  readonly acumulado: number
  /** Ponderación que sigue en juego. */
  readonly pesoPendiente: number
  /** Definitiva firme, o `null` si el plan está incompleto o quedan parciales. */
  readonly definitiva: number | null
  /** `false` mientras las ponderaciones no sumen 100. */
  readonly planCompleto: boolean
  readonly rango: Rango
  readonly objetivos: readonly Necesario[]
  /** Desenlace respecto a aprobar, que es la pregunta que trae el usuario. */
  readonly aprobar: Necesario
}

/** Todo lo que la pantalla necesita, de una sola pasada. */
export function evaluar(plan: PlanEvaluacion): Resultado {
  const completo = sumaDePonderaciones(plan).completo
  return {
    acumulado: acumulado(plan),
    pesoPendiente: pesoPendiente(plan),
    definitiva: definitiva(plan),
    planCompleto: completo,
    rango: rangoAlcanzable(plan),
    objetivos: tablaDeObjetivos(plan),
    aprobar: necesarioPara(plan, DEFINITIVA_APROBATORIA),
  }
}
