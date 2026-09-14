## MODIFIED Requirements

### Requirement: Navegación entre el grafo y la calculadora

El sistema SHALL ofrecer tres vistas —el grafo, la lista del pensum y la calculadora— direccionables mediante el fragmento de la URL, de modo que el enlace sea compartible y el botón de retroceso del navegador funcione. El conmutador de vistas SHALL estar visible en las tres.

#### Scenario: Vista por defecto

- **WHEN** se abre la aplicación sin fragmento en la URL
- **THEN** se muestra el grafo

#### Scenario: Entrar a la calculadora

- **WHEN** el usuario abre la pestaña de la calculadora
- **THEN** el fragmento de la URL pasa a identificarla y se muestra la calculadora

#### Scenario: Entrar a la lista

- **WHEN** el usuario abre la pestaña de la lista del pensum
- **THEN** el fragmento de la URL pasa a `#/plan` y se muestra la lista

#### Scenario: Enlace directo

- **WHEN** se carga la aplicación con el fragmento de la calculadora o el de la lista
- **THEN** arranca directamente en esa vista

#### Scenario: Retroceso del navegador

- **WHEN** el usuario navega del grafo a la lista y de ahí a la calculadora, y pulsa atrás dos veces
- **THEN** recorre las vistas en orden inverso sin recargar la aplicación

#### Scenario: Fragmento desconocido

- **WHEN** la URL trae un fragmento que no corresponde a ninguna vista
- **THEN** se muestra el grafo, sin error
