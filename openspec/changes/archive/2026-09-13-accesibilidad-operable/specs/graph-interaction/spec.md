## MODIFIED Requirements

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
