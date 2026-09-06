import { describe, expect, it } from 'vitest'
import {
  planSugerido,
  reglaArticulo32,
  sumaDePonderaciones,
  validarArticulo32,
  validarParcial,
  parcialDesdePuntos,
  type Parcial,
  type PlanEvaluacion,
} from './plan'
import {
  acumulado,
  aportePonderado,
  definitiva,
  definitivaDeSuma,
  evaluar,
  necesarioPara,
  pesoPendiente,
  rangoAlcanzable,
  tablaDeObjetivos,
} from './definitiva'

const parcial = (peso: number, nota: number | null = null, np = false): Parcial => ({
  peso,
  nota,
  np,
})
const plan = (...parciales: Parcial[]): PlanEvaluacion => ({ materiaId: 'x', parciales })

// ─── Plan y validaciones ────────────────────────────────────────────────────

describe('validación de un parcial', () => {
  it('acepta una calificación de la escala', () => {
    expect(validarParcial(parcial(30, 6.5))).toEqual([])
  })

  it('rechaza más de una décima (Art. 40)', () => {
    expect(validarParcial(parcial(30, 6.55))).toContain('nota-fuera-de-escala')
  })

  it('rechaza fuera de la escala', () => {
    expect(validarParcial(parcial(30, 0))).toContain('nota-fuera-de-escala')
    expect(validarParcial(parcial(30, 9.5))).toContain('nota-fuera-de-escala')
    expect(validarParcial(parcial(30, 18))).toContain('nota-fuera-de-escala')
  })

  it('NP y calificación son excluyentes', () => {
    expect(validarParcial({ peso: 30, nota: 6, np: true })).toContain('np-con-nota')
    expect(validarParcial({ peso: 30, nota: null, np: true })).toEqual([])
  })

  it('rechaza ponderaciones imposibles', () => {
    expect(validarParcial(parcial(-5))).toContain('peso-fuera-de-rango')
    expect(validarParcial(parcial(120))).toContain('peso-fuera-de-rango')
  })
})

describe('parcial en puntos · Artículos 31 y 42', () => {
  it('los puntos se convierten con la Tabla 1', () => {
    // El Art. 31 define la sumatoria del parcial «en la escala de uno a cien
    // puntos»; el Art. 42 la lleva a la escala 1,0–9,0 del Art. 40.
    const p = parcialDesdePuntos(30, 78)
    expect(p.puntos).toBe(78)
    // 78 son 7,4: el 7,5 no empieza hasta el 79. Interpolar daría 7,45.
    expect(p.nota).toBe(7.4)
    expect(validarParcial(p)).toEqual([])
  })

  it('la frontera de aprobación en puntos', () => {
    expect(parcialDesdePuntos(30, 50).nota).toBe(4.9)
    expect(parcialDesdePuntos(30, 51).nota).toBe(5)
  })

  it('el aporte usa la nota convertida, no los puntos', () => {
    // 7,4 × 30 % = 2,22. Si se usaran los 78 puntos crudos daría 23,40.
    expect(aportePonderado(parcialDesdePuntos(30, 78))).toBe(2.22)
  })

  it('una definitiva armada solo con puntos', () => {
    const p = plan(
      parcialDesdePuntos(30, 62), // 6,0 → 1,80
      parcialDesdePuntos(30, 79), // 7,5 → 2,25
      parcialDesdePuntos(40, 51), // 5,0 → 2,00
    )
    expect(acumulado(p)).toBe(6.05)
    expect(definitiva(p)).toBe(6)
  })

  it('rechaza puntos fuera de la escala', () => {
    expect(validarParcial({ peso: 30, puntos: 120, nota: 9 })).toContain(
      'puntos-fuera-de-rango',
    )
    expect(validarParcial({ peso: 30, puntos: -5, nota: 1 })).toContain(
      'puntos-fuera-de-rango',
    )
  })

  it('detecta que los puntos y la nota no se corresponden', () => {
    // 78 puntos son 7,5; declarar 9,0 sería saltarse la Tabla 1.
    expect(validarParcial({ peso: 30, puntos: 78, nota: 9 })).toContain(
      'puntos-no-concuerdan',
    )
  })

  it('en modo puntos sin valor todavía, el parcial está pendiente', () => {
    const p: Parcial = { peso: 30, puntos: null, nota: null }
    expect(validarParcial(p)).toEqual([])
    expect(aportePonderado(p)).toBe(0)
  })
})

