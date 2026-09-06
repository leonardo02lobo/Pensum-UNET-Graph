import { describe, expect, it } from 'vitest'
import { pensum } from './pensum'
import { CONTEO_POR_SECTOR, TOTAL_MATERIAS, TOTAL_SECTORIZADAS, validarPensum } from './validate'
import { SECTORES, UC_TOTALES, gateEnUC } from './types'
import type { Materia } from './types'

const materias = pensum.materias
const porId = new Map(materias.map((m) => [m.id, m]))

function get(id: string): Materia {
  const m = porId.get(id)
  if (!m) throw new Error(`Materia no encontrada: ${id}`)
  return m
}

describe('validación de integridad', () => {
  it('el dataset curado pasa todas las reglas', () => {
    const problemas = validarPensum(pensum)
    expect(problemas.map((p) => `[${p.regla}] ${p.mensaje}`)).toEqual([])
  })

  it('reporta 68 materias', () => {
    expect(materias).toHaveLength(TOTAL_MATERIAS)
  })

  it('detecta un id huérfano', () => {
    const roto = {
      ...pensum,
      materias: [...materias, { ...get('425401'), id: 'x', prelaciones: ['no-existe'] }],
    }
    const problemas = validarPensum(roto)
    expect(problemas.some((p) => p.regla === 'referencias-resueltas')).toBe(true)
  })

  it('detecta un ciclo', () => {
    const roto = {
      ...pensum,
      materias: materias.map((m) =>
        m.id === '424301' ? { ...m, prelaciones: ['425401'] } : m,
      ),
    }
    const problemas = validarPensum(roto)
    expect(problemas.some((p) => p.regla === 'sin-ciclos')).toBe(true)
  })

  it('detecta una prelación temporalmente incoherente', () => {
    const roto = {
      ...pensum,
      materias: materias.map((m) => (m.id === '424301' ? { ...m, semestre: 1 } : m)),
    }
    const problemas = validarPensum(roto)
    expect(problemas.some((p) => p.regla === 'coherencia-temporal')).toBe(true)
  })

  it('detecta un correquisito asimétrico', () => {
    const roto = {
      ...pensum,
      materias: materias.map((m) => (m.id === '842204L' ? { ...m, correquisitos: [] } : m)),
    }
    const problemas = validarPensum(roto)
    expect(problemas.some((p) => p.regla === 'simetria-correquisitos')).toBe(true)
  })

  it('detecta un id duplicado', () => {
    const roto = { ...pensum, materias: [...materias, get('425401')] }
    const problemas = validarPensum(roto)
    expect(problemas.some((p) => p.regla === 'ids-unicos')).toBe(true)
  })
})

describe('esquema de materia', () => {
  it('Programación II tiene los campos de la spec', () => {
    const m = get('425401')
    // El id no cambia nunca — es la clave del historial persistido. El código
    // sí, y ahora es el vigente en Control de Estudios.
    expect(m.id).toBe('425401')
    expect(m.codigo).toBe('0415405T')
    expect(m.semestre).toBe(4)
    expect(m.uc).toBe(3)
    expect(m.sector).toBe('programacion')
    expect(m.prelaciones).toEqual(['424301'])
    expect(m.correquisitos).toEqual([])
    expect(m.gate).toBeNull()
  })

  it('las materias sin código en ninguna fuente llevan id kebab-case', () => {
    const sinCodigo = materias.filter((m) => m.codigo === null)
    expect(sinCodigo.map((m) => m.id).sort()).toEqual([
      // Las siete Actividad Deportiva que el informe no lista.
      'deportiva-10',
      'deportiva-4',
      'deportiva-5',
      'deportiva-6',
      'deportiva-7',
      'deportiva-8',
      'deportiva-9',
      'electiva-1',
      'electiva-2',
      'electiva-3',
      'electiva-4',
      'tap-pasantia',
      'tap-tesis',
    ])
    for (const m of sinCodigo) expect(m.id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/)
  })

  it('Física II declara sus tres prelaciones como conjunción', () => {
    expect([...get('846302').prelaciones].sort()).toEqual(['826201', '842204L', '846203'])
  })
})

