# Layout y render

## El diseño en tres líneas

```
   radio     = semestre    → los anillos concéntricos son el tiempo
   ángulo    = sector      → cada brazo es un área de conocimiento
   elevación = desempate   → separa materias que caen en la misma celda
```

`src/layout/orbital.ts` es una función **pura** de coordenadas. No sabe qué es three.js;
el render la consume y fija las posiciones, y ningún solver las mueve después.

### Consecuencias que la geometría regala

- **Todas las aristas apuntan hacia afuera.** El radio crece con el semestre y toda
  prelación va de un semestre anterior a uno posterior, así que la dirección se lee sin
  flechas. Lo verifica `orbital.test.ts`: si esa prueba falla, el dataset tiene una
  prelación temporalmente incoherente.
- **El ancho de cada brazo es proporcional a su número de materias.** Matemática y
  Modelado (11) sale siendo el brazo más ancho de la carrera. Eso es verdad, y el diseño
  lo dice sin escribirlo.
- **Programación II es el cruce**: sus tres aristas salientes van a otro brazo. Es donde
  la carrera se abre en abanico.
- **Ingeniería del Software es el sumidero**: tres brazos distintos convergen en él.

## Parámetros del layout

`OPCIONES_POR_DEFECTO`:

| Opción | Valor | Por qué |
|---|---|---|
| `radioBase` | 130 | El anillo del semestre 1 arranca lejos del centro a propósito: su circunferencia limita cuánto pueden separarse las materias tempranas, y por tanto cuán grandes pueden dibujarse los nodos. |
| `radioPaso` | 52 | Incremento por semestre. |
| `pasoElevacion` | 26 | Escalonamiento simétrico (0, ±1, ±2…) dentro de una celda. |
| `elevacionOrbitaLibre` | 150 | Altura de las materias sin sector. |
| `margenSector` | 0.12 | Fracción del arco que se deja libre para que los brazos vecinos no se toquen. |
| `anguloInicial` | 3π/2 (270°) | Sitúa la **costura** del sunburst — el único ángulo garantizado sin materias — en la parte alta de la pantalla, zona libre de cromo. De ahí cuelgan las etiquetas de semestre sin pisar nada. |

### El orden de los sectores no es alfabético

```ts
['formacion', 'gestion', 'matematica', 'ciencias',
 'sistemas', 'programacion', 'datos', 'grado', 'deportiva']
```

Está elegido para dejar **adyacentes los pares que realmente se cruzan**: gestión↔formación
(Economía → Legislación), matemática↔gestión (Mat. II → Economía), matemática↔ciencias
(Mat. I → Física I), ciencias↔sistemas (Física II → Lógica Digital), sistemas↔programación
(S.O. → Compiladores), programación↔datos (Prog. II → BD I). Queda un solo cruce largo
aceptado: Matemática Discreta → Programación I.

`deportiva` se inserta entre `grado` y `formacion` porque `grado` es el único sector sin
aristas cruzadas: meterlo ahí no separa ningún par que las tenga.

### Determinismo

`calcularLayout` agrupa por celda `(sector, semestre)` y **ordena por id** antes de
repartir. Mismas materias, mismas coordenadas, siempre — el orden del dataset no altera
el resultado. Las materias sin sector (las cuatro Electivas) no pertenecen a ningún
brazo: se reparten en la circunferencia completa, elevadas fuera del plano principal.

### El tamaño de los nodos se deriva, no se fija

`separacionMinima(layout)` devuelve la distancia entre las dos materias más cercanas. El
render dibuja cada nodo con `separacion × 0.29` (y `× 0.23` las materias con compuerta,
que se leen como «todavía no ancladas»). En 0.5 los nodos más cercanos se tocarían. Al
derivarlo así, un cambio en el layout ajusta los nodos solo, en vez de dejarlos diminutos
o solapados sin que nadie se entere.

### Encuadre calculado, no ajustado a ojo

`zoomToFit` de react-force-graph depende del ciclo de simulación, que aquí está
desactivado. `distanciaDeCamara(radio, fov, margen, aspecto)` lo resuelve
analíticamente: `R / sin(fov/2)`, con corrección por aspecto cuando la ventana es más
alta que ancha (en three.js el `fov` es siempre el vertical). El fov por defecto es 50
porque react-force-graph construye su cámara con `new THREE.PerspectiveCamera()` sin
argumentos.

### Referencias visibles

El diseño codifica semestre y sector en la geometría, pero sin nada dibujado esas dos
reglas son invisibles: el usuario tendría que creerse la explicación en vez de leerla.
`referencias()` produce:

- **Anillos guía** por semestre, con el punto de la costura donde va la etiqueta `S1`…`S10`.
- **Nombres de brazo**, colocados justo fuera de la materia más lejana del sector, en su
  centro angular.

## Render 3D (`src/view/GrafoOrbital.tsx`)

Consume el layout y fija las posiciones con `fx/fy/fz`; la simulación queda desactivada
con `cooldownTicks={0}`.

