import type { Sector } from '../data/types'
import { NOMBRE_ESTADO, type EstadoMateria } from '../progreso/estados'
import { NOMBRE_SECTOR, colorDeSector, leerTokens } from '../view/tokens'

/**
 * Los filtros activos, juntos y en un solo sitio.
 *
 * Había tres filtros en dos componentes distintos —uno de ellos con pestañas—
 * y componían entre sí sin que se viera en ninguna parte qué estaba filtrando.
 * Si filtrabas por sector, cambiabas a la pestaña «compuertas» y te olvidabas,
 * el grafo quedaba medio apagado sin explicación a la vista.
 *
 * Los chips MUESTRAN y QUITAN; elegir se sigue haciendo donde se hace hoy
 * (design.md, D6). Un chip que también permitiera elegir duplicaría la leyenda
 * y la barra de semestres.
 *
 * Son además la contraparte visible de `Esc`, que limpia los tres a la vez y
 * hasta ahora solo estaba documentado en `docs/`.
 */

interface Props {
  readonly sector: Sector | null
  readonly estado: EstadoMateria | null
  readonly semestre: number | null
  readonly onQuitarSector: () => void
  readonly onQuitarEstado: () => void
  readonly onQuitarSemestre: () => void
  readonly onQuitarTodos: () => void
}

function Chip({
  texto,
  color,
  onQuitar,
}: {
  texto: string
  color?: string
  onQuitar: () => void
}) {
  return (
    <span className="flex items-center gap-1.5 rounded-md bg-white/10 py-1 pr-1 pl-2 text-[11px] text-slate-200">
      {color && (
        <span
          aria-hidden
          className="size-2 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
      )}
      {texto}
      <button
        type="button"
        onClick={onQuitar}
        aria-label={`Quitar el filtro ${texto}`}
        className="rounded px-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
      >
        ✕
      </button>
    </span>
  )
}

export function ChipsFiltro({
  sector,
  estado,
  semestre,
  onQuitarSector,
  onQuitarEstado,
  onQuitarSemestre,
  onQuitarTodos,
}: Props) {
  const activos = [sector, estado, semestre].filter((v) => v !== null).length
  // Sin filtros no se muestra nada: un hueco vacío sería ruido.
  if (activos === 0) return null

  const tokens = leerTokens()

  return (
    <div className="pointer-events-auto flex max-w-full flex-wrap items-center gap-1.5 rounded-xl border border-hairline bg-void-soft/90 px-2 py-1.5 shadow-xl backdrop-blur">
      <span className="px-0.5 text-[10px] tracking-wider text-slate-500 uppercase">
        Filtrando
      </span>

      {sector !== null && (
        <Chip
          texto={NOMBRE_SECTOR[sector]}
          color={colorDeSector(tokens, sector)}
          onQuitar={onQuitarSector}
        />
      )}
      {estado !== null && (
        <Chip texto={NOMBRE_ESTADO[estado]} onQuitar={onQuitarEstado} />
      )}
      {semestre !== null && (
        <Chip texto={`Semestre ${semestre}`} onQuitar={onQuitarSemestre} />
      )}

      {activos > 1 && (
        <button
          type="button"
          onClick={onQuitarTodos}
          className="rounded-md px-2 py-1 text-[11px] text-slate-400 transition hover:bg-white/5 hover:text-white"
        >
          Limpiar todo
        </button>
      )}
      <span className="px-1 text-[10px] text-slate-600" title="La tecla Escape limpia selección y filtros">
        Esc
      </span>
    </div>
  )
}
