interface Props {
  readonly girando: boolean
  readonly onGirar: (v: boolean) => void
  readonly onVistaInicial: () => void
  readonly onVistaCenital: () => void
}

function Boton({
  activo,
  titulo,
  onClick,
  children,
}: {
  activo?: boolean
  titulo: string
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={titulo}
      aria-label={titulo}
      aria-pressed={activo}
      className={`flex size-9 items-center justify-center rounded-lg border border-hairline transition ${
        activo
          ? 'bg-white/10 text-white'
          : 'bg-void-soft/90 text-slate-400 hover:text-white'
      }`}
    >
      {children}
    </button>
  )
}

/**
 * Controles de cámara.
 *
 * Sin un "volver a la vista inicial" el usuario que orbita de más no tiene
 * salida: la escena no tiene arriba ni abajo evidentes y quedarse perdido es
 * el fallo de navegación más fácil de provocar.
 */
export function Controles({ girando, onGirar, onVistaInicial, onVistaCenital }: Props) {
  return (
    <div className="pointer-events-auto flex flex-col gap-1.5 backdrop-blur">
      <Boton titulo="Volver a la vista inicial" onClick={onVistaInicial}>
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M3 10a7 7 0 1 1 2.3 5.2" strokeLinecap="round" />
          <path d="M3 14.5V10h4.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </Boton>
      <Boton titulo="Vista cenital: brazos y anillos de frente" onClick={onVistaCenital}>
        <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <circle cx="10" cy="10" r="6.5" />
          <circle cx="10" cy="10" r="2.5" />
        </svg>
      </Boton>
      <Boton
        titulo={girando ? 'Detener la rotación' : 'Rotar automáticamente'}
        activo={girando}
        onClick={() => onGirar(!girando)}
      >
        {girando ? (
          <svg viewBox="0 0 20 20" className="size-4" fill="currentColor">
            <rect x="5.5" y="5" width="3" height="10" rx="1" />
            <rect x="11.5" y="5" width="3" height="10" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 20 20" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
            <ellipse cx="10" cy="10" rx="7.5" ry="3.5" />
            <path d="M10 3v3M10 14v3" strokeLinecap="round" />
          </svg>
        )}
      </Boton>
    </div>
  )
}
