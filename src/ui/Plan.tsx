import { useMemo, useState } from 'react'
import { formatearUmbral } from '../data/types'
import type { PensumGraph } from '../model/graph'
import type { Resumen } from '../progreso/indice'
import { notaEfectiva } from '../progreso/indice'
import { NOMBRE_ESTADO, type EstadoMateria } from '../progreso/estados'
import type { Historial, Intento } from '../progreso/tipos'
import { NOMBRE_SECTOR, colorDeSector, leerTokens } from '../view/tokens'
import { formatearNota } from './intentos/consecuencia'
import { FormularioIntento } from './intentos/FormularioIntento'
import { SelectorNota } from './intentos/SelectorNota'

/**
 * El pensum como lista agrupada por semestre.
 *
 * El grafo responde «cómo se conecta la carrera»; esto responde «qué hago con
 * ella». Es además la única vista que cabe en una pantalla estrecha, el
 * equivalente textual de un `<canvas>` que ningún lector de pantalla puede
 * anunciar, y el destino cuando WebGL no está disponible.
 *
 * No calcula nada (design.md, D7): estados, índice y créditos llegan derivados
 * del mismo cálculo que alimenta al grafo y a la cabecera. Un recálculo
 * paralelo aquí sería una segunda implementación del Art. 49 esperando a
 * divergir.
 */

/** «1 materias» chirría en una app que cuida el idioma en todo lo demás. */
function plural(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`
}

const CLASE_ESTADO: Readonly<Record<EstadoMateria, string>> = {
  aprobada: 'bg-emerald-500/15 text-emerald-300',
  'en-curso': 'bg-sky-500/15 text-sky-300',
  disponible: 'bg-amber-500/15 text-amber-200',
  'bloqueada-prelacion': 'bg-white/5 text-slate-400',
  'bloqueada-credito': 'bg-white/5 text-slate-400',
}

interface Props {
  readonly grafo: PensumGraph
  readonly estados: ReadonlyMap<string, EstadoMateria>
  readonly resumen: Resumen
  readonly historial: Historial
  readonly estadoFiltrado: EstadoMateria | null
  readonly onFiltrarEstado: (e: EstadoMateria | null) => void
  readonly onRegistrar: (id: string, intentos: readonly Intento[]) => void
  readonly onVerEnGrafo: (id: string) => void
  readonly onCalcular: (id: string) => void
  /** Aviso cuando la lista se muestra porque el grafo no es viable. */
  readonly aviso?: string | null
  /** Vía de escape cuando la lista se ofrece por ancho, no por falta de WebGL:
   *  hay tabletas donde el grafo es perfectamente usable y el umbral se queda
   *  corto. El usuario sabe mejor que la heurística (design.md, D4). */
  readonly onVerGrafoIgual?: () => void
}

export function Plan({
  grafo,
  estados,
  resumen,
  historial,
  estadoFiltrado,
  onFiltrarEstado,
  onRegistrar,
  onVerEnGrafo,
  onCalcular,
  aviso,
  onVerGrafoIgual,
}: Props) {
  const tokens = useMemo(() => leerTokens(), [])
  const [desplegada, setDesplegada] = useState<string | null>(null)

  // Agrupación por semestre. El orden dentro de cada grupo es el mismo que usa
  // `Semestres`, para que la misma materia esté en el mismo sitio en ambos.
  const semestres = useMemo(() => {
    const m = new Map<number, string[]>()
    for (const materia of grafo.materias.values()) {
      const lista = m.get(materia.semestre)
      if (lista) lista.push(materia.id)
      else m.set(materia.semestre, [materia.id])
    }
    for (const lista of m.values()) {
      lista.sort((a, b) =>
        grafo.materias.get(a)!.nombre.localeCompare(grafo.materias.get(b)!.nombre, 'es'),
      )
    }
    return [...m.entries()].sort((a, b) => a[0] - b[0])
  }, [grafo])

  // El filtro se aplica aquí y los grupos que quedan vacíos se omiten: un
  // semestre vacío no informa de nada y alarga la lista.
  const visibles = useMemo(() => {
    if (estadoFiltrado === null) return semestres
    return semestres
      .map(([s, ids]) => [s, ids.filter((id) => estados.get(id) === estadoFiltrado)] as const)
      .filter(([, ids]) => ids.length > 0)
  }, [semestres, estados, estadoFiltrado])

  const totales = useMemo(() => {
    let materias = 0
    let uc = 0
    for (const [, ids] of visibles) {
      materias += ids.length
      for (const id of ids) uc += grafo.materias.get(id)!.uc
    }
    return { materias, uc }
  }, [visibles, grafo])

  return (
    <div className="h-full w-full overflow-y-auto">
      <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-6">
        <header className="flex flex-col gap-1">
          <h1 className="text-sm font-semibold tracking-wide text-white">
            Plan · Ingeniería en Informática
          </h1>
          <p className="text-xs text-slate-500">
            {grafo.materias.size} materias · {resumen.ucAprobadas} de {resumen.ucTotales}{' '}
            U.C. aprobadas
          </p>
        </header>

        {aviso && (
          <div className="flex flex-wrap items-center gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2">
            <p className="flex-1 text-[12px] text-amber-200">{aviso}</p>
            {onVerGrafoIgual && (
              <button
                type="button"
                onClick={onVerGrafoIgual}
                className="shrink-0 rounded border border-amber-500/40 px-2 py-1 text-[11px] text-amber-200 transition hover:bg-amber-500/15"
              >
                Verlo igual →
              </button>
            )}
          </div>
        )}

        <Filtros
          estados={estados}
          activo={estadoFiltrado}
          onFiltrar={onFiltrarEstado}
          totales={totales}
        />

        {visibles.length === 0 ? (
          <p className="rounded-lg border border-hairline bg-void-soft/60 px-4 py-6 text-center text-sm text-slate-400">
            Ninguna materia está en ese estado ahora mismo.
          </p>
        ) : (
          visibles.map(([semestre, ids]) => (
            <GrupoSemestre
              key={semestre}
              semestre={semestre}
              ids={ids}
              grafo={grafo}
              estados={estados}
              historial={historial}
              tokens={tokens}
              desplegada={desplegada}
              onDesplegar={setDesplegada}
              onRegistrar={onRegistrar}
              onVerEnGrafo={onVerEnGrafo}
              onCalcular={onCalcular}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ─── Filtro por estado ──────────────────────────────────────────────────────

function Filtros({
  estados,
  activo,
  onFiltrar,
  totales,
}: {
  estados: ReadonlyMap<string, EstadoMateria>
  activo: EstadoMateria | null
  onFiltrar: (e: EstadoMateria | null) => void
  totales: { materias: number; uc: number }
}) {
  const conteo = useMemo(() => {
    const c = new Map<EstadoMateria, number>()
    for (const e of estados.values()) c.set(e, (c.get(e) ?? 0) + 1)
    return c
  }, [estados])

  // «Disponible» va primero: es la pregunta que trae el estudiante.
  const orden: readonly EstadoMateria[] = [
    'disponible',
    'aprobada',
    'en-curso',
    'bloqueada-prelacion',
    'bloqueada-credito',
  ]

  return (
    <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-hairline bg-void-soft/60 p-2">
      <button
        type="button"
        onClick={() => onFiltrar(null)}
        aria-pressed={activo === null}
        className={`rounded-md px-2.5 py-1 text-[11px] transition ${
          activo === null
            ? 'bg-white/15 font-medium text-white'
            : 'text-slate-400 hover:bg-white/5 hover:text-white'
        }`}
      >
        Todas
      </button>
      {orden.map((e) => (
        <button
          key={e}
          type="button"
          onClick={() => onFiltrar(activo === e ? null : e)}
          aria-pressed={activo === e}
          className={`rounded-md px-2.5 py-1 text-[11px] transition ${
            activo === e
              ? 'bg-white/15 font-medium text-white'
              : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          {NOMBRE_ESTADO[e]}{' '}
          <span className="text-slate-500 tabular-nums">{conteo.get(e) ?? 0}</span>
        </button>
      ))}
      <p className="ml-auto px-1.5 text-[11px] text-slate-500 tabular-nums">
        {plural(totales.materias, 'materia', 'materias')} · {totales.uc} U.C.
      </p>
    </div>
  )
}

