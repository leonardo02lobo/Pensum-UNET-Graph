## ADDED Requirements

### Requirement: Aporte ponderado de cada parcial

El sistema SHALL calcular el aporte de cada parcial como su calificación por su ponderación, aproximado a dos decimales conforme al Artículo 40. Un parcial en condición NP SHALL aportar cero.

#### Scenario: Aporte de un parcial evaluado

- **WHEN** un parcial de 30 % obtiene 6,0
- **THEN** su aporte es 1,80

#### Scenario: El aporte se aproxima a dos decimales

- **WHEN** un parcial de 33,33 % obtiene 7,5
- **THEN** su aporte se registra con dos decimales, y ese valor aproximado es el que entra a la sumatoria

#### Scenario: Aporte de un no presentado

- **WHEN** un parcial de 40 % está en condición NP
- **THEN** su aporte es cero, y su 40 % no se redistribuye entre los demás

#### Scenario: Un parcial pendiente no aporta

- **WHEN** un parcial no tiene calificación ni NP
- **THEN** no interviene en la sumatoria acumulada

### Requirement: Calificación definitiva

El sistema SHALL obtener la calificación definitiva sumando los aportes de todos los parciales y redondeando desde cincuenta centésimas hacia la unidad superior, conforme al Artículo 41, acotando el resultado a la escala entera de 1 a 9 del Artículo 39.

#### Scenario: Sumatoria y redondeo

- **WHEN** el plan tiene parciales de 30 %, 30 % y 40 % con 6,0 · 7,5 · 5,0
- **THEN** la suma es 6,05 y la definitiva es 6

#### Scenario: Cincuenta centésimas suben

- **WHEN** la suma de aportes es 4,50
- **THEN** la definitiva es 5 y la materia queda aprobada

#### Scenario: Cuarenta y nueve centésimas no suben

- **WHEN** la suma de aportes es 4,49
- **THEN** la definitiva es 4 y la materia queda reprobada

#### Scenario: Todas las evaluaciones no presentadas

- **WHEN** todos los parciales están en condición NP
- **THEN** la suma es cero y la definitiva es 1, conforme al Artículo 31, Parágrafo Segundo

#### Scenario: La definitiva no se calcula con el plan incompleto

- **WHEN** las ponderaciones no suman 100
- **THEN** no se devuelve definitiva y se indica que el plan está incompleto, en vez de normalizar las ponderaciones

#### Scenario: Definitiva solo con todo evaluado

- **WHEN** quedan parciales pendientes
- **THEN** se distingue entre la definitiva ya determinada y la proyección, sin presentar una parcial como si fuera final

### Requirement: Cuánto falta para una calificación objetivo

El sistema SHALL calcular la calificación mínima necesaria, uniforme en todos los parciales pendientes, para alcanzar una calificación definitiva objetivo. El umbral SHALL ser medio punto por debajo del objetivo, conforme al redondeo del Artículo 41.

#### Scenario: El umbral para aprobar es cuatro con cincuenta

- **WHEN** se calcula lo necesario para obtener 5
- **THEN** el objetivo de la sumatoria es 4,50 y no 5,00

#### Scenario: Necesario alcanzable

- **WHEN** el acumulado es 2,40 y queda 40 % por evaluar
- **THEN** se informa la calificación mínima necesaria en lo pendiente, redondeada hacia arriba a la décima

#### Scenario: El necesario se redondea hacia arriba

- **WHEN** el cálculo crudo da 6,23
- **THEN** se informa 6,3, porque 6,2 no alcanzaría

#### Scenario: Ya está aprobada

- **WHEN** incluso obteniendo 1,0 en todo lo pendiente la definitiva sería 5 o más
- **THEN** se informa que la materia ya está asegurada

#### Scenario: Ya no alcanza

- **WHEN** ni obteniendo 9,0 en todo lo pendiente se llega a 4,50
- **THEN** se informa que ya no es posible aprobar

#### Scenario: Sin parciales pendientes

- **WHEN** todos los parciales están evaluados
- **THEN** no hay nada que calcular y se muestra únicamente la definitiva

#### Scenario: Tabla de objetivos

- **WHEN** hay parciales pendientes
- **THEN** se informa lo necesario para cada calificación objetivo de 5 a 9, marcando cuáles son inalcanzables

### Requirement: Rango posible de la definitiva

El sistema SHALL informar la calificación definitiva mínima y máxima todavía alcanzables, dadas las calificaciones ya obtenidas.

#### Scenario: Rango con parciales pendientes

- **WHEN** quedan parciales por evaluar
- **THEN** se informa la definitiva que resultaría con 1,0 en todo lo pendiente y la que resultaría con 9,0

#### Scenario: Rango cerrado

- **WHEN** no quedan parciales pendientes
- **THEN** el mínimo y el máximo coinciden con la definitiva

### Requirement: El cálculo es independiente del navegador

El módulo de cálculo SHALL no importar dependencias de React, del DOM ni de visualización, y SHALL ser ejecutable y testeable en Node.

#### Scenario: Las reglas se prueban sin navegador

- **WHEN** se ejecutan las pruebas del cálculo de la definitiva en Node sin entorno DOM
- **THEN** todas pasan sin necesidad de mocks de navegador
