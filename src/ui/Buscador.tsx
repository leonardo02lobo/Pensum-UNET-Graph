import { useMemo } from 'react'
import type { PensumGraph } from '../model/graph'
import { colorDeSector, leerTokens } from '../view/tokens'
import { propsDelCampo, useComboMaterias } from './useComboMaterias'

/**
 * Búsqueda del grafo.
 *
 * Era el camino más rápido de la aplicación —escribir tres letras y saltar a
 * cualquier materia— y estaba construido como ocho botones que solo respondían
 * a `onClick`: había que escribir con el teclado y elegir con el ratón. En una
 * app cuyo argumento es «apuntar a discos de 17 px que se mueven es mal camino,
 * usa las flechas», eso desentonaba.
 *
 * El comportamiento vive en `useComboMaterias`, compartido con el selector de
 * la calculadora.
 */

interface Props {
  readonly grafo: PensumGraph
  readonly onElegir: (id: string) => void
  /** El atajo de teclado enfoca el campo a través de esta referencia. */
  readonly campoRef?: React.RefObject<HTMLInputElement | null>
}

export function Buscador({ grafo, onElegir, campoRef }: Props) {
  const tokens = useMemo(() => leerTokens(), [])
  const c = useComboMaterias(grafo, onElegir, campoRef)

  return (
    <div className="pointer-events-auto w-80 max-w-[calc(100vw-2rem)]">
      <input
        {...propsDelCampo(c)}
        placeholder="Buscar materia o código…   /"
        aria-label="Buscar materia o código. Atajo: barra inclinada"
        className="w-full rounded-lg border border-hairline bg-void-soft/90 px-3 py-2 text-sm text-slate-200 shadow-xl backdrop-blur placeholder:text-slate-500 focus:border-slate-500"
      />

      <p className="sr-only" role="status" aria-live="polite">
        {c.anuncio}
      </p>

      {c.abierta && (
        <div className="mt-1.5 overflow-hidden rounded-lg border border-hairline bg-void-soft/95 shadow-2xl backdrop-blur">
          {c.resultados.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-500">
              Ninguna materia coincide con «{c.texto.trim()}».
            </p>
          ) : (
            <ul id={c.idLista} role="listbox" aria-label="Resultados de la búsqueda">
              {c.resultados.map((m, i) => (
                <li
                  key={m.id}
                  id={c.idOpcion(i)}
                  role="option"
                  aria-selected={i === c.activo}
                  // El ratón mueve el activo para que no haya dos marcas a la
                  // vez peleándose por decir cuál se elegiría.
                  onMouseEnter={() => c.setActivo(i)}
                  onClick={() => c.elegir(m.id)}
                  className={`flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left transition ${
                    i === c.activo ? 'bg-white/10' : ''
                  }`}
                >
                  <span
                    aria-hidden
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: colorDeSector(tokens, m.sector) }}
                  />
                  <span className="truncate text-sm text-slate-200">{m.nombre}</span>
                  <span className="ml-auto shrink-0 text-xs text-slate-500">
                    S{m.semestre}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
