# graph-navigation Specification

## Purpose

Definir las ayudas de navegación de la escena: referencias visibles de la geometría, resolución de solapamiento de etiquetas, recorrido por semestre, controles de cámara y navegación con teclado.

## Requirements

### Requirement: Referencias visibles de la geometría

El sistema SHALL dibujar anillos guía concéntricos, uno por semestre, y SHALL etiquetar cada anillo con su número de semestre y cada sector con su nombre junto al extremo exterior de su brazo. Estas referencias SHALL estar visibles sin interacción alguna.

#### Scenario: Las dos reglas del diseño se leen de la escena

- **WHEN** se carga la aplicación y no se ha interactuado
- **THEN** se ven diez anillos concéntricos etiquetados `S1`…`S10` y los ocho nombres de sector junto a sus brazos, de modo que «el radio es el semestre y el ángulo es el sector» se lee del dibujo y no solo del texto de la leyenda

#### Scenario: Las etiquetas de semestre no tapan materias

- **WHEN** se sitúan las etiquetas de anillo
- **THEN** cuelgan del ángulo inicial del layout — la costura del sunburst, el único ángulo sin materias asignadas

#### Scenario: El nombre del brazo queda fuera de sus materias

- **WHEN** se sitúa la etiqueta de un sector
- **THEN** se coloca en el centro angular de su arco y a un radio mayor que el de su materia más lejana

### Requirement: Etiquetas sin solapamiento

El sistema SHALL resolver las colisiones entre etiquetas en coordenadas de pantalla, desplazando las que chocan. Cuando el panel de detalle está abierto, SHALL omitir las etiquetas que caerían debajo de él.

#### Scenario: Cono denso legible

- **WHEN** se ilumina el cono de una materia con muchos ancestros y descendientes alineados en un mismo brazo
- **THEN** ninguna etiqueta queda tapada por otra

#### Scenario: Prioridad al resolver

- **WHEN** dos etiquetas compiten por el mismo sitio
- **THEN** la de la materia activa conserva su posición y la otra cede

#### Scenario: El panel no tapa etiquetas

- **WHEN** el panel de detalle está abierto
- **THEN** no se dibujan etiquetas en la franja que ocupa el panel

### Requirement: Recorrido por semestre

El sistema SHALL ofrecer un control para elegir un semestre. Al elegirlo, SHALL destacar las materias de ese semestre atenuando las demás, listarlas con su total de unidades de crédito, y etiquetarlas en la escena. SHALL permitir volver a ver todos los semestres.

#### Scenario: Aislar un semestre

- **WHEN** el usuario elige el semestre 5
- **THEN** se destacan sus 7 materias con 18 unidades de crédito en total, el resto se atenúa, y cada una muestra su nombre en la escena

#### Scenario: Saltar a una materia desde la lista

- **WHEN** el usuario elige una materia de la lista del semestre
- **THEN** esa materia queda seleccionada y la cámara la enfoca

#### Scenario: Volver a la vista completa

- **WHEN** el usuario pulsa el semestre activo de nuevo, o «Todos»
- **THEN** se levanta el filtro y vuelven a verse todas las materias

### Requirement: Controles de cámara

El sistema SHALL ofrecer controles para volver a la vista inicial, ir a una vista cenital y activar o detener una rotación automática lenta.

#### Scenario: Recuperarse de haberse perdido orbitando

- **WHEN** el usuario ha orbitado hasta desorientarse y pulsa volver a la vista inicial
- **THEN** la cámara transiciona al encuadre de arranque, con la escena entera visible

#### Scenario: Vista cenital

- **WHEN** el usuario pide la vista cenital
- **THEN** la cámara se sitúa casi a plomo sobre el plano y los anillos se proyectan como circunferencias, no como elipses

#### Scenario: La rotación se detiene al interactuar

- **WHEN** la rotación automática está activa y el usuario selecciona una materia
- **THEN** la rotación se detiene para no mover la escena mientras se lee

### Requirement: Navegación con teclado

El sistema SHALL permitir recorrer el grafo con el teclado: avanzar a lo que una materia desbloquea, retroceder a sus prelaciones, rotar entre materias hermanas y limpiar la selección. SHALL no capturar el teclado mientras el foco está en un campo de texto.

#### Scenario: Recorrer una cadena de prelaciones

- **WHEN** hay una materia seleccionada y el usuario pulsa la flecha derecha
- **THEN** se selecciona una materia que esa desbloquea, y la cámara la enfoca

#### Scenario: Retroceder

- **WHEN** el usuario pulsa la flecha izquierda
- **THEN** se selecciona una prelación directa de la materia actual

#### Scenario: Entrar sin selección previa

- **WHEN** no hay materia seleccionada y el usuario pulsa una flecha
- **THEN** se selecciona la primera materia del orden topológico

#### Scenario: Materia terminal

- **WHEN** el usuario pulsa la flecha derecha sobre una materia que no desbloquea nada
- **THEN** la selección no cambia y no se produce error

#### Scenario: Limpiar con Escape

- **WHEN** el usuario pulsa Escape
- **THEN** se limpian la selección y los filtros activos

#### Scenario: El teclado no interfiere con la búsqueda

- **WHEN** el foco está en el campo de búsqueda y el usuario pulsa las flechas
- **THEN** las flechas mueven el cursor del texto y no navegan el grafo
