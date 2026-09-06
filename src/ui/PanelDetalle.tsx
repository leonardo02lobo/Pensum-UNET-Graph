import { formatearUmbral, totalHoras, type Materia } from '../data/types'
import {
  correquisitosDe,
  desbloqueaDirecto,
  prelacionesDirectas,
  type PensumGraph,
} from '../model/graph'
import { evaluarCompuerta } from '../progreso/indice'
import { NOMBRE_ESTADO, type EstadoMateria } from '../progreso/estados'
import type { Intento } from '../progreso/tipos'
import { NOMBRE_SECTOR, colorDeSector, leerTokens } from '../view/tokens'
import { EditorIntentos } from './EditorIntentos'

interface Props {
  readonly grafo: PensumGraph
  readonly materia: Materia
  readonly intentos: readonly Intento[]
  readonly estado: EstadoMateria
  readonly ucAprobadas: number
  readonly onRegistrar: (id: string, intentos: readonly Intento[]) => void
  readonly onIr: (id: string) => void
  readonly onCerrar: () => void
}

const CLASE_ESTADO: Readonly<Record<EstadoMateria, string>> = {
  aprobada: 'bg-emerald-500/20 text-emerald-300',
  'en-curso': 'bg-sky-500/20 text-sky-300',
  disponible: 'bg-amber-500/20 text-amber-200',
  'bloqueada-prelacion': 'bg-white/10 text-slate-400',
  'bloqueada-credito': 'bg-white/10 text-slate-400',
}

