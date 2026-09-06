## MODIFIED Requirements

### Requirement: Evaluación de compuertas contra los créditos reales

El sistema SHALL evaluar cada compuerta por créditos comparando las unidades de crédito aprobadas contra su umbral, resolviendo los umbrales expresados en porcentaje sobre el total de la carrera.

#### Scenario: Compuerta cumplida

- **WHEN** las unidades de crédito aprobadas son 95 y una materia exige 90
- **THEN** su compuerta está cumplida

#### Scenario: Compuerta pendiente informa lo que falta

- **WHEN** las unidades de crédito aprobadas son 78 y una materia exige 90
- **THEN** la compuerta no está cumplida y se informa que faltan 12 unidades de crédito

#### Scenario: Umbral por porcentaje

- **WHEN** una materia exige el 80 % de las unidades de crédito de la carrera
- **THEN** el umbral se resuelve a 143 unidades sobre el total de 178