describe('compuertas por créditos', () => {
  it('son atributo del nodo y nunca arista', () => {
    // Ninguna materia lista un umbral entre sus prelaciones.
    for (const m of materias) {
      for (const p of m.prelaciones) {
        expect(porId.has(p)).toBe(true)
      }
    }
  })

  it('compuerta pura sin prelación de materia', () => {
    const m = get('electiva-1')
    expect(m.prelaciones).toEqual([])
    expect(m.gate).toEqual({ kind: 'uc', uc: 90 })
  })

  it('compuerta mixta: Ecología tiene prelación Y umbral', () => {
    const m = get('1123403')
    expect(m.prelaciones).toEqual(['914201'])
    expect(m.gate).toEqual({ kind: 'uc', uc: 100 })
  })

  it('compuerta por porcentaje: TAP Tesis', () => {
    const m = get('tap-tesis')
    expect(m.gate).toEqual({ kind: 'pct', pct: 80 })
    expect(m.prelaciones).toEqual(['1033801'])
  })

  it('cobertura completa: los nueve umbrales distintos más las tres Electivas', () => {
    const conGate = materias.filter((m) => m.gate !== null)
    expect(conGate).toHaveLength(12)

    const electivas = conGate.filter((m) => m.id.startsWith('electiva-'))
    expect(electivas).toHaveLength(4)
    for (const e of electivas) expect(e.gate).toEqual({ kind: 'uc', uc: 90 })

    // Las nueve entradas de la leyenda del Canva.
    const leyenda = conGate
      .filter((m) => m.id !== 'electiva-2' && m.id !== 'electiva-3' && m.id !== 'electiva-4')
      .map((m) => (m.gate!.kind === 'uc' ? `${m.gate!.uc}` : `${m.gate!.pct}%`))
      .sort()
    expect(leyenda.sort()).toEqual(
      ['12', '78', '78', '90', '100', '110', '126', '80%', '100%'].sort(),
    )
  })

  it('los porcentajes se resuelven a unidades de crédito', () => {
    // Recalculados sobre las 178 U.C. reales de la carrera.
    expect(gateEnUC({ kind: 'pct', pct: 80 })).toBe(143)
    expect(gateEnUC({ kind: 'pct', pct: 100 })).toBe(178)
    expect(gateEnUC({ kind: 'uc', uc: 90 })).toBe(90)
  })
})

describe('correquisitos', () => {
  it('el par de Física I se declara en ambos sentidos y comparte semestre', () => {
    const fisica = get('846203')
    const lab = get('842204L')
    expect(fisica.correquisitos).toContain('842204L')
    expect(lab.correquisitos).toContain('846203')
    expect(fisica.semestre).toBe(2)
    expect(lab.semestre).toBe(2)
  })

  it('solo hay dos pares de correquisitos', () => {
    const conCorreq = materias.filter((m) => m.correquisitos.length > 0)
    expect(conCorreq.map((m) => m.id).sort()).toEqual([
      '842204L',
      '842303L',
      '846203',
      '846302',
    ])
  })
})

describe('resolución de discrepancias entre fuentes', () => {
  it('Metodología de la Investigación adopta las 110 UC del Canva', () => {
    expect(get('1033801').gate).toEqual({ kind: 'uc', uc: 110 })
  })

  it('Servicio Comunitario son tres nodos', () => {
    expect(get('seminario-servicio-comunitario').gate).toEqual({ kind: 'uc', uc: 78 })
    expect(get('proyecto-servicio-comunitario').gate).toEqual({ kind: 'uc', uc: 78 })
    expect(get('1000001').nombre).toBe('Servicio Comunitario')
  })

  it('las materias presentes en ambas fuentes llevan código del PDF y fuente "fusion"', () => {
    const m = get('425401')
    expect(m.fuente).toBe('fusion')
    expect(m.codigo).not.toBeNull()
  })

  it('cada discrepancia declarada apunta a una materia real o a un grupo documentado', () => {
    for (const d of pensum.meta.discrepancias) {
      expect(porId.has(d.materia)).toBe(true)
    }
  })

  it('el dataset declara su fecha de verificación y las tres fuentes', () => {
    expect(pensum.meta.verificado).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(pensum.meta.fuentes.map((f) => f.id).sort()).toEqual([
      'canva',
      'control-estudios',
      'pdf',
    ])
  })

  it('Control de Estudios manda sobre las unidades de crédito', () => {
    expect(get('425605').uc).toBe(4) // Investigación de Operaciones I
    expect(get('tap-tesis').uc).toBe(12)
    expect(get('tap-pasantia').uc).toBe(12)
  })

  it('los códigos vacíos que el informe rellenó', () => {
    expect(get('automatizacion').codigo).toBe('0236509T')
    expect(get('seminario-servicio-comunitario').codigo).toBe('1000001T')
    expect(get('proyecto-servicio-comunitario').codigo).toBe('1000002T')
  })

  it('Análisis Numérico pasó a llamarse Métodos Numéricos', () => {
    expect(get('834504').nombre).toBe('Métodos Numéricos')
  })
})

