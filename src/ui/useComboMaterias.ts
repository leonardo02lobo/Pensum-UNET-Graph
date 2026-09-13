import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { Materia } from '../data/types'
import { buscar, type PensumGraph } from '../model/graph'

/**
 * Búsqueda de materias operable sin soltar el teclado.
 *
 * El grafo y la calculadora tienen cada uno su campo de búsqueda con la misma
 * estructura. Antes eran dos copias que solo respondían a `onClick`; ahora
 * comparten esta pieza, por la misma razón que `ui/intentos/` comparte la
 * escala del Art. 39: dos copias del mismo comportamiento acaban divergiendo.
 *
 * El foco NO se mueve a los resultados (design.md, D2). Se queda en el campo y
 * la relación con el elemento activo se expresa con `aria-activedescendant`.
 */

export interface Combo {
  readonly texto: string
  readonly setTexto: (v: string) => void
  readonly resultados: readonly Materia[]
  readonly activo: number
  readonly setActivo: (i: number) => void
  readonly abierta: boolean
  readonly elegir: (id: string) => void
  readonly campo: React.RefObject<HTMLInputElement | null>
  readonly idOpcion: (i: number) => string
  readonly idLista: string
  readonly alPulsar: (e: React.KeyboardEvent<HTMLInputElement>) => void
  /** Texto del anuncio para lectores de pantalla. Vacío con la lista cerrada. */
  readonly anuncio: string
}

export function useComboMaterias(
  grafo: PensumGraph,
  onElegir: (id: string) => void,
  campoExterno?: React.RefObject<HTMLInputElement | null>,
): Combo {
  const [texto, setTexto] = useState('')
  const [activo, setActivo] = useState(0)
  const [cerrada, setCerrada] = useState(false)
  const propio = useRef<HTMLInputElement>(null)
  const campo = campoExterno ?? propio
  const idLista = useId()

  const resultados = useMemo(() => buscar(grafo, texto).slice(0, 8), [grafo, texto])
  const abierta = texto.trim() !== '' && !cerrada

  // Al cambiar el texto vuelve a abrirse y el activo vuelve al principio: lo
  // contrario dejaría un índice apuntando a un resultado que ya no está.
  useEffect(() => {
    setActivo(0)
    setCerrada(false)
  }, [texto])

  const elegir = (id: string) => {
    onElegir(id)
    setTexto('')
    setCerrada(false)
  }

  const alPulsar = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      if (abierta) {
        // Dos capas: primero se cierra la lista, y solo un Escape posterior
        // llega a limpiar selección y filtros. Es el orden que el usuario
        // espera —de lo más local a lo más global— y la convención de
        // cualquier combo.
        e.preventDefault()
        e.stopPropagation()
        setCerrada(true)
      }
      return
    }

    if (!abierta || resultados.length === 0) return

    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault()
      // Tope en los extremos en vez de dar la vuelta: con ocho resultados como
      // máximo, dar la vuelta desorienta más de lo que ahorra.
      const paso = e.key === 'ArrowDown' ? 1 : -1
      setActivo((i) => Math.min(resultados.length - 1, Math.max(0, i + paso)))
      return
    }

    if (e.key === 'Enter') {
      const m = resultados[activo]
      if (m) {
        e.preventDefault()
        elegir(m.id)
      }
    }
  }

  const anuncio = !abierta
    ? ''
    : resultados.length === 0
      ? 'Ninguna materia coincide'
      : `${resultados.length} ${resultados.length === 1 ? 'resultado' : 'resultados'}`

  return {
    texto,
    setTexto,
    resultados,
    activo,
    setActivo,
    abierta,
    elegir,
    campo,
    idLista,
    idOpcion: (i: number) => `${idLista}-${i}`,
    alPulsar,
    anuncio,
  }
}

/** Atributos ARIA del campo, para no repetirlos en cada consumidor. */
export function propsDelCampo(c: Combo) {
  return {
    ref: c.campo,
    type: 'search' as const,
    role: 'combobox',
    'aria-expanded': c.abierta,
    'aria-controls': c.idLista,
    'aria-autocomplete': 'list' as const,
    'aria-activedescendant':
      c.abierta && c.resultados.length > 0 ? c.idOpcion(c.activo) : undefined,
    value: c.texto,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => c.setTexto(e.target.value),
    onKeyDown: c.alPulsar,
  }
}
