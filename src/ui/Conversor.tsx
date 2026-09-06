import { useMemo, useState } from 'react'
import {
  URL_TABLA_OFICIAL,
  VERSION_TABLA,
  calificacionesDeLaEscala,
  notaDePorcentaje,
  notaDePuntaje,
  porcentajeMinimoDeNota,
} from '../data/tablaConversion'

/**
 * Conversor del Artículo 42.
 *
 * Sustituye a modelar actividades anidadas dentro de cada parcial: quien tiene
 * «17 de 20» lo convierte aquí y escribe la calificación resultante en su
 * parcial.
 */

function Campo({
  etiqueta,
  valor,
  onCambiar,
  sufijo,
  paso = 1,
}: {
  etiqueta: string
  valor: string
  onCambiar: (v: string) => void
  sufijo?: string
  paso?: number
}) {
  return (
    <label className="flex flex-1 flex-col gap-1">
      <span className="text-[10px] tracking-wider text-slate-500 uppercase">{etiqueta}</span>
      <div className="flex items-center gap-1">
        <input
          type="number"
          step={paso}
          value={valor}
          onChange={(e) => onCambiar(e.target.value)}
          className="w-full rounded border border-hairline bg-white/5 px-2 py-1 text-sm text-slate-200 tabular-nums outline-none focus:border-slate-500"
        />
        {sufijo && <span className="text-xs text-slate-500">{sufijo}</span>}
      </div>
    </label>
  )
}

function Resultado({ nota, detalle }: { nota: number | null; detalle?: string }) {
  return (
    <div className="flex min-w-24 flex-col items-center justify-center rounded-lg bg-white/[0.04] px-3 py-2">
      <span className="text-[10px] tracking-wider text-slate-500 uppercase">Nota</span>
      <span
        className={`text-xl font-semibold tabular-nums ${
          nota === null ? 'text-slate-600' : nota >= 5 ? 'text-emerald-400' : 'text-rose-400'
        }`}
      >
        {nota === null ? '—' : nota.toFixed(1).replace('.', ',')}
      </span>
      {detalle && <span className="text-[10px] text-slate-500">{detalle}</span>}
    </div>
  )
}

export function Conversor() {
  const [obtenido, setObtenido] = useState('17')
  const [maximo, setMaximo] = useState('20')
  const [porcentaje, setPorcentaje] = useState('51')
  const [notaObjetivo, setNotaObjetivo] = useState('5')

  const desdePuntaje = useMemo(() => {
    const o = Number(obtenido)
    const m = Number(maximo)
    if (obtenido === '' || maximo === '') return null
    return notaDePuntaje(o, m)
  }, [obtenido, maximo])

  const desdePorcentaje = useMemo(() => {
    if (porcentaje === '') return null
    const p = Number(porcentaje)
    if (!Number.isFinite(p)) return null
    return notaDePorcentaje(p)
  }, [porcentaje])

  const pctNecesario = useMemo(() => {
    const n = Number(notaObjetivo)
    try {
      return porcentajeMinimoDeNota(n)
    } catch {
      return null
    }
  }, [notaObjetivo])

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-hairline bg-void-soft/60 p-4">
      <div>
        <h2 className="text-sm font-semibold text-white">Conversor</h2>
        <p className="mt-0.5 text-[11px] leading-relaxed text-slate-500">
          Tabla del Artículo 42 ({VERSION_TABLA}). No es una regla de tres: el 50 % es
          4,9 y el 51 % es 5,0.{' '}
          <a
            href={URL_TABLA_OFICIAL}
            target="_blank"
            rel="noreferrer"
            className="text-sky-400 hover:underline"
          >
            Tabla oficial
          </a>
        </p>
      </div>

      <div className="flex items-end gap-3">
        <Campo etiqueta="Obtenido" valor={obtenido} onCambiar={setObtenido} paso={0.1} />
        <span className="pb-1.5 text-slate-600">de</span>
        <Campo etiqueta="Máximo" valor={maximo} onCambiar={setMaximo} paso={0.1} />
        <Resultado
          nota={desdePuntaje?.ok ? desdePuntaje.nota : null}
          detalle={
            desdePuntaje?.ok
              ? `${desdePuntaje.porcentaje.toFixed(2).replace(/\.?0+$/, '')} %`
              : undefined
          }
        />
      </div>
      {desdePuntaje && !desdePuntaje.ok && (
        <p className="-mt-2 text-[11px] text-rose-300">{desdePuntaje.error}</p>
      )}

      <div className="flex items-end gap-3 border-t border-hairline pt-3">
        <Campo
          etiqueta="Porcentaje"
          valor={porcentaje}
          onCambiar={setPorcentaje}
          sufijo="%"
          paso={0.1}
        />
        <Resultado
          nota={desdePorcentaje}
          detalle={desdePorcentaje === 5 ? 'primer aprobatorio' : undefined}
        />
      </div>

      <div className="flex items-end gap-3 border-t border-hairline pt-3">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-[10px] tracking-wider text-slate-500 uppercase">
            Quiero sacar
          </span>
          <select
            value={notaObjetivo}
            onChange={(e) => setNotaObjetivo(e.target.value)}
            className="w-full rounded border border-hairline bg-white/5 px-2 py-1 text-sm text-slate-200 tabular-nums outline-none focus:border-slate-500"
          >
            {calificacionesDeLaEscala().map((n) => (
              <option key={n} value={n} className="bg-void-soft">
                {n.toFixed(1).replace('.', ',')}
              </option>
            ))}
          </select>
        </label>
        <div className="flex min-w-24 flex-col items-center justify-center rounded-lg bg-white/[0.04] px-3 py-2">
          <span className="text-[10px] tracking-wider text-slate-500 uppercase">
            Necesito
          </span>
          <span className="text-xl font-semibold text-white tabular-nums">
            {pctNecesario === null ? '—' : `${pctNecesario} %`}
          </span>
        </div>
      </div>
    </section>
  )
}
