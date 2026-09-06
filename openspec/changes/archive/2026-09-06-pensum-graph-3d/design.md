## Context

El repo está vacío (solo `README.md`). Existen dos fuentes del pensum de Ingeniería en Informática de la UNET, ambas en conflicto parcial:

- **Canva** (`Pensum de Ingeniería Informática UNET`, autor John Llanes, actualizado 06/05/2026) — DAG dibujado a mano en columnas por semestre, con las compuertas por créditos ya resueltas visualmente (relleno gris + tabla-leyenda aparte). No tiene códigos de asignatura.
- **PDF oficial** (`unet.edu.ve/informatica/Servicios/Pensum/PensumNuevo.pdf`) — tabla con códigos, horas y créditos. Más antiguo y con datos que el Canva corrige.

Al analizar el grafo real emergieron tres hechos que gobiernan todo el diseño:

1. **No es una nube, es un río trenzado.** 58 nodos, ~50 aristas, profundidad 9, grado de salida máximo 3. No hay hubs que descubrir; hay caminos que seguir. Un force-directed libre convertiría estructura legible en spaghetti.
2. **Las filas del Canva no son semánticas.** Son minimización manual de cruces de líneas. Estadística II vive en la fila de Inglés; Comunicaciones en la de Matemática I. El autor peleó contra una restricción de layout 2D.
3. **Hay "aristas" que no son nodo→nodo.** Nueve materias se desbloquean por umbral de créditos acumulados (12, 78, 90, 100, 110, 126 UC, 80%, 100%), no por aprobar una materia concreta. Eso no tiene representación en un grafo puro.

El argumento real para 3D no es estético: **en 3D el problema de cruce de aristas desaparece**, lo que libera la posición para significar algo.

## Goals / Non-Goals

**Goals:**

- Un dataset curado, versionado y **validable automáticamente** que sea la fuente de verdad única — más confiable que cualquiera de las dos fuentes por separado.
- Una vista 3D donde **radio, ángulo y elevación tienen significado**, no son decoración.
- Responder de un vistazo dos preguntas que el papel no puede: *"¿qué necesito antes de X?"* y *"¿qué desbloquea X?"*.
- Una frontera dura entre **modelo** y **render**, para poder cambiar de librería de visualización sin tocar los datos ni los algoritmos.

**Non-Goals:**

- Estado del usuario, materias aprobadas, progreso personal. Diferido a un cambio posterior — pero el modelo se diseña para admitirlo sin refactor.
- Vista malla 2D (xyflow + elkjs). Es la ruta de escape conocida si el 3D resulta poco práctico, no parte de este MVP.
- Rendimiento a escala. 58 nodos no es un problema de rendimiento; optimizar para 100k nodos (Cosmograph, Sigma.js) compraría escala que no necesitamos pagando en control estético.
- Otras carreras de la UNET.

## Decisions

### D1 — Fusión de fuentes: el Canva manda, el PDF aporta códigos

El Canva es más nuevo (06/05/2026) y más correcto en contenido. El PDF es la única fuente de códigos de asignatura.

| Dato | PDF | Canva | Resuelto |
|---|---|---|---|
| Metodología de la Investigación | 120 UC | **110 UC** | Canva |
| Servicio Comunitario | 1 nodo sin prelación | **3 nodos** (Seminario SC 78 UC → Proyecto SC 78 UC → Servicio Comunitario) | Canva |
| Inglés I / II | S3 / S4 | **S2 / S3** | Canva |
| Catálogo de electivas | 12 ítems | **13 ítems** (incluye Redes Neurales y Lógica Difusa, Aprendizaje Automático, IA, Interfaces Digitales Biomédicas) | Canva |
| Códigos de asignatura | **✅ los 55** | ninguno | PDF |

*Alternativa descartada:* dejar el PDF como autoridad por ser institucional. Se rechazó porque el Canva corrige errores demostrables y está fechado 2026.

*Alternativa descartada:* registrar ambos valores con un campo `conflicto` y mostrar badges de advertencia. Añade complejidad de UI a cambio de honestidad que se puede lograr más barato — un campo `fuente` por materia y una fecha de última verificación cubren la trazabilidad.

### D2 — Las compuertas por créditos son atributo del nodo, no arista

```jsonc
{ "id": "electiva-1", "nombre": "Electiva I", "sector": null,
  "prelaciones": [], "gate": { "uc": 90 } }

// caso mixto — gate y prelación conviven sin ensuciar el DAG
{ "id": "1123403", "nombre": "Ecología y Cont. Ambiental",
  "sector": "ciencias", "prelaciones": ["914201"], "gate": { "uc": 100 } }
```

Es la misma decisión que ya tomó el Canva (gris + leyenda aparte), y la heredamos.

