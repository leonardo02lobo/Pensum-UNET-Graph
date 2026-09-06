/**
 * Tabla de conversión del Artículo 42 (C-3, Normas para la Evaluación del
 * Rendimiento Estudiantil de la UNET).
 *
 * Convierte un valor porcentual a la escala de calificaciones de 1,0 a 9,0.
 *
 * ES UN DATO, NO UNA FÓRMULA. La tabla es irregular: ocho calificaciones
 * reciben dos porcentajes y el resto uno solo. El mejor ajuste lineal
 * —`1 + (pct − 7) / 11`— se desvía más de media décima en 35 de las 89 celdas,
 * y se desvía justo donde importa:
 *
 *     48 % → 4,8      50 % → 4,9
 *     49 % → 4,8      51 % → 5,0   ← primer porcentaje aprobatorio
 *
 * El 5,0 es la única calificación con un solo porcentaje asociado: no hay
 * margen. Interpolar aquí sería aprobar o reprobar a gente por redondeo.
 *
 * Procedencia: transcrita del PDF C-3 (Tabla 1, marcada «UE19») y contrastada
 * celda a celda contra la tabla oficial en línea de la UNET. Ambas coinciden.
 * @see https://www.unet.edu.ve/~frsilva/TablaConversion.php
 */

/** Marca de versión que trae la tabla en el documento fuente. */
export const VERSION_TABLA = 'UE19'

export const URL_TABLA_OFICIAL = 'https://www.unet.edu.ve/~frsilva/TablaConversion.php'

export const NOTA_MINIMA = 1.0
export const NOTA_MAXIMA = 9.0
/** Porcentaje por debajo del cual toda calificación es 1,0. */
export const PORCENTAJE_MINIMO = 7
/** Porcentaje desde el cual toda calificación es 9,0. */
export const PORCENTAJE_MAXIMO = 95

/**
 * Porcentaje mínimo que alcanza cada calificación, de 1,0 a 9,0 en décimas.
 *
 * 81 umbrales que reconstruyen la tabla completa sin pérdida: el índice `i`
 * corresponde a la calificación `(10 + i) / 10`. Guardar los umbrales en vez
 * de las 101 filas es equivalente y hace evidentes los saltos dobles (17→19,
 * 28→30, 39→41, 48→50, 54→56, 62→64, 73→75, 84→86).
 */
export const UMBRALES: readonly number[] = [
  // 1,0 – 1,9
  7, 8, 9, 10, 11, 12, 13, 14, 15, 16,
  // 2,0 – 2,9
  17, 19, 20, 21, 22, 23, 24, 25, 26, 27,
  // 3,0 – 3,9
  28, 30, 31, 32, 33, 34, 35, 36, 37, 38,
  // 4,0 – 4,9
  39, 41, 42, 43, 44, 45, 46, 47, 48, 50,
  // 5,0 – 5,9
  51, 52, 53, 54, 56, 57, 58, 59, 60, 61,
  // 6,0 – 6,9
  62, 64, 65, 66, 67, 68, 69, 70, 71, 72,
  // 7,0 – 7,9
  73, 75, 76, 77, 78, 79, 80, 81, 82, 83,
  // 8,0 – 8,9
  84, 86, 87, 88, 89, 90, 91, 92, 93, 94,
  // 9,0
  95,
]

/** Las 81 calificaciones de la escala, de 1,0 a 9,0 en décimas. */
export function calificacionesDeLaEscala(): number[] {
  return UMBRALES.map((_, i) => redondearDecima((10 + i) / 10))
}

/** Evita que 5.1 salga como 5.100000000000001 al construirlo desde índices. */
function redondearDecima(n: number): number {
  return Math.round(n * 10) / 10
}

/**
 * Calificación que la tabla asigna a un valor porcentual.
 *
 * El porcentaje NO se redondea al alza: se busca el mayor umbral que no lo
 * supera. Un 50,9 % no llega al 51 que exige el 5,0, y la tabla no regala esa
 * décima.
 */
export function notaDePorcentaje(porcentaje: number): number {
  if (!Number.isFinite(porcentaje)) {
    throw new Error(`Porcentaje inválido: ${porcentaje}`)
  }
  const pct = Math.min(100, Math.max(0, porcentaje))
  if (pct < PORCENTAJE_MINIMO) return NOTA_MINIMA
  if (pct >= PORCENTAJE_MAXIMO) return NOTA_MAXIMA

  // El mayor índice cuyo umbral no supera al porcentaje.
  let indice = 0
  for (let i = 0; i < UMBRALES.length; i++) {
    if (UMBRALES[i] <= pct) indice = i
    else break
  }
  return redondearDecima((10 + indice) / 10)
}

/** ¿Es una calificación válida de la escala: de 1,0 a 9,0, en décimas? */
export function esNotaDeEscala(nota: unknown): nota is number {
  if (typeof nota !== 'number' || !Number.isFinite(nota)) return false
  if (nota < NOTA_MINIMA || nota > NOTA_MAXIMA) return false
  // Una décima exacta. El ×10 con redondeo evita los errores de coma flotante
  // de comparar 6.5 * 10 con 65.
  return Math.abs(Math.round(nota * 10) - nota * 10) < 1e-9
}

/**
 * Porcentaje mínimo que alcanza una calificación. Responde «¿qué porcentaje
 * necesito para sacar esta nota?».
 */
export function porcentajeMinimoDeNota(nota: number): number {
  if (!esNotaDeEscala(nota)) {
    throw new Error(`Fuera de la escala 1,0–9,0 en décimas: ${nota}`)
  }
  return UMBRALES[Math.round(nota * 10) - 10]
}

export type ResultadoPuntaje =
  | { readonly ok: true; readonly porcentaje: number; readonly nota: number }
  | { readonly ok: false; readonly error: string }

/**
 * Convierte un puntaje sobre un máximo cualquiera a calificación, pasando
 * primero por su valor porcentual como indica el Artículo 42.
 */
export function notaDePuntaje(obtenido: number, maximo: number): ResultadoPuntaje {
  if (!Number.isFinite(obtenido) || !Number.isFinite(maximo)) {
    return { ok: false, error: 'El puntaje y el máximo deben ser números.' }
  }
  if (maximo <= 0) {
    return { ok: false, error: 'El puntaje máximo debe ser mayor que cero.' }
  }
  if (obtenido < 0) {
    return { ok: false, error: 'El puntaje obtenido no puede ser negativo.' }
  }
  if (obtenido > maximo) {
    return { ok: false, error: 'El puntaje obtenido no puede superar al máximo.' }
  }
  const porcentaje = (obtenido / maximo) * 100
  return { ok: true, porcentaje, nota: notaDePorcentaje(porcentaje) }
}
