## ADDED Requirements

### Requirement: Layout analítico determinista

El sistema SHALL calcular la posición 3D de cada materia con una función pura, sin simulación de física. La función SHALL recibir el conjunto de materias y devolver coordenadas cartesianas. Las posiciones SHALL fijarse en el render mediante `fx`, `fy` y `fz` para que ningún solver las desplace.

#### Scenario: Reproducibilidad

- **WHEN** se ejecuta el cálculo de layout dos veces sobre el mismo dataset
- **THEN** ambas ejecuciones devuelven coordenadas idénticas

#### Scenario: Ausencia de simulación

- **WHEN** se monta la vista
- **THEN** los nodos aparecen en su posición final en el primer frame, sin animación de convergencia ni jitter

### Requirement: El radio codifica el semestre

El sistema SHALL situar cada materia a un radio determinado únicamente por su `semestre`, de modo que las materias del mismo semestre formen un anillo concéntrico y los semestres posteriores queden más afuera.

#### Scenario: Materias del mismo semestre comparten radio

- **WHEN** se calcula el layout de dos materias cualesquiera con `semestre: 5`
- **THEN** su distancia radial al origen es la misma

#### Scenario: Monotonía radial

- **WHEN** se comparan los radios de las materias de semestre 1 y semestre 9
- **THEN** el radio de semestre 9 es estrictamente mayor

#### Scenario: Las prelaciones apuntan hacia afuera

- **WHEN** se recorre cualquier arista de prelación
- **THEN** el radio del destino es estrictamente mayor que el del origen, de forma que la dirección se lee sin necesidad de flechas

### Requirement: El ángulo codifica el sector, con ancho proporcional

El sistema SHALL asignar a cada uno de los ocho sectores un arco angular contiguo cuya amplitud sea proporcional a su número de materias, cubriendo entre todos los 360 grados. Las materias de un sector SHALL distribuirse dentro de su arco.

#### Scenario: Amplitud proporcional al peso del sector

- **WHEN** se calculan los arcos de los sectores
- **THEN** `matematica` (11 materias) recibe el arco más amplio y `gestion` (3 materias) el más estrecho, y la suma de todos los arcos es 360 grados

#### Scenario: Orden cíclico que acorta los cruces

- **WHEN** se recorren los sectores en sentido angular creciente
- **THEN** el orden es `formacion`, `gestion`, `matematica`, `ciencias`, `sistemas`, `programacion`, `datos`, `grado`

#### Scenario: Materia única en su celda

- **WHEN** un sector tiene exactamente una materia en un semestre dado
- **THEN** esa materia se sitúa en el centro angular del arco de su sector

#### Scenario: Varias materias en la misma celda

- **WHEN** un sector tiene varias materias en el mismo semestre
- **THEN** se reparten uniformemente dentro del arco de su sector sin salirse de él

### Requirement: La elevación desambigua colisiones

El sistema SHALL escalonar la coordenada vertical de las materias que comparten celda de sector y semestre, de modo que ninguna pareja de materias quede a una distancia menor que un umbral mínimo configurado.

#### Scenario: Separación mínima garantizada

- **WHEN** se calcula el layout del dataset completo
- **THEN** la distancia euclídea entre cualquier par de materias es mayor o igual al umbral mínimo

#### Scenario: Escalonamiento simétrico

- **WHEN** un sector tiene tres materias en el mismo semestre
- **THEN** sus elevaciones quedan repartidas simétricamente respecto al plano de su anillo

### Requirement: Órbita libre para materias sin sector

El sistema SHALL situar las materias con `sector: null` fuera de los brazos, en una órbita propia desplazada verticalmente respecto al plano principal, conservando el radio que les corresponde por su semestre.

#### Scenario: Las electivas flotan

- **WHEN** se calcula el layout de las cuatro `Electiva`
- **THEN** su elevación difiere de la del plano principal y su radio sigue correspondiendo a su semestre

### Requirement: Tratamiento visual de las compuertas por créditos

El sistema SHALL renderizar las materias con `gate != null` con un material diferenciado, translúcido y desaturado, y SHALL mostrar su umbral como etiqueta o distintivo. El tratamiento de compuerta SHALL ser independiente de la posición.

#### Scenario: Compuerta con sector se posiciona en su brazo

- **WHEN** se renderiza `1123403` (Ecología y Contaminación Ambiental), que tiene `sector: "ciencias"` y `gate: { "uc": 100 }`
- **THEN** se sitúa en el brazo de `ciencias` **y** se pinta con el material de compuerta

#### Scenario: Compuerta sin sector flota y se desatura

- **WHEN** se renderiza `electiva-1`, que tiene `sector: null` y `gate: { "uc": 90 }`
- **THEN** se sitúa en la órbita libre **y** se pinta con el material de compuerta

#### Scenario: Umbral visible

- **WHEN** se renderiza una materia con `gate: { "pct": 80 }`
- **THEN** su distintivo comunica el umbral como porcentaje y no como unidades de crédito

### Requirement: Render diferenciado de tipos de arista

El sistema SHALL dibujar las prelaciones como aristas dirigidas y los correquisitos como vínculos cortos sin dirección entre materias del mismo anillo, con tratamiento visual distinto.

#### Scenario: Correquisito sin dirección

- **WHEN** se renderiza el vínculo entre `846203` (Física I) y `842204L` (Laboratorio de Física I)
- **THEN** se dibuja sin indicador de dirección y con estilo distinto al de una prelación

#### Scenario: Las aristas que cruzan brazos se distinguen

- **WHEN** se renderiza una arista clasificada como `cruce-sector`
- **THEN** su tratamiento visual la diferencia de las `intra-sector`

### Requirement: Cámara orbital

El sistema SHALL permitir orbitar la escena alrededor del origen y acercarse o alejarse. El zoom SHALL estar acotado para que el usuario no pueda perder de vista la estructura.

#### Scenario: Órbita

- **WHEN** el usuario arrastra sobre el lienzo
- **THEN** la cámara rota alrededor del origen manteniendo el punto de mira en el centro

#### Scenario: Zoom acotado

- **WHEN** el usuario intenta alejarse o acercarse más allá de los límites configurados
- **THEN** la cámara se detiene en el límite y la escena permanece visible

#### Scenario: Vista inicial legible

- **WHEN** se carga la aplicación
- **THEN** la cámara arranca en una posición desde la que se aprecian los anillos concéntricos y los brazos completos

### Requirement: Tokens de color compartidos entre Tailwind y la escena 3D

El sistema SHALL definir el color de cada sector en variables CSS y SHALL consumirlas tanto desde la configuración de Tailwind para el chrome 2D como desde los materiales de la escena 3D, de modo que exista una sola definición por color.

#### Scenario: Un color, dos consumidores

- **WHEN** se cambia el valor de la variable CSS del color de un sector
- **THEN** tanto la leyenda 2D como los nodos 3D de ese sector reflejan el nuevo color sin editar código de render
