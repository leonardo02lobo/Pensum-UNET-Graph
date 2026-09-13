## Context

El cromo es hoy cinco islas `absolute` colocadas por `App.tsx` sobre una capa `pointer-events-none`, con anchos literales:

```
  header      top-4  left-4     título + Cabecera + Buscador (w-80 = 320)
  vistas      top-4  right:24rem|1rem   PestanasVista + Controles
  Leyenda     bottom-4 left-4   w-76 = 304
  Semestres   bottom-4 left-1/2 -translate-x-1/2   ~390 sin tope
  Panel       top-4 right-4 bottom-4  w-[22rem] = 352
```

Ninguna de esas medidas consulta el ancho de la ventana. El único `max-width` responsive que existe es `max-w-[calc(100vw-2rem)]`, que impide desbordar pero no impide **solaparse**, que es el fallo real:

```
   W = 1280           W = 1000                W = 375
  ┌──────────────┐   ┌───────────┐           ┌─────┐
  │Ley     Sem   │   │Ley ▓▓ Sem │           │▓▓▓▓▓│   Sem (390) > W
  └──────────────┘   └───────────┘           └─────┘   y overflow:hidden
      ok              solapan                 recortado
```

Y hay un segundo problema que ningún reflujo arregla: el cono de dependencias —la aportación del grafo— entra solo por `onNodeHover`. Sin cursor no hay cono. Los discos son de radio 17 px y se mueven mientras orbitas con el mismo dedo.

El número `368` merece mención aparte. Aparece en `GrafoOrbital` como `ANCHO_PANEL`, aproximando `w-[22rem] + right-4` = 368. Cuando el ancho de ventana hace que el panel caiga a `max-w-[calc(100vw-2rem)]`, el panel mide menos de 368 pero la capa de etiquetas sigue suprimiendo una franja de 368. **El valor está escrito tres veces y las tres discrepan en cuanto la ventana se estrecha.**

Este cambio llega **después** de `plan-de-inscripcion`: sin la lista del pensum, «bajo el umbral ofrecemos otra vista» no tiene destino.

## Goals / Non-Goals

**Goals:**

- Que no exista ningún ancho en el que la app ofrezca el grafo y las islas se pisen.
- Que el umbral del grafo sea una decisión **declarada**, no el resultado accidental de unos `className`.
- Que el cono de dependencias sea alcanzable sin cursor.
- Que el ancho del panel tenga una sola definición.
- Que el tramo ancho de escritorio quede **byte a byte igual** que hoy.

**Non-Goals:**

- Construir la lista del pensum (la trae `plan-de-inscripcion`).
- Hacer que el grafo orbital funcione bien a 375 px. No va a funcionar; la decisión es no ofrecerlo ahí por defecto.
- Rediseñar la calculadora.
- Gestos avanzados: pellizco más allá del zoom de la cámara orbital, doble toque para enfocar.
- Anillo de foco, movimiento reducido, atajos de teclado (`accesibilidad-operable`).
- App instalable, modo sin conexión, envoltorio nativo.

## Decisions

### D1 — Tres tramos con nombre, no breakpoints sueltos

```ts
// src/ui/tramos.ts
export const ANCHO_MINIMO_GRAFO = 900   // por debajo: la lista es el destino
export const ANCHO_DOS_COLUMNAS = 1100  // por debajo: el panel baja a hoja

export type Tramo = 'estrecho' | 'compacto' | 'amplio'
```

```
      0 ─────────── 900 ─────────── 1100 ──────────→
        estrecho      compacto        amplio

        lista por     grafo con       grafo como
        defecto       cromo           está hoy,
                      colapsado       sin tocar
                      + panel
                      como hoja
```

Los dos números salen de la aritmética del cromo actual, no de una tabla de dispositivos:

- **1100** es donde deja de haber sitio para leyenda (320) + semestres (390) + panel (368) sin que nada se toque. La cuenta del solape es `W/2 − 195 < 320 ⟹ W < 1030`; se redondea arriba con holgura.
- **900** es donde el grafo deja de contar una historia: por debajo, el panel abierto tapa más de la mitad de la escena y los diez anillos concéntricos no se distinguen.

*Alternativa descartada:* los breakpoints por defecto de Tailwind (`sm` 640, `md` 768, `lg` 1024). Son anchos de dispositivo genéricos y ninguno cae donde este cromo concreto se rompe. Usarlos habría dejado el solape real de ~1030 justo dentro de `lg`.

