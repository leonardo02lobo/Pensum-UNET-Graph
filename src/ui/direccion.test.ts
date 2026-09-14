import { describe, expect, it } from 'vitest'
import {
  DIRECCION_INICIAL,
  escribirDireccion,
  hayFiltros,
  leerDireccion,
  sinFiltros,
  type Direccion,
} from './direccion'

describe('leerDireccion · vistas', () => {
  it('el fragmento vacío es el grafo', () => {
    expect(leerDireccion('')).toEqual(DIRECCION_INICIAL)
  })

  it('reconoce las tres vistas', () => {
    expect(leerDireccion('#/grafo').vista).toBe('grafo')
    expect(leerDireccion('#/plan').vista).toBe('plan')
    expect(leerDireccion('#/calculadora').vista).toBe('calculadora')
  })

  it('«#/» es el grafo, como antes de este cambio', () => {
    expect(leerDireccion('#/').vista).toBe('grafo')
  })

  it('un fragmento desconocido cae en el grafo, sin error', () => {
    expect(leerDireccion('#/basura').vista).toBe('grafo')
    expect(leerDireccion('#loquesea').vista).toBe('grafo')
  })

  it('los enlaces anteriores a este cambio se comportan igual', () => {
    // `#/grafo` y `#/calculadora` ya circulan; no pueden romperse.
    for (const f of ['', '#/', '#/grafo', '#/calculadora']) {
      const d = leerDireccion(f)
      expect(d.materia).toBeNull()
      expect(hayFiltros(d)).toBe(false)
    }
    expect(leerDireccion('#/calculadora').vista).toBe('calculadora')
  })
})

describe('leerDireccion · materia', () => {
  it('toma la materia del segundo segmento', () => {
    expect(leerDireccion('#/grafo/425401').materia).toBe('425401')
    expect(leerDireccion('#/calculadora/425401').materia).toBe('425401')
  })

  it('acepta los ids en kebab-case del dataset', () => {
    expect(leerDireccion('#/grafo/tap-tesis').materia).toBe('tap-tesis')
    expect(leerDireccion('#/plan/electiva-1').materia).toBe('electiva-1')
  })

  it('sin segundo segmento no hay materia', () => {
    expect(leerDireccion('#/grafo').materia).toBeNull()
  })

  it('no saca materia de una vista que no reconoce', () => {
    // Sin esto, `#/basura/425401` seleccionaría una materia por accidente.
    expect(leerDireccion('#/basura/425401').materia).toBeNull()
  })

  it('descodifica el identificador', () => {
    expect(leerDireccion('#/grafo/a%20b').materia).toBe('a b')
  })
})

describe('leerDireccion · filtros, con validación tolerante', () => {
  it('lee los tres filtros', () => {
    const d = leerDireccion('#/grafo?sector=programacion&estado=disponible&semestre=4')
    expect(d.sector).toBe('programacion')
    expect(d.estado).toBe('disponible')
    expect(d.semestre).toBe(4)
  })

  it('un sector inexistente se descarta sin arrastrar al resto', () => {
    const d = leerDireccion('#/grafo?sector=inventado&estado=disponible')
    expect(d.sector).toBeNull()
    expect(d.estado).toBe('disponible')
  })

  it('un estado inexistente se descarta sin arrastrar al resto', () => {
    const d = leerDireccion('#/grafo?estado=inventado&sector=programacion')
    expect(d.estado).toBeNull()
    expect(d.sector).toBe('programacion')
  })

  it('rechaza semestres que no son enteros positivos', () => {
    for (const v of ['0', '-1', '4.5', '04', '4abc', 'cuatro', '']) {
      expect(leerDireccion(`#/grafo?semestre=${v}`).semestre).toBeNull()
    }
  })

  it('acepta los diez semestres', () => {
    for (let s = 1; s <= 10; s++) {
      expect(leerDireccion(`#/grafo?semestre=${s}`).semestre).toBe(s)
    }
  })

  it('un filtro inválido no invalida la materia', () => {
    const d = leerDireccion('#/grafo/425401?sector=inventado')
    expect(d.materia).toBe('425401')
    expect(d.sector).toBeNull()
  })

  it('una consulta vacía no rompe', () => {
    expect(leerDireccion('#/grafo?')).toEqual({ ...DIRECCION_INICIAL, vista: 'grafo' })
  })
})

describe('escribirDireccion', () => {
  it('omite los parámetros que no están activos', () => {
    expect(escribirDireccion(DIRECCION_INICIAL)).toBe('#/grafo')
  })

  it('el caso frecuente se lee bien', () => {
    const d: Direccion = { ...DIRECCION_INICIAL, materia: '425401' }
    expect(escribirDireccion(d)).toBe('#/grafo/425401')
  })

  it('escribe los filtros activos', () => {
    const d: Direccion = {
      vista: 'plan',
      materia: null,
      sector: null,
      estado: 'disponible',
      semestre: null,
    }
    expect(escribirDireccion(d)).toBe('#/plan?estado=disponible')
  })

  it('escribe materia y filtros juntos', () => {
    const d: Direccion = {
      vista: 'grafo',
      materia: '425401',
      sector: 'programacion',
      estado: null,
      semestre: 4,
    }
    expect(escribirDireccion(d)).toBe('#/grafo/425401?sector=programacion&semestre=4')
  })
})

describe('ida y vuelta', () => {
  const casos = [
    '#/grafo',
    '#/plan',
    '#/calculadora',
    '#/grafo/425401',
    '#/calculadora/tap-tesis',
    '#/plan?estado=disponible',
    '#/grafo?sector=programacion&semestre=4',
    '#/grafo/425401?sector=programacion&estado=disponible&semestre=4',
  ]

  it('escribir lo leído devuelve el mismo fragmento', () => {
    for (const f of casos) {
      expect(escribirDireccion(leerDireccion(f))).toBe(f)
    }
  })

  it('es estable: aplicarlo dos veces no cambia nada', () => {
    for (const f of casos) {
      const una = escribirDireccion(leerDireccion(f))
      const dos = escribirDireccion(leerDireccion(una))
      expect(dos).toBe(una)
    }
  })

  it('normaliza lo ilegible a algo estable', () => {
    for (const f of ['', '#/', '#/basura', '#/grafo?sector=inventado']) {
      const una = escribirDireccion(leerDireccion(f))
      expect(escribirDireccion(leerDireccion(una))).toBe(una)
    }
  })
})

describe('hayFiltros y sinFiltros', () => {
  it('detecta cada filtro por separado', () => {
    expect(hayFiltros(DIRECCION_INICIAL)).toBe(false)
    expect(hayFiltros({ ...DIRECCION_INICIAL, sector: 'programacion' })).toBe(true)
    expect(hayFiltros({ ...DIRECCION_INICIAL, estado: 'disponible' })).toBe(true)
    expect(hayFiltros({ ...DIRECCION_INICIAL, semestre: 4 })).toBe(true)
  })

  it('limpiar conserva vista y materia', () => {
    const d: Direccion = {
      vista: 'plan',
      materia: '425401',
      sector: 'programacion',
      estado: 'disponible',
      semestre: 4,
    }
    const limpia = sinFiltros(d)
    expect(hayFiltros(limpia)).toBe(false)
    expect(limpia.vista).toBe('plan')
    expect(limpia.materia).toBe('425401')
  })
})
