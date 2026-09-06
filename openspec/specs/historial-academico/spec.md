# historial-academico Specification

## Purpose

Definir el historial académico como una secuencia de intentos por materia, los tipos de intento y sus dos banderas —si otorgan unidades de crédito y si pesan en el índice—, el estado derivado de cada materia y el esquema persistido versionado que lo respalda.

## Requirements

### Requirement: El historial es una secuencia de intentos por materia

El sistema SHALL registrar el historial como una lista ordenada de intentos por cada materia, identificada por su `id` del dataset. Un intento SHALL declarar su tipo, y su nota cuando el tipo la admita. El historial SHALL no modificar nunca el dataset del pensum.

#### Scenario: Materia cursada una sola vez

- **WHEN** se registra un intento regular con nota 7 en `425401`
- **THEN** el historial de `425401` contiene un único intento de tipo `regular` con nota 7

#### Scenario: Materia repetida

- **WHEN** una materia se cursa tres veces con notas 3, 4 y 6
- **THEN** su historial conserva los tres intentos en orden, sin descartar ninguno

#### Scenario: El dataset permanece intacto

- **WHEN** se registran intentos en cualquier materia
- **THEN** el pensum estático no cambia, y el historial referencia las materias solo por su `id`

#### Scenario: Materia sin historial

- **WHEN** se consulta una materia sobre la que nunca se registró nada
- **THEN** su historial es una lista vacía y no se produce error

### Requirement: Tipos de intento y sus dos banderas

Cada intento SHALL determinar de forma independiente si otorga unidades de crédito y si pesa en el índice académico, según su tipo y su nota.

#### Scenario: Regular aprobado

- **WHEN** el intento es `regular` con nota mayor o igual a 5
- **THEN** otorga unidades de crédito y pesa en el índice

#### Scenario: Regular reprobado

- **WHEN** el intento es `regular` con nota menor o igual a 4
- **THEN** no otorga unidades de crédito pero **sí** pesa en el índice

#### Scenario: Equivalencia

- **WHEN** el intento es `equivalencia`
- **THEN** otorga unidades de crédito y **no** pesa en el índice

#### Scenario: Suficiencia aprobada

- **WHEN** el intento es `suficiencia` con nota mayor o igual a 5
- **THEN** otorga unidades de crédito y pesa en el índice

#### Scenario: Suficiencia reprobada

- **WHEN** el intento es `suficiencia` con nota menor o igual a 4
- **THEN** no otorga unidades de crédito y **no** pesa en el índice

#### Scenario: Retiro con desincorporación

- **WHEN** el intento es `retiro` con desincorporación
- **THEN** no otorga unidades de crédito y no pesa en el índice

#### Scenario: Retiro sin desincorporación

- **WHEN** el intento es `retiro` sin desincorporación y con nota registrada
- **THEN** no otorga unidades de crédito pero **sí** pesa en el índice con esa nota

#### Scenario: En curso

- **WHEN** el intento es `en-curso`
- **THEN** no otorga unidades de crédito ni pesa en el índice

### Requirement: Estado derivado de cada materia

El sistema SHALL derivar el estado de cada materia a partir del historial y del grafo, y SHALL no persistir ese estado. Los estados son: aprobada, en curso, disponible, bloqueada por prelación y bloqueada por crédito.

#### Scenario: Aprobada

- **WHEN** una materia tiene algún intento que otorga unidades de crédito
- **THEN** su estado es aprobada

#### Scenario: Disponible

- **WHEN** una materia no está aprobada, todas sus prelaciones están aprobadas y su compuerta por créditos está cumplida
- **THEN** su estado es disponible

#### Scenario: Bloqueada por prelación

- **WHEN** a una materia le falta aprobar alguna de sus prelaciones
- **THEN** su estado es bloqueada por prelación, sea cual sea su situación de créditos

#### Scenario: Bloqueada por crédito

- **WHEN** una materia tiene todas sus prelaciones aprobadas pero no alcanza el umbral de su compuerta
- **THEN** su estado es bloqueada por crédito

#### Scenario: Materia sin prelaciones ni compuerta

- **WHEN** una materia del primer semestre sin prelaciones ni compuerta no ha sido cursada
- **THEN** su estado es disponible desde un historial vacío

#### Scenario: El estado se recalcula, no se guarda

- **WHEN** se registra un intento que aprueba una materia
- **THEN** el estado de las materias que dependían de ella se recalcula sin que exista ningún campo de estado almacenado

### Requirement: Esquema persistido versionado

El historial persistido SHALL llevar un número de versión y SHALL pasar por una función de migración al leerse. Un historial de versión desconocida o corrupto SHALL tratarse como vacío sin romper la aplicación.

#### Scenario: Lectura de la versión vigente

- **WHEN** se lee un historial cuya versión coincide con la actual
- **THEN** se carga tal cual, sin transformación

#### Scenario: Dato corrupto

- **WHEN** el contenido almacenado no es JSON válido o no cumple el esquema
- **THEN** la aplicación arranca con un historial vacío y avisa de que no pudo recuperarse

#### Scenario: Versión futura

- **WHEN** la versión almacenada es mayor que la que entiende la aplicación
- **THEN** no se sobrescribe el dato y se informa al usuario en vez de perderlo silenciosamente