// ─── Un semestre ────────────────────────────────────────────────────────────

interface GrupoProps {
  semestre: number
  ids: readonly string[]
  grafo: PensumGraph
  estados: ReadonlyMap<string, EstadoMateria>
  historial: Historial
  tokens: ReturnType<typeof leerTokens>
  desplegada: string | null
  onDesplegar: (id: string | null) => void
  onRegistrar: (id: string, intentos: readonly Intento[]) => void
  onVerEnGrafo: (id: string) => void
  onCalcular: (id: string) => void
}

function GrupoSemestre({ semestre, ids, grafo, ...resto }: GrupoProps) {
  const uc = ids.reduce((n, id) => n + grafo.materias.get(id)!.uc, 0)

  return (
    <section aria-labelledby={`semestre-${semestre}`} className="flex flex-col gap-1">
      <h2
        id={`semestre-${semestre}`}
        className="px-1 text-[11px] tracking-wider text-slate-500 uppercase"
      >
        Semestre {semestre} · {plural(ids.length, 'materia', 'materias')} · {uc} U.C.
      </h2>
      <ul className="flex flex-col gap-1">
        {ids.map((id) => (
          <FilaMateria key={id} id={id} grafo={grafo} {...resto} />
        ))}
      </ul>
    </section>
  )
}

// ─── Una materia ────────────────────────────────────────────────────────────

