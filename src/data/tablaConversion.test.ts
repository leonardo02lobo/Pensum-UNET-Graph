import { describe, expect, it } from 'vitest'
import {
  UMBRALES,
  calificacionesDeLaEscala,
  esNotaDeEscala,
  notaDePorcentaje,
  notaDePuntaje,
  porcentajeMinimoDeNota,
} from './tablaConversion'

describe('cobertura de la tabla', () => {
  it('todo porcentaje de 0 a 100 devuelve una calificación', () => {
    for (let p = 0; p <= 100; p++) {
      const n = notaDePorcentaje(p)
      expect(n).toBeGreaterThanOrEqual(1)
      expect(n).toBeLessThanOrEqual(9)
    }
  })

  it('la escala son las 81 décimas de 1,0 a 9,0', () => {
    const escala = calificacionesDeLaEscala()
    expect(escala).toHaveLength(81)
    expect(escala[0]).toBe(1)
    expect(escala[80]).toBe(9)
    expect(escala).toContain(5)
    expect(escala).toContain(6.5)
  })

  it('los umbrales crecen de forma estricta', () => {
    for (let i = 1; i < UMBRALES.length; i++) {
      expect(UMBRALES[i]).toBeGreaterThan(UMBRALES[i - 1])
    }
  })

  it('las ocho calificaciones que reciben dos porcentajes', () => {
    const porNota = new Map<number, number[]>()
    for (let p = 7; p <= 95; p++) {
      const n = notaDePorcentaje(p)
      porNota.set(n, [...(porNota.get(n) ?? []), p])
    }
    const dobles = [...porNota.entries()]
      .filter(([, ps]) => ps.length > 1)
      .sort((a, b) => a[0] - b[0])
    expect(dobles).toEqual([
      [2, [17, 18]],
      [3, [28, 29]],
      [4, [39, 40]],
      [4.8, [48, 49]],
      [5.3, [54, 55]],
      [6, [62, 63]],
      [7, [73, 74]],
      [8, [84, 85]],
    ])
  })

  it('el 5,0 recibe un solo porcentaje: el 51', () => {
    const cincos = []
    for (let p = 0; p <= 100; p++) if (notaDePorcentaje(p) === 5) cincos.push(p)
    expect(cincos).toEqual([51])
  })
})

describe('la tabla no es una fórmula', () => {
  it('el mejor ajuste lineal falla en más de un tercio de las celdas', () => {
    // Si algún día esto pasara a fallar en cero celdas, la tabla sería
    // interpolable y este módulo sobraría. Hoy no lo es.
    let fallos = 0
    let total = 0
    for (let p = 7; p <= 95; p++) {
      total += 1
      const lineal = 1 + (p - 7) / 11
      if (Math.abs(lineal - notaDePorcentaje(p)) > 0.051) fallos += 1
    }
    expect(total).toBe(89)
    expect(fallos).toBe(35)
    expect(fallos / total).toBeGreaterThan(1 / 3)
  })
})

describe('porcentaje a calificación', () => {
  it('la frontera de aprobación', () => {
    expect(notaDePorcentaje(48)).toBe(4.8)
    expect(notaDePorcentaje(49)).toBe(4.8)
    expect(notaDePorcentaje(50)).toBe(4.9)
    expect(notaDePorcentaje(51)).toBe(5)
    expect(notaDePorcentaje(52)).toBe(5.1)
  })

  it('satura por debajo en 1,0', () => {
    for (const p of [0, 1, 6, 7]) expect(notaDePorcentaje(p)).toBe(1)
    expect(notaDePorcentaje(8)).toBe(1.1)
  })

  it('satura por arriba en 9,0', () => {
    for (const p of [95, 96, 100]) expect(notaDePorcentaje(p)).toBe(9)
    expect(notaDePorcentaje(94)).toBe(8.9)
  })

  it('un porcentaje con decimales no se redondea al alza', () => {
    // 50,9 no llega al 51 que exige el 5,0.
    expect(notaDePorcentaje(50.9)).toBe(4.9)
    expect(notaDePorcentaje(51)).toBe(5)
    expect(notaDePorcentaje(50.0001)).toBe(4.9)
  })

  it('fuera de rango satura en vez de inventar', () => {
    expect(notaDePorcentaje(-10)).toBe(1)
    expect(notaDePorcentaje(150)).toBe(9)
  })

  it('rechaza valores no numéricos', () => {
    expect(() => notaDePorcentaje(NaN)).toThrow(/inválido/)
  })
})

