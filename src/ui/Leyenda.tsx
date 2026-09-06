import { useMemo, useState } from 'react'
import { SECTORES, formatearUmbral, gateEnUC, type Sector } from '../data/types'
import type { PensumGraph } from '../model/graph'
import { evaluarCompuerta, type Resumen } from '../progreso/indice'
import { ESTADOS, NOMBRE_ESTADO, type EstadoMateria } from '../progreso/estados'
import type { Historial } from '../progreso/tipos'
import { NOMBRE_SECTOR, leerTokens } from '../view/tokens'
import { Respaldo } from './Respaldo'

interface Props {
  readonly grafo: PensumGraph
  readonly historial: Historial
  readonly resumen: Resumen
  readonly estados: ReadonlyMap<string, EstadoMateria>
  readonly sectorFiltrado: Sector | null
  readonly estadoFiltrado: EstadoMateria | null
  readonly onFiltrar: (s: Sector | null) => void
  readonly onFiltrarEstado: (e: EstadoMateria | null) => void
  readonly onImportar: (h: Historial) => void
  readonly onIr: (id: string) => void
}

type Pestana = 'sectores' | 'estados' | 'compuertas' | 'datos'

const PUNTO_ESTADO: Readonly<Record<EstadoMateria, string>> = {
  aprobada: 'bg-emerald-400',
  'en-curso': 'bg-sky-400',
  disponible: 'bg-amber-400',
  'bloqueada-prelacion': 'bg-slate-600',
  'bloqueada-credito': 'bg-slate-500',
}

