import { useCallback, useEffect, useState } from 'react'

/**
 * Enrutado por el fragmento de la URL.
 *
 * Dos vistas no justifican una dependencia de enrutado (design.md, D8): un
 * `hashchange` propio da URL compartible y botón atrás en unas pocas líneas.
 */

export type Vista = 'grafo' | 'calculadora'

const RUTAS: Readonly<Record<string, Vista>> = {
  '': 'grafo',
  '#/': 'grafo',
  '#/grafo': 'grafo',
  '#/calculadora': 'calculadora',
}

const FRAGMENTO: Readonly<Record<Vista, string>> = {
  grafo: '#/grafo',
  calculadora: '#/calculadora',
}

/** Un fragmento desconocido cae en el grafo, sin error. */
function leerVista(): Vista {
  if (typeof window === 'undefined') return 'grafo'
  return RUTAS[window.location.hash] ?? 'grafo'
}

export function useVista(): [Vista, (v: Vista) => void] {
  const [vista, setVista] = useState<Vista>(leerVista)

  useEffect(() => {
    const alCambiar = () => setVista(leerVista())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  // Se navega escribiendo el fragmento, no el estado: así el botón atrás del
  // navegador queda dentro del mismo flujo y no hay dos fuentes de verdad.
  const ir = useCallback((v: Vista) => {
    window.location.hash = FRAGMENTO[v]
  }, [])

  return [vista, ir]
}
