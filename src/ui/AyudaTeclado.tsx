/**
 * Referencia de atajos, en la propia interfaz.
 *
 * La tabla de teclas vivía en `docs/05-interfaz.md`. Un atajo que nadie
 * descubre no existe, y `Esc` —que limpia selección y los tres filtros a la
 * vez— era la única forma rápida de salir de un estado filtrado.
 *
 * Va junto a los controles de cámara y no como quinta pestaña de la leyenda:
 * esa barra ya lleva cuatro a `text-[10px]` y una quinta la dejaría ilegible.
 */

interface Atajo {
  readonly teclas: readonly string[]
  readonly hace: string
}

const ATAJOS: readonly Atajo[] = [
  { teclas: ['/'], hace: 'Buscar una materia' },
  { teclas: ['←'], hace: 'La primera prelación: lo que hace falta antes' },
  { teclas: ['→'], hace: 'Lo primero que se desbloquea' },
  { teclas: ['↑', '↓'], hace: 'Rota entre materias hermanas' },
  { teclas: ['Esc'], hace: 'Limpia la selección y los filtros' },
]

function Tecla({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="rounded border border-hairline bg-white/5 px-1.5 py-0.5 font-sans text-[11px] text-slate-300">
      {children}
    </kbd>
  )
}

interface Props {
  readonly abierta: boolean
  readonly onAlternar: () => void
}

export function AyudaTeclado({ abierta, onAlternar }: Props) {
  return (
    <div className="pointer-events-auto flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierta}
        aria-label="Atajos de teclado"
        title="Atajos de teclado"
        className={`flex size-9 items-center justify-center rounded-lg border border-hairline text-[13px] transition ${
          abierta ? 'bg-white/10 text-white' : 'bg-void-soft/90 text-slate-400 hover:text-white'
        }`}
      >
        ?
      </button>

      {abierta && (
        <div className="w-64 rounded-xl border border-hairline bg-void-soft/95 p-2.5 shadow-2xl backdrop-blur">
          <p className="px-1 pb-2 text-[10px] tracking-wider text-slate-500 uppercase">
            Teclado
          </p>
          <dl className="flex flex-col gap-1.5">
            {ATAJOS.map((a) => (
              <div key={a.hace} className="flex items-start gap-2">
                <dt className="flex shrink-0 gap-1">
                  {a.teclas.map((t) => (
                    <Tecla key={t}>{t}</Tecla>
                  ))}
                </dt>
                <dd className="text-[11px] leading-relaxed text-slate-400">{a.hace}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 border-t border-hairline px-1 pt-2 text-[10px] leading-relaxed text-slate-500">
            Las flechas caminan el grafo por sus propias aristas. Mientras escribes en un
            campo se comportan como siempre.
          </p>
        </div>
      )}
    </div>
  )
}
