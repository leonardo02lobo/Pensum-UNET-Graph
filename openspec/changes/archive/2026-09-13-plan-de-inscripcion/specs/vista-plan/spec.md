## ADDED Requirements

### Requirement: El pensum como lista agrupada por semestre

El sistema SHALL ofrecer una vista del pensum como lista agrupada por semestre, direccionable mediante el fragmento `#/plan`. Cada materia SHALL mostrar su nombre, su código, su sector, sus unidades de crédito y su estado. Cada grupo de semestre SHALL mostrar su número de materias y su total de unidades de crédito.

#### Scenario: La lista cubre el pensum completo

- **WHEN** el usuario abre la vista plan
- **THEN** se listan todas las materias del pensum, agrupadas por semestre y en orden ascendente de semestre

#### Scenario: Agregados por semestre

- **WHEN** un semestre agrupa 6 materias que suman 18 unidades de crédito
- **THEN** su encabezado indica ambas cifras

#### Scenario: Enlace directo

- **WHEN** se carga la aplicación con el fragmento `#/plan`
- **THEN** arranca directamente en la lista, sin montar la escena 3D

#### Scenario: El estado de cada materia es visible sin interacción

- **WHEN** el usuario recorre la lista
- **THEN** cada fila indica si la materia está aprobada, en curso, disponible, bloqueada por prelación o bloqueada por crédito, sin necesidad de abrirla

### Requirement: Filtrar la lista por estado

La vista plan SHALL permitir restringir la lista a un estado concreto y SHALL indicar cuántas materias y cuántas unidades de crédito quedan en el filtro. El filtro de estado SHALL ser el mismo estado de aplicación que usa el filtrado del grafo, de modo que elegirlo en una vista se conserve al cambiar a la otra.

#### Scenario: Aislar lo inscribible

- **WHEN** el usuario filtra la lista por el estado disponible
- **THEN** solo se listan las materias que puede inscribir, con su conteo y su total de unidades de crédito

#### Scenario: Semestres sin materias en el filtro

- **WHEN** un semestre no tiene ninguna materia del estado filtrado
- **THEN** ese grupo no aparece, en vez de aparecer vacío

#### Scenario: El filtro cruza de vista

- **WHEN** el usuario filtra por el estado disponible en la lista y cambia al grafo
- **THEN** el grafo aparece con el mismo filtro aplicado

#### Scenario: Quitar el filtro

- **WHEN** el usuario quita el filtro de estado
- **THEN** vuelve a listarse el pensum completo

### Requirement: Navegación entre la lista y el resto de la aplicación

Cada materia de la lista SHALL permitir abrirla en el grafo, quedando seleccionada y enfocada por la cámara, y SHALL permitir abrirla en la calculadora.

#### Scenario: Saltar al grafo desde la lista

- **WHEN** el usuario abre una materia de la lista en el grafo
- **THEN** la aplicación cambia a la vista grafo con esa materia seleccionada y la cámara enfocándola

#### Scenario: Saltar a la calculadora desde la lista

- **WHEN** el usuario abre una materia de la lista en la calculadora
- **THEN** la aplicación cambia a la calculadora con esa materia ya elegida, sin pedir que se busque de nuevo

### Requirement: La lista es operable solo con teclado y expuesta semánticamente

La vista plan SHALL construirse con elementos semánticos de HTML, de modo que un lector de pantalla anuncie la agrupación por semestre, el estado de cada materia y sus cifras. Toda su funcionalidad SHALL ser alcanzable con el teclado.

#### Scenario: Recorrido con teclado

- **WHEN** el usuario recorre la lista con el tabulador
- **THEN** alcanza todos los controles de cada fila en orden de lectura

#### Scenario: El estado no se comunica solo por color

- **WHEN** una materia está bloqueada por crédito y otra por prelación
- **THEN** ambas se distinguen por texto además de por color

### Requirement: La lista es la vista de reserva cuando el grafo no es viable

Cuando el navegador no pueda renderizar la escena 3D, el sistema SHALL mostrar la vista plan en su lugar y SHALL explicar por qué, sin quedar en una pantalla en blanco ni en un error de consola.

#### Scenario: WebGL no disponible

- **WHEN** el navegador no ofrece un contexto WebGL utilizable
- **THEN** la aplicación muestra la lista, indica que el grafo 3D no está disponible en este navegador, y el resto de la aplicación sigue funcionando

#### Scenario: La detección ocurre antes de montar la escena

- **WHEN** la aplicación arranca en un entorno sin WebGL
- **THEN** la escena 3D no llega a montarse

### Requirement: La lista no abre su propia fuente de verdad

Los estados, el índice, las unidades de crédito y los conteos que muestra la lista SHALL derivarse del mismo cálculo que alimenta al grafo y a la cabecera. La vista plan SHALL no calcular por su cuenta ninguno de esos valores.

#### Scenario: Coherencia entre vistas

- **WHEN** el usuario registra un intento y compara la lista con el grafo y la cabecera
- **THEN** las tres muestran el mismo estado para esa materia y las mismas cifras agregadas
