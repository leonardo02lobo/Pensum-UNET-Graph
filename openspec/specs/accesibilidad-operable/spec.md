# accesibilidad-operable Specification

## Purpose

Definir lo que hace operable la aplicación sin ratón, sin movimiento y sin depender del color: un indicador de foco visible definido en un solo sitio y legible también sobre el cromo translúcido, el respeto a la preferencia de movimiento reducido —la aplicación no arranca movimiento por su cuenta, pero el usuario conserva el derecho a pedirlo—, el equivalente semántico del lienzo 3D con anuncios de selección que no roban el foco ni se atropellan, la regla de que ningún estado se comunique solo por color, y los atajos de teclado expuestos en la propia interfaz en vez de escondidos en la documentación.

## Requirements

### Requirement: Indicador de foco visible en todo control

Todo elemento interactivo del sistema SHALL mostrar un indicador de foco visible cuando reciba el foco por teclado, con contraste suficiente contra el fondo de la aplicación y contra el fondo de las islas del cromo. El indicador SHALL definirse una sola vez y SHALL no requerir que cada componente lo declare.

#### Scenario: Recorrido con tabulador

- **WHEN** el usuario recorre la aplicación con el tabulador
- **THEN** en todo momento se ve qué elemento tiene el foco

#### Scenario: Controles sobre el cromo translúcido

- **WHEN** el foco recae sobre un botón de la leyenda, del control de semestres o del panel de detalle
- **THEN** el indicador se distingue del fondo translúcido de esa isla

#### Scenario: El clic no deja anillo

- **WHEN** el usuario hace clic en un botón con el ratón
- **THEN** no aparece el indicador de foco, que está reservado a la navegación por teclado

#### Scenario: Una sola definición

- **WHEN** se cambia el color o el grosor del indicador de foco
- **THEN** el cambio alcanza a todos los controles de la aplicación desde un solo sitio

#### Scenario: Ningún control queda fuera del orden de tabulación

- **WHEN** el usuario recorre una vista completa con el tabulador
- **THEN** alcanza todos sus controles interactivos, sin que ninguno quede inalcanzable

### Requirement: Se respeta la preferencia de movimiento reducido

Cuando el sistema operativo declare preferencia por el movimiento reducido, la aplicación SHALL no iniciar movimiento por su cuenta: la rotación automática no SHALL arrancar sola, las transiciones de cámara SHALL resolverse como un salto y las transiciones del cromo SHALL desactivarse. El usuario SHALL conservar la posibilidad de activar la rotación deliberadamente.

#### Scenario: La rotación no arranca sola

- **WHEN** la preferencia de movimiento reducido está activa
- **THEN** la rotación automática permanece detenida hasta que el usuario la active

#### Scenario: El usuario puede pedir movimiento

- **WHEN** la preferencia está activa y el usuario activa la rotación desde su control
- **THEN** la escena rota, porque la preferencia limita lo que la aplicación inicia, no lo que el usuario pide

#### Scenario: Enfoque sin barrido de cámara

- **WHEN** la preferencia está activa y el usuario elige una materia desde la búsqueda, el panel o el teclado
- **THEN** la cámara queda encuadrada sobre esa materia sin recorrer el trayecto

#### Scenario: La preferencia cambia en caliente

- **WHEN** el usuario cambia la preferencia del sistema con la aplicación abierta
- **THEN** el comportamiento se ajusta sin recargar

### Requirement: El lienzo 3D tiene equivalente semántico

El lienzo de la escena SHALL exponerse a las tecnologías de asistencia con un nombre y una descripción de lo que representa, y SHALL indicar dónde encontrar la misma información en forma de texto. Los cambios de selección SHALL anunciarse sin robar el foco al elemento que lo tiene.

#### Scenario: El lienzo se anuncia

- **WHEN** un lector de pantalla alcanza la escena
- **THEN** la anuncia como el grafo del pensum, no como un elemento gráfico sin nombre

#### Scenario: Hay una vía hacia el equivalente textual

- **WHEN** un usuario de lector de pantalla llega a la escena
- **THEN** encuentra desde ahí la vista de lista, que contiene la misma información en forma navegable

#### Scenario: La selección se anuncia

- **WHEN** la selección cambia por clic, por búsqueda o por teclado
- **THEN** se anuncia qué materia quedó seleccionada

#### Scenario: El anuncio no atropella la navegación por flechas

- **WHEN** el usuario recorre rápidamente una cadena de prelaciones con las flechas
- **THEN** los anuncios no se acumulan hasta hacer inusable el recorrido

#### Scenario: El anuncio no roba el foco

- **WHEN** la selección cambia mientras el foco está en el campo de búsqueda
- **THEN** el foco permanece en el campo

### Requirement: Ningún estado se comunica solo por color

Los cinco estados de materia y las señales de umbral del índice SHALL comunicarse con texto además de con color, en toda superficie donde aparezcan.

#### Scenario: Estados en la leyenda

- **WHEN** el usuario consulta los estados en la leyenda
- **THEN** cada uno se identifica por su nombre además de por su punto de color

#### Scenario: Umbral del índice

- **WHEN** el índice cae en un umbral normativo concreto
- **THEN** ese umbral se nombra en texto, no solo mediante el color del número

#### Scenario: Bloqueo por prelación frente a bloqueo por crédito

- **WHEN** se presentan las dos formas de bloqueo
- **THEN** se distinguen por texto, porque lo que hay que hacer para desbloquearlas es distinto

### Requirement: Los atajos de teclado son visibles en la interfaz

El sistema SHALL exponer en la propia interfaz los atajos de teclado que ofrece, incluido el que limpia selección y filtros, sin obligar a consultar documentación externa.

#### Scenario: Descubrir los atajos

- **WHEN** el usuario busca cómo recorrer el grafo con el teclado
- **THEN** encuentra en la interfaz las teclas disponibles y lo que hace cada una

#### Scenario: Limpiar es descubrible

- **WHEN** hay filtros o selección activos
- **THEN** la interfaz indica que Escape los limpia, además de ofrecer un control para hacerlo