describe('suma de ponderaciones', () => {
  it('plan completo', () => {
    const e = sumaDePonderaciones(plan(parcial(25), parcial(25), parcial(25), parcial(25)))
    expect(e.suma).toBe(100)
    expect(e.completo).toBe(true)
  })

  it('informa lo que falta por asignar', () => {
    const e = sumaDePonderaciones(plan(parcial(40), parcial(50)))
    expect(e.completo).toBe(false)
    expect(e.falta).toBe(10)
    expect(e.sobra).toBe(0)
  })

  it('informa el exceso', () => {
    const e = sumaDePonderaciones(plan(parcial(60), parcial(50)))
    expect(e.sobra).toBe(10)
    expect(e.falta).toBe(0)
  })

  it('33,33 tres veces no cuadra, y se nota', () => {
    const e = sumaDePonderaciones(plan(parcial(33.33), parcial(33.33), parcial(33.33)))
    expect(e.suma).toBe(99.99)
    expect(e.completo).toBe(false)
  })
})

describe('Artículo 32 · reglas por unidades de crédito', () => {
  it('literal a: una unidad de crédito', () => {
    expect(reglaArticulo32(1)).toEqual({
      literal: 'a',
      parciales: 2,
      pesoMinimo: 40,
      pesoMaximo: 60,
      admiteExcepcion: false,
    })
  })

  it('literal b: dos o tres unidades de crédito', () => {
    expect(reglaArticulo32(2)?.literal).toBe('b')
    expect(reglaArticulo32(3)?.literal).toBe('b')
    expect(reglaArticulo32(3)?.parciales).toBe(3)
    expect(reglaArticulo32(3)?.pesoMaximo).toBe(40)
  })

  it('literal c: cuatro o más, con excepción admitida', () => {
    const r = reglaArticulo32(4)!
    expect(r.literal).toBe('c')
    expect(r.parciales).toBe(4)
    expect(r.pesoMinimo).toBe(10)
    expect(r.pesoMaximo).toBe(35)
    expect(r.admiteExcepcion).toBe(true)
  })

  it('una materia de cero créditos no tiene regla', () => {
    expect(reglaArticulo32(0)).toBeNull()
  })
})

describe('Artículo 32 · discrepancias', () => {
  it('un plan conforme no genera avisos', () => {
    const p = plan(parcial(25), parcial(25), parcial(25), parcial(25))
    expect(validarArticulo32(p, 4)).toEqual([])
  })

  it('una materia de 4 U.C. con 3 parciales avisa y menciona la excepción', () => {
    const p = plan(parcial(30), parcial(35), parcial(35))
    const d = validarArticulo32(p, 4)
    const numero = d.find((x) => x.tipo === 'numero-de-parciales')
    expect(numero).toMatchObject({
      literal: 'c',
      esperados: 4,
      declarados: 3,
      admiteExcepcion: true,
    })
  })

  it('señala el parcial concreto que se pasa de ponderación', () => {
    const p = plan(parcial(50), parcial(25), parcial(25))
    const d = validarArticulo32(p, 3)
    const peso = d.filter((x) => x.tipo === 'peso-fuera-de-norma')
    expect(peso).toHaveLength(1)
    expect(peso[0]).toMatchObject({ tipo: 'peso-fuera-de-norma', indice: 0, maximo: 40 })
  })

  it('una materia de cero créditos no genera avisos', () => {
    expect(validarArticulo32(plan(parcial(100)), 0)).toEqual([])
  })

  it('avisar nunca impide calcular', () => {
    // El mismo plan que dispara avisos sigue produciendo definitiva.
    const p = plan(parcial(50, 6), parcial(25, 6), parcial(25, 6))
    expect(validarArticulo32(p, 3).length).toBeGreaterThan(0)
    expect(definitiva(p)).toBe(6)
  })
})

