import { describe, expect, it } from 'vitest'
import { pensum } from '../data/pensum'
import { construirGrafo } from '../model/graph'
import {
  detalleIndice,
  estaAprobada,
  evaluarCompuerta,
  indiceAcumulado,
  notaEfectiva,
  notasComputables,
  redondearNormativo,
  resumen,
  ucAprobadas,
  umbralNormativo,
} from './indice'
import { estadoDeMateria, estadosDeTodas, materiasDisponibles } from './estados'
import {
  otorgaCreditos,
  pesaEnIndice,
  type Historial,
  type Intento,
  esNotaValida,
} from './tipos'

const grafo = construirGrafo(pensum)
const materias = grafo.materias

const regular = (nota: number): Intento => ({ tipo: 'regular', nota })
const equivalencia = (): Intento => ({ tipo: 'equivalencia', nota: null })
const suficiencia = (nota: number): Intento => ({ tipo: 'suficiencia', nota })
const retiro = (nota: number | null, desincorporado: boolean): Intento => ({
  tipo: 'retiro',
  nota,
  desincorporado,
})
const enCurso = (): Intento => ({ tipo: 'en-curso', nota: null })

describe('las dos banderas de cada intento', () => {
  it('regular aprobado otorga crédito y pesa', () => {
    expect(otorgaCreditos(regular(5))).toBe(true)
    expect(pesaEnIndice(regular(5))).toBe(true)
  })

  it('regular reprobado no otorga crédito pero sí pesa (Art. 47a)', () => {
    expect(otorgaCreditos(regular(4))).toBe(false)
    expect(pesaEnIndice(regular(4))).toBe(true)
  })

  it('equivalencia otorga crédito y no pesa (Art. 48)', () => {
    expect(otorgaCreditos(equivalencia())).toBe(true)
    expect(pesaEnIndice(equivalencia())).toBe(false)
  })

  it('suficiencia aprobada otorga crédito y pesa (Art. 37 P.2)', () => {
    expect(otorgaCreditos(suficiencia(7))).toBe(true)
    expect(pesaEnIndice(suficiencia(7))).toBe(true)
  })

  it('suficiencia reprobada no hace ninguna de las dos (Art. 37 P.3)', () => {
    expect(otorgaCreditos(suficiencia(3))).toBe(false)
    expect(pesaEnIndice(suficiencia(3))).toBe(false)
  })

  it('retiro con desincorporación no afecta nada (Art. 21 P.1a)', () => {
    expect(otorgaCreditos(retiro(3, true))).toBe(false)
    expect(pesaEnIndice(retiro(3, true))).toBe(false)
  })

  it('retiro sin desincorporación no da crédito pero sí pesa (Art. 21 P.1b)', () => {
    expect(otorgaCreditos(retiro(3, false))).toBe(false)
    expect(pesaEnIndice(retiro(3, false))).toBe(true)
  })

  it('en curso no afecta nada', () => {
    expect(otorgaCreditos(enCurso())).toBe(false)
    expect(pesaEnIndice(enCurso())).toBe(false)
  })

  it('la escala solo admite enteros de 1 a 9', () => {
    expect(esNotaValida(5)).toBe(true)
    expect(esNotaValida(1)).toBe(true)
    expect(esNotaValida(9)).toBe(true)
    expect(esNotaValida(0)).toBe(false)
    expect(esNotaValida(10)).toBe(false)
    expect(esNotaValida(20)).toBe(false)
    expect(esNotaValida(6.5)).toBe(false)
  })
})

describe('nota efectiva — Artículo 49', () => {
  it('un solo intento devuelve su nota', () => {
    expect(notaEfectiva([regular(7)])).toBe(7)
  })

  it('el segundo intento elimina al primero', () => {
    expect(notaEfectiva([regular(3), regular(6)])).toBe(6)
  })

  it('a la tercera se promedian todos menos el primero', () => {
    // NO es 6 (la última) ni 4.33 (el promedio de las tres).
    expect(notaEfectiva([regular(3), regular(4), regular(6)])).toBe(5)
  })

  it('a la cuarta, igual', () => {
    expect(notaEfectiva([regular(3), regular(4), regular(6), regular(8)])).toBe(6)
  })

  it('un retiro con desincorporación no gasta una vez cursada', () => {
    // Solo hay dos intentos computables, así que el segundo elimina al primero.
    expect(notaEfectiva([regular(3), retiro(1, true), regular(8)])).toBe(8)
  })

  it('un retiro sin desincorporación sí cuenta como vez cursada', () => {
    // Tres computables: promedio de (2, 8) = 5.
    expect(notaEfectiva([regular(3), retiro(2, false), regular(8)])).toBe(5)
  })

  it('sin intentos computables no hay nota efectiva', () => {
    expect(notaEfectiva([])).toBeNull()
    expect(notaEfectiva([enCurso()])).toBeNull()
    expect(notaEfectiva([equivalencia()])).toBeNull()
  })

  it('solo se computan las notas que pesan', () => {
    expect(notasComputables([regular(3), equivalencia(), regular(7)])).toEqual([3, 7])
  })
})

