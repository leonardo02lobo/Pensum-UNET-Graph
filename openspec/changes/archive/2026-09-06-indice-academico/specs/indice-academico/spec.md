## ADDED Requirements

### Requirement: Nota efectiva según el Artículo 49

El sistema SHALL calcular la nota efectiva de una materia a partir de sus intentos que pesan en el índice: con un solo intento, esa nota; con dos o más, el promedio de todos **excepto el primero**.

#### Scenario: Un solo intento

- **WHEN** una materia tiene un único intento computable con nota 7
- **THEN** su nota efectiva es 7

#### Scenario: Segundo intento elimina al primero

- **WHEN** una materia se cursa dos veces con notas 3 y 6
- **THEN** su nota efectiva es 6, y la nota 3 no interviene

#### Scenario: Tercer intento promedia todos menos el primero

- **WHEN** una materia se cursa tres veces con notas 3, 4 y 6
- **THEN** su nota efectiva es 5, que es el promedio de 4 y 6, y no 6 ni el promedio de las tres

#### Scenario: Cuarto intento

- **WHEN** una materia se cursa cuatro veces con notas 3, 4, 6 y 8
- **THEN** su nota efectiva es 6, que es el promedio de 4, 6 y 8

#### Scenario: Los intentos que no pesan no cuentan como veces cursadas

- **WHEN** una materia tiene un intento regular con nota 3, luego un retiro con desincorporación, y luego un intento regular con nota 8
- **THEN** su nota efectiva es 8, porque los intentos computables son solo dos y el segundo elimina al primero

#### Scenario: Materia sin intentos computables

- **WHEN** una materia solo tiene un intento `en-curso` o una equivalencia
- **THEN** no tiene nota efectiva y queda fuera del cálculo del índice

### Requirement: Índice académico acumulado

El sistema SHALL calcular el índice académico como la suma de los productos de la nota efectiva de cada materia por sus unidades de crédito, dividida entre el total de unidades de crédito de esas materias.

#### Scenario: Cálculo sobre un semestre completo

- **WHEN** el historial contiene el primer semestre con notas 7, 8, 6, 5, 8 y 9 en materias de 1, 3, 3, 4, 2 y 1 unidades de crédito
- **THEN** el índice es 6,71, resultado de dividir 94 entre 14

#### Scenario: Las materias reprobadas pesan

- **WHEN** una materia de 4 unidades de crédito se reprueba con 3 y no se ha vuelto a cursar
- **THEN** esa nota 3 entra al numerador y sus 4 unidades de crédito al denominador

#### Scenario: Las equivalencias no entran al índice

- **WHEN** una materia se acredita por equivalencia
- **THEN** ni su nota ni sus unidades de crédito intervienen en el índice

#### Scenario: Historial vacío

- **WHEN** no hay ninguna materia con intentos computables
- **THEN** el índice no está definido y la interfaz lo indica en vez de mostrar cero

#### Scenario: Materias de cero unidades de crédito

- **WHEN** una materia con cero unidades de crédito tiene nota registrada
- **THEN** no altera el índice, porque su peso es cero

### Requirement: Redondeo del Artículo 55

El sistema SHALL calcular el índice con tres decimales y registrarlo con dos, aproximando hacia arriba desde cinco milésimas. El redondeo SHALL ser a medio hacia arriba y no depender del comportamiento de coma flotante de `toFixed`.

#### Scenario: Cinco milésimas suben

- **WHEN** el índice crudo es 6,715
- **THEN** se registra como 6,72 y no como 6,71

#### Scenario: Menos de cinco milésimas bajan

- **WHEN** el índice crudo es 6,7139
- **THEN** se registra como 6,71, porque a tres decimales es 6,714 y sus milésimas no llegan a cinco

#### Scenario: El redondeo en dos pasos cambia el resultado

- **WHEN** el índice crudo es 6,7149
- **THEN** se registra como 6,72: a tres decimales es 6,715, y esas cinco milésimas suben la centésima. Redondear de una sola vez a dos decimales daría 6,71, que es incorrecto

### Requirement: Unidades de crédito aprobadas

El sistema SHALL calcular las unidades de crédito aprobadas sumando las de toda materia con algún intento que otorgue créditos. Este total SHALL ser independiente del conjunto de materias que pesan en el índice.

#### Scenario: Aprobadas y reprobadas

- **WHEN** una materia de 3 unidades de crédito está aprobada y otra de 4 está reprobada
- **THEN** las unidades de crédito aprobadas son 3

#### Scenario: La equivalencia suma créditos aunque no índice

- **WHEN** una materia de 4 unidades de crédito se acredita por equivalencia
- **THEN** sus 4 unidades cuentan como aprobadas, pese a no intervenir en el índice

#### Scenario: Una materia aprobada cuenta una sola vez

- **WHEN** una materia se cursa varias veces y termina aprobada
- **THEN** sus unidades de crédito se cuentan una sola vez

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
- **THEN** el umbral se resuelve a 124 unidades sobre el total de 155

### Requirement: Umbrales normativos

El sistema SHALL evaluar el índice acumulado contra los umbrales de la norma e indicar en cuál de ellos cae.

#### Scenario: Por debajo del mínimo de permanencia

- **WHEN** el índice acumulado es menor que 3,60
- **THEN** se señala la condición de pérdida de inscripción prevista en el Artículo 51

#### Scenario: Insuficiente para graduarse

- **WHEN** el índice acumulado está entre 3,60 y 5,09
- **THEN** se señala que no alcanza el mínimo de graduación de 5,10 del Artículo 54

#### Scenario: Apto para graduarse

- **WHEN** el índice acumulado es mayor o igual a 5,10
- **THEN** se señala que cumple el mínimo de graduación

#### Scenario: Cuadro de honor

- **WHEN** el índice acumulado es mayor que 6,00
- **THEN** se señala que alcanza el umbral del Cuadro de Honor

### Requirement: El cálculo es independiente del navegador

El módulo de cálculo SHALL no importar dependencias de React, del DOM ni de visualización, y SHALL ser ejecutable y testeable en Node.

#### Scenario: Las reglas se prueban sin navegador

- **WHEN** se ejecutan las pruebas del cálculo del índice en Node sin entorno DOM
- **THEN** todas pasan sin necesidad de mocks de navegador
