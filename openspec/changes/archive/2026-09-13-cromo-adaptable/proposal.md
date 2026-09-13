## Why

El cromo de la aplicación asume un viewport que nunca se declaró. En todo `src/` hay **una sola** utilidad responsive de Tailwind (`sm:grid-cols-2`, en la calculadora); todo lo demás son islas `absolute` clavadas a las cuatro esquinas con anchos fijos.

Eso no falla solo en un teléfono. Falla en una ventana de portátil sin maximizar:

```
  Leyenda      bottom-4 left-4, w-76        →  ocupa  16 … 320 px
  Semestres    bottom-4, centrada, ~390 px  →  empieza en  W/2 − 195

  se solapan cuando   W/2 − 195 < 320   ⟹   W < ~1030 px
```

A 375 px la situación es peor: el buscador (320 px) choca con los controles de cámara, la barra de semestres (~390 px) es más ancha que la pantalla y queda recortada por el `overflow: hidden` del `body`, y el panel de detalle ocupa 343 de 375 px — tapa por completo el grafo que debería estar explicando.

Hay además un problema que no es de anchura. El cono de dependencias, que es *la* aportación del grafo, solo se enciende con `onNodeHover`. **En táctil no existe el hover.** Y acertar discos de 17 px que se mueven mientras orbitas con el mismo dedo no es una interacción que se degrade: es una que no funciona.

La conclusión no es «hacer el grafo 3D responsive». Es declarar dónde vive cada vista y que la aplicación se comporte en consecuencia, en vez de dejar el solapamiento a la suerte del ancho de ventana.

## What Changes

- **Un umbral declarado, no implícito.** El grafo orbital tiene un ancho mínimo por debajo del cual la aplicación ofrece la lista del pensum en su lugar, con una vía explícita para insistir en el grafo si el usuario quiere.
- **Reflujo del cromo entre el umbral y el escritorio holgado.** En el tramo intermedio —el portátil sin maximizar, donde hoy se solapan leyenda y semestres— las islas se recolocan y se colapsan en vez de pisarse:
  - `Leyenda` y `Semestres` dejan de competir por la banda inferior.
  - `Semestres` acorta su barra cuando no caben los diez botones.
  - `Cabecera`, `Buscador` y el conmutador de vistas dejan de invadir la esquina opuesta.
- **El panel de detalle deja de ser siempre un panel lateral.** Por debajo del umbral de dos columnas pasa a hoja inferior, dejando ver el grafo detrás.
- **El ancho del panel deja de estar escrito tres veces.** Hoy vive como `w-[22rem]` en `PanelDetalle`, como `right: '24rem'` en `App` y como `ANCHO_PANEL = 368` en `GrafoOrbital` — y en pantallas estrechas las tres discrepan, así que las etiquetas esquivan un borde que no existe. Pasa a ser un valor único que las tres consumen.
- **Interacción táctil de primera clase en el grafo:**
  - Un toque sobre una materia enciende su cono y la selecciona, sin depender del hover.
  - El área de acierto de un nodo se amplía respecto a su radio visible.
  - La rotación automática se detiene ante cualquier gesto del usuario.
- **La lista del pensum es la vista por defecto en pantallas estrechas**, cerrando el hueco que abre el umbral.

**Fuera de alcance en este cambio:**
- Construir la lista del pensum: la aporta `plan-de-inscripcion`, que es prerrequisito de este cambio.
- Rediseñar la calculadora, que ya reflúye razonablemente y cuyo problema es otro.
- Anillo de foco, movimiento reducido y atajos de teclado: eso es `accesibilidad-operable`.
- Gestos avanzados en el grafo (pellizcar para acercar más allá de lo que ya da la cámara orbital, doble toque para enfocar).
- Una app instalable, modo sin conexión o cualquier envoltorio nativo.

## Capabilities

### New Capabilities

- `cromo-adaptable`: Las reglas de disposición del cromo 2D según el ancho disponible — los tramos declarados, el reflujo de cada isla, el panel de detalle como hoja inferior, el ancho de panel como valor único, y la elección de vista por defecto bajo el umbral del grafo.

### Modified Capabilities

- `graph-interaction`: el cono de dependencias y la selección dejan de depender del cursor; el toque es un canal de primera clase y el área de acierto de un nodo se desacopla de su radio visible.
- `graph-navigation`: la barra de semestres y los controles de cámara se adaptan al ancho; la rotación automática se detiene ante la intervención del usuario.

## Impact

- **Depende de `plan-de-inscripcion`.** Sin la lista del pensum, «bajo el umbral ofrecemos otra vista» no tiene destino. Este cambio debe implementarse después.
- **`App.tsx` concentra el reflujo.** Las cinco islas se posicionan hoy con `absolute` y clases literales dentro de `App`; ahí es donde entran las reglas de tramo. La alternativa —que cada componente decida su sitio— repartiría el conocimiento del layout entre seis archivos.
- **Nuevo módulo pequeño**: un observador del ancho del contenedor y la definición de los tramos, para que el umbral sea un valor con nombre y no un número repetido en cada `className`.
- **`ANCHO_PANEL` sale de `GrafoOrbital`.** Ese `368` es hoy la razón por la que `CapaEtiquetas` recibe `bordeDerecho`; al unificarse el valor, la capa de etiquetas pasa a recibir el ancho real del panel, no una constante que lo aproxima.
- **La interacción táctil toca `nodeThreeObject` y la configuración de `react-force-graph-3d`.** Ampliar el área de acierto sin agrandar el disco visible implica geometría de colisión separada de la geometría visible. Es el punto de mayor riesgo técnico del cambio.
- **`girando` se vuelve interactivo.** Hoy es un booleano que solo cambia por el botón y por `irA`; pasa a apagarse también ante gestos sobre el lienzo.
- **Riesgo de regresión en escritorio.** Este cambio toca la disposición que hoy funciona bien a 1280 px. El tramo ancho debe quedar idéntico a como está: cualquier movimiento ahí es un coste sin beneficio.
- **Sin dependencias nuevas.** Los tramos se resuelven con `ResizeObserver` y utilidades de Tailwind ya disponibles.
