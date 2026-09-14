# cromo-adaptable Specification

## Purpose

Definir cómo se dispone el cromo 2D sobre la escena según el ancho disponible: los tramos de ancho declarados como valores con nombre en vez de números repetidos en cada clase, la regla de que ninguna isla pise a otra ni quede recortada en ningún ancho que la aplicación ofrezca, el panel de detalle como hoja inferior cuando no caben dos columnas, el ancho del panel como definición única que consumen el posicionamiento y la capa de etiquetas, y la elección de vista por defecto por debajo del umbral en que el grafo orbital deja de ser utilizable.

## Requirements

### Requirement: Tramos de ancho declarados

El sistema SHALL definir explícitamente los tramos de ancho disponible que gobiernan la disposición del cromo, con un valor con nombre por umbral. Ninguna isla del cromo SHALL decidir su posición a partir de un ancho escrito en línea.

#### Scenario: El umbral es un valor único

- **WHEN** se cambia el umbral por debajo del cual el grafo deja de ofrecerse
- **THEN** basta cambiarlo en un sitio para que todas las decisiones de disposición y de vista por defecto lo sigan

#### Scenario: La disposición reacciona al redimensionar

- **WHEN** el usuario redimensiona la ventana cruzando un umbral
- **THEN** el cromo se recoloca sin recargar y sin dejar islas superpuestas

#### Scenario: El tramo ancho no cambia

- **WHEN** la ventana tiene el ancho holgado de escritorio
- **THEN** la disposición es la misma que antes de este cambio, isla por isla

### Requirement: Las islas del cromo no se solapan en ningún ancho ofrecido

En todo ancho en el que el sistema ofrezca el grafo, las islas del cromo SHALL no superponerse entre sí ni quedar recortadas por el borde de la ventana.

#### Scenario: La banda inferior deja de estar disputada

- **WHEN** el ancho de la ventana es tal que la leyenda y el control de semestres se solaparían en la disposición de escritorio
- **THEN** una de las dos se recoloca o se colapsa, y ninguna queda debajo de la otra

#### Scenario: La barra de semestres cabe

- **WHEN** los botones de los diez semestres no caben en el ancho disponible
- **THEN** el control se reduce a una forma que sí cabe, sin quedar recortado ni desbordar la ventana

#### Scenario: Las esquinas opuestas no se invaden

- **WHEN** el ancho no da para el buscador y los controles de cámara en la misma banda superior
- **THEN** las islas de la esquina superior derecha se recolocan o se colapsan, y el buscador conserva su ancho utilizable

#### Scenario: Las islas colapsadas siguen siendo alcanzables

- **WHEN** una isla se colapsa por falta de sitio
- **THEN** su contenido sigue siendo accesible mediante un control visible, y no desaparece sin rastro

### Requirement: El panel de detalle se adapta al ancho

Cuando el ancho disponible no permita mostrar el panel de detalle junto al grafo sin taparlo, el panel SHALL presentarse como hoja anclada al borde inferior, dejando visible la escena.

#### Scenario: Panel lateral en escritorio

- **WHEN** el ancho permite dos columnas
- **THEN** el panel aparece anclado al borde derecho, como hoy

#### Scenario: Hoja inferior en ancho reducido

- **WHEN** el ancho no permite dos columnas
- **THEN** el panel aparece anclado al borde inferior ocupando parte de la altura, y la materia seleccionada sigue viéndose en la escena

#### Scenario: El cromo cede el sitio en ambos casos

- **WHEN** el panel está abierto en cualquiera de sus dos formas
- **THEN** las islas que quedarían debajo se apartan, en vez de quedar tapadas

### Requirement: El ancho del panel tiene una sola definición

El ancho que ocupa el panel de detalle SHALL definirse una sola vez y SHALL ser consumido por el posicionamiento del cromo y por la capa de etiquetas. El sistema SHALL no aproximar ese ancho con una constante propia.

#### Scenario: Las etiquetas esquivan el panel real

- **WHEN** el panel se muestra más estrecho de lo habitual porque el ancho de la ventana lo limita
- **THEN** la capa de etiquetas omite exactamente la franja que el panel ocupa, ni más ni menos

#### Scenario: Un solo sitio que cambiar

- **WHEN** se cambia el ancho del panel
- **THEN** el desplazamiento de las islas del cromo y la franja omitida por las etiquetas cambian con él, sin editar nada más

#### Scenario: El panel como hoja inferior no recorta etiquetas por el lado

- **WHEN** el panel se presenta como hoja inferior
- **THEN** la capa de etiquetas deja de omitir una franja derecha que ya no existe

### Requirement: Vista por defecto bajo el umbral del grafo

Cuando el ancho disponible esté por debajo del umbral en que el grafo orbital es utilizable, el sistema SHALL presentar la lista del pensum en su lugar y SHALL explicar por qué, ofreciendo una vía explícita para ver el grafo de todos modos.

#### Scenario: Arranque en pantalla estrecha

- **WHEN** la aplicación se abre en una ventana por debajo del umbral, sin fragmento en la URL
- **THEN** se muestra la lista del pensum, con una nota de que el grafo 3D necesita una pantalla más ancha

#### Scenario: El usuario insiste en el grafo

- **WHEN** el usuario, bajo el umbral, pide ver el grafo de todos modos
- **THEN** el grafo se muestra, sin bloquearlo

#### Scenario: Enlace directo al grafo bajo el umbral

- **WHEN** se abre un enlace al grafo en una ventana estrecha
- **THEN** la aplicación respeta el enlace y muestra el grafo, porque el fragmento es una intención explícita

#### Scenario: Ensanchar la ventana no secuestra la vista

- **WHEN** el usuario está en la lista y ensancha la ventana por encima del umbral
- **THEN** permanece en la lista, sin que la aplicación lo cambie de vista por su cuenta