describe('calificación a porcentaje mínimo', () => {
  it('para aprobar hace falta 51', () => {
    expect(porcentajeMinimoDeNota(5)).toBe(51)
  })

  it('en las notas de doble porcentaje devuelve el menor', () => {
    expect(porcentajeMinimoDeNota(6)).toBe(62)
    expect(porcentajeMinimoDeNota(4.8)).toBe(48)
    expect(porcentajeMinimoDeNota(5.3)).toBe(54)
  })

  it('los extremos', () => {
    expect(porcentajeMinimoDeNota(1)).toBe(7)
    expect(porcentajeMinimoDeNota(9)).toBe(95)
  })

  it('ida y vuelta para las 81 calificaciones', () => {
    for (const nota of calificacionesDeLaEscala()) {
      expect(notaDePorcentaje(porcentajeMinimoDeNota(nota))).toBe(nota)
    }
  })

  it('rechaza lo que no es de la escala', () => {
    expect(() => porcentajeMinimoDeNota(6.55)).toThrow(/escala/)
    expect(() => porcentajeMinimoDeNota(0)).toThrow(/escala/)
    expect(() => porcentajeMinimoDeNota(9.5)).toThrow(/escala/)
  })
})

describe('validación de la escala', () => {
  it('acepta décimas de 1,0 a 9,0', () => {
    expect(esNotaDeEscala(1)).toBe(true)
    expect(esNotaDeEscala(6.5)).toBe(true)
    expect(esNotaDeEscala(9)).toBe(true)
    // 6.7 y 4.3 son los clásicos que fallan al comparar en coma flotante.
    expect(esNotaDeEscala(6.7)).toBe(true)
    expect(esNotaDeEscala(4.3)).toBe(true)
  })

  it('rechaza fuera de escala y más de una décima', () => {
    expect(esNotaDeEscala(0.9)).toBe(false)
    expect(esNotaDeEscala(9.1)).toBe(false)
    expect(esNotaDeEscala(6.55)).toBe(false)
    expect(esNotaDeEscala(20)).toBe(false)
    expect(esNotaDeEscala('6')).toBe(false)
    expect(esNotaDeEscala(NaN)).toBe(false)
  })
})

describe('puntaje sobre un máximo arbitrario', () => {
  it('diecisiete sobre veinte', () => {
    const r = notaDePuntaje(17, 20)
    expect(r.ok).toBe(true)
    expect(r.ok && r.porcentaje).toBe(85)
    // 85 es el segundo porcentaje de la celda doble del 8,0 (84 y 85).
    // El 8,1 no empieza hasta el 86.
    expect(r.ok && r.nota).toBe(8)
  })

  it('el máximo da 9,0', () => {
    const r = notaDePuntaje(20, 20)
    expect(r.ok && r.nota).toBe(9)
  })

  it('cero da 1,0', () => {
    const r = notaDePuntaje(0, 20)
    expect(r.ok && r.nota).toBe(1)
  })

  it('rechaza un máximo no positivo', () => {
    expect(notaDePuntaje(5, 0).ok).toBe(false)
    expect(notaDePuntaje(5, -3).ok).toBe(false)
  })

  it('rechaza obtenido mayor que el máximo', () => {
    const r = notaDePuntaje(21, 20)
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.error).toMatch(/superar/)
  })

  it('rechaza un obtenido negativo', () => {
    expect(notaDePuntaje(-1, 20).ok).toBe(false)
  })
})
