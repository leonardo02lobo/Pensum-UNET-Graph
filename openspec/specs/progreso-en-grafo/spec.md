# progreso-en-grafo Specification

## Purpose

Definir cómo el progreso del usuario se refleja en la visualización: la cabecera con índice y créditos, el coloreado del grafo por estado, las compuertas vueltas personales y el filtrado por estado.

## Requirements

### Requirement: Cabecera con índice y créditos

La cabecera SHALL mostrar el índice académico acumulado con dos decimales y las unidades de crédito aprobadas sobre el total de la carrera, con una señal visual del umbral normativo en que cae el índice. SHALL mostrar además cuántas materias están en estado disponible y cuántas unidades de crédito suman, porque es la respuesta a qué inscribir el semestre siguiente y no puede quedar a tres pasos de distancia. Ese dato SHALL ser un control que lleve a la lista del pensum filtrada por ese estado.

#### Scenario: Índice con señal de umbral

- **WHEN** el índice acumulado es 6,71
- **THEN** la cabecera lo muestra como `6,71` con la señal correspondiente a superar el umbral del Cuadro de Honor

#### Scenario: Créditos sobre el total

- **WHEN** las unidades de crédito aprobadas son 78
- **THEN** la cabecera muestra `78 / 155` con su avance

#### Scenario: Materias inscribibles a la vista

- **WHEN** el historial deja 7 materias en estado disponible que suman 19 unidades de crédito
- **THEN** la cabecera muestra ambas cifras junto al índice y a los créditos

#### Scenario: Lo inscribible es un control

- **WHEN** el usuario activa el dato de materias inscribibles
- **THEN** la aplicación abre la lista del pensum filtrada por el estado disponible

#### Scenario: Sin historial

- **WHEN** no hay ninguna materia con intentos computables
- **THEN** la cabecera indica que aún no hay índice, en vez de mostrar `0,00`, e invita a cargar el historial en vez de presentar el primer semestre como si fuera un logro

#### Scenario: Actualización inmediata

- **WHEN** se registra o edita un intento
- **THEN** el índice, los créditos y el conteo de inscribibles de la cabecera reflejan el cambio sin recargar

### Requirement: El grafo se colorea por estado

La escena SHALL distinguir visualmente los cinco estados de materia: aprobada, en curso, disponible, bloqueada por prelación y bloqueada por crédito. Los estados SHALL componerse con el color de sector sin sustituirlo por completo.

#### Scenario: Materias aprobadas

- **WHEN** hay materias aprobadas en el historial
- **THEN** se distinguen de las no cursadas en la escena

#### Scenario: La frontera de disponibles destaca

- **WHEN** el historial deja un conjunto de materias con prelaciones y compuerta cumplidas
- **THEN** esas materias se destacan como el conjunto inscribible, que es la respuesta a qué cursar el semestre siguiente

#### Scenario: Bloqueo por prelación y por crédito se distinguen

- **WHEN** una materia está bloqueada por faltarle una prelación y otra por no alcanzar su compuerta
- **THEN** ambas se ven bloqueadas pero con tratamiento visual distinto, porque lo que hay que hacer para desbloquearlas es distinto

#### Scenario: Sin historial

- **WHEN** el historial está vacío
- **THEN** la escena se ve como antes de este cambio, salvo por las materias del primer semestre marcadas como disponibles

### Requirement: Las compuertas se vuelven personales

Toda materia con compuerta por créditos SHALL mostrar su situación respecto al historial en vez de solo su umbral, tanto en el panel de detalle como en la referencia de compuertas de la leyenda.

#### Scenario: Compuerta pendiente

- **WHEN** una materia exige 90 unidades de crédito y el usuario tiene 78
- **THEN** el panel indica que faltan 12 unidades, en vez de mostrar solo el umbral

#### Scenario: Compuerta cumplida

- **WHEN** el usuario supera el umbral de una compuerta
- **THEN** esa materia deja de mostrarse como bloqueada por crédito

#### Scenario: La referencia de compuertas refleja el avance

- **WHEN** el usuario consulta la referencia de compuertas de la leyenda
- **THEN** cada umbral indica si está alcanzado y cuánto falta si no lo está

#### Scenario: Sin historial la compuerta muestra solo el umbral

- **WHEN** el historial está vacío
- **THEN** las compuertas muestran su umbral sin afirmar que falte una cantidad concreta

### Requirement: Filtrar por estado

La leyenda SHALL permitir destacar las materias de un estado concreto, atenuando las demás, componiendo con los filtros de sector y de semestre ya existentes.

#### Scenario: Aislar lo inscribible

- **WHEN** el usuario filtra por el estado disponible
- **THEN** solo destacan las materias que puede inscribir, y el resto se atenúa

#### Scenario: Composición con los filtros existentes

- **WHEN** el usuario filtra por estado disponible y además por el sector Programación
- **THEN** destacan solo las materias que cumplen ambas condiciones
