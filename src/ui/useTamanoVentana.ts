import { useLayoutEffect, useState } from 'react'

/**
 * Sigue el tamaño del contenedor raíz.
 *
 * Se observa el elemento y no `window.matchMedia` porque lo que importa es el
 * ancho disponible, no el del dispositivo — y porque `GrafoOrbital` ya mide su
 * contenedor con `ResizeObserver` por la misma razón. Un solo criterio.
 *
 * Se mide en `useLayoutEffect` para que el primer pintado ya tenga el tramo
 * correcto: medir después provoca un parpadeo en el que el cromo se coloca
 * primero como escritorio y salta.
 */

export interface TamanoVentana {
  readonly ancho: number
  readonly alto: number
}

export function useTamanoVentana(): TamanoVentana {
  const [tamano, setTamano] = useState<TamanoVentana>(() =>
    typeof window === 'undefined'
      ? { ancho: 0, alto: 0 }
      : { ancho: window.innerWidth, alto: window.innerHeight },
  )

  useLayoutEffect(() => {
    const el = document.documentElement
    const medir = (ancho: number, alto: number) =>
      setTamano((previo) =>
        previo.ancho === ancho && previo.alto === alto ? previo : { ancho, alto },
      )

    medir(window.innerWidth, window.innerHeight)

    const observador = new ResizeObserver(() =>
      medir(window.innerWidth, window.innerHeight),
    )
    observador.observe(el)
    return () => observador.disconnect()
  }, [])

  return tamano
}