function FilaMateria({
  id,
  grafo,
  estados,
  historial,
  tokens,
  desplegada,
  onDesplegar,
  onRegistrar,
  onVerEnGrafo,
  onCalcular,
}: Omit<GrupoProps, 'semestre' | 'ids'> & { id: string }) {
  const materia = grafo.materias.get(id)!
  const estado = estados.get(id)!
  const intentos = historial[id] ?? []
  const efectiva = notaEfectiva(intentos)
  const abierta = desplegada === id
  const color = materia.gate !== null ? tokens.gate : colorDeSector(tokens, materia.sector)

  return (
    <li className="rounded-lg border border-hairline bg-void-soft/40">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-3 py-2">
        <span
          aria-hidden
          className="size-2.5 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />

        <div className="min-w-[12rem] flex-1">
          <p className="text-sm text-slate-200">{materia.nombre}</p>
          <p className="text-[11px] text-slate-500">
            {materia.codigo ?? 'sin código'} · {materia.uc} U.C. ·{' '}
            {materia.sector === null ? 'Órbita libre' : NOMBRE_SECTOR[materia.sector]}
            {materia.gate !== null && ` · requiere ${formatearUmbral(materia.gate)}`}
          </p>
        </div>

        {/* El estado va en texto, no solo en color: el bloqueo por prelación y
            el bloqueo por crédito piden cosas distintas para desbloquearse. */}
        <span
          className={`shrink-0 rounded px-2 py-0.5 text-[11px] font-medium ${CLASE_ESTADO[estado]}`}
        >
          {NOMBRE_ESTADO[estado]}
        </span>

        {/* Captura rápida SOLO donde no hay nada escrito (design.md, D3). Una
            materia con historial nunca se sobrescribe con un clic: el Art. 49
            depende del orden y del número de intentos, y un gesto único no
            puede expresar «corrige el segundo». */}
        {intentos.length === 0 ? (
          <SelectorNota
            valor={null}
            etiqueta={`Calificación de ${materia.nombre}, de 1 a 9`}
            onCambiar={(n) => onRegistrar(id, [{ tipo: 'regular', nota: n }])}
          />
        ) : (
          <span className="flex shrink-0 items-center gap-2">
            {efectiva !== null && (
              <span className="text-sm font-semibold text-white tabular-nums">
                {formatearNota(efectiva)}
              </span>
            )}
            {intentos.length > 1 && (
              <span
                className="text-[10px] text-slate-500"
                title="La nota efectiva resulta del Art. 49, no es una nota suelta"
              >
                {intentos.length} intentos
              </span>
            )}
          </span>
        )}

        <span className="flex shrink-0 items-center gap-0.5">
          <button
            type="button"
            onClick={() => onDesplegar(abierta ? null : id)}
            aria-expanded={abierta}
            className="rounded px-2 py-1 text-[11px] text-slate-400 transition hover:bg-white/5 hover:text-white"
          >
            {abierta ? 'Cerrar' : 'Editar'}
          </button>
          <button
            type="button"
            onClick={() => onVerEnGrafo(id)}
            title="Ver en el grafo"
            className="rounded px-2 py-1 text-[11px] text-slate-500 transition hover:bg-white/5 hover:text-white"
          >
            Grafo
          </button>
          <button
            type="button"
            onClick={() => onCalcular(id)}
            title="Abrir en la calculadora"
            className="rounded px-2 py-1 text-[11px] text-slate-500 transition hover:bg-white/5 hover:text-white"
          >
            Calcular
          </button>
        </span>
      </div>

      {/* El editor completo se despliega en su sitio: los tipos especiales
          (equivalencia, suficiencia, retiro, en curso) arrastran consecuencias
          normativas que hay que leer, y ese texto no cabe en una fila. */}
      {abierta && (
        <div className="border-t border-hairline p-3">
          <EditorEnFila
            intentos={intentos}
            onCambiar={(i) => onRegistrar(id, i)}
            onCerrar={() => onDesplegar(null)}
          />
        </div>
      )}
    </li>
  )
}

// ─── Editor desplegado dentro de la fila ────────────────────────────────────

function EditorEnFila({
  intentos,
  onCambiar,
  onCerrar,
}: {
  intentos: readonly Intento[]
  onCambiar: (i: readonly Intento[]) => void
  onCerrar: () => void
}) {
  const [editando, setEditando] = useState<number | 'nuevo' | null>(
    intentos.length === 0 ? 'nuevo' : null,
  )

  const guardar = (i: Intento) => {
    if (editando === 'nuevo') onCambiar([...intentos, i])
    else if (typeof editando === 'number')
      onCambiar(intentos.map((v, k) => (k === editando ? i : v)))
    setEditando(null)
  }

  return (
    <div className="flex flex-col gap-2">
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
              <span className="text-[10px] text-slate-600 tabular-nums">{k + 1}</span>
              <span className="text-[12px] text-slate-300">
                {i.nota !== null ? `Nota ${i.nota}` : 'Sin nota'}
              </span>
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
          onCancelar={() => (intentos.length === 0 ? onCerrar() : setEditando(null))}
        />
      ) : (
        editando === null && (
          <button
            type="button"
            onClick={() => setEditando('nuevo')}
            className="self-start rounded border border-dashed border-hairline px-2 py-1 text-[11px] text-slate-400 transition hover:border-slate-600 hover:text-white"
          >
            + Registrar intento
          </button>
        )
      )}
    </div>
  )
}
