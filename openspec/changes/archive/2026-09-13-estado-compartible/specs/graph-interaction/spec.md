## MODIFIED Requirements

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
