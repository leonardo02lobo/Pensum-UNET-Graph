import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
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
import { AVISO_SIN_WEBGL, hayWebGL } from '../view/webgl'
import {
  SIN_PANEL,
  altoLibreCromoInferior,
  apoyoCromoInferior,
  desplazamientoCromo,
  franjaDelPanel,
} from './panel'
import {
  ANCHO_MINIMO_GRAFO,
  debeColapsar,
  esAmplio,
  formaDelPanel,
  tramoDe,
} from './tramos'
import { useTamanoVentana } from './useTamanoVentana'
import { Buscador } from './Buscador'
import { Cabecera } from './Cabecera'
import { Controles } from './Controles'
import { Leyenda } from './Leyenda'
import { PanelDetalle } from './PanelDetalle'
import { Semestres } from './Semestres'
import { Calculadora, planInicial } from './Calculadora'
import { Plan } from './Plan'
import { PestanasVista } from './PestanasVista'
import { useVista } from './useVista'
import type { PlanEvaluacion } from '../evaluacion/plan'
import { useTeclado } from './useTeclado'

export function App() {
  const grafo = useMemo(() => construirGrafo(pensum), [])
  const [vistaPedida, irAVista] = useVista()

  // ── Disposición ───────────────────────────────────────────────────────────
  //
  // El reflujo vive aquí, que es quien posiciona las cinco islas. Repartirlo
  // entre los componentes haría imposible razonar sobre «¿se solapan?», que es
  // una propiedad del conjunto y no de cada isla (design.md, D2).
  const { ancho, alto } = useTamanoVentana()
  const tramo = tramoDe(ancho)
  const amplio = esAmplio(tramo)
  const colapsar = debeColapsar(tramo)
  const forma = formaDelPanel(tramo)

  // Sin WebGL la escena no se monta y la lista es el destino, cualquiera que
  // sea el fragmento de la URL (design.md, D6).
  const webgl = useMemo(() => hayWebGL(), [])

  // Bajo el umbral el grafo no se ofrece por defecto, pero un fragmento que lo
  // pide explícitamente es una intención y se respeta (design.md, D4). Sin
  // WebGL no hay nada que respetar.
  const [insisteEnGrafo, setInsisteEnGrafo] = useState(false)
  const estrecho = ancho > 0 && ancho < ANCHO_MINIMO_GRAFO
  // Solo `#/grafo` es una intención explícita. La ausencia de fragmento y `#/`
  // son el destino por defecto, no una petición, y bajo el umbral el destino
  // por defecto es la lista.
  const grafoPedidoPorURL = useRef(window.location.hash === '#/grafo')
  const puedeGrafo =
    webgl && (!estrecho || insisteEnGrafo || grafoPedidoPorURL.current)
  const vista = !puedeGrafo && vistaPedida === 'grafo' ? 'plan' : vistaPedida

  // La caída a la lista se fija en el fragmento en vez de quedarse como una
  // derivación. Si no, al ensanchar la ventana la condición se revierte y la
  // aplicación devuelve al usuario al grafo por su cuenta — y mover a alguien
  // de sitio por redimensionar es peor que el problema que resuelve.
  useEffect(() => {
    if (vista === 'plan' && vistaPedida === 'grafo') irAVista('plan')
  }, [vista, vistaPedida, irAVista])
  const vistasDisponibles = useMemo(
    () =>
      puedeGrafo
        ? (['grafo', 'plan', 'calculadora'] as const)
        : (['plan', 'calculadora'] as const),
    [puedeGrafo],
  )

  const [hover, setHover] = useState<string | null>(null)
  const [seleccion, setSeleccion] = useState<string | null>(null)
  const [sectorFiltrado, setSectorFiltrado] = useState<Sector | null>(null)
  const [semestreFiltrado, setSemestreFiltrado] = useState<number | null>(null)
  const [estadoFiltrado, setEstadoFiltrado] = useState<EstadoMateria | null>(null)
  const [girando, setGirando] = useState(false)
  const [orden, setOrden] = useState<OrdenCamara | null>(null)
  const nonce = useRef(0)

  // Alto real de la cabecera. En el tramo estrecho —el grafo visto por
  // insistencia del usuario— la cabecera envuelve y crece hasta ~229 px, y el
  // cromo de la esquina opuesta se le monta encima. Se mide en vez de suponer
  // porque el alto depende de cuánto envuelva, que depende del ancho.
  const cabeceraRef = useRef<HTMLElement>(null)
  const [altoCabecera, setAltoCabecera] = useState(0)
  useLayoutEffect(() => {
    const el = cabeceraRef.current
    if (!el) return
    const medir = () => setAltoCabecera(el.getBoundingClientRect().height)
    medir()
    const obs = new ResizeObserver(medir)
    obs.observe(el)
    return () => obs.disconnect()
  })

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

  // Lo inscribible sale de `estados`, no de un recorrido propio del historial:
  // `disponible` ya significa «prelaciones aprobadas y compuerta cumplida».
  const inscribible = useMemo(() => {
    let materias = 0
    let uc = 0
    for (const [id, estado] of estados) {
      if (estado !== 'disponible') continue
      materias += 1
      uc += grafo.materias.get(id)!.uc
    }
    return { materias, uc }
  }, [estados, grafo])

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

  // Saltos desde la lista. Reutilizan `irA` y `elegirMateriaCalculada` para
  // que una materia abierta desde el plan llegue igual que si se hubiera
  // elegido en su vista de destino: seleccionada y enfocada en el grafo, con
  // su plan inicial ya creado en la calculadora.
  const verEnGrafo = useCallback(
    (id: string) => {
      irAVista('grafo')
      irA(id)
    },
    [irAVista, irA],
  )

  const calcularMateria = useCallback(
    (id: string) => {
      elegirMateriaCalculada(id)
      irAVista('calculadora')
    },
    [elegirMateriaCalculada, irAVista],
  )

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

  if (vista === 'plan') {
    return (
      <div className="relative h-full w-full">
        <Plan
          grafo={grafo}
          estados={estados}
          resumen={resumen}
          historial={historial}
          estadoFiltrado={estadoFiltrado}
          onFiltrarEstado={setEstadoFiltrado}
          onRegistrar={registrarIntentos}
          onVerEnGrafo={verEnGrafo}
          onCalcular={calcularMateria}
          aviso={
            !webgl
              ? AVISO_SIN_WEBGL
              : estrecho
                ? 'El grafo 3D necesita una pantalla más ancha. Mientras tanto, aquí está el pensum como lista.'
                : null
          }
          onVerGrafoIgual={
            webgl && estrecho && !insisteEnGrafo
              ? () => {
                  setInsisteEnGrafo(true)
                  irAVista('grafo')
                }
              : undefined
          }
        />
        <div className="absolute top-4 right-4">
          <PestanasVista vista={vista} onIr={irAVista} disponibles={vistasDisponibles} />
        </div>
      </div>
    )
  }

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
          <PestanasVista vista={vista} onIr={irAVista} disponibles={vistasDisponibles} />
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
        franjaPanel={materia === null ? SIN_PANEL : franjaDelPanel(forma, ancho, alto)}
        onHover={setHover}
        onSelect={setSeleccion}
        // Cualquier gesto sobre la escena detiene la rotación: seguir girando
        // mientras alguien la manipula es pelearse con él.
        onIntervenir={() => setGirando(false)}
        orden={orden}
      />

      {/* Cromo 2D. `pointer-events-none` deja que el ratón llegue al lienzo;
          cada isla lo vuelve a activar para sí. */}
      <div className="pointer-events-none absolute inset-0">
        {/* Acotada al ancho útil: sin esto la cabecera mide 410 px y desborda
            una ventana de 375, que es el caso de quien insiste en ver el grafo
            por debajo del umbral. */}
        <header
          ref={cabeceraRef}
          className="absolute top-4 left-4 flex flex-col gap-3"
          style={{ maxWidth: `calc(100vw - 2rem)` }}
        >
          <div>
            <h1 className="text-sm font-semibold tracking-wide text-white">
              Pensum · Ingeniería en Informática
            </h1>
            <p className="text-xs text-slate-500">
              {pensum.meta.universidad.replace(/ \(UNET\)$/, '')} ·{' '}
              {grafo.materias.size} materias
            </p>
          </div>
          <Cabecera
            resumen={resumen}
            inscribible={inscribible}
            hayProgreso={progresoActivo}
            onVerInscribible={() => {
              setEstadoFiltrado(progresoActivo ? 'disponible' : null)
              irAVista('plan')
            }}
          />
          <Buscador grafo={grafo} onElegir={irA} />
          {avisoAlmacen && (
            <p className="pointer-events-auto max-w-80 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1.5 text-[11px] text-amber-200">
              {avisoAlmacen}
            </p>
          )}
        </header>

        <div
          className="absolute flex flex-col items-end gap-2"
          style={{
            right: desplazamientoCromo(forma, materia !== null, ancho),
            // En estrecho no caben lado a lado: se apila debajo.
            top: tramo === 'estrecho' ? altoCabecera + 24 : 16,
          }}
        >
          <PestanasVista vista={vista} onIr={irAVista} disponibles={vistasDisponibles} />
          <Controles
            girando={girando}
            onGirar={setGirando}
            onVistaInicial={() => setOrden({ tipo: 'inicial', nonce: (nonce.current += 1) })}
            onVistaCenital={() => setOrden({ tipo: 'cenital', nonce: (nonce.current += 1) })}
          />
        </div>

        <div
          className="absolute left-4"
          style={{ bottom: apoyoCromoInferior(forma, materia !== null, alto) }}
        >
          <Leyenda
            colapsadaPorDefecto={colapsar}
            // La cabecera ocupa ~200 px con el buscador; el resto de la
            // columna izquierda es lo que le queda a la leyenda.
            altoMaximo={
              // 56 px de cromo propio (pestañas) sobre la zona desplazable.
              altoLibreCromoInferior(forma, materia !== null, alto, 200) - 56
            }
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

        <div
          className={
            amplio
              ? 'absolute left-1/2 -translate-x-1/2'
              : 'absolute right-4'
          }
          style={{ bottom: apoyoCromoInferior(forma, materia !== null, alto) }}
        >
          <Semestres
            compacto={colapsar}
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
            forma={forma}
          />
        )}
      </div>
    </div>
  )
}