*Alternativa descartada:* un nodo-compuerta explícito `⚡ 90 U.C.` que recibe aristas de todo lo anterior. Visualmente dramático, pero infla el grafo en ~50 aristas por compuerta y rompe los algoritmos de cono (todo sería ancestro de todo).

*Alternativa descartada:* un anillo-barrera puramente decorativo. Metáfora de portal muy lograda, pero no es consultable — no se puede preguntar "¿qué me falta para la Electiva?".

**Consecuencia:** `gate != null` y `sector == null` son **ortogonales**. `gate` controla el *material* (translúcido/gris + badge UC); `sector == null` controla la *posición* (órbita libre). Ecología tiene gate y sector: se posiciona en su brazo y se pinta en gris. Las Electivas tienen gate y no tienen sector: flotan.

### D3 — Layout analítico determinista, no simulación de física

Las posiciones se calculan con una fórmula cerrada y se fijan vía `fx/fy/fz`. Sin simulación.

```
r     = R0 + semestre · ΔR          radio  = semestre  (1..10)
θ     = arco del sector, repartido  ángulo = sector
y     = escalonado dentro de celda  elevación desambigua colisiones
```

Determinista, reproducible, sin jitter, sin esperar a que converja. Con 58 nodos el force layout no aporta nada y cuesta control.

*Alternativa descartada:* `d3Force('radial', forceRadial(...))` con física. Válida y más fácil de arrancar, pero el ángulo quedaría a merced del solver y perderíamos el significado de θ, que es justo el aporte del diseño.

### D4 — Sunburst orbital: radio = semestre, ángulo = sector, ancho ∝ nº de materias

```
                        MATEMÁTICA (11)
                  CIENCIAS ╲   │   ╱ SISTEMAS (7)
                       (6)  ╲  │  ╱
        GESTIÓN (3) ─────────╲ │ ╱───────── PROGRAMACIÓN (8)
                              ⊙
        FORMACIÓN (10) ──────╱ │ ╲────────── DATOS (5)
                            ╱  │  ╲
                       GRADO (4)

        r=1  r=2  r=3 · · · r=9  r=10    ← anillos = semestres
```

El ancho angular de cada sector es proporcional a su número de materias, así que **Matemática y Modelado sale siendo el brazo más ancho de la carrera** — lo cual es verdad, y el diseño lo dice sin escribirlo.

**Orden cíclico de los sectores** elegido para minimizar la longitud de arco de las aristas que cruzan brazos:

```
formacion → gestion → matematica → ciencias → sistemas → programacion → datos → grado → (formacion)
```

Esto deja adyacentes los pares que realmente se cruzan: `matematica↔gestion` (Mat II → Economía), `matematica↔ciencias` (Mat I → Física I), `ciencias↔sistemas` (Física II → Lógica Digital), `sistemas↔programacion` (S.O. → Compiladores), `programacion↔datos` (Prog II → BD I), `gestion↔formacion` (Economía → Legislación). Queda un solo cruce largo: `Matemática Discreta → Programación I`, que se acepta.

**Lo que esta geometría revela sin que nadie lo programe:**

```
              Programación II  ← EL CRUCE
                    ╱ │ ╲
       Org.Computador  BD I  Automatización
          (sistemas) (datos)  (sistemas)

  Sus 3 aristas salientes cruzan a otro brazo.
  Es el punto donde la carrera se abre en abanico.


    SI II (datos) ─────┐
                       ├──▶  INGENIERÍA DE SOFTWARE  (programación)
    S.Distrib (sist.) ─┘
                       └──  tres brazos convergiendo en el anillo 9.
                            Es el sumidero del DAG.
```

Y el arco larguísimo del Canva `Química General I ⟶ Ecología`, que cruza toda la lámina, se convierte en **una línea radial recta dentro del brazo de Ciencias Básicas**. La geometría lo arregla gratis.

### D5 — La taxonomía de sectores se deriva de los códigos departamentales

Los prefijos de código son un agrupamiento institucional real y observable:

```
826 → Matemática I-IV          1013 → Economía
834 → Mat.Discreta, Estadística, Análisis Numérico
846/842 → Física + Laboratorios 1023 → Inglés
914 → Química                   1032/1033 → Formación integral
1123 → Ecología                 134 → Ingeniería Económica
41x/42x → todo el núcleo de Informática   ← demasiado grueso, se parte por tema
```

Los 8 sectores resultantes viven **como campo del dataset, no hardcodeados en el render**, para que reasignar una materia sea editar JSON.

