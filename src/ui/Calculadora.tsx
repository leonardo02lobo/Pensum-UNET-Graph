import { useMemo, useState } from 'react'
import type { Materia } from '../data/types'
import {
  calificacionesDeLaEscala,
  notaDePorcentaje,
  porcentajeMinimoDeNota,
} from '../data/tablaConversion'
import { buscar, type PensumGraph } from '../model/graph'
import type { Intento } from '../progreso/tipos'
import {
  planSugerido,
  reglaArticulo32,
  sumaDePonderaciones,
  validarArticulo32,
  type Discrepancia,
  type Parcial,
  type PlanEvaluacion,
} from '../evaluacion/plan'
import { evaluar, type Necesario } from '../evaluacion/definitiva'
import { colorDeSector, leerTokens } from '../view/tokens'
import { Conversor } from './Conversor'

interface Props {
  readonly grafo: PensumGraph
  /** Planes de la sesión, indexados por materia. No se persisten (D7). */
  readonly planes: Readonly<Record<string, PlanEvaluacion>>
  readonly onCambiarPlan: (plan: PlanEvaluacion) => void
  readonly materiaId: string | null
  readonly onElegirMateria: (id: string | null) => void
  readonly intentosDe: (id: string) => readonly Intento[]
  /** Definitiva ya registrada desde la calculadora, por materia. */
  readonly registradas: Readonly<Record<string, number>>
  readonly onRegistrar: (id: string, nota: number) => void
}

const NOTAS = calificacionesDeLaEscala()

function fmt(n: number, dec = 2): string {
  return n.toFixed(dec).replace('.', ',')
}

// ─── Selección de materia ───────────────────────────────────────────────────

