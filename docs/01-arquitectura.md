# Arquitectura

## La frontera que ordena todo

Cinco de las ocho carpetas de `src/` **no importan React ni three.js**. Son puras y
corren en Node sin DOM:

```
src/
├── data/          esquema, dataset y validación          ← puro
├── model/         grafo, conos, orden topológico          ← puro
├── layout/        posiciones (r, θ, y)                    ← puro
├── evaluacion/    plan de parciales, nota definitiva      ← puro
├── progreso/      historial, índice, estados derivados    ← puro
├── persistencia/  localStorage, versión, migración        ← toca el navegador
├── view/          render three.js + tokens de color       ← navegador
└── ui/            cromo 2D en Tailwind                    ← navegador
```

Consecuencias directas de esa frontera:

- **Las 233 pruebas corren en `environment: 'node'`.** Ninguna necesita jsdom, ninguna
  monta un componente. Lo que se prueba es el cálculo, que es lo que puede estar mal de
  forma silenciosa.
- **El render consume, no decide.** `react-force-graph-3d` recibe coordenadas ya
  calculadas y no devuelve nada hacia el modelo. Si un día se quieren shaders propios,
  el render migra a `react-three-fiber` sin tocar datos ni algoritmos.
- **`persistencia/` es la única parte de la capa de progreso que toca el navegador**, y
  se comunica con el resto a través de una interfaz mínima (`Almacen`), lo que permite
  probar carga, guardado, corrupción y migración sin navegador.

## Flujo de datos

```
  pensum.ts ──┬─→ validarPensum()          →  npm run validate / suite
              │
              ├─→ construirGrafo()         →  PensumGraph { dag, materias, correquisitos }
              │        │
              │        ├─→ calcularResaltado(id)   →  conos ancestros/descendientes
              │        ├─→ ordenTopologico / profundidades
              │        └─→ buscar(texto)
              │
              └─→ calcularLayout()         →  Map<id, { x, y, z, radio, angulo }>
                                                     │
  localStorage ─→ cargarHistorial() ─→ Historial ────┤
                                          │          │
                                          ├─→ resumen()          → índice, U.C., avance
                                          └─→ estadosDeTodas()   → estado por materia
                                                     │
                                                     ▼
                                            GrafoOrbital (three.js)
                                            + cromo 2D (Tailwind)
```

Todo lo derivado se recalcula por completo en cada cambio. Con 68 materias eso es
instantáneo, y evita la clase de error más cara de esta aplicación: un estado guardado
que se desincroniza de la única fuente de verdad.

## Decisiones estructurales

### El estado de una materia nunca se persiste

Se guarda el **historial de intentos**; `aprobada`, `disponible` o `bloqueada-credito`
se derivan de él en cada render (`progreso/estados.ts`). Persistir el estado invitaría a
que se desviara del historial que lo produjo.

### El DAG contiene solo prelaciones

Correquisitos y compuertas quedan fuera del grafo dirigido:

- Los **correquisitos** son bidireccionales y del mismo semestre. Dentro del DAG serían
  un ciclo y romperían el orden topológico. Viven en una lista aparte, un par por vez.
- Las **compuertas** por créditos no son aristas: son un atributo del nodo. Modelarlas
  como nodo añadiría ~50 aristas y haría que todo fuera ancestro de todo, destruyendo
  los conos de dependencia.

### Los conos se calculan en el modelo, no en el render

`calcularResaltado(grafo, id)` devuelve conjuntos de ids y de claves de arista
(`desde→hasta`). El render solo consulta `rolEnCono(...)` para decidir opacidad y color.
La lógica de «qué se ilumina» es puro y tiene sus propias pruebas.

### La selección manda sobre el cursor

`activo = seleccion ?? hover`. Al hacer clic, el cono persiste aunque el ratón se retire,
que es lo que hace falta para leer el panel de detalle sin perder el resaltado.

### El historial se carga durante el render, no en un efecto

`localStorage` es síncrono. Cargarlo en un `useEffect` obligaría a un primer render con
historial vacío, y el efecto de guardado lo escribiría encima antes de que llegara el
real. Además, el guardado compara contra una referencia (`ultimoGuardado`) para no
sobrescribir un dato corrupto antes de que el usuario toque nada — eso borraría la
evidencia del problema.

### Enrutado por fragmento, sin dependencia

Dos vistas (`#/grafo`, `#/calculadora`) no justifican un router. `useVista` escucha
`hashchange` y navega escribiendo el fragmento, de modo que el botón atrás del navegador
queda dentro del mismo flujo y no hay dos fuentes de verdad. Un fragmento desconocido cae
en el grafo, sin error.

### Un solo puente entre Tailwind y WebGL

Tailwind no puede estilizar una escena 3D. Los colores viven **una sola vez** como
variables CSS en `src/index.css` (bloque `@theme static`) y `view/tokens.ts` los lee con
`getComputedStyle` al montar. Cambiar un token mueve la leyenda 2D y los nodos 3D a la
vez. En Node —donde no hay `window`— la lectura cae en valores de respaldo y avisa por
consola si una variable falta: eso significa que el puente está roto y hay dos
definiciones del mismo color en circulación.

`static` es obligatorio en `@theme`: Tailwind v4 descarta los tokens que no se usan como
clase utilitaria, y los colores de sector solo los lee el render 3D.

## Rendimiento

Los objetos three.js se construyen **una vez** y se mutan al resaltar, en lugar de
regenerarse en cada cambio de cursor — regenerarlos produce parpadeo. La simulación de
fuerzas está desactivada (`cooldownTicks={0}`): las posiciones vienen del layout
analítico y se fijan con `fx/fy/fz`, así que los nodos aparecen en su sitio en el primer
frame, sin converger ni temblar.

Como `zoomToFit` de react-force-graph depende del ciclo de simulación, el encuadre se
calcula a mano: para una esfera envolvente de radio *R* y una cámara de campo vertical
*fov*, la distancia mínima es `R / sin(fov/2)`, corregida por relación de aspecto cuando
la ventana es más alta que ancha.
