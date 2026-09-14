import { useState } from 'react'
import { NOTA_APROBATORIA, pesaEnIndice, type Intento } from '../progreso/tipos'
import { notaEfectiva } from '../progreso/indice'
import { ETIQUETA_TIPO, formatearNota } from './intentos/consecuencia'
import { FormularioIntento } from './intentos/FormularioIntento'

/**
 * Captura de intentos desde el panel de la materia.
 *
 * La escala, los tipos y sus consecuencias viven en `ui/intentos/`: hay más de
 * una superficie de captura y solo puede haber una definición del Art. 39.
 */

interface Props {
  readonly intentos: readonly Intento[]
  readonly onCambiar: (intentos: readonly Intento[]) => void
}

export function EditorIntentos({ intentos, onCambiar }: Props) {
  const [editando, setEditando] = useState<number | 'nuevo' | null>(null)
  const efectiva = notaEfectiva(intentos)

  const guardar = (i: Intento) => {
    if (editando === 'nuevo') onCambiar([...intentos, i])
    else if (typeof editando === 'number')
      onCambiar(intentos.map((v, k) => (k === editando ? i : v)))
    setEditando(null)
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between">
        <h3 className="text-[11px] font-medium tracking-wider text-slate-500 uppercase">
          Mi historial
        </h3>
        {efectiva !== null && (
          <span className="text-[11px] text-slate-400">
            nota efectiva{' '}
            <strong className="text-white tabular-nums">{formatearNota(efectiva)}</strong>
          </span>
        )}
      </div>

      {intentos.length === 0 && editando === null && (
        <p className="px-2 text-sm text-slate-500">Sin intentos registrados.</p>
      )}

      <ul className="flex flex-col gap-1">
        {intentos.map((i, k) =>
          editando === k ? (
            <li key={k}>
              <FormularioIntento
                inicial={i}
                onGuardar={guardar}
                onCancelar={() => setEditando(null)}
              />
            </li>
          ) : (
            <li
              key={k}
              className="flex items-center gap-2 rounded bg-white/[0.03] px-2 py-1.5"
            >
              <span className="text-[10px] tabular-nums text-slate-600">{k + 1}</span>
              <span className="text-[12px] text-slate-300">{ETIQUETA_TIPO[i.tipo]}</span>
              {i.tipo === 'retiro' && (
                <span className="text-[10px] text-slate-500">
                  {i.desincorporado ? 'con desinc.' : 'sin desinc.'}
                </span>
              )}
              {i.nota !== null && (
                <span
                  className={`rounded px-1.5 text-[11px] font-semibold tabular-nums ${
                    i.nota >= NOTA_APROBATORIA
                      ? 'bg-emerald-500/20 text-emerald-300'
                      : 'bg-rose-500/20 text-rose-300'
                  }`}
                >
                  {i.nota}
                </span>
              )}
              {!pesaEnIndice(i) && (
                <span className="text-[10px] text-slate-600" title="No entra al índice">
                  fuera del índice
                </span>
              )}
              <button
                type="button"
                onClick={() => setEditando(k)}
                className="ml-auto rounded px-1.5 text-[11px] text-slate-500 transition hover:text-white"
              >
                Editar
              </button>
              <button
                type="button"
                aria-label="Eliminar intento"
                onClick={() => onCambiar(intentos.filter((_, j) => j !== k))}
                className="rounded px-1 text-[11px] text-slate-600 transition hover:text-rose-300"
              >
                ✕
              </button>
            </li>
          ),
        )}
      </ul>

      {editando === 'nuevo' ? (
        <FormularioIntento
          inicial={null}
          onGuardar={guardar}
          onCancelar={() => setEditando(null)}
        />
      ) : (
        editando === null && (
          <button
            type="button"
            onClick={() => setEditando('nuevo')}
            className="rounded border border-dashed border-hairline px-2 py-1.5 text-[11px] text-slate-400 transition hover:border-slate-600 hover:text-white"
          >
            + Registrar intento
          </button>
        )
      )}
    </section>
  )
}
