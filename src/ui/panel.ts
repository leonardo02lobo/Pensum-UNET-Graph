/**
 * La geometría del panel de detalle, definida una sola vez.
 *
 * Antes vivía en tres sitios que discrepaban en cuanto la ventana se
 * estrechaba: `w-[22rem]` en `PanelDetalle`, `right: '24rem'` a mano en `App`
 * y `ANCHO_PANEL = 368` en `GrafoOrbital`. Cuando el ancho de la ventana
 * obligaba al panel a encogerse, la capa de etiquetas seguía suprimiendo una
 * franja de 368 px que ya no existía, borrando etiquetas perfectamente
 * visibles (design.md, D3).
 */

/** Ancho nominal del panel lateral, en px. */
export const ANCHO_PANEL = 352

/** Margen entre el panel y el borde de la ventana, en px. */
export const MARGEN_PANEL = 16

/**
 * Forma del panel según el sitio disponible.
 *
 * - `lateral`: anclado al borde derecho, como en escritorio.
 * - `hoja`: anclado al borde inferior, cuando no caben dos columnas. La escena
 *   sigue viéndose por encima, que es el punto: un panel que tapa el grafo que
 *   está explicando no explica nada.
 */
export type FormaPanel = 'lateral' | 'hoja'

/** Alto de la hoja inferior, como fracción de la altura disponible. */
export const FRACCION_ALTO_HOJA = 0.55

/**
 * Qué franja ocupa el panel, para que la capa de etiquetas la esquive.
 *
 * Devuelve el ancho real, no el nominal: en una ventana estrecha el panel se
 * limita con `max-width` y ocupa menos. Cuando es hoja, no ocupa franja
 * derecha ninguna y lo que hay que esquivar es el borde inferior.
 */
export interface FranjaPanel {
  /** X donde empieza el panel lateral, o `null` si no hay panel lateral. */
  readonly bordeDerecho: number | null
  /** Y donde empieza la hoja inferior, o `null` si no hay hoja. */
  readonly bordeInferior: number | null
}

export const SIN_PANEL: FranjaPanel = { bordeDerecho: null, bordeInferior: null }

export function franjaDelPanel(
  forma: FormaPanel,
  ancho: number,
  alto: number,
): FranjaPanel {
  if (forma === 'hoja') {
    return {
      bordeDerecho: null,
      bordeInferior: Math.round(alto * (1 - FRACCION_ALTO_HOJA)) - MARGEN_PANEL,
    }
  }
  // El panel nunca es más ancho que la ventana menos sus dos márgenes: es el
  // mismo tope que aplica su `max-width`.
  const real = Math.min(ANCHO_PANEL, ancho - MARGEN_PANEL * 2)
  return { bordeDerecho: ancho - real - MARGEN_PANEL, bordeInferior: null }
}

/**
 * Dónde debe apoyarse el cromo inferior, en px desde el borde de abajo.
 *
 * Con el panel como hoja, las islas de la banda inferior quedarían debajo de
 * ella. Se apartan por encima en vez de quedar tapadas: una isla tapada es
 * una isla que el usuario no puede usar.
 */
export function apoyoCromoInferior(
  forma: FormaPanel,
  abierto: boolean,
  alto: number,
): number {
  if (!abierto || forma === 'lateral') return MARGEN_PANEL
  return Math.round(alto * FRACCION_ALTO_HOJA) + MARGEN_PANEL * 2
}

/**
 * Cuánto alto le queda al cromo inferior por encima de la hoja.
 *
 * Apartar una isla sin mirar cuánto mide la empuja fuera de la ventana por
 * arriba: la leyenda expandida mide 402 px y el apoyo sobre la hoja son 472,
 * que a 800 px de alto la saca de la pantalla y la superpone a la cabecera.
 */
export function altoLibreCromoInferior(
  forma: FormaPanel,
  abierto: boolean,
  alto: number,
  altoCabecera: number,
): number {
  const apoyo = apoyoCromoInferior(forma, abierto, alto)
  return Math.max(120, alto - apoyo - altoCabecera - MARGEN_PANEL)
}

/** Cuánto se aparta el cromo superior derecho cuando el panel es lateral. */
export function desplazamientoCromo(
  forma: FormaPanel,
  abierto: boolean,
  ancho: number,
): number {
  if (!abierto || forma === 'hoja') return MARGEN_PANEL
  const real = Math.min(ANCHO_PANEL, ancho - MARGEN_PANEL * 2)
  return real + MARGEN_PANEL * 2
}
