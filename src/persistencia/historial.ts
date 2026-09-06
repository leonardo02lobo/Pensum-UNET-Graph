import {
  esNotaValida,
  HISTORIAL_VACIO,
  type Historial,
  type Intento,
  type TipoIntento,
} from '../progreso/tipos'

/**
 * Persistencia del historial en `localStorage`. Sin backend.
 *
 * Es la ÚNICA parte de la capa de progreso que toca el navegador: el cálculo
 * del índice queda puro y probable en Node (design.md, D7).
 *
 * Advertencia honesta: `localStorage` desaparece al limpiar los datos del
 * sitio, no existe en ventana privada y no cruza dispositivos. Por eso el
 * exportar/importar no es un extra, es la única red de seguridad que hay.
 */

export const CLAVE = 'pensum-unet:historial'
export const VERSION_ESQUEMA = 1

interface Guardado {
  readonly version: number
  readonly historial: Historial
}

/** Interfaz mínima de `localStorage`, para poder probar sin navegador. */
export interface Almacen {
  getItem(clave: string): string | null
  setItem(clave: string, valor: string): void
  removeItem(clave: string): void
}

export type ResultadoCarga =
  | { readonly estado: 'ok'; readonly historial: Historial }
  | { readonly estado: 'vacio'; readonly historial: Historial }
  /** El contenido no era legible. Se arranca vacío pero NO se sobrescribe. */
  | { readonly estado: 'corrupto'; readonly historial: Historial }
  /** Guardado por una versión posterior. Se respeta y no se toca. */
  | {
      readonly estado: 'version-futura'
      readonly historial: Historial
      readonly version: number
    }

const TIPOS: readonly TipoIntento[] = [
  'regular',
  'equivalencia',
  'suficiencia',
  'retiro',
  'en-curso',
]

function esIntento(v: unknown): v is Intento {
  if (typeof v !== 'object' || v === null) return false
  const i = v as Record<string, unknown>
  if (!TIPOS.includes(i.tipo as TipoIntento)) return false
  if (i.nota !== null && !esNotaValida(i.nota)) return false
  if (i.desincorporado !== undefined && typeof i.desincorporado !== 'boolean') return false
  if (i.periodo !== undefined && typeof i.periodo !== 'string') return false
  return true
}

/** Valida la forma del historial y descarta lo que no encaje. */
export function esHistorial(v: unknown): v is Historial {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return false
  for (const intentos of Object.values(v as Record<string, unknown>)) {
    if (!Array.isArray(intentos)) return false
    if (!intentos.every(esIntento)) return false
  }
  return true
}

/**
 * Migración entre versiones del esquema. Hoy solo existe la versión 1, pero la
 * función existe desde el principio: añadirla después de que la gente ya tenga
 * notas cargadas es mucho más caro.
 */
function migrar(version: number, historial: Historial): Historial | null {
  if (version === VERSION_ESQUEMA) return historial
  // Versiones anteriores irían encadenándose aquí.
  return null
}

export function cargarHistorial(almacen: Almacen): ResultadoCarga {
  let crudo: string | null
  try {
    crudo = almacen.getItem(CLAVE)
  } catch {
    // Un navegador con el almacenamiento bloqueado lanza al leer.
    return { estado: 'corrupto', historial: HISTORIAL_VACIO }
  }
  if (crudo === null) return { estado: 'vacio', historial: HISTORIAL_VACIO }

  let dato: unknown
  try {
    dato = JSON.parse(crudo)
  } catch {
    return { estado: 'corrupto', historial: HISTORIAL_VACIO }
  }

  if (typeof dato !== 'object' || dato === null) {
    return { estado: 'corrupto', historial: HISTORIAL_VACIO }
  }
  const { version, historial } = dato as Partial<Guardado>

  if (typeof version !== 'number' || !esHistorial(historial)) {
    return { estado: 'corrupto', historial: HISTORIAL_VACIO }
  }

  if (version > VERSION_ESQUEMA) {
    // No se toca: sobrescribirlo perdería datos de una versión que no
    // entendemos. Se informa y se trabaja en blanco.
    return { estado: 'version-futura', historial: HISTORIAL_VACIO, version }
  }

  const migrado = migrar(version, historial)
  if (migrado === null) return { estado: 'corrupto', historial: HISTORIAL_VACIO }
  return { estado: 'ok', historial: migrado }
}

/**
 * Guarda el historial. Devuelve `false` sin escribir si en el almacén hay un
 * dato de una versión posterior — perderlo sería peor que no guardar.
 */
export function guardarHistorial(historial: Historial, almacen: Almacen): boolean {
  const actual = cargarHistorial(almacen)
  if (actual.estado === 'version-futura') return false
  try {
    const dato: Guardado = { version: VERSION_ESQUEMA, historial }
    almacen.setItem(CLAVE, JSON.stringify(dato))
    return true
  } catch {
    // Cuota llena o almacenamiento bloqueado.
    return false
  }
}

export function borrarHistorial(almacen: Almacen): void {
  try {
    almacen.removeItem(CLAVE)
  } catch {
    /* nada que hacer */
  }
}

export function exportarJSON(historial: Historial): string {
  const dato: Guardado = { version: VERSION_ESQUEMA, historial }
  return JSON.stringify(dato, null, 2)
}

export type ResultadoImportacion =
  | { readonly ok: true; readonly historial: Historial }
  | { readonly ok: false; readonly error: string }

export function importarJSON(texto: string): ResultadoImportacion {
  let dato: unknown
  try {
    dato = JSON.parse(texto)
  } catch {
    return { ok: false, error: 'El archivo no es JSON válido.' }
  }
  if (typeof dato !== 'object' || dato === null) {
    return { ok: false, error: 'El archivo no tiene la forma esperada.' }
  }
  const { version, historial } = dato as Partial<Guardado>
  if (typeof version !== 'number') {
    return { ok: false, error: 'Al archivo le falta la versión del esquema.' }
  }
  if (version > VERSION_ESQUEMA) {
    return {
      ok: false,
      error: `El archivo es de una versión posterior (${version}). Actualiza la aplicación.`,
    }
  }
  if (!esHistorial(historial)) {
    return { ok: false, error: 'El historial del archivo no cumple el esquema.' }
  }
  const migrado = migrar(version, historial)
  if (migrado === null) {
    return { ok: false, error: `No se sabe migrar desde la versión ${version}.` }
  }
  return { ok: true, historial: migrado }
}

/** El almacén real del navegador, o `null` donde no exista. */
export function almacenDelNavegador(): Almacen | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage
  } catch {
    return null
  }
}
