## ADDED Requirements

### Requirement: La tabla del Artículo 42 se almacena como dato

El sistema SHALL almacenar la tabla de conversión del Artículo 42 como datos transcritos, y SHALL no derivarla de una fórmula. La transcripción SHALL registrar la referencia de versión del documento fuente.

#### Scenario: La tabla cubre toda la escala porcentual

- **WHEN** se consulta la conversión para cada porcentaje entero de 0 a 100
- **THEN** todos devuelven una calificación, sin huecos ni ambigüedad

#### Scenario: La tabla cubre toda la escala de calificaciones

- **WHEN** se enumeran las calificaciones que la tabla puede producir
- **THEN** son las 81 décimas de 1,0 a 9,0, ambas incluidas

#### Scenario: Las ocho calificaciones de doble porcentaje

- **WHEN** se consulta qué porcentajes producen 2,0, 3,0, 4,0, 4,8, 5,3, 6,0, 7,0 y 8,0
- **THEN** cada una recibe exactamente dos porcentajes: 17 y 18, 28 y 29, 39 y 40, 48 y 49, 54 y 55, 62 y 63, 73 y 74, 84 y 85

#### Scenario: La conversión no es lineal

- **WHEN** se compara la tabla contra el mejor ajuste lineal `1 + (pct − 7) / 11`
- **THEN** la fórmula difiere en más de media décima en más de un tercio de las celdas, confirmando que la tabla no puede sustituirse por un cálculo

### Requirement: Conversión de porcentaje a calificación

El sistema SHALL convertir un porcentaje de 0 a 100 a su calificación de 1,0 a 9,0 según la tabla, saturando en los extremos.

#### Scenario: La frontera de aprobación

- **WHEN** se convierten los porcentajes 48, 49, 50, 51 y 52
- **THEN** dan 4,8 · 4,8 · 4,9 · 5,0 · 5,1, de modo que el 51 % es el primer porcentaje aprobatorio

#### Scenario: Saturación inferior

- **WHEN** se convierte cualquier porcentaje de 0 a 7
- **THEN** el resultado es 1,0

#### Scenario: Saturación superior

- **WHEN** se convierte cualquier porcentaje de 95 a 100
- **THEN** el resultado es 9,0

#### Scenario: Porcentaje con decimales

- **WHEN** se convierte un porcentaje que no es entero
- **THEN** se resuelve de forma determinista y documentada, sin producir una calificación fuera de la escala

#### Scenario: Porcentaje fuera de rango

- **WHEN** se convierte un valor negativo o mayor que 100
- **THEN** se rechaza o se satura de forma explícita, sin devolver una calificación inventada

### Requirement: Conversión de calificación a porcentaje

El sistema SHALL convertir una calificación de 1,0 a 9,0 al porcentaje mínimo que la alcanza, para responder «qué porcentaje necesito».

#### Scenario: Porcentaje mínimo para aprobar

- **WHEN** se consulta el porcentaje mínimo que produce 5,0
- **THEN** el resultado es 51

#### Scenario: Calificación de doble porcentaje

- **WHEN** se consulta el porcentaje mínimo que produce 6,0
- **THEN** el resultado es 62, que es el menor de los dos que la producen

#### Scenario: Ida y vuelta

- **WHEN** se convierte una calificación a su porcentaje mínimo y ese porcentaje de vuelta a calificación
- **THEN** se recupera la calificación de partida, para las 81 de la escala

### Requirement: Conversión desde un puntaje sobre un máximo arbitrario

El sistema SHALL convertir un puntaje obtenido sobre un máximo cualquiera a calificación, pasando primero por su valor porcentual como indica el Artículo 42.

#### Scenario: Puntaje sobre veinte

- **WHEN** se convierte 17 sobre un máximo de 20
- **THEN** se calcula el 85 % y se devuelve la calificación que la tabla asocia a ese porcentaje

#### Scenario: Puntaje máximo

- **WHEN** el puntaje obtenido iguala al máximo
- **THEN** el resultado es 9,0

#### Scenario: Máximo inválido

- **WHEN** el máximo es cero o negativo, o el puntaje obtenido supera al máximo
- **THEN** se rechaza con un mensaje claro y no se devuelve calificación
