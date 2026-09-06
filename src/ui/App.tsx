import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Sector } from '../data/types'
import { pensum } from '../data/pensum'
import { construirGrafo } from '../model/graph'
import { calcularResaltado } from '../model/resaltado'
import { resumen as calcularResumen } from '../progreso/indice'
import { estadosDeTodas, type EstadoMateria } from '../progreso/estados'
import { HISTORIAL_VACIO, type Historial, type Intento } from '../progreso/tipos'
import {
  almacenDelNavegador,
  cargarHistorial,
  guardarHistorial,
} from '../persistencia/historial'
import { GrafoOrbital, type OrdenCamara } from '../view/GrafoOrbital'
import { Buscador } from './Buscador'
import { Cabecera } from './Cabecera'
import { Controles } from './Controles'
import { Leyenda } from './Leyenda'
import { PanelDetalle } from './PanelDetalle'
import { Semestres } from './Semestres'
import { Calculadora, planInicial } from './Calculadora'
import { PestanasVista } from './PestanasVista'
import { useVista } from './useVista'
import type { PlanEvaluacion } from '../evaluacion/plan'
import { useTeclado } from './useTeclado'

export function App() {
  const grafo = useMemo(() => construirGrafo(pensum), [])
  const [vista, irAVista] = useVista()

  const [hover, setHover] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [sectorFiltrado, setSectorFiltrado] = useState<Sector | null>(null)
  const [semestreFiltrado, setSemestreFiltrado] = useState<number | null>(null)
  const [estadoFiltrado, setEstadoFiltrado] = useState<EstadoMateria | null>(null)
  const [girando, setGirando] = useState(false)
  const [orden, setOrden] = useState<OrdenCamara | null>(null)
  const nonce = useRef(0)

  // ── Historial ─────────────────────────────────────────────────────────────
  //
  // Se carga durante el render, no en un efecto: `localStorage` es síncrono, y
  // cargarlo después obliga a arrancar con un historial vacío que el efecto de
  // guardado escribiría encima antes de que llegue el real. Así el primer
  // render ya tiene lo guardado y no hay ventana para pisarlo.
  const almacen = useMemo(() => almacenDelNavegador(), [])
  const carga = useMemo(() => (almacen ? cargarHistorial(almacen) : null), [almacen])
  const [historial, setHistorial] = useState<Historial>(carga?.historial ?? HISTORIAL_VACIO)

  const avisoAlmacen =
    carga === null
      ? 'Este navegador no permite guardar; tu historial no se conservará.'
      : carga.estado === 'corrupto'
        ? 'No se pudo leer el historial guardado. Se empieza en blanco.'
        : carga.estado === 'version-futura'
          ? `Hay un historial de una versión posterior (${carga.version}). No se tocará: actualiza la aplicación.`
          : null

  // Solo se escribe cuando el historial cambia de verdad. Sin esto, montar la
  // aplicación guardaría encima de un dato corrupto antes de que el usuario
  // toque nada, borrando la evidencia.
  const ultimoGuardado = useRef(historial)
  useEffect(() => {
    if (!almacen || historial === ultimoGuardado.current) return
    guardarHistorial(historial, almacen)
    ultimoGuardado.current = historial
  }, [historial, almacen])

  // ── Calculadora ───────────────────────────────────────────────────────────
  //
  // Los planes viven solo en memoria (design.md, D7): son papel de borrador.
  // Se indexan por materia para que cambiar de asignatura y volver no los
  // pierda dentro de la misma sesión; se pierden al recargar.
  const [planes, setPlanes] = useState<Record<string, PlanEvaluacion>>({})
  const [materiaCalculada, setMateriaCalculada] = useState<string | null>(null)
  // Qué definitiva se registró ya desde la calculadora, por materia. Evita
  // añadir el mismo intento dos veces de un doble clic o de volver a la
  // pestaña. Si la definitiva cambia, vuelve a poder registrarse.
  const [registradas, setRegistradas] = useState<Record<string, number>>({})

  const elegirMateriaCalculada = useCallback(
    (id: string | null) => {
      setMateriaCalculada(id)
      if (id === null) return
      setPlanes((previos) => {
        if (previos[id]) return previos
        const materia = grafo.materias.get(id)
        return materia ? { ...previos, [id]: planInicial(materia) } : previos
      })
    },
    [grafo],
  )

  const registrarIntentos = useCallback((id: string, intentos: readonly Intento[]) => {
    setHistorial((h) => {
      const siguiente = { ...h }
      if (intentos.length === 0) delete siguiente[id]
      else siguiente[id] = intentos
      return siguiente
    })
  }, [])

  // ── Derivados ─────────────────────────────────────────────────────────────
  const resumen = useMemo(
    () => calcularResumen(historial, grafo.materias),
    [historial, grafo],
  )
  const estados = useMemo(() => estadosDeTodas(historial, grafo), [historial, grafo])
  const progresoActivo = useMemo(
    () => Object.values(historial).some((i) => i.length > 0),
    [historial],
  )

  // La selección manda sobre el cursor: el cono persiste al retirarlo.
  const activo = seleccion ?? hover
  const resaltado = useMemo(
    () => (activo === null ? null : calcularResaltado(grafo, activo)),
    [grafo, activo],
  )

  const irA = useCallback((id: string) => {
    setSeleccion(id)
    setGirando(false)
    setOrden({ tipo: 'enfocar', id, nonce: (nonce.current += 1) })
  }, [])

  const limpiar = useCallback(() => {
    setSeleccion(null)
    setSemestreFiltrado(null)
    setSectorFiltrado(null)
    setEstadoFiltrado(null)
  }, [])

  const registrarDefinitiva = useCallback((id: string, nota: number) => {
    setHistorial((h) => ({ ...h, [id]: [...(h[id] ?? []), { tipo: 'regular', nota }] }))
    setRegistradas((r) => ({ ...r, [id]: nota }))
  }, [])

  // El teclado navega el grafo; en la calculadora estorbaría.
  useTeclado({ grafo, seleccion: vista === 'grafo' ? seleccion : null, irA, limpiar })

  const materia = seleccion === null ? null : (grafo.materias.get(seleccion) ?? null)

  if (vista === 'calculadora') {
    return (
      <div className="relative h-full w-full">
        <Calculadora
          grafo={grafo}
          planes={planes}
          onCambiarPlan={(plan) => setPlanes((p) => ({ ...p, [plan.materiaId]: plan }))}
          materiaId={materiaCalculada}
          onElegirMateria={elegirMateriaCalculada}
          intentosDe={(id) => historial[id] ?? []}
          registradas={registradas}
          onRegistrar={registrarDefinitiva}
        />
        <div className="absolute top-4 right-4">
          <PestanasVista vista={vista} onIr={irAVista} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full w-full">
      <GrafoOrbital
        grafo={grafo}
        resaltado={resaltado}
        sectorFiltrado={sectorFiltrado}
        semestreFiltrado={semestreFiltrado}
        estadoFiltrado={estadoFiltrado}
        estados={estados}
        progresoActivo={progresoActivo}
        girando={girando}
        panelAbierto={materia !== null}
        onHover={setHover}
        onSelect={setSeleccion}
        orden={orden}
      />

      {/* Cromo 2D. `pointer-events-none` deja que el ratón llegue al lienzo;
          cada isla lo vuelve a activar para sí. */}
      <div className="pointer-events-none absolute inset-0">
        <header className="absolute top-4 left-4 flex flex-col gap-3">
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white">
              Pensum · Ingeniería en Informática
            </h1>
            <p className="text-xs text-slate-500">
              {pensum.meta.universidad.replace(/ \(UNET\)$/, '')} ·{' '}
              {grafo.materias.size} materias
            </p>
          </div>
          <Cabecera resumen={resumen} />
          <Buscador grafo={grafo} onElegir={irA} />
          {avisoAlmacen && (
            <p className="pointer-events-auto max-w-80 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200">
              {avisoAlmacen}
            </p>
          )}
        </header>

        <div
          className="absolute top-4 flex flex-col items-end gap-2"
          style={{ right: materia ? '24rem' : '1rem' }}
        >
          <PestanasVista vista={vista} onIr={irAVista} />
          <Controles
            girando={girando}
            onGirar={setGirando}
            onVistaInicial={() => setOrden({ tipo: 'inicial', nonce: (nonce.current += 1) })}
            onVistaCenital={() => setOrden({ tipo: 'cenital', nonce: (nonce.current += 1) })}
          />
        </div>

        <div className="absolute bottom-4 left-4">
          <Leyenda
            grafo={grafo}
            historial={historial}
            resumen={resumen}
            estados={estados}
            sectorFiltrado={sectorFiltrado}
            estadoFiltrado={estadoFiltrado}
            onFiltrar={setSectorFiltrado}
            onFiltrarEstado={setEstadoFiltrado}
            onImportar={setHistorial}
            onIr={irA}
          />
        </div>

        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <Semestres
            grafo={grafo}
            activo={semestreFiltrado}
            onElegir={(s) => {
              setSemestreFiltrado(s)
              setSeleccion(null)
            }}
            onIr={irA}
          />
        </div>

        {materia && (
          <PanelDetalle
            grafo={grafo}
            materia={materia}
            intentos={historial[materia.id] ?? []}
            estado={estados.get(materia.id)!}
            ucAprobadas={resumen.ucAprobadas}
            onRegistrar={registrarIntentos}
            onIr={irA}
            onCerrar={() => setSeleccion(null)}
          />
        )}
      </div>
    </div>
  )
}
