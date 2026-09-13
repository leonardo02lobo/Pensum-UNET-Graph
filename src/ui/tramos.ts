/**
 * Los tramos de ancho que gobiernan la disposición del cromo.
 *
 * Los dos umbrales salen de la aritmética de este cromo concreto, no de una
 * tabla de dispositivos. Si el cromo crece, dejan de corresponder a lo que se
 * midió, así que aquí queda la cuenta que los produjo (design.md, D1).
 *
 * ── ANCHO_DOS_COLUMNAS ────────────────────────────────────────────────────
 *
 * `Semestres` va centrado y mide 399 px; `Leyenda` ocupa 16..320. El centro
 * empieza en `W/2 − 199,5`, así que se pisan cuando:
 *
 *     W/2 − 199,5 < 320   ⟹   W < 1039
 *
 * Pero con el panel de detalle abierto manda otra cuenta, más exigente: el
 * panel lateral ocupa desde `W − 352 − 16`, y la barra centrada termina en
 * `W/2 + 199,5`, así que se pisan cuando:
 *
 *     W/2 + 199,5 > W − 368   ⟹   W < 1135
 *
 * Medido en el navegador: a 1100 con panel abierto la barra llega a 749 y el
 * panel empieza en 732 — 17 px de solape. A 1140 hay 3 px de holgura. Se fija
 * en 1160 para no depender de tres píxeles.
 *
 * ── ANCHO_MINIMO_GRAFO ────────────────────────────────────────────────────
 *
 * Por debajo, el panel abierto tapa más de la mitad de la escena y los diez
 * anillos concéntricos dejan de distinguirse: el grafo deja de contar una
 * historia. No se degrada, se ofrece la lista en su lugar (design.md, D4).
 */

export const ANCHO_MINIMO_GRAFO = 900
export const ANCHO_DOS_COLUMNAS = 1160

export type Tramo = 'estrecho' | 'compacto' | 'amplio'

export function tramoDe(ancho: number): Tramo {
  if (ancho < ANCHO_MINIMO_GRAFO) return 'estrecho'
  if (ancho < ANCHO_DOS_COLUMNAS) return 'compacto'
  return 'amplio'
}

/**
 * En el tramo amplio el cromo conserva sus clases actuales sin excepción: es
 * el ancho en el que la aplicación se ha estado usando y ajustando, y cualquier
 * movimiento ahí es coste sin beneficio (design.md, D8).
 */
export function esAmplio(tramo: Tramo): boolean {
  return tramo === 'amplio'
}

/** El panel cabe al lado de la escena solo en el tramo amplio. */
export function formaDelPanel(tramo: Tramo): 'lateral' | 'hoja' {
  return tramo === 'amplio' ? 'lateral' : 'hoja'
}

/** Las islas que estorban se colapsan antes que encogerse (design.md, D5). */
export function debeColapsar(tramo: Tramo): boolean {
  return tramo !== 'amplio'
}
