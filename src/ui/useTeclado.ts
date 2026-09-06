import { useEffect } from 'react'
import {
  desbloqueaDirecto,
  ordenTopologico,
  prelacionesDirectas,
  type PensumGraph,
} from '../model/graph'

interface Opciones {
  readonly grafo: PensumGraph
  readonly seleccion: string | null
  readonly irA: (id: string) => void
  readonly limpiar: () => void
}

/**
 * Navegación con teclado.
 *
 * Recorrer una cadena de prelaciones con el ratón obliga a apuntar a discos de
 * 17 px que además se mueven al orbitar. Con las flechas se camina el grafo por
 * sus propias aristas: ← lo que hace falta antes, → lo que se desbloquea,
 * ↑ ↓ entre las alternativas cuando hay varias.
 */
export function useTeclado({ grafo, seleccion, irA, limpiar }: Opciones) {
  useEffect(() => {
    const alPulsar = (e: KeyboardEvent) => {
      // No secuestrar el teclado mientras se escribe en la búsqueda.
      const activo = document.activeElement
      if (
        activo instanceof HTMLInputElement ||
        activo instanceof HTMLTextAreaElement ||
        (activo instanceof HTMLElement && activo.isContentEditable)
      ) {
        if (e.key === 'Escape') (activo as HTMLElement).blur()
        return
      }

      if (e.key === 'Escape') {
        limpiar()
        return
      }

      const flechas = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown']
      if (!flechas.includes(e.key)) return
      e.preventDefault()

      // Sin selección, la primera flecha entra por el principio del pensum.
      if (seleccion === null) {
        const primera = ordenTopologico(grafo)[0]
        if (primera) irA(primera)
        return
      }

      if (e.key === 'ArrowLeft') {
        const previas = prelacionesDirectas(grafo, seleccion)
        if (previas.length > 0) irA(previas[0])
        return
      }
      if (e.key === 'ArrowRight') {
        const siguientes = desbloqueaDirecto(grafo, seleccion)
        if (siguientes.length > 0) irA(siguientes[0])
        return
      }

      // Arriba y abajo rotan entre las materias hermanas: las que comparten
      // el mismo requisito. Es la pregunta "¿qué más se abre por aquí?".
      const previas = prelacionesDirectas(grafo, seleccion)
      const hermanas =
        previas.length > 0
          ? desbloqueaDirecto(grafo, previas[0])
          : [...grafo.materias.values()]
              .filter((m) => m.prelaciones.length === 0)
              .map((m) => m.id)
      if (hermanas.length < 2) return
      const i = hermanas.indexOf(seleccion)
      const paso = e.key === 'ArrowDown' ? 1 : -1
      irA(hermanas[(i + paso + hermanas.length) % hermanas.length])
    }

    window.addEventListener('keydown', alPulsar)
    return () => window.removeEventListener('keydown', alPulsar)
  }, [grafo, seleccion, irA, limpiar])
}
