## Why

La app ya sabe responder la pregunta que el estudiante trae de verdad —*«¿qué puedo inscribir el semestre que viene?»*— y la tiene enterrada a cuatro pasos: abrir la leyenda, cambiar a la pestaña «estados», clicar «Disponible», y leer el grafo filtrado. Mientras tanto la cabecera, el sitio más visible de la pantalla, muestra índice y unidades de crédito, que son datos **retrospectivos**.

Peor: para que cualquiera de esos números exista hay que cargar el historial, y el único camino de entrada es el `EditorIntentos` dentro del panel de detalle, que solo aparece si hay una materia seleccionada en la escena 3D. Un estudiante de quinto semestre con treinta materias aprobadas tiene que localizar treinta discos de 17 px que se mueven al orbitar, y por cada uno: clic, panel, «añadir», tipo, nota, guardar, cerrar. Antes de pagar ese precio la app muestra índice `—` y casi todo en gris. **El estado vacío es el estado dominante en la primera visita**, y es donde se abandona.

Las dos cosas se resuelven con el mismo artefacto: una **lista del pensum**. Una lista responde «qué puedo inscribir» de un vistazo, permite cargar un semestre entero sin tocar la cámara, cabe en un teléfono —donde el grafo orbital no cabe— y es el equivalente textual que hoy un lector de pantalla no tiene, porque un `<canvas>` de WebGL no se anuncia.

## What Changes

- **Tercera vista: `#/plan`.** El pensum como lista agrupada por semestre, con el estado de cada materia, sus unidades de crédito y su sector. No sustituye al grafo: el grafo responde «cómo se conecta la carrera», la lista responde «qué hago con ella».
- **Captura de notas en lote.** Cada fila de la lista lleva el mismo `SelectorNota` de nueve enteros del Art. 39 que hoy vive en el panel. Cargar un semestre pasa de ~210 interacciones a ~30.
  - El tipo de intento por defecto es `regular`; los tipos especiales (equivalencia, suficiencia, retiro, en curso) siguen entrando por el editor completo, que se despliega desde la fila.
  - Una materia que ya tiene intentos muestra su nota efectiva y **no se pisa en silencio**: editar desde la lista abre el editor completo, nunca añade un intento a ciegas.
- **La cabecera responde lo inscribible.** Junto al índice y a las U.C. aparece una tercera celda —*«Puedes inscribir 7 · 19 U.C.»*— y es un control: lleva a la vista plan filtrada por `disponible`. Cuando el historial está vacío, esa celda es la invitación a cargarlo.
- **La lista es la vista accesible y la vista estrecha.** Es HTML semántico (`<table>` / listas con encabezados), operable solo con teclado, y es la vista que la aplicación ofrece cuando el grafo 3D no es viable: viewport estrecho o WebGL no disponible.
- **Filtro por estado compartido entre vistas.** El estado filtrado deja de ser propiedad de la leyenda y pasa a ser estado de la aplicación, para que la cabecera pueda dispararlo y la lista pueda leerlo.

**Fuera de alcance en este cambio:**
- El cromo del grafo sigue siendo de escritorio. Que la lista quepa en un móvil no arregla la escena orbital — eso es `cromo-adaptable`.
- Anillo de foco global, `prefers-reduced-motion` y el atajo de teclado del buscador — eso es `accesibilidad-operable`.
- Chips de filtro activo y materia en la URL — eso es `filtros-y-enlaces`.
- Proyecciones («qué necesito para llegar a 6,00») y simulación de inscripción («si apruebo estas tres, ¿qué se abre?»).
- Importar el historial desde un PDF o una captura de Control de Estudios.

## Capabilities

### New Capabilities

- `vista-plan`: La tercera vista del pensum como lista agrupada por semestre — estado, créditos y sector de cada materia, agregados por semestre, filtrado por estado, y su papel como vista de reserva cuando el grafo 3D no es viable.
- `captura-masiva`: El registro de notas en lote desde la lista — la escala del Art. 39 en cada fila, el tipo `regular` por defecto, y la regla de que una materia con historial previo nunca se sobrescribe sin abrir el editor completo.

### Modified Capabilities

- `progreso-en-grafo`: la cabecera suma el conteo de materias inscribibles con sus U.C., y esa celda navega a la lista filtrada.
- `captura-de-notas`: el panel de detalle deja de ser el único punto de entrada al historial; la escala, los tipos de intento y sus reglas pasan a ser compartidos entre panel y lista.
- `pestana-calculadora`: la navegación deja de ser entre dos vistas y pasa a ser entre tres, con `#/plan` como fragmento propio.

## Impact

- **Módulo nuevo**: `src/ui/Plan.tsx` (la vista) más la extracción de `SelectorNota` y `FormularioIntento` de `EditorIntentos.tsx` a piezas reutilizables. Ninguna dependencia nueva.
- **El modelo no se toca.** `estadosDeTodas`, `resumen` e `indice` ya devuelven exactamente lo que la lista necesita; `EstadoMateria === 'disponible'` **es** la respuesta a «qué puedo inscribir». Este cambio es interfaz sobre cálculo que ya existe y ya está probado.
- **`useVista` crece a tres rutas.** Hoy `RUTAS` mapea `''`, `#/`, `#/grafo` y `#/calculadora`; se añade `#/plan`. El fragmento desconocido sigue cayendo en el grafo sin error.
- **Estado que sube a `App`**: `estadoFiltrado` ya vive en `App` y se pasa a la leyenda, así que la cabecera y la lista pueden leerlo sin refactor. `Semestres` conserva su propio filtro de semestre: son preguntas distintas.
- **Riesgo de duplicar la escala.** Si `SelectorNota` se copia en vez de extraerse, la app acaba con dos definiciones de la escala del Art. 39 y una de ellas se desactualiza. La extracción no es opcional.
- **Riesgo de borrado silencioso.** La captura rápida y el historial de intentos están en tensión directa: un clic en la lista sobre una materia que ya tiene tres intentos no puede significar «reemplázalos». La regla de no sobrescribir es la que hace que la captura rápida sea segura, y tiene que estar en la spec, no solo en el código.
- **La vista de reserva tiene consecuencias de arranque.** Para ofrecer la lista cuando WebGL no está disponible hay que detectarlo antes de montar `GrafoOrbital`, que hoy se monta en cuanto hay medida (`tamano.ancho > 0`).