| Aspecto | Decisión |
|---|---|
| **Objetos three.js** | Se construyen una vez y se **mutan** al resaltar. Regenerarlos produce parpadeo al mover el cursor. |
| **Estilado** | Se aplica en dos momentos: al crear cada nodo y cuando cambia el estado. Solo con el efecto no basta — en el primer render el mapa de objetos aún está vacío y un historial ya cargado no se vería hasta la siguiente interacción. |
| **Bloom** | `UnrealBloomPass(…, 0.32, 0.25, 0.6)`: halo escaso y umbral alto. La paleta tiene el doble de luminancia entre el token más claro y el más oscuro; cualquier ajuste que ilumine a los apagados funde a los brillantes en cápsulas. |
| **Medida del contenedor** | `ResizeObserver` propio: react-force-graph mide su contenedor una vez al montar, y al maximizar la ventana el canvas se quedaba con el tamaño viejo mientras las etiquetas proyectaban sobre el nuevo. |
| **Zoom** | Acotado, para que la estructura nunca se pierda de vista ni el bloom se queme al acercarse a un nodo. |

### Cómo se codifica el estado

El estado de progreso **modula** la opacidad del color de sector en vez de sustituirlo:
la materia sigue diciendo a qué brazo pertenece. Con historial vacío no se atenúa nada,
para que la vista de partida sea la de siempre.

| Estado | Opacidad | Razón |
|---|---|---|
| `disponible` | 1.00 (y ×1.3 de tamaño) | Es la respuesta a «qué inscribo ahora» |
| `en-curso` | 0.85 | |
| `aprobada` | 0.70 | Está hecho: ya no es una decisión |
| `bloqueada-credito` | 0.28 | Más presente que la otra: está más cerca de abrirse |
| `bloqueada-prelacion` | 0.16 | |

En el resaltado, el nodo activo escala ×1.35 y los descendientes ×1.12 — lo que se
desbloquea «crece». Lo filtrado o fuera del cono baja a opacidad 0.06.

### Cámara

| Orden | Posición |
|---|---|
| `inicial` | ~60° sobre el plano (`y = d·0.866, z = d·0.5`): cenital para leer anillos y brazos, inclinada para que se note el relieve |
| `cenital` | Casi a plomo: brazos y anillos sin deformación, a costa del relieve |
| `enfocar` | Distancia fija del nodo, alejándose del origen por su misma dirección radial, de modo que el nodo queda centrado **pero su brazo sigue visible** |

Cada orden lleva un `nonce` para poder repetirla aunque el destino no cambie.

## Etiquetas: capa HTML, no sprites 3D

`src/view/CapaEtiquetas.tsx` proyecta a coordenadas de pantalla en lugar de usar sprites.
Los sprites no se pueden separar cuando chocan: cada uno vive en su posición de mundo y
se pisan en cuanto dos materias se proyectan cerca, que es justo lo que pasa a lo largo
de un brazo. Proyectando se pueden resolver colisiones, esquivar el panel de detalle
(368 px) y estilar el texto con Tailwind como el resto del cromo.

Qué se etiqueta:

- **Siempre**: anillos de semestre y nombres de brazo — hacen legible la geometría sin
  necesidad de interactuar.
- **Bajo demanda**: nombres de materia solo donde aportan — cursor, selección y cono. Al
  recorrer por semestre se etiqueta el anillo entero.

## Aristas

| Tipo | Color | |
|---|---|---|
| `intra-sector` | `--color-edge-intra` | Dentro del mismo brazo |
| `cruce-sector` | `--color-edge-cross` | Los momentos interesantes del pensum |
| `correquisito` | `--color-edge-correq` | Fuera del DAG |

El grosor va en proporción al radio del nodo: si los nodos crecen, las aristas no quedan
como pelos al lado. Dentro de un cono, ancestros y descendientes se distinguen por color.

## Tokens de color

Definidos una sola vez en `src/index.css` bajo `@theme static` y leídos por
`view/tokens.ts`. Ver [Arquitectura → Un solo puente entre Tailwind y WebGL](01-arquitectura.md#un-solo-puente-entre-tailwind-y-webgl).

| Token | Valor |
|---|---|
| `--color-sector-matematica` | `#fbbf24` |
| `--color-sector-formacion` | `#60a5fa` |
| `--color-sector-programacion` | `#22d3ee` |
| `--color-sector-sistemas` | `#34d399` |
| `--color-sector-ciencias` | `#fb7185` |
| `--color-sector-datos` | `#c084fc` |
| `--color-sector-grado` | `#f472b6` |
| `--color-sector-gestion` | `#94cc2e` |
| `--color-sector-deportiva` | `#fb923c` |
| `--color-sector-none` | `#94a3b8` |
| `--color-void` | `#05060a` |

`gestion` está algo más apagado que el lima puro: era el único token por encima del
umbral del bloom, y su halo leía como un énfasis no buscado.
