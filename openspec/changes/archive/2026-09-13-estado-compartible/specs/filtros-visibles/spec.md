## ADDED Requirements

### Requirement: Los filtros activos se muestran juntos

Cuando haya algún filtro aplicado, el sistema SHALL mostrarlos todos en un mismo sitio, nombrando qué filtra cada uno, con independencia del control desde el que se hayan elegido.

#### Scenario: Un filtro activo

- **WHEN** el usuario filtra por el sector Programación
- **THEN** se muestra que hay un filtro activo y cuál es, sin tener que abrir el control desde el que se eligió

#### Scenario: Filtros de origen distinto

- **WHEN** el usuario filtra a la vez por sector, por estado y por semestre
- **THEN** los tres se muestran juntos, aunque se eligieran en controles distintos de la pantalla

#### Scenario: Sin filtros no hay ruido

- **WHEN** no hay ningún filtro aplicado
- **THEN** no se muestra nada en su lugar

#### Scenario: El grafo atenuado siempre tiene explicación

- **WHEN** el grafo aparece parcialmente atenuado por un filtro
- **THEN** la razón está a la vista, sin depender de qué pestaña de la leyenda esté abierta

### Requirement: Los filtros se quitan desde donde se ven

Cada filtro mostrado SHALL ofrecer un control para retirarlo individualmente, y SHALL existir un control para retirarlos todos a la vez.

#### Scenario: Quitar uno

- **WHEN** el usuario retira el filtro de sector estando también filtrado por estado
- **THEN** se levanta solo el de sector y el de estado sigue aplicado

#### Scenario: Quitar todos

- **WHEN** el usuario retira todos los filtros a la vez
- **THEN** el grafo vuelve a verse completo

#### Scenario: Coherencia con el control de origen

- **WHEN** el usuario retira un filtro desde donde se muestra
- **THEN** el control desde el que se eligió deja de marcarlo como activo

#### Scenario: Equivalencia con el teclado

- **WHEN** el usuario pulsa la tecla que limpia selección y filtros
- **THEN** el resultado es el mismo que retirar todos los filtros desde su presentación conjunta
