import { NOTA_APROBATORIA, NOTA_MAXIMA, NOTA_MINIMA } from '../../progreso/tipos'

/**
 * La escala del Artículo 39: nueve enteros, con la frontera 4|5 marcada.
 *
 * Nada de campos numéricos libres ni de escala sobre 20 — el error más fácil
 * de cometer aquí es teclear una nota de otra universidad.
 *
 * Esta es la ÚNICA definición de la escala en la interfaz. La consumen el
 * editor de intentos del panel y la lista del pensum; si alguna vez hay dos,
 * una de ellas estará mal.
 */

export const NOTAS = Array.from(
  { length: NOTA_MAXIMA - NOTA_MINIMA + 1 },
  (_, i) => NOTA_MINIMA + i,
)

interface Props {
  readonly valor: number | null
  readonly onCambiar: (n: number) => void
  /** Etiqueta del grupo. Por defecto describe la escala. */
  readonly etiqueta?: string
}

export function SelectorNota({ valor, onCambiar, etiqueta }: Props) {
  return (
    <div
      className="flex gap-0.5"
      role="group"
      aria-label={etiqueta ?? 'Calificación de 1 a 9'}
    >
      {NOTAS.map((n) => {
        const activa = valor === n
        const aprobatoria = n >= NOTA_APROBATORIA
        return (
          <button
            key={n}
            type="button"
            onClick={() => onCambiar(n)}
            aria-pressed={activa}
            title={aprobatoria ? `${n} · aprobatoria` : `${n} · reprobatoria`}
            className={`size-7 rounded text-[12px] tabular-nums transition ${
              // La frontera 4|5 se marca con una separación, para que la escala
              // se lea sin tener que recordar dónde aprueba.
              n === NOTA_APROBATORIA ? 'ml-2' : ''
            } ${
              activa
                ? aprobatoria
                  ? 'bg-emerald-500 font-semibold text-white'
                  : 'bg-rose-500 font-semibold text-white'
                : aprobatoria
                  ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/25'
                  : 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/25'
            }`}
          >
            {n}
          </button>
        )
      })}
    </div>
  )
}