describe('plan sugerido', () => {
  it('cuatro créditos: cuatro parciales de 25', () => {
    const p = planSugerido('x', 4)
    expect(p.parciales.map((q) => q.peso)).toEqual([25, 25, 25, 25])
  })

  it('un crédito: dos parciales de 50', () => {
    expect(planSugerido('x', 1).parciales.map((q) => q.peso)).toEqual([50, 50])
  })

  it('tres créditos: reparto que suma exactamente 100', () => {
    const p = planSugerido('x', 3)
    expect(p.parciales).toHaveLength(3)
    expect(sumaDePonderaciones(p).completo).toBe(true)
  })

  it('cero créditos: sin parciales', () => {
    expect(planSugerido('x', 0).parciales).toEqual([])
  })

  it('lo sugerido siempre cumple el Artículo 32', () => {
    for (const uc of [1, 2, 3, 4, 5]) {
      expect(validarArticulo32(planSugerido('x', uc), uc)).toEqual([])
    }
  })
})

// ─── Cálculo de la definitiva ───────────────────────────────────────────────

describe('aporte ponderado · Artículo 40', () => {
  it('nota por ponderación', () => {
    expect(aportePonderado(parcial(30, 6))).toBe(1.8)
  })

  it('se aproxima a dos decimales', () => {
    // 7,5 × 33,33 % = 2,49975 → 2,50
    expect(aportePonderado(parcial(33.33, 7.5))).toBe(2.5)
  })

  it('un NP aporta cero y no devuelve su peso', () => {
    expect(aportePonderado(parcial(40, null, true))).toBe(0)
  })

  it('un pendiente no aporta', () => {
    expect(aportePonderado(parcial(40))).toBe(0)
  })
})

describe('definitiva · Artículos 39 y 41', () => {
  it('el ejemplo de 30/30/40 con 6,0 · 7,5 · 5,0 da 6', () => {
    const p = plan(parcial(30, 6), parcial(30, 7.5), parcial(40, 5))
    expect(acumulado(p)).toBe(6.05)
    expect(definitiva(p)).toBe(6)
  })

  it('cincuenta centésimas suben: 4,50 aprueba', () => {
    expect(definitivaDeSuma(4.5)).toBe(5)
  })

  it('cuarenta y nueve centésimas no suben: 4,49 reprueba', () => {
    expect(definitivaDeSuma(4.49)).toBe(4)
  })

  it('la escala se acota por arriba', () => {
    expect(definitivaDeSuma(9)).toBe(9)
    expect(definitivaDeSuma(8.6)).toBe(9)
  })

  it('todas NP dan 1, sin caso especial', () => {
    // Art. 31 P.2 sale del acotado inferior: la suma es 0 y la escala empieza en 1.
    const p = plan(parcial(50, null, true), parcial(50, null, true))
    expect(acumulado(p)).toBe(0)
    expect(definitiva(p)).toBe(1)
  })

  it('un NP arrastra su ponderación a cero', () => {
    // 9,0 en la mitad y NP en la otra: 4,50 → 5. Justo en la frontera.
    const p = plan(parcial(50, 9), parcial(50, null, true))
    expect(acumulado(p)).toBe(4.5)
    expect(definitiva(p)).toBe(5)
  })

  it('sin ponderaciones completas no hay definitiva', () => {
    expect(definitiva(plan(parcial(40, 6), parcial(50, 6)))).toBeNull()
  })

  it('con parciales pendientes tampoco: eso es proyección', () => {
    expect(definitiva(plan(parcial(50, 6), parcial(50)))).toBeNull()
  })
})

