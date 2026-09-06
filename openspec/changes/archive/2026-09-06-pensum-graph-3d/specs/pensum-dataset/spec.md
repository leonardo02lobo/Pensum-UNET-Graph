## ADDED Requirements

### Requirement: Esquema de materia

El dataset SHALL representar cada materia como un objeto con los campos `id`, `nombre`, `semestre`, `uc`, `sector`, `prelaciones`, `correquisitos`, `gate` y `fuente`. Los campos `codigo` y `horas` SHALL estar presentes cuando la fuente los provea y ser `null` cuando no.

#### Scenario: Materia con prelación simple

- **WHEN** se lee la materia `425401` (Programación II)
- **THEN** tiene `codigo: "425401"`, `semestre: 4`, `uc: 3`, `sector: "programacion"`, `prelaciones: ["424301"]`, `correquisitos: []` y `gate: null`

#### Scenario: Materia sin código en ninguna fuente

- **WHEN** se lee `Automatización` o cualquiera de las cuatro `Electiva`
- **THEN** su `id` es un identificador provisional en kebab-case (`automatizacion`, `electiva-1`..`electiva-4`) y su `codigo` es `null`

#### Scenario: Materia con prelación múltiple

- **WHEN** se lee la materia `846302` (Física II)
- **THEN** su arreglo `prelaciones` contiene los tres ids `826201`, `846203` y `842204L`, interpretados como conjunción (todas requeridas)

### Requirement: Compuertas por créditos como atributo del nodo

El dataset SHALL representar los umbrales de créditos acumulados en el campo `gate` del nodo, nunca como arista del grafo. `gate` SHALL ser `null`, `{ "uc": <número> }` o `{ "pct": <número> }`.

#### Scenario: Compuerta pura sin prelación de materia

- **WHEN** se lee `electiva-1`
- **THEN** tiene `prelaciones: []` y `gate: { "uc": 90 }`

#### Scenario: Compuerta mixta con prelación de materia

- **WHEN** se lee `1123403` (Ecología y Contaminación Ambiental)
- **THEN** tiene `prelaciones: ["914201"]` **y** `gate: { "uc": 100 }`, y ambas condiciones se interpretan como conjunción

#### Scenario: Compuerta por porcentaje

- **WHEN** se lee `tap-tesis` (TAP Tesis)
- **THEN** tiene `gate: { "pct": 80 }` y `prelaciones: ["1033801"]`

#### Scenario: Cobertura completa de compuertas

- **WHEN** se listan todas las materias con `gate != null`
- **THEN** el resultado contiene exactamente nueve entradas con los umbrales 12, 78, 78, 90, 100, 110, 126, 80% y 100%, más las tres Electivas restantes que comparten el umbral de 90 UC

### Requirement: Correquisitos separados de prelaciones

El dataset SHALL registrar los correquisitos en un campo `correquisitos` distinto de `prelaciones`. Un correquisito SHALL declararse en ambas materias implicadas y ambas SHALL pertenecer al mismo semestre.

#### Scenario: Par de correquisitos declarado en ambos sentidos

- **WHEN** se lee `846203` (Física I) y `842204L` (Laboratorio de Física I)
- **THEN** `846203.correquisitos` contiene `842204L`, `842204L.correquisitos` contiene `846203`, y ambas tienen `semestre: 2`

### Requirement: Resolución documentada de discrepancias entre fuentes

El dataset SHALL adoptar el Canva del 06/05/2026 como autoridad de contenido y el PDF oficial de la UNET como autoridad de códigos de asignatura. Cada materia SHALL declarar su procedencia en `fuente` con valor `canva`, `pdf` o `fusion`. El dataset SHALL incluir metadatos con la fecha de última verificación y la referencia de ambas fuentes.

#### Scenario: Discrepancia resuelta a favor del Canva

- **WHEN** se lee `1033801` (Metodología de la Investigación)
- **THEN** su `gate` es `{ "uc": 110 }` (valor del Canva) y no `{ "uc": 120 }` (valor del PDF)

#### Scenario: Servicio Comunitario como tres nodos

- **WHEN** se buscan las materias de Servicio Comunitario
- **THEN** existen tres nodos distintos: `Seminario Servicio Comunitario` con `gate: { "uc": 78 }`, `Proyecto Servicio Comunitario` con `gate: { "uc": 78 }`, y `Servicio Comunitario`

#### Scenario: Código tomado del PDF sobre un nodo cuyo contenido viene del Canva

- **WHEN** se lee una materia presente en ambas fuentes
- **THEN** su `codigo` proviene del PDF, sus demás campos del Canva, y su `fuente` es `"fusion"`

### Requirement: Taxonomía de sectores de conocimiento

El dataset SHALL definir ocho sectores (`programacion`, `datos`, `sistemas`, `matematica`, `ciencias`, `gestion`, `formacion`, `grado`) y asignar a cada materia un `sector` o `null`. El campo SHALL ser editable sin cambios en el código de render.

#### Scenario: Materias sin sector

- **WHEN** se listan las materias con `sector: null`
- **THEN** el resultado son exactamente las cuatro `Electiva`

#### Scenario: Distribución de materias por sector

- **WHEN** se cuentan las materias por sector
- **THEN** los conteos son `matematica: 11`, `formacion: 10`, `programacion: 8`, `sistemas: 7`, `ciencias: 6`, `datos: 5`, `grado: 4`, `gestion: 3`, sumando 54 materias sectorizadas

### Requirement: Validación de integridad del dataset

El proyecto SHALL proveer una validación ejecutable que falle cuando el dataset viole cualquier invariante estructural. La validación SHALL correr en CI y como script de desarrollo.

#### Scenario: Referencias resueltas

- **WHEN** una entrada de `prelaciones` o `correquisitos` apunta a un `id` inexistente
- **THEN** la validación falla e informa el id huérfano y la materia que lo referencia

#### Scenario: El grafo de prelaciones es acíclico

- **WHEN** se ejecuta la validación sobre el grafo dirigido de prelaciones
- **THEN** confirma que no existen ciclos; si los hubiera, falla listando el ciclo detectado

#### Scenario: Coherencia temporal de las prelaciones

- **WHEN** una materia declara una prelación cuyo `semestre` es mayor o igual al suyo
- **THEN** la validación falla e informa el par incoherente

#### Scenario: Simetría de correquisitos

- **WHEN** una materia declara un correquisito que no la declara de vuelta, o cuyo semestre difiere
- **THEN** la validación falla e informa el par asimétrico

#### Scenario: Unicidad de identificadores

- **WHEN** dos materias comparten el mismo `id`
- **THEN** la validación falla e informa el id duplicado

#### Scenario: Dataset completo y válido

- **WHEN** se ejecuta la validación sobre el dataset curado
- **THEN** pasa sin errores y reporta 58 materias
