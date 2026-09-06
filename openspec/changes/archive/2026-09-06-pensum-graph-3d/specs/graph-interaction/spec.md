## ADDED Requirements

### Requirement: Hover ilumina el cono de dependencias

Al posar el cursor sobre una materia, el sistema SHALL iluminar simultáneamente su cono de ancestros y su cono de descendientes junto con las aristas que los conectan, y SHALL atenuar todo lo que no pertenezca a ninguno de los dos conos.

#### Scenario: Cono completo iluminado

- **WHEN** el usuario posa el cursor sobre `425401` (Programación II)
- **THEN** se iluminan sus ancestros transitivos, sus descendientes transitivos y las aristas correspondientes, y el resto del grafo se atenúa

#### Scenario: Ancestros y descendientes se distinguen entre sí

- **WHEN** un cono iluminado contiene tanto ancestros como descendientes
- **THEN** el tratamiento visual permite distinguir lo que hay que aprobar antes de lo que se desbloquea después

#### Scenario: Materia sin dependencias

- **WHEN** el usuario posa el cursor sobre `1032109T` (Efectividad Personal), que no tiene prelaciones ni descendientes
- **THEN** solo se ilumina esa materia y el resto se atenúa

#### Scenario: Restauración al retirar el cursor

- **WHEN** el usuario retira el cursor de la materia
- **THEN** el grafo recupera su estado visual completo sin nodos atenuados

### Requirement: Etiquetas visibles solo cuando aportan

El sistema SHALL mostrar el nombre de una materia cuando esté bajo el cursor, cuando esté seleccionada, o cuando pertenezca a un cono iluminado. El resto de las materias SHALL renderizarse sin etiqueta.

#### Scenario: Estado de reposo sin texto

- **WHEN** ninguna materia está bajo el cursor ni seleccionada
- **THEN** no se muestra ninguna etiqueta de nombre en la escena

#### Scenario: El cono se etiqueta completo

- **WHEN** el usuario posa el cursor sobre una materia y se ilumina su cono
- **THEN** todas las materias del cono muestran su nombre

### Requirement: Selección con panel de detalle

Al hacer clic sobre una materia, el sistema SHALL seleccionarla y abrir un panel de detalle que muestre su nombre, código, semestre, unidades de crédito, horas, sector, sus prelaciones directas, sus correquisitos, su compuerta por créditos si tiene, y las materias que desbloquea directamente. La selección SHALL mantener el cono iluminado aunque el cursor se retire.

#### Scenario: Panel con datos completos

- **WHEN** el usuario hace clic en `425401` (Programación II)
- **THEN** el panel muestra código `425401`, semestre 4, 3 unidades de crédito, sector `programacion`, prelación `Estructura de Datos`, y las tres materias que desbloquea

#### Scenario: Panel de una materia con compuerta

- **WHEN** el usuario hace clic en `electiva-1`
- **THEN** el panel indica que se desbloquea al acumular 90 unidades de crédito y no muestra prelaciones de materia

#### Scenario: Panel de una materia con compuerta mixta

- **WHEN** el usuario hace clic en `1123403` (Ecología y Contaminación Ambiental)
- **THEN** el panel muestra tanto la prelación `Química General I` como el umbral de 100 unidades de crédito

#### Scenario: El cono persiste con la selección

- **WHEN** el usuario selecciona una materia y luego mueve el cursor fuera de ella
- **THEN** el cono de la materia seleccionada sigue iluminado

#### Scenario: Cerrar la selección

- **WHEN** el usuario cierra el panel o hace clic en una zona vacía de la escena
- **THEN** la selección se limpia, el panel se cierra y el grafo recupera su estado completo

#### Scenario: Campos ausentes

- **WHEN** el usuario hace clic en una materia sin código ni horas registradas
- **THEN** el panel omite esos campos u los marca como no disponibles, sin mostrar valores nulos crudos

### Requirement: Navegación desde el panel

El panel de detalle SHALL permitir saltar a cualquier materia listada en sus prelaciones, correquisitos o desbloqueos, convirtiéndola en la nueva selección.

#### Scenario: Salto a una prelación

- **WHEN** el usuario hace clic en `Estructura de Datos` dentro del panel de `Programación II`
- **THEN** `Estructura de Datos` pasa a ser la materia seleccionada, el panel muestra sus datos y la cámara la enfoca

### Requirement: Búsqueda con enfoque de cámara

El sistema SHALL ofrecer un campo de búsqueda que filtre materias por nombre o código de forma incremental. Al elegir un resultado, SHALL seleccionarla y desplazar la cámara para enfocarla.

#### Scenario: Búsqueda incremental

- **WHEN** el usuario escribe `"progra"` en el campo de búsqueda
- **THEN** la lista de resultados muestra `Programación I` y `Programación II`

#### Scenario: Búsqueda insensible a acentos

- **WHEN** el usuario escribe `"matematica"` sin tilde
- **THEN** los resultados incluyen las materias cuyo nombre lleva tilde

#### Scenario: Enfoque al elegir un resultado

- **WHEN** el usuario elige un resultado de la búsqueda
- **THEN** esa materia queda seleccionada, su cono se ilumina y la cámara transiciona para enfocarla

#### Scenario: Sin resultados

- **WHEN** el texto buscado no coincide con ninguna materia
- **THEN** se informa que no hay resultados y el grafo permanece sin cambios

### Requirement: Leyenda de sectores y tabla de compuertas

El sistema SHALL mostrar una leyenda con los ocho sectores y su color, y una referencia consultable de las compuertas por créditos con su umbral y las materias que desbloquean.

#### Scenario: Leyenda de sectores

- **WHEN** el usuario abre la leyenda
- **THEN** ve los ocho sectores con el color que los identifica en la escena

#### Scenario: Referencia de compuertas

- **WHEN** el usuario consulta la referencia de compuertas
- **THEN** ve los umbrales 12, 78, 90, 100, 110 y 126 unidades de crédito y 80% y 100%, cada uno con las materias que habilita

#### Scenario: Filtrado por sector desde la leyenda

- **WHEN** el usuario activa un sector en la leyenda
- **THEN** las materias de ese sector permanecen destacadas y las demás se atenúan

### Requirement: Procedencia de los datos visible

El sistema SHALL exponer en la interfaz la fecha de última verificación del dataset y las fuentes de las que proviene.

#### Scenario: Procedencia consultable

- **WHEN** el usuario consulta la información del pensum
- **THEN** ve la fecha de última verificación y la referencia al Canva del 06/05/2026 y al PDF oficial de la UNET
