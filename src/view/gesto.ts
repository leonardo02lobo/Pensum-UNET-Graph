/**
 * Toque contra órbita.
 *
 * `onNodeClick` dispara al soltar, sin más. Con el dedo, un arrastre para
 * orbitar que termina sobre un nodo lo seleccionaría — y como la cámara acaba
 * de moverse, el usuario no sabría por qué se abrió un panel (design.md, D7).
 *
 * La distinción es por desplazamiento entre el inicio y el punto actual del
 * gesto: por debajo del umbral es un toque, por encima es una órbita.
 */

export interface Punto {
  readonly x: number
  readonly y: number
}

/** Desplazamiento en px a partir del cual el gesto es una órbita, no un toque. */
export const UMBRAL_ARRASTRE = 6

export function esArrastre(
  inicio: Punto | null,
  actual: Punto,
  umbral: number = UMBRAL_ARRASTRE,
): boolean {
  if (inicio === null) return false
  return Math.hypot(actual.x - inicio.x, actual.y - inicio.y) > umbral
}