describe('cuánto falta', () => {
  it('el umbral para aprobar es 4,50 y no 5,00', () => {
    expect(necesarioPara(plan(parcial(100)), 5).umbral).toBe(4.5)
  })

  it('el necesario se redondea hacia arriba a la décima', () => {
    // 3,0 × 50 % = 1,50 → (4,50 − 1,50) / 0,50 = 6,0 exacto, sin resto
    const p = plan(parcial(50, 3), parcial(50))
    expect(necesarioPara(p, 5).nota).toBe(6)

    // Un caso con resto: 40 % con 5,0 → 2,00; queda 60 %.
    // (4,50 − 2,00) / 0,60 = 4,1666… → 4,2
    const q = plan(parcial(40, 5), parcial(60))
    expect(necesarioPara(q, 5).nota).toBe(4.2)
  })

  it('ya asegurada: ni con la mínima se pierde', () => {
    const p = plan(parcial(80, 8), parcial(20))
    const n = necesarioPara(p, 5)
    expect(n.desenlace).toBe('asegurado')
  })

  it('ya no alcanza: ni con 9,0 se llega', () => {
    const p = plan(parcial(80, 1), parcial(20))
    const n = necesarioPara(p, 5)
    expect(n.desenlace).toBe('inalcanzable')
    expect(n.nota).toBeNull()
  })

  it('en juego: informa la calificación mínima', () => {
    const p = plan(parcial(60, 5), parcial(40))
    const n = necesarioPara(p, 5)
    expect(n.desenlace).toBe('en-juego')
    expect(n.nota).toBeGreaterThan(1)
    expect(n.nota).toBeLessThanOrEqual(9)
  })

  it('sin pendientes no hay nada que calcular', () => {
    const p = plan(parcial(50, 6), parcial(50, 6))
    expect(necesarioPara(p, 5).nota).toBeNull()
    expect(necesarioPara(p, 5).desenlace).toBe('asegurado')
    expect(necesarioPara(p, 9).desenlace).toBe('inalcanzable')
  })

  it('la tabla cubre los objetivos de 5 a 9', () => {
    const t = tablaDeObjetivos(plan(parcial(50, 6), parcial(50)))
    expect(t.map((x) => x.objetivo)).toEqual([5, 6, 7, 8, 9])
  })
})

describe('rango alcanzable', () => {
  it('se abre con lo pendiente', () => {
    const r = rangoAlcanzable(plan(parcial(50, 6), parcial(50)))
    expect(r.minima).toBeLessThan(r.maxima)
  })

  it('se cierra cuando todo está evaluado', () => {
    const p = plan(parcial(50, 6), parcial(50, 6))
    const r = rangoAlcanzable(p)
    expect(r.minima).toBe(r.maxima)
    expect(r.minima).toBe(definitiva(p))
  })
})

describe('resultado completo', () => {
  it('reúne todo de una pasada', () => {
    const p = plan(parcial(30, 6), parcial(30, 7.5), parcial(40, 5))
    const r = evaluar(p)
    expect(r.acumulado).toBe(6.05)
    expect(r.definitiva).toBe(6)
    expect(r.planCompleto).toBe(true)
    expect(r.pesoPendiente).toBe(0)
    expect(r.objetivos).toHaveLength(5)
  })

  it('marca el plan incompleto sin inventar definitiva', () => {
    const r = evaluar(plan(parcial(40, 6), parcial(50, 6)))
    expect(r.planCompleto).toBe(false)
    expect(r.definitiva).toBeNull()
  })

  it('peso pendiente solo cuenta lo no evaluado', () => {
    const p = plan(parcial(30, 6), parcial(30, null, true), parcial(40))
    expect(pesoPendiente(p)).toBe(40)
  })
})
