## MODIFIED Requirements

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

### Requirement: Selección con panel de detalle

Al hacer clic o tocar sobre una materia, el sistema SHALL seleccionarla y abrir un panel de detalle que muestre su nombre, código, semestre, unidades de crédito, horas, sector, sus prelaciones directas, sus correquisitos, su compuerta por créditos si tiene, y las materias que desbloquea directamente. La selección SHALL mantener el cono iluminado aunque el cursor se retire. El área que acepta ese gesto SHALL ser mayor que el radio visible del nodo, de modo que acertar no dependa de la precisión del puntero.

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

#### Scenario: Acertar con el dedo

- **WHEN** el usuario toca ligeramente fuera del disco visible de una materia, dentro de su área de acierto
- **THEN** la materia queda seleccionada, igual que si hubiera tocado el centro

#### Scenario: Ampliar el acierto no agranda el nodo

- **WHEN** se compara la escena antes y después de ampliar el área de acierto
- **THEN** el tamaño visible de los discos es el mismo, porque la geometría de colisión es independiente de la visible

#### Scenario: Arrastrar no selecciona

- **WHEN** el usuario arrastra sobre la escena para orbitarla y el gesto termina sobre una materia
- **THEN** no se selecciona ninguna materia, porque orbitar y elegir son gestos distintos
