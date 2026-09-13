# captura-masiva Specification

## Purpose

Definir la captura de calificaciones desde la propia fila de la vista plan, pensada para cargar el historial de un semestre entero de corrido: el caso regular resuelto en un gesto, la protección de las materias que ya tienen historial frente al sobreescrito accidental, y la frontera que manda los tipos de intento especiales al editor completo.

## Requirements

### Requirement: Registrar la nota desde la fila de la lista

Cada materia de la vista plan SHALL permitir registrar su calificación sin salir de la lista, ofreciendo los nueve valores enteros de la escala del Artículo 39 con la frontera aprobatoria marcada. El intento así registrado SHALL ser de tipo regular.

#### Scenario: Cargar un semestre completo

- **WHEN** el usuario elige una nota en seis filas consecutivas de un semestre
- **THEN** las seis materias quedan con un intento regular de esa nota, sin haber abierto ningún panel ni haber cambiado de vista

#### Scenario: La escala es la misma que la del panel

- **WHEN** el usuario compara el selector de la lista con el del panel de detalle
- **THEN** ambos ofrecen los mismos nueve enteros, con la misma distinción entre aprobatorias y reprobatorias, porque son la misma pieza

#### Scenario: El índice se recalcula al vuelo

- **WHEN** el usuario registra una nota desde la lista
- **THEN** el índice, las unidades de crédito y los estados de las materias que dependen de ella se actualizan sin recargar ni cambiar de vista

### Requirement: Una materia con historial nunca se sobrescribe desde la lista

Cuando una materia ya tenga intentos registrados, la fila SHALL mostrar su nota efectiva y SHALL no permitir reemplazarlos con un solo gesto. Modificar el historial de esa materia SHALL exigir abrir el editor de intentos completo.

#### Scenario: Materia que ya tiene un intento

- **WHEN** el usuario llega a una fila de una materia que ya tiene un intento registrado
- **THEN** la fila muestra su nota efectiva en vez de un selector vacío, y ofrece abrir el editor completo en lugar de aceptar una nota directa

#### Scenario: Materia con repeticiones

- **WHEN** una materia acumula tres intentos, cuya nota efectiva resulta del Artículo 49
- **THEN** la fila muestra la nota efectiva y señala que hay más de un intento, sin ofrecer sustituirlos

#### Scenario: No hay borrado accidental

- **WHEN** el usuario hace clic en una fila con historial
- **THEN** ningún intento se elimina ni se reemplaza como efecto de ese clic

### Requirement: Los tipos de intento especiales entran por el editor completo

La captura desde la lista SHALL cubrir únicamente el caso regular. Los tipos equivalencia, suficiencia, retiro y en curso SHALL registrarse desde el editor de intentos completo, desplegable desde la propia fila.

#### Scenario: Registrar una equivalencia

- **WHEN** el usuario necesita registrar una materia acreditada por equivalencia
- **THEN** despliega el editor completo desde su fila y elige ese tipo, con su consecuencia normativa a la vista

#### Scenario: Marcar una materia en curso

- **WHEN** el usuario despliega el editor de una materia y la marca en curso
- **THEN** la materia pasa a estado en curso y no se le pide calificación

#### Scenario: El editor desplegado no saca al usuario de la lista

- **WHEN** el usuario abre y cierra el editor completo de una fila
- **THEN** permanece en la vista plan, en la misma posición de la lista
