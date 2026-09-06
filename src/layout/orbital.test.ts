import { describe, expect, it } from 'vitest'
import { pensum } from '../data/pensum'
import {
  OPCIONES_POR_DEFECTO,
  ORDEN_SECTORES,
  arcosDeSectores,
  calcularLayout,
  distancia,
  radioDeSemestre,
  radioEnvolvente,
  separacionMinima,
  distanciaDeCamara,
} from './orbital'

const materias = pensum.materias
const layout = calcularLayout(materias)
const TAU = Math.PI * 2

function pos(id: string) {
  const p = layout.get(id)
  if (!p) throw new Error(`Sin posición: ${id}`)
  return p
}

describe('determinismo', () => {
  it('dos ejecuciones dan coordenadas idénticas', () => {
    const a = calcularLayout(materias)
    const b = calcularLayout(materias)
    for (const [id, p] of a) {
      expect(b.get(id)).toEqual(p)
    }
  })

  it('el orden del dataset no altera el resultado', () => {
    const barajado = [...materias].reverse()
    const b = calcularLayout(barajado)
    for (const [id, p] of layout) {
      expect(b.get(id)).toEqual(p)
    }
  })

  it('todas las materias reciben posición', () => {
    expect(layout.size).toBe(materias.length)
  })
})

describe('el radio codifica el semestre', () => {
  it('las materias del mismo semestre comparten radio', () => {
    const quinto = materias.filter((m) => m.semestre === 5).map((m) => pos(m.id).radio)
    expect(new Set(quinto).size).toBe(1)
  })

  it('el radio crece con el semestre', () => {
    for (let s = 1; s < 10; s++) {
      expect(radioDeSemestre(s + 1, OPCIONES_POR_DEFECTO)).toBeGreaterThan(
        radioDeSemestre(s, OPCIONES_POR_DEFECTO),
      )
    }
  })

  it('toda prelación apunta hacia afuera', () => {
    // El invariante que hace legible el diseño: si esto pasa, la dirección de
    // cada arista se lee sin flechas. Si falla, el dataset tiene una prelación
    // temporalmente incoherente.
    for (const m of materias) {
      for (const p of m.prelaciones) {
        expect(pos(p).radio).toBeLessThan(pos(m.id).radio)
      }
    }
  })

  it('los correquisitos comparten anillo', () => {
    for (const m of materias) {
      for (const c of m.correquisitos) {
        expect(pos(c).radio).toBe(pos(m.id).radio)
      }
    }
  })
})

describe('el ángulo codifica el sector', () => {
  const arcos = arcosDeSectores(materias)

  it('los arcos cubren exactamente 360 grados', () => {
    const total = arcos.reduce((a, s) => a + (s.hasta - s.desde), 0)
    expect(total).toBeCloseTo(TAU, 10)
  })

  it('los arcos son contiguos y siguen el orden cíclico de D4', () => {
    expect(arcos.map((a) => a.sector)).toEqual([...ORDEN_SECTORES])
    for (let i = 1; i < arcos.length; i++) {
      expect(arcos[i].desde).toBeCloseTo(arcos[i - 1].hasta, 10)
    }
  })

  it('matemática recibe el arco más amplio y gestión el más estrecho', () => {
    const amplitud = (s: string) => {
      const a = arcos.find((x) => x.sector === s)!
      return a.hasta - a.desde
    }
    const amplitudes = arcos.map((a) => a.hasta - a.desde)
    expect(amplitud('matematica')).toBe(Math.max(...amplitudes))
    expect(amplitud('gestion')).toBe(Math.min(...amplitudes))
  })

  it('la amplitud es proporcional al número de materias', () => {
    const total = arcos.reduce((a, s) => a + s.materias, 0)
    for (const a of arcos) {
      expect(a.hasta - a.desde).toBeCloseTo((a.materias / total) * TAU, 10)
    }
  })

  it('cada materia cae dentro del arco de su sector', () => {
    for (const m of materias) {
      if (m.sector === null) continue
      const arco = arcos.find((a) => a.sector === m.sector)!
      const ang = pos(m.id).angulo
      expect(ang).toBeGreaterThanOrEqual(arco.desde)
      expect(ang).toBeLessThanOrEqual(arco.hasta)
    }
  })

  it('una materia sola en su celda queda centrada en el arco', () => {
    // Gestión tiene exactamente una materia en el semestre 6 (Economía).
    const arco = arcos.find((a) => a.sector === 'gestion')!
    expect(pos('1013401').angulo).toBeCloseTo((arco.desde + arco.hasta) / 2, 10)
  })
})

describe('elevación y separación', () => {
  it('ninguna pareja de materias queda superpuesta', () => {
    const puntos = [...layout.values()]
    const minimo = OPCIONES_POR_DEFECTO.pasoElevacion * 0.5
    let peor = Infinity
    for (let i = 0; i < puntos.length; i++) {
      for (let j = i + 1; j < puntos.length; j++) {
        peor = Math.min(peor, distancia(puntos[i], puntos[j]))
      }
    }
    expect(peor).toBeGreaterThanOrEqual(minimo)
    expect(peor).toBeCloseTo(separacionMinima(layout), 10)
  })

  it('queda holgura suficiente para dibujar los nodos visibles', () => {
    // El render deriva el radio del nodo de esta separación. Si el layout se
    // aprieta, los nodos se encogen en pantalla — por eso se fija el ratio
    // separación/extensión, que es lo que gobierna su tamaño aparente.
    const ratio = separacionMinima(layout) / radioEnvolvente(layout)
    expect(ratio).toBeGreaterThan(0.08)
  })

  it('el escalonamiento es simétrico respecto al plano del anillo', () => {
    // Matemática tiene dos materias en el semestre 4 (Estadística I, Mat IV).
    const ys = ['834405', '826401'].map((id) => pos(id).y).sort((a, b) => a - b)
    expect(ys[0] + ys[1]).toBeCloseTo(0, 10)
  })
})

describe('órbita libre', () => {
  it('las electivas quedan fuera del plano principal y conservan su radio', () => {
    for (const id of ['electiva-1', 'electiva-2', 'electiva-3', 'electiva-4']) {
      const m = materias.find((x) => x.id === id)!
      expect(pos(id).radio).toBe(radioDeSemestre(m.semestre, OPCIONES_POR_DEFECTO))
      expect(pos(id).y).toBeGreaterThan(0)
    }
  })

  it('las dos electivas del semestre 9 no se solapan entre sí', () => {
    expect(distancia(pos('electiva-3'), pos('electiva-4'))).toBeGreaterThan(0)
  })
})

describe('encuadre de cámara', () => {
  const R = radioEnvolvente(layout)

  it('una ventana apaisada se encuadra por el campo vertical', () => {
    expect(distanciaDeCamara(R, 50, 1.12, 1.8)).toBeCloseTo(distanciaDeCamara(R), 10)
  })

  it('una ventana más alta que ancha obliga a alejarse', () => {
    // El fov de three es el vertical; con aspecto < 1 el que limita es el
    // horizontal, y encuadrar solo por el vertical cortaría la escena.
    expect(distanciaDeCamara(R, 50, 1.12, 0.5)).toBeGreaterThan(distanciaDeCamara(R))
  })
})
