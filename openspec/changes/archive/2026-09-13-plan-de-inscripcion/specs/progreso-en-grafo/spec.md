## MODIFIED Requirements

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
