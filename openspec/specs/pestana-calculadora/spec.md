# pestana-calculadora Specification

## Purpose

Definir la pestaña de calculadora: la navegación entre el grafo y la calculadora, la elección de la materia, la captura del plan y de las calificaciones, la presentación de los resultados, los avisos normativos visibles, el conversor de porcentaje a calificación y el registro de la definitiva en el historial.

## Requirements

### Requirement: Navegación entre el grafo y la calculadora

El sistema SHALL ofrecer dos vistas —el grafo y la calculadora— direccionables mediante el fragmento de la URL, de modo que el enlace sea compartible y el botón de retroceso del navegador funcione.

#### Scenario: Vista por defecto

- **WHEN** se abre la aplicación sin fragmento en la URL
- **THEN** se muestra el grafo

#### Scenario: Entrar a la calculadora

- **WHEN** el usuario abre la pestaña de la calculadora
- **THEN** el fragmento de la URL pasa a identificarla y se muestra la calculadora

#### Scenario: Enlace directo

- **WHEN** se carga la aplicación con el fragmento de la calculadora
- **THEN** arranca directamente en esa vista

#### Scenario: Retroceso del navegador

- **WHEN** el usuario navega a la calculadora y pulsa atrás
- **THEN** vuelve al grafo sin recargar la aplicación

#### Scenario: Fragmento desconocido

- **WHEN** la URL trae un fragmento que no corresponde a ninguna vista
- **THEN** se muestra el grafo, sin error

### Requirement: Elección de la materia

La calculadora SHALL operar sobre una materia del pensum, elegida mediante búsqueda por nombre o código, y SHALL mostrar sus unidades de crédito junto con la regla del Artículo 32 que le corresponde.

#### Scenario: Elegir materia

- **WHEN** el usuario busca y elige `Programación II`
- **THEN** la calculadora muestra sus 3 U.C. y la regla del literal b: 3 parciales entre 20 % y 40 %

#### Scenario: Plan sugerido al elegir

- **WHEN** el usuario elige una materia sin plan en la sesión
- **THEN** aparece el plan conforme al Artículo 32 con ponderaciones repartidas por igual, listo para editar

#### Scenario: Materia sin unidades de crédito

- **WHEN** el usuario elige una materia de 0 U.C.
- **THEN** se indica que no tiene parciales que ponderar y no se propone plan

#### Scenario: Sin materia elegida

- **WHEN** todavía no se ha elegido materia
- **THEN** la calculadora explica qué hace y no muestra resultados vacíos

### Requirement: Captura del plan y de las calificaciones

La calculadora SHALL permitir añadir, editar y eliminar parciales, fijar su ponderación, registrar su calificación en la escala de 1,0 a 9,0 y marcarlos como no presentados.

#### Scenario: Registrar la calificación de un parcial

- **WHEN** el usuario introduce 6,5 en el primer parcial
- **THEN** el acumulado y los resultados se recalculan de inmediato

#### Scenario: Elegir la escala de captura

- **WHEN** el usuario conmuta un parcial a la escala de puntos
- **THEN** puede escribir de 0 a 100 y se muestra la calificación equivalente junto al aporte

#### Scenario: Conmutar conserva el valor

- **WHEN** un parcial con calificación 7,4 se conmuta a la escala de puntos
- **THEN** se muestra el porcentaje mínimo que produce esa calificación, sin perder el dato

#### Scenario: Vaciar el campo no cambia de escala

- **WHEN** el usuario borra los puntos de un parcial
- **THEN** el parcial sigue en la escala de puntos y queda pendiente

#### Scenario: Marcar no presentado

- **WHEN** el usuario marca un parcial como NP
- **THEN** se refleja que aporta cero y que su ponderación no se redistribuye

#### Scenario: Cambiar las ponderaciones

- **WHEN** el usuario ajusta las ponderaciones
- **THEN** se recalculan tanto los resultados como los avisos del Artículo 32

#### Scenario: Se muestra siempre cuánto suma el plan

- **WHEN** el usuario edita cualquier ponderación
- **THEN** la suma de ponderaciones está visible, para que un plan incompleto se note sin buscarlo

