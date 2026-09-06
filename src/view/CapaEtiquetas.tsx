import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import type { Punto3D } from '../layout/orbital'

/**
 * Etiquetas como capa HTML proyectada sobre la escena, en vez de sprites 3D.
 *
 * Los sprites no se pueden separar cuando chocan: cada uno vive en su posición
 * de mundo y se pisan en cuanto dos materias se proyectan cerca, que es justo
 * lo que pasa a lo largo de un brazo. Proyectando a coordenadas de pantalla se
 * pueden resolver las colisiones, esquivar el panel de detalle y estilar el
 * texto con Tailwind como el resto del cromo.
 */

export interface ItemEtiqueta {
  readonly id: string
  readonly pos: Punto3D
  readonly texto: string
  readonly clase: string
  /** Menor gana el sitio cuando dos etiquetas chocan. */
  readonly prioridad: number
  /** Desplaza la etiqueta respecto al nodo, en px de pantalla. */
  readonly desplazamientoY?: number
}

interface Props {
  readonly obtenerCamara: () => THREE.Camera | undefined
  readonly items: readonly ItemEtiqueta[]
  /** Coordenada X donde empieza el panel de detalle, para no quedar debajo. */
  readonly bordeDerecho: number | null
}

interface Colocada extends ItemEtiqueta {
  readonly x: number
  readonly y: number
  readonly ancho: number
}

const ALTO_LINEA = 17
/** Ancho aproximado por carácter a 11px; basta para detectar solapes. */
const ANCHO_CARACTER = 5.9
const MARGEN_PANEL = 12

function proyectar(
  items: readonly ItemEtiqueta[],
  camara: THREE.Camera,
  ancho: number,
  alto: number,
  bordeDerecho: number | null,
): Colocada[] {
  const v = new THREE.Vector3()
  const candidatos: Colocada[] = []

  for (const it of items) {
    v.set(it.pos.x, it.pos.y, it.pos.z).project(camara)
    // z fuera de [-1, 1] significa detrás de la cámara o fuera del frustum.
    if (v.z < -1 || v.z > 1) continue
    const x = (v.x * 0.5 + 0.5) * ancho
    const y = (-v.y * 0.5 + 0.5) * alto + (it.desplazamientoY ?? -16)
    // Una cámara sin aspecto válido proyecta NaN, y React se queja de un
    // `left: NaN`. Mejor no dibujar la etiqueta que ensuciar la consola.
    if (!Number.isFinite(x) || !Number.isFinite(y)) continue
    if (x < 0 || x > ancho || y < 0 || y > alto) continue
    // Una materia que cae debajo del panel no se etiqueta: correrla mentiría
    // sobre dónde está.
    if (bordeDerecho !== null && x > bordeDerecho - MARGEN_PANEL) continue
    candidatos.push({ ...it, x, y, ancho: it.texto.length * ANCHO_CARACTER })
  }

  // Se colocan por prioridad: la materia activa se queda donde está y las
  // demás ceden el sitio.
  candidatos.sort((a, b) => a.prioridad - b.prioridad || a.y - b.y)

  const colocadas: Colocada[] = []
  for (const c of candidatos) {
    let y = c.y
    for (let intento = 0; intento < 24; intento++) {
      const choca = colocadas.some(
        (o) =>
          Math.abs(o.y - y) < ALTO_LINEA &&
          Math.abs(o.x - c.x) < (o.ancho + c.ancho) / 2,
      )
      if (!choca) break
      // Se empuja alternando arriba y abajo para no arrastrar toda la pila
      // hacia un lado.
      y = c.y + (intento % 2 === 0 ? 1 : -1) * ALTO_LINEA * Math.ceil((intento + 1) / 2)
    }
    colocadas.push({ ...c, y })
  }

  return colocadas
}

export function CapaEtiquetas({ obtenerCamara, items, bordeDerecho }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const [colocadas, setColocadas] = useState<Colocada[]>([])

  useEffect(() => {
    let vivo = true
    let firmaPrevia = ''

    const tick = () => {
      if (!vivo) return
      requestAnimationFrame(tick)

      const camara = obtenerCamara()
      const el = contenedor.current
      if (!camara || !el) return

      const ancho = el.clientWidth
      const alto = el.clientHeight
      // Reproyectar solo cuando la cámara o el encuadre cambian de verdad.
      const firma = `${camara.matrixWorld.elements.join(',')}|${ancho}x${alto}`
      if (firma === firmaPrevia) return
      firmaPrevia = firma

      setColocadas(proyectar(items, camara, ancho, alto, bordeDerecho))
    }

    requestAnimationFrame(tick)
    return () => {
      vivo = false
    }
  }, [items, obtenerCamara, bordeDerecho])

  return (
    <div ref={contenedor} className="pointer-events-none absolute inset-0 overflow-hidden">
      {colocadas.map((e) => (
        <span
          key={e.id}
          className={`absolute -translate-x-1/2 whitespace-nowrap ${e.clase}`}
          style={{ left: e.x, top: e.y }}
        >
          {e.texto}
        </span>
      ))}
    </div>
  )
}
