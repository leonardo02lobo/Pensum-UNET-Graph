import { describe, expect, it } from 'vitest'
import { pensum } from '../data/pensum'
import {
  aristas,
  buscar,
  clasificarArista,
  conoAncestros,
  conoDescendientes,
  construirGrafo,
  correquisitosDe,
  desbloqueaDirecto,
  ordenTopologico,
  prelacionesDirectas,
  profundidad,
  profundidadMaxima,
} from './graph'

const g = construirGrafo(pensum)

describe('construcción del grafo', () => {
  it('la arista de prelación va de requisito a materia', () => {
    expect(g.dag.hasDirectedEdge('424301', '425401')).toBe(true)
    expect(g.dag.hasDirectedEdge('425401', '424301')).toBe(false)
  })

  it('los correquisitos no entran al DAG y el orden topológico existe', () => {
    expect(g.dag.hasEdge('846203', '842204L')).toBe(false)
    expect(g.dag.hasEdge('842204L', '846203')).toBe(false)
    expect(ordenTopologico(g)).toHaveLength(pensum.materias.length)
  })

  it('los correquisitos se recogen una sola vez por par', () => {
    expect(g.correquisitos).toHaveLength(2)
    expect(correquisitosDe(g, '846203')).toEqual(['842204L'])
    expect(correquisitosDe(g, '842204L')).toEqual(['846203'])
  })

  it('las compuertas no añaden aristas', () => {
    const totalPrelaciones = pensum.materias.reduce((n, m) => n + m.prelaciones.length, 0)
    expect(g.dag.size).toBe(totalPrelaciones)
  })

  it('todas las materias son nodos', () => {
    expect(g.dag.order).toBe(pensum.materias.length)
  })
})

describe('cono de ancestros', () => {
  it('el cono de Ingeniería del Software alcanza toda su cadena', () => {
    const cono = conoAncestros(g, '425901')
    for (const id of [
      '425801',
      '425802',
      '425705',
      '425702',
      '425601',
      '425602',
      '425501',
      '426502',
      '425401',
      '424301',
      '416202',
      '415102',
      '834102',
    ]) {
      expect(cono.materias).toContain(id)
    }
    // No se incluye a sí misma.
    expect(cono.materias).not.toContain('425901')
  })

  it('una materia sin prelaciones tiene cono vacío', () => {
    const cono = conoAncestros(g, '415102')
    expect(cono.materias).toEqual([])
    expect(cono.aristas).toEqual([])
  })

  it('la compuerta se devuelve aparte, no como nodo del cono', () => {
    const cono = conoAncestros(g, '1123403')
    expect(cono.materias).toEqual(['914201'])
    expect(cono.gate).toEqual({ kind: 'uc', uc: 100 })
  })

  it('las materias con solo compuerta tienen cono vacío pero gate presente', () => {
    const cono = conoAncestros(g, 'electiva-1')
    expect(cono.materias).toEqual([])
    expect(cono.gate).toEqual({ kind: 'uc', uc: 90 })
  })
})

describe('cono de descendientes', () => {
  it('Programación II desbloquea tres materias directas y alcanza Ingeniería del Software', () => {
    expect(desbloqueaDirecto(g, '425401').sort()).toEqual([
      '425501',
      '426502',
      'automatizacion',
    ])
    expect(conoDescendientes(g, '425401').materias).toContain('425901')
  })

  it('Ingeniería del Software es terminal', () => {
    expect(conoDescendientes(g, '425901').materias).toEqual([])
  })
})

describe('orden topológico y profundidad', () => {
  it('el orden topológico respeta todas las prelaciones', () => {
    const orden = ordenTopologico(g)
    const posicion = new Map(orden.map((id, i) => [id, i]))
    for (const m of pensum.materias) {
      for (const p of m.prelaciones) {
        expect(posicion.get(p)!).toBeLessThan(posicion.get(m.id)!)
      }
    }
  })

  it('la profundidad máxima es 8, en Ingeniería del Software', () => {
    expect(profundidadMaxima(g)).toBe(8)
    expect(profundidad(g, '425901')).toBe(8)
  })

  it('una materia raíz tiene profundidad 0', () => {
    expect(profundidad(g, '826101')).toBe(0)
  })
})

describe('clasificación de aristas', () => {
  it('Química → Ecología es intra-sector', () => {
    expect(clasificarArista(g, '914201', '1123403')).toBe('intra-sector')
  })

  it('Programación II → Base de Datos I cruza brazos', () => {
    expect(clasificarArista(g, '425401', '425501')).toBe('cruce-sector')
  })

  it('las tres salidas de Programación II cruzan brazos', () => {
    const salidas = desbloqueaDirecto(g, '425401')
    expect(salidas).toHaveLength(3)
    for (const s of salidas) {
      expect(clasificarArista(g, '425401', s)).toBe('cruce-sector')
    }
  })

  it('toda arista queda clasificada', () => {
    for (const a of aristas(g)) {
      expect(['intra-sector', 'cruce-sector']).toContain(a.tipo)
    }
  })
})

describe('búsqueda', () => {
  it('encuentra las cinco Matemáticas escribiendo sin tilde', () => {
    const r = buscar(g, 'matematica').map((m) => m.nombre).sort()
    expect(r).toEqual([
      'Matemática Discreta',
      'Matemática I',
      'Matemática II',
      'Matemática III',
      'Matemática IV',
    ])
  })

  it('encuentra por código', () => {
    // El código vigente en Control de Estudios, no el que tenía el dataset.
    expect(buscar(g, '0415405T').map((m) => m.nombre)).toEqual(['Programación II'])
  })

  it('es insensible a mayúsculas', () => {
    expect(buscar(g, 'PROGRAMACION II').map((m) => m.id)).toEqual(['425401'])
  })

  it('sin resultados devuelve lista vacía sin lanzar', () => {
    expect(buscar(g, 'zzzz')).toEqual([])
    expect(buscar(g, '   ')).toEqual([])
  })
})

describe('consultas para el panel', () => {
  it('prelaciones directas de Ingeniería del Software', () => {
    expect(prelacionesDirectas(g, '425901').sort()).toEqual(['425801', '425802'])
  })

  it('materia desconocida lanza error explícito', () => {
    expect(() => conoAncestros(g, 'no-existe')).toThrow(/desconocida/)
  })
})