function Selector({
  grafo,
  onElegir,
}: {
  grafo: PensumGraph
  onElegir: (id: string) => void
}) {
  const [texto, setTexto] = useState('')
  const tokens = useMemo(() => leerTokens(), [])
  const resultados = useMemo(() => buscar(grafo, texto).slice(0, 8), [grafo, texto])

  return (
    <div className="relative">
      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar materia o código…"
        className="w-full rounded-lg border border-hairline bg-void-soft/90 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-slate-500"
      />
      {texto.trim() !== '' && (
        <div className="absolute z-10 mt-1.5 w-full overflow-hidden rounded-lg border border-hairline bg-void-soft shadow-2xl">
          {resultados.length === 0 ? (
            <p className="px-3 py-2.5 text-sm text-slate-500">Sin coincidencias.</p>
          ) : (
            <ul>
              {resultados.map((m) => (
                <li key={m.id}>
                  <button
                    type="button"
                    onClick={() => {
                      onElegir(m.id)
                      setTexto('')
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-white/5"
                  >
                    <span
                      aria-hidden
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: colorDeSector(tokens, m.sector) }}
                    />
                    <span className="truncate text-sm text-slate-200">{m.nombre}</span>
                    <span className="ml-auto shrink-0 text-xs text-slate-500">
                      {m.uc} U.C.
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Avisos del Artículo 32 ─────────────────────────────────────────────────

function textoDiscrepancia(d: Discrepancia): string {
  if (d.tipo === 'numero-de-parciales') {
    const base = `El Art. 32${d.literal} exige ${d.esperados} evaluaciones parciales y tu plan declara ${d.declarados}.`
    return d.admiteExcepcion
      ? `${base} Se admiten 3 con autorización de la Unidad de Evaluación.`
      : base
  }
  return `Parcial ${d.indice + 1}: el Art. 32${d.literal} limita cada evaluación al rango ${d.minimo} %–${d.maximo} %, y tiene ${fmt(d.peso, 2).replace(',00', '')} %.`
}

// ─── Tabla de parciales ─────────────────────────────────────────────────────

function FilaParcial({
  parcial,
  indice,
  fueraDeNorma,
  onCambiar,
  onEliminar,
}: {
  parcial: Parcial
  indice: number
  fueraDeNorma: boolean
  onCambiar: (p: Parcial) => void
  onEliminar: () => void
}) {
  // Los parciales llegan en puntos de 0 a 100 (Art. 31); la escala 1,0–9,0 es
  // su conversión (Art. 42). Se admiten las dos entradas porque el estudiante
  // recibe una u otra según el profesor.
  const enPuntos = parcial.puntos !== undefined
  return (
    <tr className="border-t border-hairline">
      <td className="py-1.5 pr-2 text-xs text-slate-500 tabular-nums">{indice + 1}</td>
      <td className="py-1.5 pr-2">
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={parcial.peso}
            onChange={(e) => onCambiar({ ...parcial, peso: Number(e.target.value) })}
            className={`w-20 rounded border bg-white/5 px-2 py-1 text-sm text-slate-200 tabular-nums outline-none focus:border-slate-500 ${
              fueraDeNorma ? 'border-amber-500/50' : 'border-hairline'
            }`}
          />
          <span className="text-xs text-slate-500">%</span>
        </div>
      </td>
      <td className="py-1.5 pr-2">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            title="Cambiar entre puntos de 0 a 100 (Art. 31) y calificación de 1,0 a 9,0 (Art. 40)"
            onClick={() =>
              onCambiar(
                enPuntos
                  ? // A escala 1,0–9,0: la nota ya es la conversión, se conserva.
                    { peso: parcial.peso, nota: parcial.nota, np: parcial.np }
                  : // A puntos: se muestra el mínimo que produce esa nota, que es
                    // el equivalente honesto de la ida y vuelta.
                    {
                      ...parcial,
                      puntos:
                        parcial.nota === null ? null : porcentajeMinimoDeNota(parcial.nota),
                      nota: parcial.nota,
                    },
              )
            }
            className="rounded bg-white/5 px-1.5 py-1 text-[10px] text-slate-400 transition hover:bg-white/10 hover:text-white"
          >
            {enPuntos ? '0–100' : '1–9'}
          </button>

          {parcial.np ? (
            <span className="w-28 px-2 py-1 text-sm text-slate-400">NP</span>
          ) : enPuntos ? (
            <div className="flex w-28 items-center gap-1">
              <input
                type="number"
                min={0}
                max={100}
                step={1}
                value={parcial.puntos ?? ''}
                onChange={(e) => {
                  const v = e.target.value
                  if (v === '') {
                    // `null` mantiene el modo puntos: vaciar el campo no debe
                    // devolverte al desplegable de 1,0–9,0.
                    onCambiar({ ...parcial, puntos: null, nota: null, np: false })
                    return
                  }
                  const puntos = Math.min(100, Math.max(0, Number(v)))
                  onCambiar({ ...parcial, puntos, nota: notaDePorcentaje(puntos), np: false })
                }}
                className="w-16 rounded border border-hairline bg-white/5 px-2 py-1 text-sm text-slate-200 tabular-nums outline-none focus:border-slate-500"
              />
              <span className="text-xs text-slate-500">pts</span>
            </div>
          ) : (
            <select
              value={parcial.nota === null ? '' : String(parcial.nota)}
              onChange={(e) => {
                const v = e.target.value
                if (v === '') onCambiar({ ...parcial, nota: null, np: false })
                else onCambiar({ ...parcial, nota: Number(v), np: false })
              }}
              className="w-28 rounded border border-hairline bg-white/5 px-2 py-1 text-sm text-slate-200 tabular-nums outline-none focus:border-slate-500"
            >
              <option value="" className="bg-void-soft">
                pendiente
              </option>
              {NOTAS.map((n) => (
                <option key={n} value={n} className="bg-void-soft">
                  {fmt(n, 1)}
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            title="No presentó (Art. 31)"
            onClick={() =>
              onCambiar(
                parcial.np
                  ? { ...parcial, np: false }
                  : { peso: parcial.peso, nota: null, np: true },
              )
            }
            className={`rounded px-1.5 py-1 text-[10px] transition ${
              parcial.np
                ? 'bg-amber-500/20 text-amber-300'
                : 'bg-white/5 text-slate-500 hover:text-white'
            }`}
          >
            NP
          </button>
        </div>
      </td>
      <td className="py-1.5 pr-2 text-right text-sm tabular-nums">
        {parcial.np ? (
          <span className="text-slate-400">0,00</span>
        ) : parcial.nota === null ? (
          <span className="text-slate-600">—</span>
        ) : (
          <>
            {enPuntos && (
              <span className="mr-2 text-[11px] text-slate-500">
                = {fmt(parcial.nota, 1)}
              </span>
            )}
            <span className="text-slate-300">
              {fmt(Math.round(((parcial.nota * parcial.peso) / 100) * 100) / 100)}
            </span>
          </>
        )}
      </td>
      <td className="py-1.5 text-right">
        <button
          type="button"
          aria-label="Eliminar parcial"
          onClick={onEliminar}
          className="rounded px-1 text-slate-600 transition hover:text-rose-300"
        >
          ✕
        </button>
      </td>
    </tr>
  )
}

// ─── Resultados ─────────────────────────────────────────────────────────────

function Objetivo({ n }: { n: Necesario }) {
  const clase =
    n.desenlace === 'asegurado'
      ? 'text-emerald-300'
      : n.desenlace === 'inalcanzable'
        ? 'text-slate-600'
        : 'text-slate-200'
  return (
    <tr className="border-t border-hairline">
      <td className="py-1 pr-3 font-semibold text-slate-300 tabular-nums">{n.objetivo}</td>
      <td className={`py-1 text-right tabular-nums ${clase}`}>
        {n.desenlace === 'asegurado'
          ? 'asegurado'
          : n.desenlace === 'inalcanzable'
            ? 'inalcanzable'
            : fmt(n.nota!, 1)}
      </td>
    </tr>
  )
}

// ─── Pestaña ────────────────────────────────────────────────────────────────

export function Calculadora({
  grafo,
  planes,
  onCambiarPlan,
  materiaId,
  onElegirMateria,
  intentosDe,
  registradas,
  onRegistrar,
}: Props) {
  const materia: Materia | null = materiaId ? (grafo.materias.get(materiaId) ?? null) : null
  const regla = materia ? reglaArticulo32(materia.uc) : null
  const plan = materiaId ? planes[materiaId] : undefined

  const resultado = useMemo(() => (plan ? evaluar(plan) : null), [plan])
  const ponderaciones = useMemo(() => (plan ? sumaDePonderaciones(plan) : null), [plan])
  const discrepancias = useMemo(
    () => (plan && materia ? validarArticulo32(plan, materia.uc) : []),
    [plan, materia],
  )
  const pesosFueraDeNorma = useMemo(
    () =>
      new Set(
        discrepancias
          .filter((d) => d.tipo === 'peso-fuera-de-norma')
          .map((d) => (d.tipo === 'peso-fuera-de-norma' ? d.indice : -1)),
      ),
    [discrepancias],
  )

  const cambiarParcial = (indice: number, p: Parcial) => {
    if (!plan) return
    onCambiarPlan({ ...plan, parciales: plan.parciales.map((q, i) => (i === indice ? p : q)) })
  }

  const yaTieneHistorial = materiaId ? intentosDe(materiaId).length > 0 : false
  // Se compara contra la definitiva vigente: si el usuario corrige una nota y
  // el resultado cambia, vuelve a ser algo distinto que registrar.
  const yaRegistrada =
    materiaId !== null &&
    resultado?.definitiva !== null &&
    registradas[materiaId] === resultado?.definitiva

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-5 p-6">
        <header>
          <h1 className="text-lg font-semibold text-white">Calculadora de nota final</h1>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
            Aplica las Normas de Evaluación del Rendimiento Estudiantil de la UNET (C-3,
            Art. 39 a 42) al plan que declares. Es{' '}
            <strong className="text-slate-400">referencial</strong> y no sustituye a
            Control de Estudios.
          </p>
        </header>

        <Selector grafo={grafo} onElegir={onElegirMateria} />

        {!materia && (
          <p className="rounded-lg border border-dashed border-hairline px-4 py-6 text-center text-sm text-slate-500">
            Elige una materia para armar su plan de evaluación y ver cuánto te falta.
          </p>
        )}

        {materia && (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-white">{materia.nombre}</h2>
                <p className="text-xs text-slate-500">
                  {materia.codigo ?? 'sin código'} · Semestre {materia.semestre} ·{' '}
                  {materia.uc} U.C.
                  {regla && (
                    <>
                      {' · '}
                      <span className="text-slate-400">
                        Art. 32{regla.literal}: {regla.parciales} parciales,{' '}
                        {regla.pesoMinimo}–{regla.pesoMaximo} % cada uno
                      </span>
                    </>
                  )}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onElegirMateria(null)}
                className="text-[11px] text-slate-500 transition hover:text-white"
              >
                Cambiar
              </button>
            </div>

            {regla === null ? (
              <p className="rounded-lg border border-hairline bg-white/[0.03] px-4 py-3 text-sm text-slate-400">
                Esta materia no tiene unidades de crédito, así que no tiene evaluaciones
                parciales que ponderar. Ninguna regla del Art. 32 le aplica.
              </p>
            ) : (
              plan && (
                <>
                  <section className="rounded-xl border border-hairline bg-void-soft/60 p-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-[10px] tracking-wider text-slate-500 uppercase">
                          <th className="pb-1 text-left font-medium">#</th>
                          <th className="pb-1 text-left font-medium">Ponderación</th>
                          <th className="pb-1 text-left font-medium">Calificación</th>
                          <th className="pb-1 text-right font-medium">Aporte</th>
                          <th />
                        </tr>
                      </thead>
                      <tbody>
                        {plan.parciales.map((p, i) => (
                          <FilaParcial
                            key={i}
                            parcial={p}
                            indice={i}
                            fueraDeNorma={pesosFueraDeNorma.has(i)}
                            onCambiar={(q) => cambiarParcial(i, q)}
                            onEliminar={() =>
                              onCambiarPlan({
                                ...plan,
                                parciales: plan.parciales.filter((_, j) => j !== i),
                              })
                            }
                          />
                        ))}
                      </tbody>
                    </table>

                    <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
                      <button
                        type="button"
                        onClick={() =>
                          onCambiarPlan({
                            ...plan,
                            parciales: [...plan.parciales, { peso: 0, nota: null }],
                          })
                        }
                        className="rounded border border-dashed border-hairline px-2 py-1 text-[11px] text-slate-400 transition hover:border-slate-600 hover:text-white"
                      >
                        + Parcial
                      </button>
                      {ponderaciones && (
                        <p
                          className={`text-xs tabular-nums ${
                            ponderaciones.completo ? 'text-slate-500' : 'text-amber-300'
                          }`}
                        >
                          Ponderaciones: {fmt(ponderaciones.suma).replace(',00', '')} %
                          {!ponderaciones.completo &&
                            (ponderaciones.falta > 0
                              ? ` · faltan ${fmt(ponderaciones.falta).replace(',00', '')}`
                              : ` · sobran ${fmt(ponderaciones.sobra).replace(',00', '')}`)}
                        </p>
                      )}
                    </div>
                  </section>

                  {discrepancias.length > 0 && (
                    <ul className="flex flex-col gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
                      {discrepancias.map((d, i) => (
                        <li key={i} className="text-[12px] leading-relaxed text-amber-200">
                          {textoDiscrepancia(d)}
                        </li>
                      ))}
                    </ul>
                  )}

                  {resultado && (
                    <section className="grid gap-4 sm:grid-cols-2">
                      <div className="flex flex-col gap-3 rounded-xl border border-hairline bg-void-soft/60 p-4">
                        {!resultado.planCompleto ? (
                          <p className="text-sm text-slate-400">
                            El plan está incompleto: las ponderaciones no suman 100, así que
                            no se puede calcular una definitiva sin inventar datos.
                          </p>
                        ) : (
                          <>
                            <div className="flex items-baseline gap-3">
                              <div>
                                <p className="text-[10px] tracking-wider text-slate-500 uppercase">
                                  Acumulado
                                </p>
                                <p className="text-xl font-semibold text-white tabular-nums">
                                  {fmt(resultado.acumulado)}
                                </p>
                              </div>
                              <div className="ml-auto text-right">
                                <p className="text-[10px] tracking-wider text-slate-500 uppercase">
                                  {resultado.definitiva !== null ? 'Definitiva' : 'Posible'}
                                </p>
                                <p
                                  className={`text-2xl font-semibold tabular-nums ${
                                    resultado.definitiva !== null
                                      ? resultado.definitiva >= 5
                                        ? 'text-emerald-400'
                                        : 'text-rose-400'
                                      : 'text-slate-300'
                                  }`}
                                >
                                  {resultado.definitiva !== null
                                    ? resultado.definitiva
                                    : `${resultado.rango.minima}–${resultado.rango.maxima}`}
                                </p>
                              </div>
                            </div>

                            <div
                              className={`rounded-lg px-3 py-2 text-sm ${
                                resultado.aprobar.desenlace === 'asegurado'
                                  ? 'bg-emerald-500/10 text-emerald-300'
                                  : resultado.aprobar.desenlace === 'inalcanzable'
                                    ? 'bg-rose-500/10 text-rose-300'
                                    : 'bg-white/[0.04] text-slate-200'
                              }`}
                            >
                              {resultado.aprobar.desenlace === 'asegurado' ? (
                                <>Ya está aprobada, pase lo que pase en lo que falta.</>
                              ) : resultado.aprobar.desenlace === 'inalcanzable' ? (
                                <>
                                  Ya no alcanza: ni con 9,0 en todo lo pendiente se llega al
                                  4,50 que exige el 5. La máxima posible es{' '}
                                  {resultado.rango.maxima}.
                                </>
                              ) : (
                                <>
                                  Necesitas{' '}
                                  <strong className="text-white">
                                    {fmt(resultado.aprobar.nota!, 1)}
                                  </strong>{' '}
                                  en cada parcial pendiente ({fmt(resultado.pesoPendiente).replace(',00', '')} %)
                                  para aprobar.
                                </>
                              )}
                            </div>

                            <p className="text-[11px] leading-relaxed text-slate-500">
                              Para sacar 5 basta con que la sumatoria llegue a{' '}
                              <strong className="text-slate-400">4,50</strong>: el Art. 41
                              sube desde cincuenta centésimas.
                            </p>
                          </>
                        )}
                      </div>

                      <div className="rounded-xl border border-hairline bg-void-soft/60 p-4">
                        <p className="mb-1 text-[10px] tracking-wider text-slate-500 uppercase">
                          Qué necesito en lo pendiente
                        </p>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-[10px] tracking-wider text-slate-500 uppercase">
                              <th className="pb-1 text-left font-medium">Para</th>
                              <th className="pb-1 text-right font-medium">Necesito</th>
                            </tr>
                          </thead>
                          <tbody>
                            {resultado.objetivos.map((n) => (
                              <Objetivo key={n.objetivo} n={n} />
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </section>
                  )}

                  {resultado?.definitiva !== null && resultado !== null && materiaId && (
                    <div
                      className={`flex items-center gap-3 rounded-xl border p-4 ${
                        yaRegistrada
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-hairline bg-void-soft/60'
                      }`}
                    >
                      <div className="flex-1">
                        {yaRegistrada ? (
                          <>
                            <p className="text-sm text-emerald-300">
                              Registrada: {resultado.definitiva} quedó en tu historial de{' '}
                              {materia.nombre}.
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-500">
                              Ya cuenta para tu índice y para el estado de la materia en el
                              grafo. Si cambias alguna calificación y la definitiva varía,
                              podrás registrarla de nuevo.
                            </p>
                          </>
                        ) : (
                          <>
                            <p className="text-sm text-slate-200">
                              Registrar {resultado.definitiva} como calificación definitiva
                              de esta materia.
                            </p>
                            {yaTieneHistorial && (
                              <p className="mt-0.5 text-[11px] text-amber-300">
                                Esta materia ya tiene intentos registrados. Se añadirá otro —
                                si querías corregir el anterior, edítalo desde el grafo.
                              </p>
                            )}
                          </>
                        )}
                      </div>
                      <button
                        type="button"
                        disabled={yaRegistrada}
                        onClick={() => onRegistrar(materiaId, resultado.definitiva!)}
                        className={`rounded px-3 py-1.5 text-[12px] font-medium transition ${
                          yaRegistrada
                            ? 'cursor-not-allowed bg-white/5 text-slate-500'
                            : 'bg-sky-500/90 text-white hover:bg-sky-400'
                        }`}
                      >
                        {yaRegistrada ? 'Registrada' : 'Registrar'}
                      </button>
                    </div>
                  )}
                </>
              )
            )}
          </>
        )}

        <Conversor />
      </div>
    </div>
  )
}

/** Plan inicial de una materia, conforme al Art. 32. */
export function planInicial(materia: Materia): PlanEvaluacion {
  return planSugerido(materia.id, materia.uc)
}
