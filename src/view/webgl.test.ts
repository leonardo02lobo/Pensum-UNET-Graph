import { afterEach, describe, expect, it, vi } from 'vitest'
import { hayWebGL } from './webgl'

/**
 * `hayWebGL` cachea su resultado a propósito: crear un contexto WebGL no es
 * gratis y los navegadores limitan cuántos pueden estar vivos a la vez. Eso
 * obliga a reimportar el módulo en cada caso para vaciar la caché.
 */

async function importarLimpio() {
  vi.resetModules()
  return (await import('./webgl')).hayWebGL
}

function conDocumento(getContext: (tipo: string) => unknown) {
  vi.stubGlobal('document', {
    createElement: () => ({ getContext }),
  })
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetModules()
})

describe('hayWebGL', () => {
  it('acepta webgl2', async () => {
    conDocumento((t) => (t === 'webgl2' ? {} : null))
    expect(await (await importarLimpio())()).toBe(true)
  })

  it('cae a webgl cuando no hay webgl2', async () => {
    conDocumento((t) => (t === 'webgl' ? {} : null))
    expect(await (await importarLimpio())()).toBe(true)
  })

  it('cae a experimental-webgl como último recurso', async () => {
    conDocumento((t) => (t === 'experimental-webgl' ? {} : null))
    expect(await (await importarLimpio())()).toBe(true)
  })

  it('devuelve false cuando ningún contexto está disponible', async () => {
    conDocumento(() => null)
    expect(await (await importarLimpio())()).toBe(false)
  })

  it('devuelve false, sin propagar, cuando getContext lanza', async () => {
    // Algunos navegadores lanzan en vez de devolver null cuando WebGL está
    // deshabilitado por política o por falta de hardware.
    conDocumento(() => {
      throw new Error('WebGL deshabilitado')
    })
    const fn = await importarLimpio()
    expect(() => fn()).not.toThrow()
    expect(fn()).toBe(false)
  })

  it('devuelve false sin document (Node)', async () => {
    vi.stubGlobal('document', undefined)
    expect(await (await importarLimpio())()).toBe(false)
  })

  it('solo crea un contexto, aunque se pregunte muchas veces', async () => {
    const createElement = vi.fn(() => ({ getContext: () => ({}) }))
    vi.stubGlobal('document', { createElement })
    const fn = await importarLimpio()
    fn()
    fn()
    fn()
    expect(createElement).toHaveBeenCalledTimes(1)
  })
})

describe('el módulo exportado', () => {
  it('expone la función que consume la aplicación', () => {
    expect(typeof hayWebGL).toBe('function')
  })
})