### D2 — El tramo se mide con `ResizeObserver`, y `App` es quien decide

El reflujo vive en `App.tsx`, que ya es quien posiciona las cinco islas. Cada componente recibe, cuando lo necesita, el tramo por prop.

*Alternativa descartada:* que cada isla consulte el ancho por su cuenta con utilidades `lg:` de Tailwind. Repartiría el conocimiento del layout entre seis archivos y haría imposible razonar sobre «¿se solapan?», que es una propiedad del conjunto, no de cada isla.

Se usa `ResizeObserver` sobre el contenedor raíz y no `window.matchMedia` porque `GrafoOrbital` ya mide su contenedor con `useLayoutEffect` por la misma razón —el ancho que importa es el del elemento, no el del dispositivo— y conviene tener un solo criterio.

### D3 — El ancho del panel sale de `GrafoOrbital` y se vuelve dato

```
              ANTES                                 DESPUÉS

  PanelDetalle   w-[22rem]                 ui/panel.ts
  App            right: '24rem'            └── ANCHO_PANEL, MARGEN_PANEL
  GrafoOrbital   ANCHO_PANEL = 368                      │
       ▲                                      ┌─────────┼─────────┐
       │                                      ▼         ▼         ▼
   tres valores, tres archivos,          PanelDetalle  App   GrafoOrbital
   discrepantes en cuanto la
   ventana se estrecha                   y el panel informa su forma actual
                                         (lateral | hoja) y su ancho real
```

La capa de etiquetas deja de recibir un número derivado de una constante y pasa a recibir la geometría real del panel. Cuando el panel es hoja inferior, `bordeDerecho` deja de tener sentido y la supresión pasa a ser por abajo — hoy suprimir una franja derecha inexistente borraría etiquetas perfectamente visibles.

### D4 — Bajo el umbral no se degrada el grafo: se ofrece otra cosa

```
   arranque, W < 900
        │
        ├─ ¿la URL pide el grafo explícitamente?
        │      sí ──→ grafo. El fragmento es una intención,
        │              no una casualidad, y se respeta.
        │      no ──→ lista, con nota: «el grafo 3D necesita una
        │              pantalla más ancha»  ·  [verlo igual →]
```

Intentar que el grafo orbital funcione a 375 px produciría una versión peor de las dos vistas: un grafo ilegible y una lista que no existe. La honestidad —«esto necesita una pantalla más ancha, mientras tanto aquí está lo que sí puedes hacer»— es mejor producto que una degradación silenciosa.

**Y el umbral no secuestra la navegación.** Ensanchar la ventana estando en la lista no cambia de vista: mover al usuario de sitio por redimensionar es peor que cualquier problema que resuelva.

*Alternativa descartada:* bloquear el grafo bajo el umbral. Hay tabletas y teléfonos apaisados donde el grafo es perfectamente usable y el umbral se queda corto; el usuario sabe mejor que la heurística.

### D5 — Colapsar antes que encoger

En el tramo compacto, las islas que estorban se colapsan a un control con etiqueta, no se hacen pequeñas. `Leyenda` ya tiene el mecanismo escrito —`abierta`, con un botón «Leyenda» cuando está cerrada— y es el patrón a repetir.

Encoger produce texto de 9 px y objetivos táctiles imposibles; colapsar conserva el tamaño de todo lo que queda visible y mueve el coste a un clic. El requisito que lo mantiene honesto: **una isla colapsada sigue siendo alcanzable con un control visible**, nunca desaparece sin rastro.

### D6 — El área de acierto se separa de la geometría visible

Éste es el punto de más riesgo técnico del cambio.

```
        visible                acierto
      ┌─────────┐            ┌───────────────┐
      │    ●    │   r = 17   │       ●       │   r ≈ 34, invisible
      └─────────┘            └───────────────┘
   nodeThreeObject           malla transparente hermana,
   (como hoy)                sin escribir en el buffer de
                             profundidad para no velar el bloom
```

No se agranda el disco: agrandarlo cambiaría la lectura de la escena, donde el tamaño ya codifica información. Se añade geometría de colisión mayor y transparente.

Riesgo asociado: con radio de acierto doble, en las zonas densas de un brazo dos áreas se solapan y el nodo que gana es el más cercano a la cámara, que no siempre es el que el usuario apuntaba. Se acepta: hoy, en esas mismas zonas, el resultado frecuente es **no acertar ninguno**.

