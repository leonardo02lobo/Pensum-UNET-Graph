import type { Resumen, Umbral } from '../progreso/indice'
import {
  INDICE_CUADRO_HONOR,
  INDICE_GRADUACION,
  INDICE_PERMANENCIA,
} from '../progreso/indice'

/**
 * Índice académico y avance en créditos.
 *
 * El índice se muestra con dos decimales (Art. 55) y con la señal del umbral
 * normativo en que cae, porque el número solo no dice nada: 5,09 y 5,11 se
 * parecen mucho y significan cosas opuestas.
 */

const SENAL: Readonly<Record<Umbral, { clase: string; texto: string; titulo: string }>> = {
  'sin-indice': {
    clase: 'text-slate-500',
    texto: 'sin cursar',
    titulo: 'Aún no hay materias que computen para el índice',
  },
  'pierde-inscripcion': {
    clase: 'text-rose-400',
    texto: `bajo ${INDICE_PERMANENCIA.toFixed(2)}`,
    titulo: `Art. 51: por debajo de ${INDICE_PERMANENCIA.toFixed(2)} se pierde la inscripción`,
  },
  insuficiente: {
    clase: 'text-amber-400',
    texto: `bajo ${INDICE_GRADUACION.toFixed(2)}`,
    titulo: `Art. 54: para graduarse hace falta ${INDICE_GRADUACION.toFixed(2)}`,
  },
  apto: {
    clase: 'text-emerald-400',
    texto: 'apto para grado',
    titulo: `Art. 54: cumple el mínimo de ${INDICE_GRADUACION.toFixed(2)}`,
  },
  'cuadro-de-honor': {
    clase: 'text-sky-300',
    texto: 'cuadro de honor',
    titulo: `C-19: índice acumulado mayor de ${INDICE_CUADRO_HONOR.toFixed(2)}`,
  },
}

function formatear(indice: number | null): string {
  // Dos decimales con coma, como los registra la Universidad.
  return indice === null ? '—' : indice.toFixed(2).replace('.', ',')
}

interface Props {
  readonly resumen: Resumen
  /** Materias en estado `disponible` y las U.C. que suman. */
  readonly inscribible: { readonly materias: number; readonly uc: number }
  /** Si hay algún intento registrado. Con historial vacío, «disponible» es
   *  «las del primer semestre», que no es un logro ni una respuesta. */
  readonly hayProgreso: boolean
  readonly onVerInscribible: () => void
}

export function Cabecera({
  resumen,
  inscribible,
  hayProgreso,
  onVerInscribible,
}: Props) {
  const senal = SENAL[resumen.umbral]
  const pct = Math.round(resumen.avance * 100)

  return (
    <div className="pointer-events-auto flex max-w-full flex-wrap items-stretch gap-x-3 gap-y-2 rounded-xl border border-hairline bg-void-soft/90 px-3 py-2 shadow-2xl backdrop-blur">
      <div className="flex flex-col" title={senal.titulo}>
        <span className="text-[10px] tracking-wider text-slate-500 uppercase">Índice</span>
        <span className={`text-xl leading-tight font-semibold tabular-nums ${senal.clase}`}>
          {formatear(resumen.indice)}
        </span>
        <span className={`text-[10px] ${senal.clase}`}>{senal.texto}</span>
      </div>

      <div className="w-px bg-hairline max-[26rem]:hidden" />

      <div className="flex min-w-[8.5rem] flex-col justify-center">
        <span className="text-[10px] tracking-wider text-slate-500 uppercase">
          Unidades de crédito
        </span>
        <span className="text-sm font-semibold text-white tabular-nums">
          {resumen.ucAprobadas}{' '}
          <span className="font-normal text-slate-500">/ {resumen.ucTotales}</span>
        </span>
        <div
          className="mt-1 h-1 overflow-hidden rounded-full bg-white/10"
          role="progressbar"
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Avance en unidades de crédito"
        >
          <div
            className="h-full rounded-full bg-sky-400/80 transition-[width] duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="w-px bg-hairline max-[26rem]:hidden" />

      {/* La pregunta que el estudiante trae de verdad. El índice y los créditos
          son retrospectivos; esto es lo único prospectivo de la cabecera, y
          antes vivía a cuatro pasos: leyenda → pestaña estados → clic. */}
      <button
        type="button"
        onClick={onVerInscribible}
        title={
          hayProgreso
            ? 'Ver la lista de lo que puedes inscribir'
            : 'Carga tus notas para saber qué puedes inscribir'
        }
        className="group flex min-w-[7.5rem] flex-col justify-center rounded-lg px-1 text-left transition hover:bg-white/5"
      >
        {hayProgreso ? (
          <>
            <span className="text-[10px] tracking-wider text-slate-500 uppercase">
              Inscribible
            </span>
            <span className="text-sm font-semibold text-amber-200 tabular-nums">
              {inscribible.materias}{' '}
              <span className="font-normal text-slate-500">
                {inscribible.materias === 1 ? 'materia' : 'materias'}
              </span>
            </span>
            <span className="text-[10px] text-slate-500 tabular-nums">
              {inscribible.uc} U.C. · ver lista →
            </span>
          </>
        ) : (
          <>
            <span className="text-[10px] tracking-wider text-slate-500 uppercase">
              Empieza aquí
            </span>
            <span className="text-sm font-semibold text-sky-300">Carga tus notas</span>
            <span className="text-[10px] text-slate-500">
              sin ellas no hay índice →
            </span>
          </>
        )}
      </button>
    </div>
  )
}
