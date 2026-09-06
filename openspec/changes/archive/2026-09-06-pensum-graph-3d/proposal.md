## Why

El pensum de Ingeniería en Informática de la UNET existe hoy como una lámina estática (Canva) y un PDF institucional. Ambos son grafos dirigidos de 58 materias dibujados a mano en 2D, donde el autor gastó un esfuerzo enorme en **enrutar líneas para evitar cruces** — y aun así responder "¿qué necesito antes de Ingeniería de Software?" o "¿qué se me cae si repruebo Programación II?" obliga a seguir líneas con el dedo a través de 1900px.

El grafo de prelaciones ya está ahí; lo que falta es poder **consultarlo**. Este cambio construye la base: un dataset curado y verificable, más una vista 3D donde la posición de cada materia significa algo y el cono de dependencias se ilumina al pasar el cursor.

## What Changes

- **Nuevo proyecto React + Vite + TypeScript + Tailwind** (el repo está vacío hoy).
- **Dataset curado `pensum.json`**: 58 materias con código, semestre, UC, horas, sector, prelaciones, correquisitos y compuertas por créditos. Se construye fusionando dos fuentes en conflicto:
  - **Canva (06/05/2026) manda** en contenido: gates UC, semestres, los tres nodos de Servicio Comunitario, catálogo de electivas.
  - **PDF oficial UNET aporta** los códigos de asignatura, que el Canva no tiene.
  - Discrepancias resueltas a favor del Canva y documentadas: Metodología de la Investigación 110 UC (no 120), Inglés I/II en semestres II/III (no III/IV), Servicio Comunitario como 3 nodos (no 1).
- **Tres tipos de relación explícitos y separables**, donde el Canva solo tenía uno:
  - `prelaciones` — arista dirigida, define el DAG.
  - `correquisitos` — bidireccional, mismo semestre (los Laboratorios de Física, que el Canva dibuja idéntico a una prelación).
  - `gate` — **atributo del nodo, no arista**. Umbral de créditos (12, 78, 90, 100, 110, 126 UC, 80%, 100%). No contamina el DAG y los algoritmos de grafo quedan limpios.
- **Taxonomía de 8 sectores de conocimiento**, derivada de los prefijos de código departamentales (826 Matemática, 846/842 Física, 914 Química, 1013 Economía, 1023 Inglés, 1032/1033 Formación) más una partición temática del bloque `41x/42x` de Informática. Esta taxonomía no existe en ninguna de las dos fuentes; es aporte del proyecto.
- **Vista 3D "sunburst orbital"** como vista principal: radio = semestre, ángulo = sector, ancho del sector proporcional a su número de materias. Posición **analítica y determinista**, no simulación de física.
- **Interacción de exploración**: orbit/zoom, hover ilumina el cono completo de ancestros y descendientes atenuando el resto, click abre panel de detalle en Tailwind, búsqueda por nombre/código.

**Fuera de alcance en este cambio** (explícitamente diferido):
- Estado del usuario / materias aprobadas / progreso.
- Vista malla 2D alternable (xyflow + elkjs).
- Detalle del catálogo de electivas como nodos navegables.
- Otras carreras de la UNET.

## Capabilities

### New Capabilities

- `pensum-dataset`: El dataset curado del pensum, su esquema, las reglas de fusión entre Canva y PDF, la taxonomía de sectores y la validación de integridad (DAG acíclico, referencias resueltas, semestres coherentes con las prelaciones).
- `graph-model`: El grafo en memoria construido sobre `graphology` y las consultas derivadas que la UI necesita — cono de ancestros, cono de descendientes, orden topológico, profundidad, y clasificación de aristas en intra-sector vs. cruce de sector.
- `orbital-graph-view`: El render 3D: cálculo analítico de posiciones (r, θ, elevación), asignación de sectores a arcos angulares, materialización de nodos y aristas en la escena, tratamiento visual diferenciado de nodos con `gate` y de correquisitos, y la cámara.
- `graph-navigation`: Lo que hace navegable la escena — anillos guía y nombres de sector siempre visibles, etiquetas que se esquivan entre sí, recorrido por semestre, controles de cámara y navegación con teclado.
- `graph-interaction`: El comportamiento de exploración — hover con iluminación del cono y atenuación del resto, selección con panel de detalle, búsqueda, y el chrome 2D en Tailwind (leyenda de sectores, tabla de compuertas UC).

### Modified Capabilities

Ninguna. `openspec/specs/` está vacío; este es el primer cambio del proyecto.

## Impact

- **Repo**: greenfield. Se crea la estructura completa del proyecto (hoy solo hay `README.md`).
- **Dependencias nuevas**: `react`, `react-dom`, `vite`, `typescript`, `tailwindcss`, `graphology` (+ `graphology-dag`, `graphology-traversal`), `react-force-graph-3d`, `three`.
- **Decisión de librería con puerta de salida**: `react-force-graph-3d` acepta posiciones fijas vía `fx/fy/fz`, que es exactamente lo que el layout analítico necesita. Si más adelante se requieren shaders custom (pulsos en aristas, nodos que respiran, transiciones cinematográficas), el render migra a `react-three-fiber` **sin tocar `pensum-dataset` ni `graph-model`**. La frontera entre modelo y render es deliberada.
- **Tailwind no estiliza WebGL**: los tokens de color viven en CSS variables, consumidos tanto por Tailwind (chrome 2D) como por los materiales de three.js (grafo 3D), para que no se desincronicen.
- **Deuda de datos conocida**: `Automatización` y las cuatro `Electiva` no tienen código en ninguna fuente; se les asigna un id provisional documentado, pendiente de confirmar con Control de Estudios.