### D7 — Tocar y orbitar son gestos distintos

`onNodeClick` dispara hoy al soltar, sin más. Con dedo, un arrastre para orbitar que termina sobre un nodo lo seleccionaría — y como la cámara acaba de moverse, el usuario no sabría por qué se abrió un panel.

La distinción es por desplazamiento entre el inicio y el final del gesto: por debajo de un umbral pequeño es un toque, por encima es una órbita. Es la misma razón por la que la rotación automática pasa a detenerse ante cualquier gesto sobre el lienzo y no solo al seleccionar (`girando` deja de cambiar únicamente por el botón y por `irA`).

### D8 — El tramo amplio no se toca

Todo el reflujo entra bajo condición. En el tramo `amplio`, cada isla conserva sus clases actuales, literalmente. Cualquier movimiento ahí es coste sin beneficio, y es el ancho en el que la app se ha estado usando y ajustando.

## Risks / Trade-offs

- **Regresión en escritorio.** Es el riesgo principal: este cambio toca la disposición que hoy funciona bien. → D8: el tramo amplio conserva las clases actuales sin excepción, y el primer escenario de la spec (`El tramo ancho no cambia`) es la comprobación.

- **El área de acierto ampliada roba clics en zonas densas.** → Se acepta conscientemente (D6): el estado actual en esas zonas no es «acierto preciso», es «ningún acierto». Si midiera mal, el radio de acierto puede escalarse con la densidad local del brazo.

- **La malla de colisión transparente interfiere con el bloom o con el orden de transparencias.** `UnrealBloomPass` está deliberadamente contenido (0.32 / 0.25 / 0.6) y una capa extra de transparencias puede velarlo. → No escribir en el buffer de profundidad y verificar visualmente contra el estado actual antes de dar el paso por bueno.

- **Dos umbrales son dos números que envejecen.** Si el cromo crece, 900 y 1100 dejan de corresponder a la aritmética que los originó. → Quedan documentados aquí con la cuenta que los produce, para que quien los cambie sepa qué estaba midiendo.

- **La hoja inferior compite con `Semestres`, que vive justo ahí.** → En el tramo donde el panel es hoja, `Semestres` ya está colapsado por D5. Las dos reglas se sostienen mutuamente y hay que implementarlas juntas.

- **`plan-de-inscripcion` no ha aterrizado.** → Es prerrequisito duro. Si se implementara antes, D4 no tendría destino y el umbral dejaría al usuario sin nada.

## Migration Plan

Sin migración de datos. Todo el cambio es presentación e interacción.

Orden que mantiene la app usable en cada paso:

1. Extraer `ui/panel.ts` y unificar las tres definiciones del ancho (D3). Sin efecto visible en escritorio; arregla ya la supresión de etiquetas en ventanas estrechas.
2. Añadir `ui/tramos.ts` y la medición, sin consumirla todavía.
3. Aplicar el reflujo del tramo compacto, isla por isla, verificando en cada una que el tramo amplio no se mueve.
4. Panel como hoja inferior bajo `ANCHO_DOS_COLUMNAS`, con la capa de etiquetas ajustada.
5. Vista por defecto bajo `ANCHO_MINIMO_GRAFO`, con la vía de escape (D4).
6. Interacción táctil: área de acierto (D6), toque contra órbita (D7), parada de la rotación.

Reversión: cada paso está acotado. El 6 es el único que toca la escena 3D y puede revertirse solo, dejando el reflujo en pie.

## Open Questions

- **¿900 y 1100 son los números correctos?** Salen de la aritmética del cromo actual, no de medir con usuarios. Convendría verificarlos en una tableta real en ambas orientaciones antes de fijarlos.
- **¿La hoja inferior debe poder arrastrarse a media altura**, o basta con una altura fija desplazable? Empezar por altura fija es más barato y puede que suficiente.
- **¿El aviso de «el grafo necesita más ancho» debe recordarse**, de modo que quien ya eligió verlo igual no lo reciba en cada visita? Requiere persistir una preferencia, y hoy `localStorage` solo guarda historial.
- **¿Qué pasa en un teléfono apaisado** (~800 × 375)? Cae en `estrecho` por ancho, pero la altura es el problema real y ninguno de los dos umbrales la mira. Puede que haga falta un tercer criterio, o puede que no valga la pena.
