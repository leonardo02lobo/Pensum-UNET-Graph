## MODIFIED Requirements

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

El sistema SHALL ofrecer controles para volver a la vista inicial, ir a una vista cenital y activar o detener una rotación automática lenta. La rotación automática SHALL detenerse ante cualquier intervención del usuario sobre la escena, no solo al seleccionar una materia.

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
