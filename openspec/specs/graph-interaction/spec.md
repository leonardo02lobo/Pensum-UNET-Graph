# graph-interaction Specification

## Purpose

Definir la interacción con el grafo: iluminación del cono de dependencias al posar el cursor, etiquetas contextuales, selección con panel de detalle, búsqueda con enfoque de cámara, leyenda de sectores y compuertas, y procedencia visible de los datos.

## Requirements

### Requirement: Hover ilumina el cono de dependencias

Al posar el cursor sobre una materia, el sistema SHALL iluminar simultáneamente su cono de ancestros y su cono de descendientes junto con las aristas que los conectan, y SHALL atenuar todo lo que no pertenezca a ninguno de los dos conos. El cursor SHALL no ser el único canal: en un dispositivo sin cursor, tocar una materia SHALL producir la misma iluminación, de modo que el cono nunca quede fuera del alcance del usuario.

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

#### Scenario: El cono en un dispositivo táctil

- **WHEN** el usuario toca una materia en un dispositivo sin cursor
- **THEN** el cono de esa materia se ilumina igual que al posar el cursor, sin que haga falta ningún gesto previo

### Requirement: Etiquetas visibles solo cuando aportan

El sistema SHALL mostrar el nombre de una materia cuando esté bajo el cursor, cuando esté seleccionada, o cuando pertenezca a un cono iluminado. El resto de las materias SHALL renderizarse sin etiqueta.

#### Scenario: Estado de reposo sin texto

- **WHEN** ninguna materia está bajo el cursor ni seleccionada
- **THEN** no se muestra ninguna etiqueta de nombre en la escena

#### Scenario: El cono se etiqueta completo

- **WHEN** el usuario posa el cursor sobre una materia y se ilumina su cono
- **THEN** todas las materias del cono muestran su nombre

### Requirement: Selección con panel de detalle

Al hacer clic o tocar sobre una materia, el sistema SHALL seleccionarla y abrir un panel de detalle que muestre su nombre, código, semestre, unidades de crédito, horas, sector, sus prelaciones directas, sus correquisitos, su compuerta por créditos si tiene, y las materias que desbloquea directamente. La selección SHALL mantener el cono iluminado aunque el cursor se retire. El área que acepta ese gesto SHALL ser mayor que el radio visible del nodo, de modo que acertar no dependa de la precisión del puntero. La selección SHALL reflejarse en la dirección de la aplicación, de modo que sea compartible y sobreviva a una recarga.

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
- **THEN** la selección se limpia, el panel se cierra, el grafo recupera su estado completo y la dirección deja de identificar materia

#### Scenario: Campos ausentes

- **WHEN** el usuario hace clic en una materia sin código ni horas registradas
- **THEN** el panel omite esos campos u los marca como no disponibles, sin mostrar valores nulos crudos

#### Scenario: Acertar con el dedo

- **WHEN** el usuario toca ligeramente fuera del disco visible de una materia, dentro de su área de acierto
- **THEN** la materia queda seleccionada, igual que si hubiera tocado el centro

#### Scenario: Ampliar el acierto no agranda el nodo

- **WHEN** se compara la escena antes y después de ampliar el área de acierto
- **THEN** el tamaño visible de los discos es el mismo, porque la geometría de colisión es independiente de la visible

#### Scenario: Arrastrar no selecciona

- **WHEN** el usuario arrastra sobre la escena para orbitarla y el gesto termina sobre una materia
- **THEN** no se selecciona ninguna materia, porque orbitar y elegir son gestos distintos

#### Scenario: La selección es compartible

- **WHEN** el usuario selecciona una materia y copia la dirección de la aplicación
- **THEN** quien abra esa dirección ve la misma materia seleccionada, con su panel abierto

#### Scenario: La selección sobrevive a la recarga

- **WHEN** el usuario recarga la página con una materia seleccionada
- **THEN** la misma materia vuelve a quedar seleccionada

### Requirement: Navegación desde el panel

El panel de detalle SHALL permitir saltar a cualquier materia listada en sus prelaciones, correquisitos o desbloqueos, convirtiéndola en la nueva selección.

#### Scenario: Salto a una prelación

- **WHEN** el usuario hace clic en `Estructura de Datos` dentro del panel de `Programación II`
- **THEN** `Estructura de Datos` pasa a ser la materia seleccionada, el panel muestra sus datos y la cámara la enfoca

### Requirement: Búsqueda con enfoque de cámara

El sistema SHALL ofrecer un campo de búsqueda que filtre materias por nombre o código de forma incremental. Al elegir un resultado, SHALL seleccionarla y desplazar la cámara para enfocarla. La búsqueda SHALL ser operable por completo con el teclado: recorrer los resultados, elegir el activo y cerrar la lista sin usar el puntero. La lista de resultados SHALL exponerse a las tecnologías de asistencia como tal, señalando cuál es el resultado activo.

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

#### Scenario: Recorrer los resultados con las flechas

- **WHEN** hay resultados a la vista y el usuario pulsa la flecha abajo
- **THEN** avanza el resultado activo dentro de la lista, sin que las flechas naveguen el grafo

#### Scenario: Elegir con Enter

- **WHEN** hay un resultado activo y el usuario pulsa Enter
- **THEN** esa materia queda seleccionada y enfocada, igual que si se hubiera hecho clic

#### Scenario: Escape cierra la lista antes de limpiar

- **WHEN** la lista de resultados está abierta y el usuario pulsa Escape
- **THEN** se cierra la lista de resultados sin limpiar la selección ni los filtros del grafo

#### Scenario: El recorrido no se sale de la lista

- **WHEN** el resultado activo es el último y el usuario pulsa la flecha abajo
- **THEN** el recorrido se mantiene dentro de los resultados disponibles, sin salirse ni producir error

#### Scenario: La lista se anuncia

- **WHEN** un lector de pantalla acompaña la escritura en el campo de búsqueda
- **THEN** anuncia que hay resultados disponibles y cuál está activo

### Requirement: Leyenda de sectores y tabla de compuertas

El sistema SHALL mostrar una leyenda con los nueve sectores y su color, y una referencia consultable de las compuertas por créditos con su umbral y las materias que desbloquean.

#### Scenario: Leyenda de sectores

- **WHEN** el usuario abre la leyenda
- **THEN** ve los nueve sectores con el color que los identifica en la escena, incluida la línea de Actividad Deportiva

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