describe('redondeo — Artículo 55', () => {
  it('cinco milésimas suben, donde toFixed falla', () => {
    // (6.715).toFixed(2) devuelve "6.71" en JavaScript.
    expect((6.715).toFixed(2)).toBe('6.71')
    expect(redondearNormativo(6.715)).toBe(6.72)
  })

  it('menos de cinco milésimas bajan', () => {
    // A tres decimales es 6.714; sus milésimas no llegan a cinco.
    expect(redondearNormativo(6.7139)).toBe(6.71)
  })

  it('el redondeo en dos pasos cambia el resultado', () => {
    // 6.7149 → 6.715 (3 dec) → 6.72 (2 dec).
    // De una sola vez a dos decimales daría 6.71, que es incorrecto.
    expect(redondearNormativo(6.7149)).toBe(6.72)
    expect(Math.round(6.7149 * 100) / 100).toBe(6.71)
  })

  it('un valor ya exacto no cambia', () => {
    expect(redondearNormativo(5.1)).toBe(5.1)
    expect(redondearNormativo(7)).toBe(7)
  })
})

describe('índice acumulado — Artículo 47', () => {
  it('el ejemplo del primer semestre da 6,71', () => {
    const h: Historial = {
      '412101': [regular(7)], // 1 UC
      '415102': [regular(8)], // 3 UC
      '834102': [regular(6)], // 3 UC
      '826101': [regular(5)], // 4 UC
      '1033101': [regular(8)], // 2 UC
      '1032109T': [regular(9)], // 1 UC
    }
    const d = detalleIndice(h, materias)
    expect(d.ucComputadas).toBe(14)
    expect(d.crudo).toBeCloseTo(94 / 14, 10)
    expect(d.indice).toBe(6.71)
  })

  it('las materias reprobadas pesan en el denominador y el numerador', () => {
    // Física II: 4 UC, reprobada con 3.
    const d = detalleIndice({ '846302': [regular(3)] }, materias)
    expect(d.ucComputadas).toBe(4)
    expect(d.indice).toBe(3)
  })

  it('las equivalencias no entran al índice', () => {
    const d = detalleIndice({ '826101': [equivalencia()] }, materias)
    expect(d.materiasComputadas).toBe(0)
    expect(d.indice).toBeNull()
  })

  it('historial vacío no tiene índice, y no devuelve cero', () => {
    expect(indiceAcumulado({}, materias)).toBeNull()
  })

  it('una materia de cero créditos no altera el índice', () => {
    const base = { '826101': [regular(7)] } // 4 UC
    const con = { ...base, '1000001': [regular(9)] } // Servicio Comunitario, 0 UC
    expect(indiceAcumulado(con, materias)).toBe(indiceAcumulado(base, materias))
  })

  it('no divide por cero si solo hay materias de cero créditos', () => {
    expect(indiceAcumulado({ '1000001': [regular(9)] }, materias)).toBeNull()
  })
})

describe('unidades de crédito aprobadas', () => {
  it('cuenta las aprobadas y no las reprobadas', () => {
    const h: Historial = {
      '415102': [regular(7)], // 3 UC, aprobada
      '826101': [regular(3)], // 4 UC, reprobada
    }
    expect(ucAprobadas(h, materias)).toBe(3)
  })

  it('la equivalencia suma crédito aunque no índice', () => {
    const h: Historial = { '826101': [equivalencia()] } // 4 UC
    expect(ucAprobadas(h, materias)).toBe(4)
    expect(indiceAcumulado(h, materias)).toBeNull()
  })

  it('una materia repetida y aprobada cuenta sus créditos una sola vez', () => {
    const h: Historial = { '826101': [regular(3), regular(4), regular(7)] }
    expect(ucAprobadas(h, materias)).toBe(4)
  })

  it('la suficiencia reprobada no acredita', () => {
    expect(ucAprobadas({ '826101': [suficiencia(3)] }, materias)).toBe(0)
  })
})

describe('compuertas contra el avance real', () => {
  const electiva = materias.get('electiva-1')!
  const tap = materias.get('tap-tesis')!

  it('cumplida cuando se supera el umbral', () => {
    expect(evaluarCompuerta(electiva, 95)).toEqual({ cumplida: true, faltan: 0, umbral: 90 })
  })

  it('pendiente informa cuánto falta', () => {
    expect(evaluarCompuerta(electiva, 78)).toEqual({ cumplida: false, faltan: 12, umbral: 90 })
  })

  it('el umbral por porcentaje se resuelve sobre las 155 U.C.', () => {
    expect(evaluarCompuerta(tap, 0)?.umbral).toBe(143) // 80 % de 178
  })

  it('una materia sin compuerta devuelve null', () => {
    expect(evaluarCompuerta(materias.get('425401')!, 0)).toBeNull()
  })
})

