import { useState } from 'react'
import {
  admiteNota,
  requiereNota,
  type Intento,
  type TipoIntento,
} from '../../progreso/tipos'
import { ETIQUETA_TIPO, consecuencia } from './consecuencia'
import { SelectorNota } from './SelectorNota'

/**
 * Captura completa de un intento: tipo, nota y, para el retiro, si hubo
 * desincorporación.
 *
 * Es la única superficie donde entran los tipos especiales. La lista del
 * pensum solo ofrece la escala directa para el caso regular (design.md, D4):
 * cada tipo especial arrastra una consecuencia normativa que hay que leer
 * antes de elegir, y ese texto no cabe en una fila.
 */

interface Props {
  readonly inicial: Intento | null
  readonly onGuardar: (i: Intento) => void
  readonly onCancelar: () => void
}

export function FormularioIntento({ inicial, onGuardar, onCancelar }: Props) {
  const [tipo, setTipo] = useState<TipoIntento>(inicial?.tipo ?? 'regular')
  const [nota, setNota] = useState<number | null>(inicial?.nota ?? null)
  const [desincorporado, setDesincorporado] = useState(inicial?.desincorporado ?? false)

  const notaAplica = admiteNota(tipo)
  const falta = requiereNota(tipo) && nota === null
  const previo: Intento = { tipo, nota: notaAplica ? nota : null, desincorporado }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-hairline bg-white/[0.03] p-3">
      <div className="flex flex-wrap gap-1">
        {(Object.keys(ETIQUETA_TIPO) as TipoIntento[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setTipo(t)
              if (!admiteNota(t)) setNota(null)
            }}
            aria-pressed={tipo === t}
            className={`rounded px-2 py-1 text-[11px] transition ${
              tipo === t
                ? 'bg-white/15 font-medium text-white'
                : 'bg-white/5 text-slate-400 hover:text-white'
            }`}
          >
            {ETIQUETA_TIPO[t]}
          </button>
        ))}
      </div>

      {tipo === 'retiro' && (
        <label className="flex items-center gap-2 text-[11px] text-slate-300">
          <input
            type="checkbox"
            checked={desincorporado}
            onChange={(e) => setDesincorporado(e.target.checked)}
            className="size-3.5 accent-sky-500"
          />
          Con desincorporación del semestre
        </label>
      )}

      {notaAplica && (
        <div className="flex flex-col gap-1.5">
          <SelectorNota valor={nota} onCambiar={setNota} />
          {tipo === 'retiro' && nota === null && (
            <p className="text-[10px] text-slate-500">
              Sin nota, el retiro no aporta nada al índice.
            </p>
          )}
        </div>
      )}

      <p className="text-[10px] leading-relaxed text-slate-500">{consecuencia(previo)}</p>

      <div className="flex gap-2">
        <button
          type="button"
          disabled={falta}
          onClick={() => onGuardar(previo)}
          className="rounded bg-sky-500/90 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
        >
          {inicial ? 'Guardar' : 'Añadir'}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded px-3 py-1 text-[11px] text-slate-400 transition hover:text-white"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}