### Requirement: Presentación de los resultados

La calculadora SHALL mostrar el acumulado, la definitiva o su proyección, el rango todavía alcanzable y lo necesario para cada calificación objetivo, distinguiendo con claridad los tres desenlaces posibles.

#### Scenario: Materia en juego

- **WHEN** quedan parciales pendientes y aprobar sigue siendo posible
- **THEN** se muestra la calificación mínima necesaria en lo pendiente y la tabla de objetivos de 5 a 9

#### Scenario: Materia asegurada

- **WHEN** la materia está aprobada pase lo que pase en lo pendiente
- **THEN** se comunica de forma destacada, y se sigue mostrando qué haría falta para calificaciones superiores

#### Scenario: Materia perdida

- **WHEN** ya no es posible alcanzar la definitiva de 5
- **THEN** se comunica sin ambigüedad, indicando cuál es la máxima definitiva todavía alcanzable

#### Scenario: Plan incompleto

- **WHEN** las ponderaciones no suman 100
- **THEN** no se muestra definitiva ni proyección, y se indica cuánto falta por asignar

#### Scenario: El resultado se presenta como cálculo, no como promesa

- **WHEN** se muestran los resultados
- **THEN** se indica que provienen de aplicar la norma al plan declarado y que no sustituyen a Control de Estudios

### Requirement: Avisos normativos visibles

La calculadora SHALL mostrar las discrepancias con el Artículo 32 citando el literal aplicable, sin impedir el cálculo.

#### Scenario: Aviso por número de parciales

- **WHEN** una materia de 4 U.C. declara 3 parciales
- **THEN** se muestra el aviso citando el literal c y la posibilidad de autorización de la Unidad de Evaluación, y los resultados siguen calculándose

#### Scenario: Aviso por ponderación

- **WHEN** un parcial excede el rango que su literal permite
- **THEN** se señala ese parcial concreto, no solo el plan en conjunto

#### Scenario: Plan conforme

- **WHEN** el plan cumple el Artículo 32
- **THEN** no se muestran avisos normativos

### Requirement: Conversor de porcentaje a calificación

La calculadora SHALL ofrecer un conversor entre porcentaje y calificación, y desde un puntaje sobre un máximo arbitrario, conforme al Artículo 42.

#### Scenario: Convertir un puntaje

- **WHEN** el usuario introduce 17 sobre 20
- **THEN** se muestra el porcentaje resultante y la calificación que la tabla le asigna

#### Scenario: Convertir un porcentaje

- **WHEN** el usuario introduce 51 %
- **THEN** se muestra 5,0 y se señala que es el primer porcentaje aprobatorio

#### Scenario: Consultar el porcentaje necesario

- **WHEN** el usuario consulta qué porcentaje hace falta para una calificación
- **THEN** se muestra el porcentaje mínimo que la alcanza

### Requirement: Registrar la definitiva en el historial

Cuando la definitiva esté determinada, la calculadora SHALL ofrecer registrarla como intento de esa materia en el historial académico, actualizando el índice y el estado en el grafo.

#### Scenario: Registrar

- **WHEN** la definitiva es 6 y el usuario decide registrarla
- **THEN** se añade un intento regular con calificación 6 a esa materia, y el índice acumulado se recalcula

#### Scenario: No se registra una proyección

- **WHEN** quedan parciales pendientes
- **THEN** no se ofrece registrar, porque la calificación todavía no es definitiva

#### Scenario: Tras registrar, el botón se bloquea

- **WHEN** el usuario registra la definitiva
- **THEN** el botón queda deshabilitado y se confirma que esa calificación quedó en el historial de la materia, para que un doble clic no añada el mismo intento dos veces

#### Scenario: Cambiar una calificación vuelve a habilitar el registro

- **WHEN** tras registrar el usuario modifica un parcial y la definitiva cambia
- **THEN** el botón vuelve a habilitarse, porque ahora hay una calificación distinta que registrar

#### Scenario: La materia ya tiene historial

- **WHEN** la materia ya tiene intentos registrados
- **THEN** se advierte antes de añadir otro, para que el usuario distinga corregir de repetir la materia