describe('umbrales normativos', () => {
  it('por debajo de 3,60 pierde la inscripción (Art. 51)', () => {
    expect(umbralNormativo(3.59)).toBe('pierde-inscripcion')
  })

  it('entre 3,60 y 5,09 es insuficiente para graduarse', () => {
    expect(umbralNormativo(3.6)).toBe('insuficiente')
    expect(umbralNormativo(5.09)).toBe('insuficiente')
  })

  it('desde 5,10 es apto para graduarse (Art. 54)', () => {
    expect(umbralNormativo(5.1)).toBe('apto')
    expect(umbralNormativo(6.0)).toBe('apto')
  })

  it('por encima de 6,00 opta al cuadro de honor', () => {
    expect(umbralNormativo(6.01)).toBe('cuadro-de-honor')
  })

  it('sin índice se dice sin índice', () => {
    expect(umbralNormativo(null)).toBe('sin-indice')
  })
})

describe('estados derivados', () => {
  it('con historial vacío, el primer semestre está disponible', () => {
    const estados = estadosDeTodas({}, grafo)
    expect(estados.get('415102')).toBe('disponible')
    expect(estados.get('826101')).toBe('disponible')
    // Y lo que depende de ellas, no.
    expect(estados.get('416202')).toBe('bloqueada-prelacion')
  })

  it('aprobar una materia libera a sus dependientes', () => {
    const h: Historial = { '834102': [regular(7)], '415102': [regular(7)] }
    expect(estadoDeMateria('416202', h, grafo, ucAprobadas(h, materias))).toBe('disponible')
  })

  it('una prelación pendiente basta para bloquear', () => {
    // Programación I necesita Matemática Discreta Y Computación I.
    const h: Historial = { '834102': [regular(7)] }
    expect(estadoDeMateria('416202', h, grafo, ucAprobadas(h, materias))).toBe(
      'bloqueada-prelacion',
    )
  })

  it('la compuerta sin alcanzar bloquea por crédito, no por prelación', () => {
    // Electiva I no tiene prelaciones: solo le falta el crédito.
    expect(estadoDeMateria('electiva-1', {}, grafo, 0)).toBe('bloqueada-credito')
    expect(estadoDeMateria('electiva-1', {}, grafo, 90)).toBe('disponible')
  })

  it('la prelación manda sobre la compuerta al reportar el bloqueo', () => {
    // Ecología necesita Química General I y 100 U.C.
    expect(estadoDeMateria('1123403', {}, grafo, 0)).toBe('bloqueada-prelacion')
    const h: Historial = { '914201': [regular(7)] }
    expect(estadoDeMateria('1123403', h, grafo, 0)).toBe('bloqueada-credito')
    expect(estadoDeMateria('1123403', h, grafo, 100)).toBe('disponible')
  })

  it('una materia aprobada se reporta aprobada', () => {
    expect(estadoDeMateria('826101', { '826101': [regular(6)] }, grafo, 4)).toBe('aprobada')
  })

  it('en curso se reporta en curso', () => {
    expect(estadoDeMateria('826101', { '826101': [enCurso()] }, grafo, 0)).toBe('en-curso')
  })

  it('todas las materias reciben estado', () => {
    expect(estadosDeTodas({}, grafo).size).toBe(materias.size)
  })

  it('la frontera de disponibles es consultable', () => {
    const disponibles = materiasDisponibles({}, grafo)
    expect(disponibles).toContain('415102')
    expect(disponibles).not.toContain('425901')
  })

  it('materia desconocida lanza error explícito', () => {
    expect(() => estadoDeMateria('no-existe', {}, grafo, 0)).toThrow(/desconocida/)
  })
})

describe('resumen para la cabecera', () => {
  it('reúne índice, umbral y avance', () => {
    const h: Historial = { '415102': [regular(8)], '826101': [regular(6)] }
    const r = resumen(h, materias)
    expect(r.ucAprobadas).toBe(7)
    expect(r.ucTotales).toBe(178)
    expect(r.avance).toBeCloseTo(7 / 178, 10)
    expect(r.indice).toBe(6.86) // (8*3 + 6*4) / 7 = 6.857…
    expect(r.umbral).toBe('cuadro-de-honor')
  })

  it('sin historial no inventa un cero', () => {
    const r = resumen({}, materias)
    expect(r.indice).toBeNull()
    expect(r.umbral).toBe('sin-indice')
    expect(r.ucAprobadas).toBe(0)
  })
})

describe('estaAprobada', () => {
  it('es verdadera con cualquier intento que acredite', () => {
    expect(estaAprobada({ '826101': [regular(3), regular(7)] }, '826101')).toBe(true)
    expect(estaAprobada({ '826101': [regular(3)] }, '826101')).toBe(false)
    expect(estaAprobada({}, '826101')).toBe(false)
  })
})
