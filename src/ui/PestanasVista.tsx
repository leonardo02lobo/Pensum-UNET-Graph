import type { Vista } from './useVista'

interface Props {
  readonly vista: Vista
  readonly onIr: (v: Vista) => void
}

const ETIQUETA: Readonly<Record<Vista, string>> = {
  grafo: 'Grafo',
  calculadora: 'Calculadora',
}

/** Conmutación entre las dos vistas, visible en ambas. */
export function PestanasVista({ vista, onIr }: Props) {
  return (
    <div className="pointer-events-auto flex gap-0.5 rounded-lg border border-hairline bg-void-soft/90 p-0.5 shadow-xl backdrop-blur">
      {(Object.keys(ETIQUETA) as Vista[]).map((v) => (
        <button
          key={v}
          type="button"
          onClick={() => onIr(v)}
          aria-current={vista === v ? 'page' : undefined}
          className={`rounded-md px-3 py-1 text-[12px] transition ${
            vista === v
              ? 'bg-white/10 font-medium text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          {ETIQUETA[v]}
        </button>
      ))}
    </div>
  )
}
