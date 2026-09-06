# plan-de-evaluacion Specification

## Purpose

Definir el modelo del plan de evaluación de una materia: la validación de la calificación de cada parcial, su registro en puntos de 0 a 100, la completitud de las ponderaciones, la validación normativa del Artículo 32 y el plan inicial sugerido.

## Requirements

### Requirement: Modelo del plan de evaluación

El sistema SHALL representar el plan de una materia como una lista ordenada de parciales, cada uno con su ponderación en porcentaje y, cuando exista, su calificación de 1,0 a 9,0 o la condición NP. Un parcial sin calificación y sin NP SHALL considerarse pendiente.

#### Scenario: Parcial evaluado

- **WHEN** un parcial declara ponderación 30 y calificación 6,5
- **THEN** cuenta como evaluado y aporta al cálculo

#### Scenario: Parcial pendiente

- **WHEN** un parcial declara ponderación 40 y no tiene calificación ni NP
- **THEN** cuenta como pendiente y su ponderación forma parte del peso que queda por jugar

#### Scenario: Parcial no presentado

- **WHEN** un parcial se marca como NP
- **THEN** cuenta como evaluado con aporte cero, y su ponderación **no** se devuelve al peso pendiente

#### Scenario: NP y calificación son excluyentes

- **WHEN** se intenta marcar NP en un parcial que tiene calificación
- **THEN** se rechaza, porque la condición NP significa que no hubo calificación

### Requirement: Validación de la calificación de un parcial

El sistema SHALL aceptar como calificación de parcial únicamente valores de 1,0 a 9,0 en décimas, conforme al Artículo 40.

#### Scenario: Calificación válida

- **WHEN** se registra 6,5 en un parcial
- **THEN** se acepta

#### Scenario: Más de una décima

- **WHEN** se registra 6,55
- **THEN** se rechaza, porque el Artículo 40 fija enteros y décimas

#### Scenario: Fuera de la escala

- **WHEN** se registra 0, 9,5 o un valor sobre 20
- **THEN** se rechaza sin alterar el plan

### Requirement: Un parcial se puede registrar en puntos de 0 a 100

El Artículo 31 define la sumatoria de una evaluación parcial «en la escala de uno a cien puntos», que es como el estudiante suele recibirla. El sistema SHALL permitir registrar un parcial en esa escala, convirtiéndolo a la calificación de 1,0 a 9,0 mediante la tabla del Artículo 42, y SHALL conservar los puntos originales.

#### Scenario: Puntos convertidos a calificación

- **WHEN** se registra un parcial con 78 puntos
- **THEN** su calificación es 7,4 según la tabla, y los 78 puntos se conservan

#### Scenario: La calificación convertida es la que pondera

- **WHEN** un parcial de 30 % se registra con 78 puntos
- **THEN** su aporte se calcula sobre la calificación 7,4 y es 2,22, no sobre los puntos crudos

#### Scenario: La frontera de aprobación en puntos

- **WHEN** se registran 50 y 51 puntos
- **THEN** dan 4,9 y 5,0 respectivamente

#### Scenario: Puntos fuera de la escala

- **WHEN** se registran puntos negativos o mayores que 100
- **THEN** se rechaza

#### Scenario: Puntos y calificación deben corresponderse

- **WHEN** un parcial declara 78 puntos y calificación 9,0
- **THEN** se rechaza, porque la calificación tiene que ser la conversión de los puntos por la tabla

#### Scenario: En escala de puntos sin valor todavía

- **WHEN** un parcial se maneja en puntos pero aún no se ha registrado ninguno
- **THEN** cuenta como pendiente y no aporta

### Requirement: Ponderaciones completas

El sistema SHALL comprobar que las ponderaciones del plan suman exactamente 100 e informar la diferencia cuando no sea así.

#### Scenario: Plan completo

- **WHEN** las ponderaciones son 25, 25, 25 y 25
- **THEN** el plan se considera completo

#### Scenario: Falta ponderación por asignar

- **WHEN** las ponderaciones suman 90
- **THEN** se informa que faltan 10 puntos porcentuales por asignar

#### Scenario: Ponderación excedida

- **WHEN** las ponderaciones suman 110
- **THEN** se informa el exceso de 10 puntos porcentuales

#### Scenario: Ponderación individual inválida

- **WHEN** un parcial declara una ponderación negativa o mayor que 100
- **THEN** se rechaza

### Requirement: Validación normativa del Artículo 32

El sistema SHALL comparar el plan contra las reglas del Artículo 32 correspondientes a las unidades de crédito de la materia, y SHALL informar cada discrepancia citando el literal aplicable **sin impedir el cálculo**.

#### Scenario: Materia de una unidad de crédito

- **WHEN** la materia tiene 1 U.C.
- **THEN** la regla esperada es 2 parciales con ponderación entre 40 % y 60 % cada uno, según el literal a

#### Scenario: Materia de dos o tres unidades de crédito

- **WHEN** la materia tiene 2 o 3 U.C.
- **THEN** la regla esperada es 3 parciales con ponderación entre 20 % y 40 % cada uno, según el literal b

#### Scenario: Materia de cuatro o más unidades de crédito

- **WHEN** la materia tiene 4 o más U.C.
- **THEN** la regla esperada es 4 parciales con ponderación entre 10 % y 35 % cada uno, según el literal c

#### Scenario: Número de parciales distinto al normativo

- **WHEN** una materia de 4 U.C. declara 3 parciales
- **THEN** se informa la discrepancia citando el literal c, mencionando que admite 3 con autorización de la Unidad de Evaluación, y el cálculo se realiza igualmente

#### Scenario: Ponderación fuera del rango normativo

- **WHEN** una materia de 3 U.C. declara un parcial con ponderación de 50 %
- **THEN** se informa que el literal b limita cada parcial al 40 %, y el cálculo se realiza igualmente

#### Scenario: Plan conforme

- **WHEN** una materia de 4 U.C. declara 4 parciales de 25 % cada uno
- **THEN** no se informa ninguna discrepancia normativa

#### Scenario: Materia sin unidades de crédito

- **WHEN** la materia tiene 0 U.C., como los nodos de Servicio Comunitario
- **THEN** se indica que ninguna regla del Artículo 32 le aplica, en vez de inventar una o fallar

### Requirement: Plan inicial sugerido

Al elegir una materia sin plan, el sistema SHALL proponer un plan conforme al Artículo 32 para sus unidades de crédito, con las ponderaciones repartidas por igual.

#### Scenario: Sugerencia para una materia de cuatro créditos

- **WHEN** el usuario elige una materia de 4 U.C. sin plan previo
- **THEN** se propone un plan de 4 parciales de 25 % cada uno, editable

#### Scenario: Sugerencia para una materia de un crédito

- **WHEN** el usuario elige una materia de 1 U.C. sin plan previo
- **THEN** se propone un plan de 2 parciales de 50 % cada uno, editable
