import { describe, expect, it } from 'vitest'
import {
  ANCHO_DOS_COLUMNAS,
  ANCHO_MINIMO_GRAFO,
  debeColapsar,
  esAmplio,
  formaDelPanel,
  tramoDe,
} from './tramos'
import { ANCHO_PANEL, MARGEN_PANEL, desplazamientoCromo, franjaDelPanel } from './panel'

describe('tramoDe', () => {
  it('sitúa los anchos de escritorio en amplio', () => {
    expect(tramoDe(1920)).toBe('amplio')
    expect(tramoDe(1440)).toBe('amplio')
    expect(tramoDe(ANCHO_DOS_COLUMNAS)).toBe('amplio')
  })

  it('sitúa en compacto el tramo donde hoy se solapan leyenda y semestres', () => {
    // Medido: a 1000 la leyenda termina en 320 y Semestres empieza en 301.
    expect(tramoDe(1039)).toBe('compacto')
    expect(tramoDe(1100)).toBe('compacto')
    expect(tramoDe(1000)).toBe('compacto')
    expect(tramoDe(ANCHO_MINIMO_GRAFO)).toBe('compacto')
  })

  it('sitúa en estrecho los anchos donde el grafo deja de contar una historia', () => {
    expect(tramoDe(ANCHO_MINIMO_GRAFO - 1)).toBe('estrecho')
    expect(tramoDe(768)).toBe('estrecho')
    expect(tramoDe(375)).toBe('estrecho')
  })

  it('los umbrales son fronteras cerradas por abajo', () => {
    expect(tramoDe(899)).toBe('estrecho')
    expect(tramoDe(900)).toBe('compacto')
    expect(tramoDe(1159)).toBe('compacto')
    expect(tramoDe(1160)).toBe('amplio')
  })

  it('el panel lateral solo se ofrece donde no pisa la barra de semestres', () => {
    // Medido: a 1100 con panel abierto la barra llega a 749 y el panel empieza
    // en 732. La cuenta es W/2 + 199,5 > W − 368, o sea W < 1135.
    expect(formaDelPanel(tramoDe(1100))).toBe('hoja')
    expect(formaDelPanel(tramoDe(1134))).toBe('hoja')
    expect(formaDelPanel(tramoDe(1160))).toBe('lateral')
  })
})

describe('la disposición se deriva del tramo', () => {
  it('solo el tramo amplio conserva la disposición actual', () => {
    expect(esAmplio(tramoDe(1440))).toBe(true)
    expect(esAmplio(tramoDe(1000))).toBe(false)
    expect(esAmplio(tramoDe(375))).toBe(false)
  })

  it('el panel es lateral solo donde caben dos columnas', () => {
    expect(formaDelPanel(tramoDe(1440))).toBe('lateral')
    expect(formaDelPanel(tramoDe(1000))).toBe('hoja')
    expect(formaDelPanel(tramoDe(375))).toBe('hoja')
  })

  it('las islas se colapsan fuera del tramo amplio', () => {
    expect(debeColapsar(tramoDe(1440))).toBe(false)
    expect(debeColapsar(tramoDe(1000))).toBe(true)
  })
})

describe('franjaDelPanel', () => {
  it('el panel lateral deja una franja derecha del ancho nominal', () => {
    const f = franjaDelPanel('lateral', 1440, 900)
    expect(f.bordeDerecho).toBe(1440 - ANCHO_PANEL - MARGEN_PANEL)
    expect(f.bordeInferior).toBeNull()
  })

  it('en una ventana estrecha la franja sigue al ancho REAL, no al nominal', () => {
    // Éste es el fallo que había: la constante 368 suprimía etiquetas que sí
    // se veían, porque el panel ya no medía 368.
    const f = franjaDelPanel('lateral', 375, 700)
    expect(f.bordeDerecho).toBe(MARGEN_PANEL)
    expect(f.bordeDerecho).not.toBe(375 - ANCHO_PANEL - MARGEN_PANEL)
  })

  it('la hoja inferior no deja franja lateral', () => {
    const f = franjaDelPanel('hoja', 375, 700)
    expect(f.bordeDerecho).toBeNull()
    expect(f.bordeInferior).toBeGreaterThan(0)
    expect(f.bordeInferior).toBeLessThan(700)
  })
})

describe('desplazamientoCromo', () => {
  it('sin panel abierto el cromo va al margen', () => {
    expect(desplazamientoCromo('lateral', false, 1440)).toBe(MARGEN_PANEL)
  })

  it('con panel lateral abierto el cromo se aparta su ancho', () => {
    expect(desplazamientoCromo('lateral', true, 1440)).toBe(
      ANCHO_PANEL + MARGEN_PANEL * 2,
    )
  })

  it('con el panel como hoja el cromo no se aparta a un lado', () => {
    expect(desplazamientoCromo('hoja', true, 1000)).toBe(MARGEN_PANEL)
  })
})
