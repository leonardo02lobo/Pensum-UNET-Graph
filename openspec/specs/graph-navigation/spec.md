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

El sistema SHALL resolver las colisiones entre etiquetas en coordenadas de pantalla, desplazando las que chocan. Cuando el panel de detalle está abierto, SHALL omitir las etiquetas que caerían debajo de él, tomando la franja que el panel ocupa realmente y no una aproximación.

#### Scenario: Cono denso legible

- **WHEN** se ilumina el cono de una materia con muchos ancestros y descendientes alineados en un mismo brazo
- **THEN** ninguna etiqueta queda tapada por otra

#### Scenario: Prioridad al resolver

- **WHEN** dos etiquetas compiten por el mismo sitio
- **THEN** la de la materia activa conserva su posición y la otra cede

#### Scenario: El panel no tapa etiquetas

- **WHEN** el panel de detalle está abierto
- **THEN** no se dibujan etiquetas en la franja que ocupa el panel

#### Scenario: Panel más estrecho de lo habitual

- **WHEN** el ancho de la ventana obliga al panel a mostrarse más estrecho que su ancho nominal
- **THEN** la franja omitida se ajusta a ese ancho real, sin suprimir etiquetas que sí se verían

#### Scenario: Panel anclado abajo

- **WHEN** el panel se presenta como hoja inferior
- **THEN** las etiquetas omitidas son las que caerían bajo esa hoja, y no las de una franja lateral

### Requirement: Recorrido por semestre

El sistema SHALL ofrecer un control para elegir un semestre. Al elegirlo, SHALL destacar las materias de ese semestre atenuando las demás, listarlas con su total de unidades de crédito, y etiquetarlas en la escena. SHALL permitir volver a ver todos los semestres. El control SHALL adaptarse al ancho disponible sin desbordar la ventana ni quedar recortado.

#### Scenario: Aislar un semestre

- **WHEN** el usuario elige el semestre 5
- **THEN** se destacan sus 7 materias con 18 unidades de crédito en total, el resto se atenúa, y cada una muestra su nombre en la escena

#### Scenario: Saltar a una materia desde la lista

- **WHEN** el usuario elige una materia de la lista del semestre
- **THEN** esa materia queda seleccionada y la cámara la enfoca

#### Scenario: Volver a la vista completa

- **WHEN** el usuario pulsa el semestre activo de nuevo, o «Todos»
- **THEN** se levanta el filtro y vuelven a verse todas las materias

#### Scenario: Los diez semestres no caben

- **WHEN** el ancho disponible no admite los diez botones en una fila
- **THEN** el control adopta una forma que cabe y sigue permitiendo elegir cualquiera de los diez semestres y volver a todos

#### Scenario: La lista del semestre no desborda

- **WHEN** un semestre está aislado en una ventana estrecha
- **THEN** su lista de materias se ajusta al ancho disponible y sigue siendo desplazable

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
