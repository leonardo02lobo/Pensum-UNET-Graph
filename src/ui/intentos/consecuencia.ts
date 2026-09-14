import { otorgaCreditos, pesaEnIndice, type Intento, type TipoIntento } from '../../progreso/tipos'

/**
 * Nombres y consecuencias de los tipos de intento.
 *
 * Vive aquí, y no dentro del editor, porque hay más de una superficie de
 * captura (panel de detalle y lista del pensum) y la escala del Art. 39 con
 * sus consecuencias normativas solo puede estar definida una vez. Duplicarla
 * garantiza que una de las copias se desactualice.
 */

export const ETIQUETA_TIPO: Readonly<Record<TipoIntento, string>> = {
  regular: 'Cursada',
  equivalencia: 'Equivalencia',
  suficiencia: 'Suficiencia',
  retiro: 'Retiro',
  'en-curso': 'En curso',
}

/** Lo que cada tipo hace, citando la norma. Se muestra al elegirlo. */
export function consecuencia(i: Intento): string {
  const credito = otorgaCreditos(i) ? 'Otorga créditos' : 'No otorga créditos'
  const indice = pesaEnIndice(i) ? 'pesa en el índice' : 'no pesa en el índice'
  const cita: Record<TipoIntento, string> = {
    regular: 'Art. 47a: se computa lo cursado, aprobado o no.',
    equivalencia: 'Art. 48: lo acreditado por equivalencia no entra al índice.',
    suficiencia: 'Art. 37: la suficiencia reprobada no cuenta para nada.',
    retiro: 'Art. 21: solo el retiro sin desincorporación afecta el historial.',
    'en-curso': 'Sin calificación definitiva todavía.',
  }
  return `${credito} y ${indice}. ${cita[i.tipo]}`
}

/** Cómo se escribe una nota efectiva: entera si lo es, con dos decimales si no. */
export function formatearNota(nota: number): string {
  return Number.isInteger(nota) ? String(nota) : nota.toFixed(2)
}
