## MODIFIED Requirements

### Requirement: Registro de intentos desde el panel de la materia

El panel de detalle de cada materia SHALL permitir registrar, editar y eliminar sus intentos, mostrando el historial completo en orden. El panel SHALL no ser el único punto de entrada al historial: la escala del Artículo 39, los tipos de intento y sus reglas SHALL exponerse como piezas compartidas, reutilizadas sin duplicación por cualquier otra superficie de captura.

#### Scenario: Registrar el primer intento

- **WHEN** el usuario abre el panel de una materia sin historial y registra un intento regular con nota 7
- **THEN** el panel muestra ese intento y la materia pasa a estado aprobada

#### Scenario: Registrar una repetición

- **WHEN** el usuario añade un segundo intento a una materia ya reprobada
- **THEN** el panel muestra ambos intentos en orden y la nota efectiva resultante

#### Scenario: Corregir un intento

- **WHEN** el usuario cambia la nota de un intento ya registrado
- **THEN** el índice y los estados de las materias afectadas se recalculan

#### Scenario: Eliminar un intento

- **WHEN** el usuario elimina un intento
- **THEN** desaparece del historial y todo lo derivado se recalcula

#### Scenario: Una sola definición de la escala

- **WHEN** se cambia la escala del Artículo 39 o la etiqueta de un tipo de intento
- **THEN** el cambio alcanza a la vez a todas las superficies de captura, porque comparten la misma pieza

#### Scenario: El historial no depende de por dónde se capturó

- **WHEN** el usuario registra un intento fuera del panel y después abre el panel de esa materia
- **THEN** el panel muestra ese intento como cualquier otro, sin distinguir su origen
