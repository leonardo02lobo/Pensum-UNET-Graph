import { useMemo, useState } from 'react'
import { buscar, type PensumGraph } from '../model/graph'
import { colorDeSector, leerTokens } from '../view/tokens'

interface Props {
  readonly grafo: PensumGraph
  readonly onElegir: (id: string) => void
}

export function Buscador({ grafo, onElegir }: Props) {
  const [texto, setTexto] = useState('')
  const tokens = useMemo(() => leerTokens(), [])
  const resultados = useMemo(() => buscar(grafo, texto).slice(0, 8), [grafo, texto])
  const buscando = texto.trim() !== ''

  return (
    <div className="pointer-events-auto w-80 max-w-[calc(100vw-2rem)]">
      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar materia o código…"
        className="w-full rounded-lg border border-hairline bg-void-soft/90 px-3 py-2 text-sm text-slate-200 shadow-xl backdrop-blur outline-none placeholder:text-slate-500 focus:border-slate-500"
      />

      {buscando && (
        <div className="mt-1.5 overflow-hidden rounded-lg border border-hairline bg-void-soft/95 shadow-2xl backdrop-blur">
          {resultados.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-500">
              Ninguna materia coincide con «{texto.trim()}».
            </p>
          ) : (
            <ul>
              {resultados.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onElegir(m.id)
                      setTexto('')
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-white/5"
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
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
