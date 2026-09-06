import { beforeEach, describe, expect, it } from 'vitest'
import type { Historial } from '../progreso/tipos'
import {
  CLAVE,
  VERSION_ESQUEMA,
  borrarHistorial,
  cargarHistorial,
  esHistorial,
  exportarJSON,
  guardarHistorial,
  importarJSON,
  type Almacen,
} from './historial'

/** `localStorage` simulado, para probar sin navegador. */
function almacenFalso(inicial: Record<string, string> = {}): Almacen & {
  datos: Record<string, string>
} {
  const datos = { ...inicial }
  return {
    datos,
    getItem: (k) => datos[k] ?? null,
    setItem: (k, v) => {
      datos[k] = v
    },
    removeItem: (k) => {
      delete datos[k]
    },
  }
}

const historial: Historial = {
  '826101': [{ tipo: 'regular', nota: 7 }],
  '415102': [
    { tipo: 'regular', nota: 3 },
    { tipo: 'regular', nota: 8, periodo: '2026-1' },
  ],
  'electiva-1': [{ tipo: 'equivalencia', nota: null }],
  '846302': [{ tipo: 'retiro', nota: 4, desincorporado: true }],
}

let almacen: ReturnType<typeof almacenFalso>
beforeEach(() => {
  almacen = almacenFalso()
})

describe('ida y vuelta', () => {
  it('guarda y recupera el historial intacto', () => {
    expect(guardarHistorial(historial, almacen)).toBe(true)
    const r = cargarHistorial(almacen)
    expect(r.estado).toBe('ok')
    expect(r.historial).toEqual(historial)
  })

  it('un almacén vacío arranca vacío', () => {
    const r = cargarHistorial(almacen)
    expect(r.estado).toBe('vacio')
    expect(r.historial).toEqual({})
  })

  it('guarda con la versión del esquema', () => {
    guardarHistorial(historial, almacen)
    expect(JSON.parse(almacen.datos[CLAVE]).version).toBe(VERSION_ESQUEMA)
  })

  it('borrar deja el almacén limpio', () => {
    guardarHistorial(historial, almacen)
    borrarHistorial(almacen)
    expect(cargarHistorial(almacen).estado).toBe('vacio')
  })
})

describe('lectura tolerante', () => {
  it('JSON inválido arranca vacío sin romper', () => {
    const a = almacenFalso({ [CLAVE]: 'esto no es json {{{' })
    const r = cargarHistorial(a)
    expect(r.estado).toBe('corrupto')
    expect(r.historial).toEqual({})
  })

  it('un objeto sin versión es corrupto', () => {
    const a = almacenFalso({ [CLAVE]: JSON.stringify({ historial: {} }) })
    expect(cargarHistorial(a).estado).toBe('corrupto')
  })

  it('un historial que no cumple el esquema es corrupto', () => {
    const a = almacenFalso({
      [CLAVE]: JSON.stringify({ version: 1, historial: { x: [{ tipo: 'inventado' }] } }),
    })
    expect(cargarHistorial(a).estado).toBe('corrupto')
  })

  it('una nota fuera de escala invalida el historial', () => {
    const a = almacenFalso({
      [CLAVE]: JSON.stringify({ version: 1, historial: { x: [{ tipo: 'regular', nota: 18 }] } }),
    })
    expect(cargarHistorial(a).estado).toBe('corrupto')
  })

  it('un almacén que lanza al leer no rompe la aplicación', () => {
    const roto: Almacen = {
      getItem: () => {
        throw new Error('bloqueado')
      },
      setItem: () => {},
      removeItem: () => {},
    }
    expect(cargarHistorial(roto).estado).toBe('corrupto')
  })
})

describe('versión futura', () => {
  const futuro = JSON.stringify({ version: VERSION_ESQUEMA + 1, historial: {} })

  it('se informa en vez de perderla', () => {
    const a = almacenFalso({ [CLAVE]: futuro })
    const r = cargarHistorial(a)
    expect(r.estado).toBe('version-futura')
    expect(r.estado === 'version-futura' && r.version).toBe(VERSION_ESQUEMA + 1)
  })

  it('guardar no la sobrescribe', () => {
    const a = almacenFalso({ [CLAVE]: futuro })
    expect(guardarHistorial(historial, a)).toBe(false)
    expect(a.datos[CLAVE]).toBe(futuro)
  })
})

describe('exportar e importar', () => {
  it('lo exportado se puede importar', () => {
    const r = importarJSON(exportarJSON(historial))
    expect(r.ok).toBe(true)
    expect(r.ok && r.historial).toEqual(historial)
  })

  it('el archivo exportado lleva la versión', () => {
    expect(JSON.parse(exportarJSON(historial)).version).toBe(VERSION_ESQUEMA)
  })

  it('un archivo que no es JSON se rechaza con mensaje', () => {
    const r = importarJSON('{{{')
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.error).toMatch(/JSON/)
  })

  it('un archivo sin versión se rechaza', () => {
    const r = importarJSON(JSON.stringify({ historial: {} }))
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.error).toMatch(/versión/)
  })

  it('un archivo de versión posterior se rechaza', () => {
    const r = importarJSON(JSON.stringify({ version: 99, historial: {} }))
    expect(r.ok).toBe(false)
    expect(r.ok === false && r.error).toMatch(/posterior/)
  })

  it('un historial mal formado se rechaza sin tocar nada', () => {
    const r = importarJSON(JSON.stringify({ version: 1, historial: [1, 2, 3] }))
    expect(r.ok).toBe(false)
  })
})

describe('validación de forma', () => {
  it('acepta un historial válido', () => {
    expect(esHistorial(historial)).toBe(true)
    expect(esHistorial({})).toBe(true)
  })

  it('rechaza formas inválidas', () => {
    expect(esHistorial(null)).toBe(false)
    expect(esHistorial([])).toBe(false)
    expect(esHistorial({ x: 'no es lista' })).toBe(false)
    expect(esHistorial({ x: [{ tipo: 'regular', nota: 0 }] })).toBe(false)
    expect(esHistorial({ x: [{ tipo: 'regular', nota: 5.5 }] })).toBe(false)
    expect(esHistorial({ x: [{ tipo: 'retiro', nota: null, desincorporado: 'sí' }] })).toBe(
      false,
    )
  })
})
