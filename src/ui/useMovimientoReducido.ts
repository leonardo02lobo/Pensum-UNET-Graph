import { useEffect, useState } from 'react'

/**
 * ¿El sistema pide movimiento reducido?
 *
 * La distinción que gobierna todo su uso: `prefers-reduced-motion` pide que la
 * aplicación no mueva cosas **por su cuenta**, no que el usuario pierda una
 * función (design.md, D4). La rotación automática no arranca sola, pero su
 * control sigue ahí y funciona: quitarlo sería tratar una preferencia como una
 * incapacidad.
 *
 * Se observa, no se lee una vez: la preferencia se cambia en caliente, sobre
 * todo en escritorio.
 */

const CONSULTA = '(prefers-reduced-motion: reduce)'

export function useMovimientoReducido(): boolean {
  const [reducido, setReducido] = useState(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return false
    }
    return window.matchMedia(CONSULTA).matches
  })

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return
    const mq = window.matchMedia(CONSULTA)
    const alCambiar = (e: MediaQueryListEvent) => setReducido(e.matches)
    mq.addEventListener('change', alCambiar)
    setReducido(mq.matches)
    return () => mq.removeEventListener('change', alCambiar)
  }, [])

  return reducido
}
