import { useState } from 'react'
import {
  NOTA_APROBATORIA,
  NOTA_MAXIMA,
  NOTA_MINIMA,
  admiteNota,
  otorgaCreditos,
  pesaEnIndice,
  requiereNota,
  type Intento,
  type TipoIntento,
} from '../progreso/tipos'
import { notaEfectiva } from '../progreso/indice'

/**
 * Captura de intentos desde el panel de la materia.
 *
 * La escala es la del Artículo 39: nueve enteros, con la frontera 4|5 marcada.
 * Nada de campos numéricos libres ni de escala sobre 20 — el error más fácil de
 * cometer aquí es teclear una nota de otra universidad.
 */

const NOTAS = Array.from(
  { length: NOTA_MAXIMA - NOTA_MINIMA + 1 },
  (_, i) => NOTA_MINIMA + i,
)

const ETIQUETA_TIPO: Readonly<Record<TipoIntento, string>> = {
  regular: 'Cursada',
  equivalencia: 'Equivalencia',
  suficiencia: 'Suficiencia',
  retiro: 'Retiro',
  'en-curso': 'En curso',
}

/** Lo que cada tipo hace, citando la norma. Se muestra al elegirlo. */
function consecuencia(i: Intento): string {
  const credito = otorgaCreditos(i) ? 'Otorga créditos' : 'No otorga créditos'
  const indice = pesaEnIndice(i) ? 'pesa en el índice' : 'no pesa en el índice'
  const cita: Record<TipoIntento, string> = {
    regular: 'Art. 47a: se computa lo cursado, aprobado o no.',
    equivalencia: 'Art. 48: lo acreditado por equivalencia no entra al índice.',
    suficiencia: 'Art. 37: la suficiencia reprobada no cuenta para nada.',
    retiro: 'Art. 21: solo el retiro sin desincorporación afecta el historial.',
    'en-curso': 'Sin calificación definitiva todavía.',
  }
  return `${credito} y ${indice}. ${cita[i.tipo]}`
}

function SelectorNota({
  valor,
  onCambiar,
}: {
  valor: number | null
  onCambiar: (n: number) => void
}) {
  return (
    <div className="flex gap-0.5" role="group" aria-label="Calificación de 1 a 9">
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

function FormularioIntento({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial: Intento | null
  onGuardar: (i: Intento) => void
  onCancelar: () => void
}) {
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
            <strong className="text-white tabular-nums">
              {Number.isInteger(efectiva) ? efectiva : efectiva.toFixed(2)}
            </strong>
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