describe('taxonomía de sectores', () => {
  it('solo las cuatro Electivas quedan sin sector', () => {
    const sinSector = materias.filter((m) => m.sector === null)
    expect(sinSector.map((m) => m.id).sort()).toEqual([
      'electiva-1',
      'electiva-2',
      'electiva-3',
      'electiva-4',
    ])
  })

  it('la distribución por sector es la de la spec', () => {
    const conteo = Object.fromEntries(
      SECTORES.map((s) => [s, materias.filter((m) => m.sector === s).length]),
    )
    expect(conteo).toEqual(CONTEO_POR_SECTOR)
  })

  it('las materias sectorizadas suman 54', () => {
    expect(materias.filter((m) => m.sector !== null)).toHaveLength(TOTAL_SECTORIZADAS)
  })
})

describe('línea de Actividad Deportiva', () => {
  const deportivas = materias.filter((m) => m.sector === 'deportiva')

  it('son diez, numeradas de I a X', () => {
    expect(deportivas).toHaveLength(10)
    expect(deportivas.map((m) => m.nombre)).toEqual([
      'Actividad Deportiva I',
      'Actividad Deportiva II',
      'Actividad Deportiva III',
      'Actividad Deportiva IV',
      'Actividad Deportiva V',
      'Actividad Deportiva VI',
      'Actividad Deportiva VII',
      'Actividad Deportiva VIII',
      'Actividad Deportiva IX',
      'Actividad Deportiva X',
    ])
  })

  it('una unidad de crédito cada una', () => {
    for (const d of deportivas) expect(d.uc).toBe(1)
  })

  it('sin prelaciones ni correquisitos: ninguna bloquea a otra', () => {
    for (const d of deportivas) {
      expect(d.prelaciones).toEqual([])
      expect(d.correquisitos).toEqual([])
    }
  })

  it('nadie prela de una deportiva', () => {
    const ids = new Set(deportivas.map((d) => d.id))
    for (const m of materias) {
      for (const p of m.prelaciones) expect(ids.has(p)).toBe(false)
    }
  })

  it('las tres primeras llevan el código del informe', () => {
    expect(get('deportiva-1').codigo).toBe('0007002T')
    expect(get('deportiva-2').codigo).toBe('0007005T')
    expect(get('deportiva-3').codigo).toBe('0007008T')
  })

  it('las siete restantes quedan sin código, no inventado', () => {
    for (let i = 4; i <= 10; i++) expect(get(`deportiva-${i}`).codigo).toBeNull()
  })
})

describe('las unidades de crédito cuadran con el total', () => {
  it('las materias suman las 178 U.C. de la carrera', () => {
    expect(materias.reduce((a, m) => a + m.uc, 0)).toBe(UC_TOTALES)
    expect(UC_TOTALES).toBe(178)
  })

  it('alterar una materia rompe la validación', () => {
    const roto = {
      ...pensum,
      materias: materias.map((m) => (m.id === '826101' ? { ...m, uc: 99 } : m)),
    }
    const problemas = validarPensum(roto)
    expect(problemas.some((p) => p.regla === 'creditos-cuadran')).toBe(true)
  })
})

describe('catálogo de electivas', () => {
  it('registra las 13 ofertas del Canva sin convertirlas en nodos', () => {
    expect(pensum.catalogoElectivas).toHaveLength(13)
    const nombresDeNodos = new Set(materias.map((m) => m.nombre))
    for (const oferta of pensum.catalogoElectivas) {
      expect(nombresDeNodos.has(oferta)).toBe(false)
    }
  })
})
