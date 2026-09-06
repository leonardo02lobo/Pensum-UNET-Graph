## ADDED Requirements

### Requirement: Línea de Actividad Deportiva

El dataset SHALL incluir diez materias `Actividad Deportiva I` a `Actividad Deportiva X`, de una unidad de crédito cada una, sin prelaciones ni correquisitos, agrupadas en un sector propio.

#### Scenario: Las diez actividades existen

- **WHEN** se buscan las materias cuyo nombre empieza por `Actividad Deportiva`
- **THEN** hay exactamente diez, numeradas de I a X

#### Scenario: Una unidad de crédito cada una

- **WHEN** se consultan sus unidades de crédito
- **THEN** todas tienen 1

#### Scenario: Sin dependencias

- **WHEN** se consultan sus prelaciones y correquisitos
- **THEN** todas los tienen vacíos, de modo que ninguna bloquea a otra

#### Scenario: Códigos conocidos y códigos pendientes

- **WHEN** se consultan sus códigos
- **THEN** `Actividad Deportiva I`, `II` y `III` llevan los del informe académico —`0007002T`, `0007005T` y `0007008T`— y las siete restantes llevan `codigo: null`, registradas como pendientes de confirmar

### Requirement: Las unidades de crédito de las materias suman el total de la carrera

El dataset SHALL garantizar que la suma de las unidades de crédito de todas sus materias iguale el total declarado de la carrera. La validación SHALL fallar si divergen.

#### Scenario: El dataset cuadra con su total

- **WHEN** se suman las unidades de crédito de todas las materias
- **THEN** el resultado es igual al total declarado de la carrera

#### Scenario: Una materia con unidades equivocadas rompe la validación

- **WHEN** se altera la unidad de crédito de cualquier materia
- **THEN** la validación falla e informa la diferencia contra el total declarado

## MODIFIED Requirements

### Requirement: Resolución documentada de discrepancias entre fuentes

El dataset SHALL adoptar el informe académico de Control de Estudios como autoridad de códigos, unidades de crédito y existencia de materias; el Canva del 06/05/2026 como autoridad de contenido en lo que Control de Estudios no cubre —prelaciones, correquisitos, compuertas por créditos y semestre— y el PDF oficial de la UNET como fuente de último recurso. Cada materia SHALL declarar su procedencia en `fuente`. El dataset SHALL incluir metadatos con la fecha de última verificación y la referencia de las tres fuentes.

#### Scenario: Control de Estudios manda sobre las unidades de crédito

- **WHEN** se lee `Investigación de Operaciones I`
- **THEN** tiene 4 unidades de crédito, las del informe académico, y no las 3 que registraban las fuentes anteriores

#### Scenario: Control de Estudios manda sobre los TAP

- **WHEN** se leen `TAP Tesis` y `TAP Pasantía`
- **THEN** tienen 12 unidades de crédito cada una, corrigiendo la inferencia previa de 6 que este proyecto había hecho al repartir un bloque sin desglosar

#### Scenario: Discrepancia resuelta a favor del Canva

- **WHEN** se lee `1033801` (Metodología de la Investigación)
- **THEN** su `gate` es `{ "uc": 110 }` (valor del Canva) y no `{ "uc": 120 }` (valor del PDF), porque el informe académico no declara compuertas

#### Scenario: Servicio Comunitario como tres nodos

- **WHEN** se buscan las materias de Servicio Comunitario
- **THEN** existen tres nodos distintos: `Seminario Servicio Comunitario` con `gate: { "uc": 78 }`, `Proyecto Servicio Comunitario` con `gate: { "uc": 78 }`, y `Servicio Comunitario`

#### Scenario: Código actualizado sobre una materia existente

- **WHEN** se lee `Estructura de Datos`
- **THEN** su `codigo` es `0416304T`, el vigente en Control de Estudios, y su `id` sigue siendo `424301`

#### Scenario: Los identificadores no cambian

- **WHEN** se actualizan los códigos contra Control de Estudios
- **THEN** ningún `id` cambia, porque es la clave del historial persistido y de los archivos exportados

#### Scenario: Códigos que estaban vacíos

- **WHEN** se leen `Automatización`, `Seminario Servicio Comunitario` y `Proyecto Servicio Comunitario`
- **THEN** llevan los códigos `0236509T`, `1000001T` y `1000002T`, que ninguna fuente anterior tenía

### Requirement: Taxonomía de sectores de conocimiento

El dataset SHALL definir nueve sectores (`programacion`, `datos`, `sistemas`, `matematica`, `ciencias`, `gestion`, `formacion`, `grado`, `deportiva`) y asignar a cada materia un `sector` o `null`. El campo SHALL ser editable sin cambios en el código de render.

#### Scenario: Materias sin sector

- **WHEN** se listan las materias con `sector: null`
- **THEN** el resultado son exactamente las cuatro `Electiva`

#### Scenario: Distribución de materias por sector

- **WHEN** se cuentan las materias por sector
- **THEN** los conteos son `matematica: 11`, `formacion: 10`, `deportiva: 10`, `programacion: 8`, `sistemas: 7`, `ciencias: 6`, `datos: 5`, `grado: 4`, `gestion: 3`, sumando 64 materias sectorizadas

#### Scenario: La línea deportiva es un sector propio

- **WHEN** se consulta el sector de las diez `Actividad Deportiva`
- **THEN** todas pertenecen a `deportiva`, y ninguna otra materia lo hace

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

#### Scenario: Las unidades de crédito cuadran con el total

- **WHEN** la suma de las unidades de crédito de las materias difiere del total declarado de la carrera
- **THEN** la validación falla e informa ambos valores y su diferencia

#### Scenario: Dataset completo y válido

- **WHEN** se ejecuta la validación sobre el dataset curado
- **THEN** pasa sin errores y reporta 68 materias que suman 178 unidades de crédito