export function Leyenda({
  grafo,
  historial,
  resumen,
  estados,
  sectorFiltrado,
  estadoFiltrado,
  onFiltrar,
  onFiltrarEstado,
  onImportar,
  onIr,
}: Props) {
  const [abierta, setAbierta] = useState(true)
  const [pestana, setPestana] = useState<Pestana>('sectores')
  const tokens = useMemo(() => leerTokens(), [])

  const conteoSector = useMemo(() => {
    const c = new Map<Sector, number>(SECTORES.map((s) => [s, 0]))
    for (const m of grafo.materias.values()) {
      if (m.sector !== null) c.set(m.sector, c.get(m.sector)! + 1)
    }
    return c
  }, [grafo])

  const conteoEstado = useMemo(() => {
    const c = new Map<EstadoMateria, number>(ESTADOS.map((e) => [e, 0]))
    for (const e of estados.values()) c.set(e, (c.get(e) ?? 0) + 1)
    return c
  }, [estados])

  // Las compuertas agrupadas por umbral: es la tabla del Canva, ahora viva
  // contra el avance real.
  const compuertas = useMemo(() => {
    const grupos = new Map<string, { orden: number; materias: string[] }>()
    for (const m of grafo.materias.values()) {
      if (m.gate === null) continue
      const clave = formatearUmbral(m.gate)
      const g = grupos.get(clave) ?? { orden: gateEnUC(m.gate), materias: [] }
      g.materias.push(m.id)
      grupos.set(clave, g)
    }
    return [...grupos.entries()].sort((a, b) => a[1].orden - b[1].orden)
  }, [grafo])

  const meta = grafo.pensum.meta
  const hayProgreso = Object.values(historial).some((i) => i.length > 0)

  if (!abierta) {
    return (
      <button
        type="button"
        onClick={() => setAbierta(true)}
        className="pointer-events-auto rounded-lg border border-hairline bg-void-soft/90 px-3 py-2 text-xs text-slate-300 shadow-xl backdrop-blur transition hover:text-white"
      >
        Leyenda
      </button>
    )
  }

  return (
    <div className="pointer-events-auto w-76 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xl border border-hairline bg-void-soft/90 shadow-2xl backdrop-blur">
      <div className="flex items-center border-b border-hairline">
        {(['sectores', 'estados', 'compuertas', 'datos'] as const).map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => setPestana(p)}
            className={`flex-1 px-1.5 py-2 text-[10px] tracking-wider uppercase transition ${
              pestana === p ? 'bg-white/5 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setAbierta(false)}
          aria-label="Ocultar leyenda"
          className="px-2.5 py-2 text-slate-500 transition hover:text-white"
        >
          ✕
        </button>
      </div>

      <div className="max-h-[50vh] overflow-y-auto p-2">
        {pestana === 'sectores' && (
          <>
            <ul className="flex flex-col gap-0.5">
              {SECTORES.map((s) => {
                const activo = sectorFiltrado === s
                return (
                  <li key={s}>
                    <button
                      type="button"
                      onClick={() => onFiltrar(activo ? null : s)}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition ${
                        activo ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <span
                        aria-hidden
                        className="size-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: tokens.sector[s] }}
                      />
                      <span className="truncate text-xs text-slate-300">
                        {NOMBRE_SECTOR[s]}
                      </span>
                      <span className="ml-auto shrink-0 text-[11px] text-slate-500">
                        {conteoSector.get(s)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="mt-2 border-t border-hairline px-2 pt-2 text-[11px] leading-relaxed text-slate-500">
              El radio es el semestre; el ángulo, el sector. El ancho de cada brazo es
              proporcional a su número de materias.
            </p>
          </>
        )}

        {pestana === 'estados' && (
          <>
            <ul className="flex flex-col gap-0.5">
              {ESTADOS.map((e) => {
                const activo = estadoFiltrado === e
                return (
                  <li key={e}>
                    <button
                      type="button"
                      onClick={() => onFiltrarEstado(activo ? null : e)}
                      className={`flex w-full items-center gap-2 rounded px-2 py-1.5 text-left transition ${
                        activo ? 'bg-white/10' : 'hover:bg-white/5'
                      }`}
                    >
                      <span
                        aria-hidden
                        className={`size-2.5 shrink-0 rounded-full ${PUNTO_ESTADO[e]}`}
                      />
                      <span className="truncate text-xs text-slate-300">
                        {NOMBRE_ESTADO[e]}
                      </span>
                      <span className="ml-auto shrink-0 text-[11px] text-slate-500">
                        {conteoEstado.get(e)}
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
            <p className="mt-2 border-t border-hairline px-2 pt-2 text-[11px] leading-relaxed text-slate-500">
              <strong className="text-amber-200">Disponible</strong> es lo que puedes
              inscribir ahora: prelaciones aprobadas y compuerta cumplida.
            </p>
          </>
        )}

        {pestana === 'compuertas' && (
          <>
            <p className="px-2 py-1.5 text-[11px] leading-relaxed text-slate-500">
              Estas materias no dependen de aprobar otra, sino de acumular créditos.
              {hayProgreso && (
                <>
                  {' '}
                  Llevas{' '}
                  <strong className="text-slate-300">{resumen.ucAprobadas} U.C.</strong>
                </>
              )}
            </p>
            <ul className="flex flex-col gap-2">
              {compuertas.map(([nivel, g]) => {
                const muestra = grafo.materias.get(g.materias[0])!
                const estado = evaluarCompuerta(muestra, resumen.ucAprobadas)!
                return (
                  <li key={nivel} className="rounded bg-white/[0.03] px-2 py-1.5">
                    <p className="flex items-baseline gap-2">
                      <span className="text-xs font-semibold text-slate-200">{nivel}</span>
                      {hayProgreso &&
                        (estado.cumplida ? (
                          <span className="text-[10px] text-emerald-400">alcanzada</span>
                        ) : (
                          <span className="text-[10px] text-slate-500">
                            faltan {estado.faltan}
                          </span>
                        ))}
                    </p>
                    <ul className="mt-0.5">
                      {g.materias.map((id) => (
                        <li key={id}>
                          <button
                            type="button"
                            onClick={() => onIr(id)}
                            className="w-full truncate text-left text-[11px] text-slate-400 transition hover:text-white"
                          >
                            {grafo.materias.get(id)!.nombre}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                )
              })}
            </ul>
          </>
        )}

        {pestana === 'datos' && (
          <div className="flex flex-col gap-3">
            <Respaldo historial={historial} onImportar={onImportar} />

            <div className="flex flex-col gap-3 border-t border-hairline px-2 pt-3 text-[11px] leading-relaxed text-slate-400">
              <p className="text-slate-500">
                El índice se calcula según las Normas de Evaluación del Rendimiento
                Estudiantil de la UNET (C-3, Cap. VII). Es{' '}
                <strong className="text-slate-300">referencial</strong> y no sustituye a
                Control de Estudios.
              </p>
              <p>
                Última verificación del pensum:{' '}
                <strong className="text-slate-200">{meta.verificado}</strong>
              </p>
              <ul className="flex flex-col gap-2">
                {meta.fuentes.map((f) => (
                  <li key={f.id}>
                    <p className="text-slate-300">{f.titulo}</p>
                    {f.fecha && <p className="text-slate-500">{f.fecha}</p>}
                    {f.url && (
                      <a
                        href={f.url}
                        target="_blank"
                        rel="noreferrer"
                        className="break-all text-sky-400 hover:underline"
                      >
                        {f.url}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-slate-500">
                {meta.discrepancias.length} discrepancias entre fuentes resueltas y{' '}
                {meta.inferencias.length} datos inferidos, documentados en el dataset.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
