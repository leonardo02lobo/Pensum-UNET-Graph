import type { Vista } from './useVista'

interface Props {
  readonly vista: Vista
  readonly onIr: (v: Vista) => void
  /** Vistas ofrecidas. Sin WebGL el grafo no se ofrece: una pestaña que al
   *  pulsarla no lleva a ninguna parte es peor que no tenerla. */
  readonly disponibles?: readonly Vista[]
}

const ETIQUETA: Readonly<Record<Vista, string>> = {
  grafo: 'Grafo',
  plan: 'Plan',
  calculadora: 'Calculadora',
}

const TODAS = Object.keys(ETIQUETA) as Vista[]

/** Conmutación entre las vistas, visible en todas. */
export function PestanasVista({ vista, onIr, disponibles = TODAS }: Props) {
  return (
    <div className="pointer-events-auto flex gap-0.5 rounded-lg border border-hairline bg-void-soft/90 p-0.5 shadow-xl backdrop-blur">
      {TODAS.filter((v) => disponibles.includes(v)).map((v) => (
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
