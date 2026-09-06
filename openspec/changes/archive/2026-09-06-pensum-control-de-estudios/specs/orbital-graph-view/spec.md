## MODIFIED Requirements

### Requirement: El ángulo codifica el sector, con ancho proporcional

El sistema SHALL asignar a cada uno de los nueve sectores un arco angular contiguo cuya amplitud sea proporcional a su número de materias, cubriendo entre todos los 360 grados. Las materias de un sector SHALL distribuirse dentro de su arco.

#### Scenario: Amplitud proporcional al peso del sector

- **WHEN** se calculan los arcos de los sectores
- **THEN** `matematica` (11 materias) recibe el arco más amplio y `gestion` (3 materias) el más estrecho, y la suma de todos los arcos es 360 grados

#### Scenario: Orden cíclico que acorta los cruces

- **WHEN** se recorren los sectores en sentido angular creciente
- **THEN** el orden es `formacion`, `gestion`, `matematica`, `ciencias`, `sistemas`, `programacion`, `datos`, `grado`, `deportiva`

#### Scenario: El sector nuevo no rompe las adyacencias existentes

- **WHEN** se inserta `deportiva` entre `grado` y `formacion`
- **THEN** siguen adyacentes los pares que tienen aristas cruzadas —`gestion`↔`formacion`, `matematica`↔`gestion`, `matematica`↔`ciencias`, `ciencias`↔`sistemas`, `sistemas`↔`programacion`, `programacion`↔`datos`— porque `grado` no tiene ninguna

#### Scenario: La línea deportiva forma un brazo sin aristas

- **WHEN** se dibuja el sector `deportiva`
- **THEN** sus diez materias ocupan un brazo propio y ninguna arista de prelación entra ni sale de él

#### Scenario: Materia única en su celda

- **WHEN** un sector tiene exactamente una materia en un semestre dado
- **THEN** esa materia se sitúa en el centro angular del arco de su sector

#### Scenario: Varias materias en la misma celda

- **WHEN** un sector tiene varias materias en el mismo semestre
- **THEN** se reparten uniformemente dentro del arco de su sector sin salirse de él

### Requirement: La elevación desambigua colisiones

El sistema SHALL escalonar la coordenada vertical de las materias que comparten celda de sector y semestre, de modo que ninguna pareja de materias quede a una distancia menor que un umbral mínimo configurado.

#### Scenario: Separación mínima garantizada

- **WHEN** se calcula el layout del dataset completo, con sus nueve sectores
- **THEN** la distancia euclídea entre cualquier par de materias es mayor o igual al umbral mínimo

#### Scenario: El tamaño de los nodos se reajusta solo

- **WHEN** el reparto angular cambia por añadir un sector
- **THEN** el radio de los nodos, que se deriva de la separación mínima del layout, se recalcula sin intervención y sigue sin producir solapes

#### Scenario: Escalonamiento simétrico

- **WHEN** un sector tiene tres materias en el mismo semestre
- **THEN** sus elevaciones quedan repartidas simétricamente respecto al plano de su anillo
