## MODIFIED Requirements

### Requirement: Navegación con teclado

El sistema SHALL permitir recorrer el grafo con el teclado: avanzar a lo que una materia desbloquea, retroceder a sus prelaciones, rotar entre materias hermanas y limpiar la selección. SHALL no capturar el teclado mientras el foco está en un campo de texto. SHALL ofrecer además un atajo que lleve el foco al campo de búsqueda desde cualquier parte de la vista, de modo que el camino más rápido de la aplicación no obligue a soltar el teclado.

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

#### Scenario: Atajo de enfoque de la búsqueda

- **WHEN** el usuario pulsa el atajo de búsqueda con el foco fuera de todo campo editable
- **THEN** el foco pasa al campo de búsqueda, listo para escribir

#### Scenario: El atajo no se dispara al escribir

- **WHEN** el usuario escribe la tecla del atajo dentro del campo de búsqueda, del editor de intentos o de cualquier otro campo editable
- **THEN** el carácter se escribe y el atajo no se activa

### Requirement: Controles de cámara

El sistema SHALL ofrecer controles para volver a la vista inicial, ir a una vista cenital y activar o detener una rotación automática lenta. La rotación automática SHALL detenerse ante cualquier intervención del usuario sobre la escena, no solo al seleccionar una materia. Cuando el sistema operativo declare preferencia por el movimiento reducido, la rotación automática SHALL no iniciarse por sí sola y las transiciones de cámara SHALL resolverse sin recorrido.

#### Scenario: Recuperarse de haberse perdido orbitando

- **WHEN** el usuario ha orbitado hasta desorientarse y pulsa volver a la vista inicial
- **THEN** la cámara transiciona al encuadre de arranque, con la escena entera visible

#### Scenario: Vista cenital

- **WHEN** el usuario pide la vista cenital
- **THEN** la cámara se sitúa casi a plomo sobre el plano y los anillos se proyectan como circunferencias, no como elipses

#### Scenario: La rotación se detiene al interactuar

- **WHEN** la rotación automática está activa y el usuario selecciona una materia
- **THEN** la rotación se detiene para no mover la escena mientras se lee

#### Scenario: La rotación se detiene al orbitar

- **WHEN** la rotación automática está activa y el usuario arrastra la escena para orbitarla
- **THEN** la rotación se detiene y el control refleja que ya no está activa

#### Scenario: Los controles de cámara siguen alcanzables en ancho reducido

- **WHEN** el ancho no permite mantener los controles de cámara en su sitio de escritorio
- **THEN** siguen siendo alcanzables desde una posición que no se solapa con el resto del cromo

#### Scenario: Movimiento reducido y vista inicial

- **WHEN** la preferencia de movimiento reducido está activa y el usuario pulsa volver a la vista inicial
- **THEN** la cámara queda en el encuadre de arranque de inmediato, sin barrido

#### Scenario: El control de rotación sigue disponible

- **WHEN** la preferencia de movimiento reducido está activa
- **THEN** el control de rotación sigue presente y operable, porque la preferencia limita lo que la aplicación inicia y no lo que el usuario decide