**Casos de juicio documentados** (donde la asignación es discutible y podría cambiar):
- `Matemática Discreta` → *matematica* (código 834, mismo departamento que Estadística) pese a que su única arista va a Programación I.
- `Introducción a la Ing. Informática` → *programacion*, como semilla de la carrera, aunque temáticamente es general.
- `Teoría General de Sistemas` → *datos*, porque alimenta Base de Datos I.
- `Multimedia` → *programacion*, aunque viene de Base de Datos I.

### D6 — `react-force-graph-3d` ahora, `react-three-fiber` como puerta de salida

`react-force-graph-3d` acepta posiciones fijas vía `fx/fy/fz` y trae bloom post-processing, que es exactamente lo que D3 y la estética "futurista" necesitan. Llega a algo funcionando rápido.

La frontera es deliberada:

```
pensum.json  ──▶  graph-model (graphology)  ──▶  layout analítico (r,θ,y)
                                                         │
                                                         ▼
                                              ┌──────────────────────┐
                                              │  react-force-graph-3d │  ← reemplazable
                                              └──────────────────────┘
```

El layout devuelve coordenadas puras. El render solo las consume. Migrar a `react-three-fiber + drei + @react-three/postprocessing` — necesario el día que se quieran shaders custom (pulsos viajando por las aristas, nodos que respiran, transiciones de cámara cinematográficas) — **no toca `pensum-dataset` ni `graph-model`**.

*Alternativas descartadas:* `Cosmograph`/`cosmos.gl` y `Sigma.js` optimizan para 100k+ nodos, restricción que no tenemos, a cambio de menos control estético y sin mallas 3D por nodo. `react-globe.gl` gastaría dos dimensiones (lat/lon) en algo sin semántica geográfica.

### D7 — Tokens de color en CSS variables, consumidos por los dos mundos

Tailwind no puede estilizar WebGL. El design system se parte en dos: chrome 2D (Tailwind) y grafo 3D (materiales three.js). Para que no se desincronicen, los colores de sector viven en CSS custom properties, leídos por Tailwind vía config y por el render vía `getComputedStyle` al montar.

### D8 — Los correquisitos se dibujan distinto a las prelaciones

El Canva dibuja `Física I ↔ Lab. Física I` con la misma línea que una prelación, lo cual es incorrecto: un correquisito es bidireccional y del mismo semestre. En el modelo son una arista aparte; en el render, una línea corta sin dirección y con tratamiento visual propio (mismo anillo, materias hermanas).

## Risks / Trade-offs

**[Los datos no están verificados contra Control de Estudios]** → Cada materia lleva campo `fuente` (`canva` | `pdf` | `fusion`) y el dataset lleva fecha de última verificación, visible en la UI. Las discrepancias de D1 quedan documentadas, no silenciadas.

**[58 etiquetas rotando en 3D son ilegibles]** → Las etiquetas no se muestran todas: aparecen en hover, en selección, y en todo el cono iluminado. El resto son nodos sin texto. La búsqueda cubre el caso "sé qué busco".

**[El 3D puede resultar poco práctico para planificar]** → Es un riesgo real y aceptado: la vista malla 2D queda especificada como diferida, no descartada. Si al usar el MVP la navegación estorba, el modelo ya está listo para alimentar xyflow sin cambios.

**[La taxonomía de sectores es invención del proyecto]** → No existe en ninguna fuente oficial y podría no coincidir con la visión del departamento. Mitigado por D5: vive en el dataset como campo editable. Cambiar un sector es una línea de JSON, no un refactor.

**[Acoplarse a la API de escena de `react-force-graph-3d`]** → Mitigado por D6. La regla es que el layout produce coordenadas puras y el render no filtra nada hacia el modelo.

**[Nodos que colisionan dentro de una misma celda (sector, semestre)]** → El escalonamiento en Y de D3 lo resuelve determinísticamente. Se valida como test: ninguna pareja de nodos a menos de una distancia mínima.

## Open Questions

- **Códigos faltantes**: `Automatización` y las cuatro `Electiva` no tienen código en ninguna fuente. Se les asigna id provisional (`automatizacion`, `electiva-1..4`) pendiente de confirmar con Control de Estudios.
- **Metodología de la Investigación**: ¿110 UC (Canva) o 120 UC (PDF)? Se toma 110 por D1, pero conviene verificar.
- **Inglés I**: el Canva lo ubica en Semestre II y el PDF en Semestre III. Como está gated a 12 UC, el semestre es nominal y afecta poco — pero determina en qué anillo se dibuja.
- **Investigación de Operaciones I**: el PDF dice que prela de Matemática IV; la adyacencia visual del Canva sugiere Análisis Numérico. Se toma el PDF (`826401`) por ser explícito, pendiente de verificar.
- **Sectorización de los cuatro casos de juicio de D5** — abierta a revisión del usuario antes de congelar el dataset.
