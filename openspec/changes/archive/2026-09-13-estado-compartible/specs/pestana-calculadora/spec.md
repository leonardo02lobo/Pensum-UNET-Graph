## MODIFIED Requirements

### Requirement: Elección de la materia

La calculadora SHALL operar sobre una materia del pensum, elegida mediante búsqueda por nombre o código, y SHALL mostrar sus unidades de crédito junto con la regla del Artículo 32 que le corresponde. La materia elegida SHALL compartirse con el resto de la aplicación y reflejarse en la dirección, de modo que cambiar de vista no obligue a volver a buscar lo que ya estaba elegido.

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

#### Scenario: La materia cruza del grafo a la calculadora

- **WHEN** el usuario tiene una materia seleccionada en el grafo y cambia a la calculadora
- **THEN** la calculadora arranca sobre esa materia, con su plan inicial listo, sin pedir una búsqueda

#### Scenario: La materia cruza de la calculadora al grafo

- **WHEN** el usuario tiene una materia en la calculadora y cambia al grafo
- **THEN** esa materia queda seleccionada y enfocada

#### Scenario: Enlace directo a la calculadora de una materia

- **WHEN** se carga una dirección que identifica la calculadora y una materia
- **THEN** la calculadora arranca sobre esa materia

#### Scenario: Cambiar de materia en la calculadora actualiza la dirección

- **WHEN** el usuario cambia la materia desde la calculadora
- **THEN** la dirección lo refleja, y volver al grafo lleva a la nueva materia
