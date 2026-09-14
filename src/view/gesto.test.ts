import { describe, expect, it } from 'vitest'
import { UMBRAL_ARRASTRE, esArrastre } from './gesto'

describe('esArrastre', () => {
  const origen = { x: 100, y: 100 }

  it('un toque exacto no es arrastre', () => {
    expect(esArrastre(origen, { x: 100, y: 100 })).toBe(false)
  })

  it('el temblor del dedo no es arrastre', () => {
    // Nadie toca una pantalla sin moverse un par de píxeles. Sin holgura,
    // ningún toque con el dedo llegaría a seleccionar nada.
    expect(esArrastre(origen, { x: 103, y: 102 })).toBe(false)
  })

  it('pasar el umbral es arrastre', () => {
    expect(esArrastre(origen, { x: 110, y: 100 })).toBe(true)
    expect(esArrastre(origen, { x: 100, y: 90 })).toBe(true)
  })

  it('mide en diagonal, no por eje', () => {
    // 5 en X y 5 en Y son 7,07 de desplazamiento real: es arrastre, aunque
    // ningún eje por separado pase de 6.
    expect(esArrastre(origen, { x: 105, y: 105 })).toBe(true)
    expect(esArrastre(origen, { x: 104, y: 104 })).toBe(false)
  })

  it('es simétrico en las cuatro direcciones', () => {
    for (const [dx, dy] of [
      [10, 0],
      [-10, 0],
      [0, 10],
      [0, -10],
    ]) {
      expect(esArrastre(origen, { x: 100 + dx, y: 100 + dy })).toBe(true)
    }
  })

  it('justo en el umbral todavía es toque', () => {
    expect(esArrastre(origen, { x: 100 + UMBRAL_ARRASTRE, y: 100 })).toBe(false)
    expect(esArrastre(origen, { x: 100 + UMBRAL_ARRASTRE + 1, y: 100 })).toBe(true)
  })

  it('sin gesto empezado nunca es arrastre', () => {
    // Un `pointermove` sin `pointerdown` previo — por ejemplo, el puntero
    // entrando en el lienzo — no puede contar como órbita.
    expect(esArrastre(null, { x: 999, y: 999 })).toBe(false)
  })

  it('admite un umbral propio', () => {
    expect(esArrastre(origen, { x: 120, y: 100 }, 30)).toBe(false)
    expect(esArrastre(origen, { x: 120, y: 100 }, 10)).toBe(true)
  })
})
