/**
 * ¿Puede este navegador dibujar la escena?
 *
 * `GrafoOrbital` se monta en cuanto hay medida, y sin contexto WebGL el
 * resultado es un lienzo negro con un error en consola. La comprobación es
 * barata y se hace una sola vez, antes de montar (design.md, D6).
 *
 * Cuando falla, la aplicación cae en la lista del pensum en vez de en un
 * cartel de error: índice, estados, captura, calculadora y respaldo no
 * dependen de three.js, y bloquearlos todos por el render sería desmedido.
 */

let cache: boolean | null = null

export function hayWebGL(): boolean {
  if (cache !== null) return cache
  if (typeof document === 'undefined') {
    cache = false
    return cache
  }
  try {
    const lienzo = document.createElement('canvas')
    const ctx =
      lienzo.getContext('webgl2') ??
      lienzo.getContext('webgl') ??
      lienzo.getContext('experimental-webgl')
    cache = ctx !== null
  } catch {
    // Algunos navegadores lanzan en vez de devolver null cuando WebGL está
    // deshabilitado por política o por falta de hardware.
    cache = false
  }
  return cache
}

export const AVISO_SIN_WEBGL =
  'El grafo 3D no está disponible en este navegador, así que verás el pensum como lista. ' +
  'Todo lo demás —tus notas, el índice y la calculadora— funciona igual.'
