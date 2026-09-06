import { useMemo } from 'react'
import type { PensumGraph } from '../model/graph'
import { colorDeSector, leerTokens } from '../view/tokens'

interface Props {
  readonly grafo: PensumGraph
  readonly activo: number | null
  readonly onElegir: (semestre: number | null) => void
  readonly onIr: (id: string) => void
}

/**
 * Recorrido por semestre.
 *
 * El grafo completo responde «cómo se conecta la carrera», pero la pregunta
 * que un estudiante trae es «qué veo este semestre». Aislar un anillo convierte
 * el mapa en un plan: el radio deja de ser una regla del diseño y pasa a ser
 * algo que se recorre.
 */
export function Semestres({ grafo, activo, onElegir, onIr }: Props) {
  const tokens = useMemo(() => leerTokens(), [])

  const porSemestre = useMemo(() => {
    const m = new Map<number, string[]>()
    for (const materia of grafo.materias.values()) {
      const lista = m.get(materia.semestre)
      if (lista) lista.push(materia.id)
      else m.set(materia.semestre, [materia.id])
    }
    for (const lista of m.values()) {
      lista.sort((a, b) =>
        grafo.materias.get(a)!.nombre.localeCompare(grafo.materias.get(b)!.nombre, 'es'),
      )
    }
    return m
  }, [grafo])

  const semestres = useMemo(() => [...porSemestre.keys()].sort((a, b) => a - b), [porSemestre])

  const materias = activo === null ? [] : (porSemestre.get(activo) ?? [])
  const uc = materias.reduce((n, id) => n + grafo.materias.get(id)!.uc, 0)

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-2">
      {activo !== null && (
        <div className="max-h-[34vh] w-[26rem] max-w-[calc(100vw-2rem)] overflow-y-auto rounded-xl border border-hairline bg-void-soft/90 p-2 shadow-2xl backdrop-blur">
          <p className="px-2 pt-1 pb-2 text-[11px] tracking-wider text-slate-500 uppercase">
            Semestre {activo} · {materias.length} materias · {uc} U.C.
          </p>
          <ul className="grid grid-cols-2 gap-0.5">
            {materias.map((id) => {
              const m = grafo.materias.get(id)!
              return (
                <li key={id}>
                  <button
                    type="button"
                    onClick={() => onIr(id)}
                    className="flex w-full items-center gap-2 rounded px-2 py-1 text-left transition hover:bg-white/5"
                  >
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{
                        backgroundColor:
                          m.gate !== null ? tokens.gate : colorDeSector(tokens, m.sector),
                      }}
                    />
                    <span className="truncate text-[12px] text-slate-300">{m.nombre}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      <div className="flex items-center gap-1 rounded-xl border border-hairline bg-void-soft/90 p-1.5 shadow-2xl backdrop-blur">
        <span className="px-1.5 text-[10px] tracking-wider text-slate-600 uppercase">
          Semestre
        </span>
        {semestres.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onElegir(activo === s ? null : s)}
            aria-pressed={activo === s}
            className={`size-7 rounded-md text-[11px] tabular-nums transition ${
              activo === s
                ? 'bg-white/15 font-semibold text-white'
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
            }`}
          >
            {s}
          </button>
        ))}
        {activo !== null && (
          <button
            type="button"
            onClick={() => onElegir(null)}
            className="ml-1 rounded-md px-2 py-1 text-[11px] text-slate-500 transition hover:text-white"
          >
            Todos
          </button>
        )}
      </div>
    </div>
  )
}