function Enlaces({
  grafo,
  ids,
  onIr,
}: {
  grafo: PensumGraph
  ids: readonly string[]
  onIr: (id: string) => void
}) {
  const tokens = leerTokens()
  return (
    <ul className="flex flex-col gap-1">
      {ids.map((id) => {
        const m = grafo.materias.get(id)!
        return (
          <li key={id}>
            <button
              type="button"
              onClick={() => onIr(id)}
              className="group flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <span
                aria-hidden
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: colorDeSector(tokens, m.sector) }}
              />
              <span className="truncate">{m.nombre}</span>
              <span className="ml-auto shrink-0 text-xs text-slate-500">S{m.semestre}</span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}

function Bloque({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1.5">
      <h3 className="text-[11px] font-medium tracking-wider text-slate-500 uppercase">
        {titulo}
      </h3>
      {children}
    </section>
  )
}

export function PanelDetalle({
  grafo,
  materia,
  intentos,
  estado,
  ucAprobadas,
  onRegistrar,
  onIr,
  onCerrar,
}: Props) {
  const tokens = leerTokens()
  const prelaciones = prelacionesDirectas(grafo, materia.id)
  const correquisitos = correquisitosDe(grafo, materia.id)
  const desbloquea = desbloqueaDirecto(grafo, materia.id)
  const horas = totalHoras(materia.horas)
  const color = materia.gate !== null ? tokens.gate : colorDeSector(tokens, materia.sector)
  const compuerta = evaluarCompuerta(materia, ucAprobadas)

  return (
    <aside className="pointer-events-auto absolute top-4 right-4 bottom-4 flex w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-xl border border-hairline bg-void-soft/90 shadow-2xl backdrop-blur">
      <header className="flex items-start gap-3 border-b border-hairline p-4">
        <span
          aria-hidden
          className="mt-1.5 size-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
        />
        <div className="min-w-0 flex-1">
          <h2 className="text-base leading-snug font-semibold text-white">{materia.nombre}</h2>
          <p className="mt-0.5 text-xs text-slate-400">
            {materia.codigo ?? 'sin código registrado'} · Semestre {materia.semestre}
          </p>
        </div>
        <button
          type="button"
          onClick={onCerrar}
          aria-label="Cerrar"
          className="-mt-1 -mr-1 rounded p-1 text-slate-500 transition hover:bg-white/5 hover:text-white"
        >
          ✕
        </button>
      </header>

      <div className="flex flex-col gap-5 overflow-y-auto p-4">
        <span
          className={`self-start rounded px-2 py-0.5 text-[11px] font-medium ${CLASE_ESTADO[estado]}`}
        >
          {NOMBRE_ESTADO[estado]}
        </span>

        <dl className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-lg bg-white/[0.03] px-2 py-2">
            <dt className="text-[10px] tracking-wide text-slate-500 uppercase">Créditos</dt>
            <dd className="mt-0.5 text-lg font-semibold text-white">{materia.uc}</dd>
          </div>
          <div className="rounded-lg bg-white/[0.03] px-2 py-2">
            <dt className="text-[10px] tracking-wide text-slate-500 uppercase">Horas</dt>
            <dd className="mt-0.5 text-lg font-semibold text-white">{horas ?? '—'}</dd>
          </div>
          <div className="rounded-lg bg-white/[0.03] px-2 py-2">
            <dt className="text-[10px] tracking-wide text-slate-500 uppercase">Sector</dt>
            <dd className="mt-1 text-[11px] leading-tight font-medium text-slate-300">
              {materia.sector === null ? 'Órbita libre' : NOMBRE_SECTOR[materia.sector]}
            </dd>
          </div>
        </dl>

        {materia.horas !== null &&
          (materia.horas.teoria > 0 ||
            materia.horas.practica > 0 ||
            materia.horas.lab > 0) && (
            <p className="-mt-3 text-center text-[11px] text-slate-500">
              {materia.horas.teoria} teoría · {materia.horas.practica} práctica ·{' '}
              {materia.horas.lab} laboratorio
            </p>
          )}

        {compuerta && (
          <div
            className={`rounded-lg border px-3 py-2.5 ${
              compuerta.cumplida
                ? 'border-emerald-500/30 bg-emerald-500/10'
                : 'border-slate-600/40 bg-slate-500/10'
            }`}
          >
            <p className="text-[11px] tracking-wider text-slate-400 uppercase">
              Compuerta por créditos
            </p>
            <p className="mt-1 text-sm text-slate-200">
              Requiere <strong className="text-white">{formatearUmbral(materia.gate)}</strong>
              {materia.gate?.kind === 'pct' ? ' del total de la carrera' : ' aprobadas'}
              {compuerta.umbral !== (materia.gate?.kind === 'uc' ? materia.gate.uc : -1) && (
                <span className="text-slate-500"> ({compuerta.umbral} U.C.)</span>
              )}
              .
            </p>
            <p className="mt-1 text-[12px]">
              {compuerta.cumplida ? (
                <span className="text-emerald-300">
                  Cumplida · llevas {ucAprobadas} U.C.
                </span>
              ) : (
                <span className="text-slate-400">
                  Llevas {ucAprobadas} U.C. ·{' '}
                  <strong className="text-white">faltan {compuerta.faltan}</strong>
                </span>
              )}
            </p>
          </div>
        )}

        <EditorIntentos
          intentos={intentos}
          onCambiar={(i) => onRegistrar(materia.id, i)}
        />

        {prelaciones.length > 0 ? (
          <Bloque titulo={`Requiere · ${prelaciones.length}`}>
            <Enlaces grafo={grafo} ids={prelaciones} onIr={onIr} />
          </Bloque>
        ) : (
          materia.gate === null && (
            <Bloque titulo="Requiere">
              <p className="px-2 text-sm text-slate-500">Sin prelaciones.</p>
            </Bloque>
          )
        )}

        {correquisitos.length > 0 && (
          <Bloque titulo="Se cursa en paralelo con">
            <Enlaces grafo={grafo} ids={correquisitos} onIr={onIr} />
          </Bloque>
        )}

        {desbloquea.length > 0 ? (
          <Bloque titulo={`Desbloquea · ${desbloquea.length}`}>
            <Enlaces grafo={grafo} ids={desbloquea} onIr={onIr} />
          </Bloque>
        ) : (
          <Bloque titulo="Desbloquea">
            <p className="px-2 text-sm text-slate-500">
              Nada más depende de esta materia.
            </p>
          </Bloque>
        )}
      </div>
    </aside>
  )
}
