## 1. La dirección como dato puro

- [x] 1.1 Definir el tipo `Direccion` con vista, materia y los tres filtros (D1)
- [x] 1.2 Implementar `leerDireccion(fragmento)` pura, con validación tolerante: un valor inválido se descarta sin invalidar el resto (D2)
- [x] 1.3 Implementar `escribirDireccion(direccion)` pura, omitiendo los parámetros que no están activos
- [x] 1.4 Escribir las pruebas sin navegador: ida y vuelta, fragmento vacío, fragmento desconocido, materia inexistente, sector inválido junto a estado válido, y los fragmentos `#/grafo` y `#/calculadora` anteriores a este cambio
- [x] 1.5 Comprobar que `escribirDireccion(leerDireccion(f))` es estable para todo fragmento válido

## 2. La vista sobre la nueva representación

- [x] 2.1 Reescribir `useVista.ts` sobre `Direccion`, conservando exactamente el comportamiento actual de la vista
- [x] 2.2 Comprobar que los enlaces `#/grafo` y `#/calculadora` se comportan igual que antes, incluido el retroceso del navegador
- [x] 2.3 Comprobar que un fragmento desconocido sigue cayendo en el grafo sin error

## 3. La materia en la dirección

- [x] 3.1 Eliminar el `useState` de `seleccion` en `App.tsx` y derivarla de la dirección, sin dejar ninguna copia sincronizada (D3)
- [x] 3.2 Hacer que seleccionar por clic, por búsqueda, por teclado o desde el panel escriba la dirección con `replaceState`, actualizando el estado en el mismo gesto y sin esperar a `hashchange` (D4)
- [x] 3.3 Hacer que cerrar el panel y limpiar la selección retiren la materia de la dirección
- [x] 3.4 Disparar el enfoque de cámara cuando la materia de la dirección cambia, no en cada lectura, de modo que llegar por enlace enfoque una sola vez (D7)
- [x] 3.5 Comprobar que una materia inexistente en la dirección abre la vista sin selección y sin error. **Falló en la primera implementación**: `calcularResaltado` lanzaba `Materia desconocida` y dejaba la pantalla en blanco. Antes de este cambio la selección solo podía venir de un clic sobre un nodo real; la dirección es entrada del usuario y hay que validarla contra el grafo
- [x] 3.6 Comprobar que recorrer diez materias con las flechas deja una sola entrada en el historial del navegador

## 4. La materia compartida con la calculadora

- [x] 4.1 Fundir `materiaCalculada` con la materia de la dirección, eliminando el estado duplicado (D5)
- [x] 4.2 Disparar la creación del plan inicial al entrar en la calculadora con una materia, venga de donde venga, en vez de solo al elegirla en su selector
- [x] 4.3 Comprobar que pasar del grafo a la calculadora conserva la materia, y al revés
- [x] 4.4 Comprobar que cambiar de materia desde la calculadora actualiza la dirección
- [x] 4.5 Comprobar que los planes de evaluación siguen viviendo solo en memoria, indexados por materia, sin entrar en la dirección

## 5. Los filtros en la dirección

- [x] 5.1 Eliminar los `useState` de `sectorFiltrado`, `semestreFiltrado` y `estadoFiltrado` y derivarlos de la dirección
- [x] 5.2 Hacer que aplicar o quitar cualquier filtro escriba la dirección con `replaceState`
- [x] 5.3 Comprobar que los tres filtros componen igual que antes al llegar por enlace
- [x] 5.4 Comprobar que un filtro inválido en la dirección se ignora sin arrastrar al resto. `?semestre=99` pasaba la validación pura (es entero positivo) y mostraba un chip que no filtraba nada, dejando la escena entera atenuada: el semestre se valida además contra los que el pensum tiene de verdad
- [x] 5.5 Comprobar que probar varios filtros seguidos no obliga a deshacerlos uno a uno con el botón de retroceso

## 6. Chips de filtro activo

- [x] 6.1 Presentar los filtros activos juntos bajo la cabecera, nombrando qué filtra cada uno, con independencia del control desde el que se eligieron (D6)
- [x] 6.2 No mostrar nada cuando no hay ningún filtro activo
- [x] 6.3 Ofrecer retirar cada filtro individualmente y retirarlos todos a la vez
- [x] 6.4 Comprobar que retirar un filtro desde el chip deja de marcarlo como activo en su control de origen
- [x] 6.5 Comprobar que la tecla que limpia selección y filtros produce el mismo resultado que retirarlos todos desde los chips

## 7. Cierre

- [x] 7.1 Comprobar que editar el fragmento a mano en la barra de direcciones produce exactamente el mismo estado que alcanzarlo con clics
- [x] 7.2 Comprobar que el retroceso y el avance del navegador siguen la dirección en ambos sentidos sin dejar la interfaz desfasada
- [x] 7.3 Comprobar que ninguna nota del historial académico aparece en la dirección
- [x] 7.4 Verificar que no queda en `App.tsx` ningún estado que duplique lo que ya vive en la dirección
- [x] 7.5 Ejecutar `npm run test` y `npm run build`
- [x] 7.6 Actualizar `docs/05-interfaz.md` con la forma de las direcciones, la regla de empujar frente a reemplazar y los chips de filtro
