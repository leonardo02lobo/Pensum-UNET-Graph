## MODIFIED Requirements

### Requirement: Leyenda de sectores y tabla de compuertas

El sistema SHALL mostrar una leyenda con los nueve sectores y su color, y una referencia consultable de las compuertas por créditos con su umbral y las materias que desbloquean.

#### Scenario: Leyenda de sectores

- **WHEN** el usuario abre la leyenda
- **THEN** ve los nueve sectores con el color que los identifica en la escena, incluida la línea de Actividad Deportiva

#### Scenario: Referencia de compuertas

- **WHEN** el usuario consulta la referencia de compuertas
- **THEN** ve los umbrales 12, 78, 90, 100, 110 y 126 unidades de crédito y 80% y 100%, cada uno con las materias que habilita

#### Scenario: Filtrado por sector desde la leyenda

- **WHEN** el usuario activa un sector en la leyenda
- **THEN** las materias de ese sector permanecen destacadas y las demás se atenúan
