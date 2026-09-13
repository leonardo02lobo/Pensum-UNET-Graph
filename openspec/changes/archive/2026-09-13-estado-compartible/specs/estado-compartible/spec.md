## ADDED Requirements

### Requirement: La materia seleccionada vive en la dirección

El fragmento de la URL SHALL identificar la materia seleccionada, además de la vista. Cargar esa dirección SHALL reproducir la selección, abrir su panel de detalle y enfocar la cámara sobre ella.

#### Scenario: Enlace a una materia

- **WHEN** se carga la aplicación con un fragmento que identifica a `425401`
- **THEN** esa materia queda seleccionada, su panel abierto, su cono iluminado y la cámara enfocándola

#### Scenario: Seleccionar actualiza la dirección

- **WHEN** el usuario selecciona una materia en el grafo
- **THEN** el fragmento pasa a identificarla

#### Scenario: Recargar conserva la selección

- **WHEN** el usuario recarga la página con una materia seleccionada
- **THEN** vuelve a la misma materia, no al grafo sin selección

#### Scenario: Cerrar el panel actualiza la dirección

- **WHEN** el usuario cierra el panel o limpia la selección
- **THEN** el fragmento deja de identificar materia alguna

#### Scenario: Materia inexistente en la dirección

- **WHEN** el fragmento identifica una materia que no está en el pensum
- **THEN** se muestra la vista sin selección, sin error y sin pantalla en blanco

#### Scenario: El enfoque inicial no se repite

- **WHEN** la aplicación arranca desde un enlace a una materia
- **THEN** la cámara la enfoca una vez y no queda reenfocándola

### Requirement: Los filtros viven en la dirección

El fragmento de la URL SHALL codificar los filtros activos de sector, estado y semestre. Cargar esa dirección SHALL reproducirlos, componiendo entre sí igual que si se hubieran elegido a mano.

#### Scenario: Enlace a una vista filtrada

- **WHEN** se carga la aplicación con un fragmento que filtra por estado disponible y por el sector Programación
- **THEN** ambos filtros quedan aplicados y componen, destacando solo lo que cumple las dos condiciones

#### Scenario: Filtrar actualiza la dirección

- **WHEN** el usuario aplica o quita cualquiera de los tres filtros
- **THEN** el fragmento lo refleja

#### Scenario: Recargar conserva los filtros

- **WHEN** el usuario recarga la página con filtros activos
- **THEN** vuelven a aplicarse los mismos filtros

#### Scenario: Filtro inválido en la dirección

- **WHEN** el fragmento trae un sector, un estado o un semestre que no existe
- **THEN** se ignora ese filtro y el resto de la dirección se respeta, sin error

### Requirement: Un fragmento inválido nunca rompe la aplicación

Ante cualquier fragmento que no se pueda interpretar, total o parcialmente, el sistema SHALL recuperar lo que sí entienda y SHALL caer en la vista del grafo para el resto, sin producir error.

#### Scenario: Fragmento desconocido

- **WHEN** la URL trae un fragmento que no corresponde a ninguna vista
- **THEN** se muestra el grafo, sin error

#### Scenario: Fragmento a medio entender

- **WHEN** el fragmento identifica una vista válida y una materia inexistente
- **THEN** se abre esa vista sin selección

#### Scenario: Los enlaces anteriores siguen valiendo

- **WHEN** se carga un enlace con el fragmento del grafo o el de la calculadora, en la forma que tenían antes de este cambio
- **THEN** se comportan exactamente igual que antes

### Requirement: El historial del navegador no se llena de selecciones

El sistema SHALL distinguir la navegación entre vistas, que SHALL añadir una entrada al historial del navegador, de los cambios de selección y de filtro, que SHALL reemplazar la entrada actual.

#### Scenario: Recorrer materias no llena el historial

- **WHEN** el usuario recorre diez materias seguidas con el teclado
- **THEN** una sola pulsación del botón de retroceso lo devuelve a donde estaba antes de empezar, no diez

#### Scenario: Cambiar de vista sí se recuerda

- **WHEN** el usuario pasa del grafo a la calculadora y pulsa atrás
- **THEN** vuelve al grafo sin recargar la aplicación

#### Scenario: Filtrar no llena el historial

- **WHEN** el usuario prueba varios filtros seguidos
- **THEN** el botón de retroceso no lo obliga a deshacerlos uno a uno

### Requirement: Una sola fuente de verdad para el estado direccionado

La vista, la materia seleccionada y los filtros SHALL derivarse del fragmento de la URL. El sistema SHALL no mantener una copia paralela de esos valores que pueda divergir del fragmento.

#### Scenario: Navegar escribiendo la dirección

- **WHEN** el usuario edita el fragmento a mano en la barra de direcciones
- **THEN** la aplicación refleja exactamente ese estado, igual que si se hubiera alcanzado con clics

#### Scenario: Retroceso y avance del navegador

- **WHEN** el usuario usa los botones de retroceso y avance del navegador
- **THEN** la interfaz sigue la dirección en ambos sentidos, sin quedar desfasada

#### Scenario: El historial académico no entra en la dirección

- **WHEN** el usuario tiene notas registradas y comparte un enlace
- **THEN** el enlace no contiene ninguna de sus notas, que siguen viviendo solo en su navegador
