# captura-de-notas Specification

## Purpose

Definir la captura de notas desde el panel de la materia: el registro, edición y eliminación de intentos, la escala entera de 1 a 9, los tipos de intento especiales y el respaldo y restauración del historial.

## Requirements

### Requirement: Registro de intentos desde el panel de la materia

El panel de detalle de cada materia SHALL permitir registrar, editar y eliminar sus intentos, mostrando el historial completo en orden.

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

### Requirement: Escala 1 a 9 entera

La captura de notas SHALL ofrecer únicamente los nueve valores enteros de la escala del Artículo 39, distinguiendo visualmente las aprobatorias de las reprobatorias. SHALL no aceptar decimales, ni valores fuera de 1 a 9, ni escala sobre 20.

#### Scenario: Selección de nota

- **WHEN** el usuario abre el control de nota
- **THEN** ve nueve valores del 1 al 9, con la frontera entre 4 y 5 marcada como el límite de aprobación

#### Scenario: Valor fuera de escala

- **WHEN** se intenta registrar una nota fuera de 1 a 9 o con decimales
- **THEN** se rechaza y el historial no cambia

### Requirement: Tipos de intento especiales

La captura SHALL permitir elegir el tipo de intento: regular, equivalencia, suficiencia, retiro o en curso. Al elegir retiro, SHALL exigir indicar si fue con o sin desincorporación. Los tipos que no llevan nota SHALL no pedirla.

#### Scenario: Equivalencia sin nota

- **WHEN** el usuario registra un intento de tipo equivalencia
- **THEN** no se pide nota y la materia queda aprobada sin afectar el índice

#### Scenario: El retiro exige precisar su tipo

- **WHEN** el usuario elige el tipo retiro
- **THEN** debe indicar si fue con o sin desincorporación, porque de eso depende que la nota pese en el índice

#### Scenario: La consecuencia se explica al elegir

- **WHEN** el usuario elige un tipo de intento
- **THEN** el panel explica en una línea si otorga créditos y si pesa en el índice, citando la norma aplicable

#### Scenario: En curso sin nota

- **WHEN** el usuario marca una materia como en curso
- **THEN** no se pide nota y la materia no altera el índice ni los créditos aprobados

### Requirement: Respaldo y restauración del historial

El sistema SHALL permitir exportar el historial completo como archivo JSON e importarlo de vuelta. La interfaz SHALL advertir que los datos viven únicamente en este navegador.

#### Scenario: Exportar

- **WHEN** el usuario exporta su historial
- **THEN** obtiene un archivo JSON con la versión del esquema y todos sus intentos

#### Scenario: Importar reemplaza

- **WHEN** el usuario importa un archivo de respaldo válido
- **THEN** el historial se reemplaza por el importado y todo lo derivado se recalcula

#### Scenario: Importar un archivo inválido

- **WHEN** el archivo importado no es válido o no cumple el esquema
- **THEN** se rechaza con un mensaje claro y el historial existente no se toca

#### Scenario: Advertencia de fragilidad

- **WHEN** el usuario consulta la información de sus datos
- **THEN** se le indica que el historial vive solo en este navegador y que conviene exportarlo
