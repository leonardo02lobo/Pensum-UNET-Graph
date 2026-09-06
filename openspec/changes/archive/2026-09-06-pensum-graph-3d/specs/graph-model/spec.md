## ADDED Requirements

### Requirement: Construcción del grafo desde el dataset

El sistema SHALL construir un grafo dirigido en memoria sobre `graphology` a partir del dataset, con un nodo por materia y una arista dirigida por cada prelación en sentido `requisito → materia`. Los correquisitos SHALL representarse como aristas de tipo propio y no SHALL participar del grafo dirigido de prelaciones. Las compuertas por créditos SHALL permanecer como atributo de nodo y no generar aristas.

#### Scenario: Orden de la arista de prelación

- **WHEN** se construye el grafo y la materia `425401` declara `prelaciones: ["424301"]`
- **THEN** existe una arista dirigida de `424301` hacia `425401` con tipo `prelacion`

#### Scenario: Los correquisitos no ensucian el DAG

- **WHEN** se recorre el grafo dirigido de prelaciones
- **THEN** ninguna arista de tipo `correquisito` es atravesada, y el orden topológico existe

#### Scenario: Las compuertas no generan aristas

- **WHEN** se construye el grafo
- **THEN** el número de aristas de tipo `prelacion` es igual al total de entradas de `prelaciones` del dataset, sin aristas añadidas por compuertas

### Requirement: Cono de ancestros

El sistema SHALL exponer una consulta que, dada una materia, devuelva el conjunto transitivo de todas las materias que deben aprobarse antes, junto con las aristas que las conectan.

#### Scenario: Cono de ancestros de una materia profunda

- **WHEN** se consulta el cono de ancestros de `425901` (Ingeniería de Software)
- **THEN** el resultado incluye transitivamente `425801`, `425802`, `425705`, `425702`, `425601`, `425602`, `425501`, `426502`, `425401`, `424301`, `416202`, `415102` y `834102`

#### Scenario: Materia sin prelaciones

- **WHEN** se consulta el cono de ancestros de `415102` (Computación I)
- **THEN** el resultado es el conjunto vacío

#### Scenario: Compuerta por créditos reportada aparte

- **WHEN** se consulta el cono de ancestros de `1123403` (Ecología y Contaminación Ambiental)
- **THEN** el conjunto de materias contiene `914201`, y la compuerta `{ "uc": 100 }` se devuelve como dato separado y no como nodo del cono

### Requirement: Cono de descendientes

El sistema SHALL exponer una consulta que, dada una materia, devuelva el conjunto transitivo de todas las materias que se desbloquean al aprobarla, junto con las aristas que las conectan.

#### Scenario: Cono de descendientes de un nodo bisagra

- **WHEN** se consulta el cono de descendientes de `425401` (Programación II)
- **THEN** el resultado incluye directamente `426502`, `425501` y `automatizacion`, y transitivamente alcanza `425901` (Ingeniería de Software)

#### Scenario: Materia terminal

- **WHEN** se consulta el cono de descendientes de `425901` (Ingeniería de Software)
- **THEN** el resultado es el conjunto vacío

### Requirement: Orden topológico y profundidad

El sistema SHALL exponer el orden topológico del grafo de prelaciones y, para cada materia, su profundidad definida como la longitud del camino más largo desde cualquier materia sin prelaciones.

#### Scenario: Profundidad del grafo

- **WHEN** se calcula la profundidad máxima del grafo
- **THEN** el valor es 8, alcanzado únicamente por `425901` (Ingeniería del Software), cuya cadena más larga recorre 9 materias

#### Scenario: Profundidad de una materia raíz

- **WHEN** se consulta la profundidad de `826101` (Matemática I)
- **THEN** el valor es 0

### Requirement: Clasificación de aristas por cruce de sector

El sistema SHALL clasificar cada arista de prelación como `intra-sector` cuando origen y destino comparten `sector`, o `cruce-sector` cuando difieren. Las aristas cuyo origen o destino tenga `sector: null` SHALL clasificarse como `cruce-sector`.

#### Scenario: Arista dentro del mismo brazo

- **WHEN** se clasifica la arista `914201 → 1123403` (Química General I → Ecología), ambas en `ciencias`
- **THEN** la clasificación es `intra-sector`

#### Scenario: Arista que cruza brazos

- **WHEN** se clasifica la arista `425401 → 425501` (Programación II en `programacion` → Base de Datos I en `datos`)
- **THEN** la clasificación es `cruce-sector`

#### Scenario: El nodo bisagra cruza en todas sus salidas

- **WHEN** se clasifican las tres aristas salientes de `425401` (Programación II)
- **THEN** las tres son `cruce-sector`

### Requirement: Búsqueda de materias

El sistema SHALL exponer una búsqueda sobre el grafo que acepte texto libre y encuentre materias por coincidencia parcial e insensible a acentos y mayúsculas en su `nombre` o su `codigo`.

#### Scenario: Búsqueda por nombre parcial sin acentos

- **WHEN** se busca `"matematica"`
- **THEN** el resultado incluye las cinco materias `Matemática I`, `Matemática II`, `Matemática III`, `Matemática IV` y `Matemática Discreta`

#### Scenario: Búsqueda por código

- **WHEN** se busca `"425401"`
- **THEN** el resultado contiene `Programación II`

#### Scenario: Búsqueda sin resultados

- **WHEN** se busca un texto que no coincide con ninguna materia
- **THEN** el resultado es una lista vacía y no lanza error

### Requirement: El modelo es independiente del render

El módulo de modelo SHALL no importar ninguna dependencia de visualización ni de React, y SHALL ser ejecutable y testeable en Node sin DOM.

#### Scenario: El modelo corre sin navegador

- **WHEN** se ejecutan las pruebas del modelo en Node sin entorno DOM
- **THEN** todas pasan sin necesidad de mocks de navegador
