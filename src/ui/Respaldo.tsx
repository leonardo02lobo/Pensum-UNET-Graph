import { useRef, useState } from 'react'
import type { Historial } from '../progreso/tipos'
import { exportarJSON, importarJSON } from '../persistencia/historial'

/**
 * Respaldo del historial.
 *
 * `localStorage` desaparece al limpiar los datos del sitio, no existe en
 * ventana privada y no cruza dispositivos. Sin backend, exportar es la única
 * forma de que un clic accidental no borre una carrera entera — por eso la
 * advertencia es explícita y no letra pequeña.
 */

interface Props {
  readonly historial: Historial
  readonly onImportar: (h: Historial) => void
}

export function Respaldo({ historial, onImportar }: Props) {
  const archivo = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  const exportar = () => {
    const blob = new Blob([exportarJSON(historial)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `historial-pensum-unet-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importar = async (f: File) => {
    const r = importarJSON(await f.text())
    if (r.ok) {
      onImportar(r.historial)
      setError(null)
    } else {
      // El historial existente no se toca si el archivo no es válido.
      setError(r.error)
    }
  }

  const registradas = Object.values(historial).filter((i) => i.length > 0).length

  return (
    <div className="flex flex-col gap-2 px-2 py-1.5">
      <p className="text-[11px] leading-relaxed text-slate-500">
        Tu historial vive <strong className="text-slate-300">solo en este navegador</strong>.
        Se pierde si limpias los datos del sitio y no viaja a otros dispositivos. Expórtalo
        de vez en cuando.
      </p>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={exportar}
          disabled={registradas === 0}
          className="rounded bg-white/10 px-2.5 py-1 text-[11px] text-slate-200 transition hover:bg-white/20 disabled:cursor-not-allowed disabled:text-slate-600"
        >
          Exportar
        </button>
        <button
          type="button"
          onClick={() => archivo.current?.click()}
          className="rounded bg-white/10 px-2.5 py-1 text-[11px] text-slate-200 transition hover:bg-white/20"
        >
          Importar
        </button>
        <input
          ref={archivo}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) void importar(f)
            e.target.value = ''
          }}
        />
      </div>

      {error && <p className="text-[11px] text-rose-300">{error}</p>}

      <p className="text-[10px] text-slate-600">
        {registradas === 0
          ? 'Sin materias registradas.'
          : `${registradas} materias con historial.`}
      </p>
    </div>
  )
}
