import { useCallback, useEffect, useState } from 'react'
import {
  DIRECCION_INICIAL,
  escribirDireccion,
  leerDireccion,
  type Direccion,
  type Vista,
} from './direccion'

export type { Vista } from './direccion'

/**
 * Enrutado por el fragmento de la URL.
 *
 * Tres vistas no justifican una dependencia de enrutado (design.md, D8): un
 * `hashchange` propio da URL compartible y botón atrás en unas pocas líneas.
 *
 * El fragmento es la ÚNICA fuente de verdad de la vista, la materia
 * seleccionada y los tres filtros. No hay copia en `useState` que sincronizar:
 * un clic no llama a un setter, escribe la dirección, y el render sigue. Es más
 * indirecto y es el precio de no tener dos verdades (design.md, D3).
 */

function leerDelNavegador(): Direccion {
  if (typeof window === 'undefined') return DIRECCION_INICIAL
  return leerDireccion(window.location.hash)
}

export interface Enrutado {
  readonly direccion: Direccion
  /** Navegar a otra vista: AÑADE una entrada al historial del navegador. */
  readonly navegar: (v: Vista) => void
  /**
   * Navegar a otra vista llevándose una materia.
   *
   * Un solo gesto y una sola entrada de historial: la app ya sabía qué materia
   * miraba el usuario, y hacerle buscarla otra vez al cambiar de pestaña era
   * olvidar lo que acababa de saber (design.md, D5).
   */
  readonly navegarConMateria: (v: Vista, materia: string) => void
  /**
   * Cambiar selección o filtros: REEMPLAZA la entrada actual.
   *
   * Sin esto, recorrer diez materias con las flechas deja diez entradas y el
   * botón de retroceso se vuelve inútil (design.md, D4).
   */
  readonly reemplazar: (d: Direccion) => void
}

export function useEnrutado(): Enrutado {
  const [direccion, setDireccion] = useState<Direccion>(leerDelNavegador)

  useEffect(() => {
    const alCambiar = () => setDireccion(leerDelNavegador())
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])

  const navegar = useCallback((v: Vista) => {
    // Cambiar de vista ES navegar, y el usuario espera poder volver.
    setDireccion((previa) => {
      const siguiente = { ...previa, vista: v }
      window.location.hash = escribirDireccion(siguiente)
      return siguiente
    })
  }, [])

  const navegarConMateria = useCallback((v: Vista, materia: string) => {
    setDireccion((previa) => {
      const siguiente = { ...previa, vista: v, materia }
      window.location.hash = escribirDireccion(siguiente)
      return siguiente
    })
  }, [])

  const reemplazar = useCallback((d: Direccion) => {
    // `replaceState` NO dispara `hashchange`, así que el estado se actualiza en
    // el mismo gesto. Esperar al evento dejaría la selección sin responder.
    const fragmento = escribirDireccion(d)
    window.history.replaceState(null, '', fragmento)
    setDireccion(d)
  }, [])

  return { direccion, navegar, navegarConMateria, reemplazar }
}
