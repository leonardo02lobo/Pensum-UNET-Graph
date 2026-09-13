## 1. Foco visible

- [x] 1.1 Añadir un token `--color-focus` a `@theme static` en `src/index.css`, midiendo su contraste contra `--color-void` y contra `--color-void-soft` antes de fijarlo (D1). **Medido**: `#f1f5f9` da 18,5:1 y 17,6:1. Se descartó `sky-300`, que tiene contraste **1,00** contra el amarillo de `matematica` —misma luminancia— y se perdería justo donde hace falta
- [x] 1.2 Añadir la regla global de `:focus-visible` con grosor y separación, de modo que ningún componente tenga que declarar su propio indicador
- [x] 1.3 Verificar que el anillo aparece al tabular y no al hacer clic con el ratón
- [x] 1.4 Comprobar el anillo sobre el cromo translúcido: leyenda, control de semestres, panel de detalle y pestañas de vista
- [x] 1.5 Comprobar el anillo sobre la escena, donde el bloom puede lavarlo, y ajustar grosor o color si hace falta
- [x] 1.6 Recorrer cada vista completa con el tabulador y corregir todo control interactivo que la regla global no alcance o que quede fuera del orden de tabulación

## 2. Movimiento reducido

- [x] 2.1 Observar `prefers-reduced-motion` con `matchMedia` y su evento de cambio, de modo que la preferencia se respete en caliente (D4)
- [x] 2.2 Impedir que la rotación automática arranque por sí sola con la preferencia activa, dejando el control operable para quien la pida. Ya se cumple por construcción (`girando` arranca en `false`); **no** se acota con la preferencia, porque hacerlo rompería que el usuario pueda pedirla
- [x] 2.3 Resolver las órdenes de cámara `inicial`, `cenital` y `enfocar` como salto directo al encuadre final, sin recorrido
- [x] 2.4 Desactivar las transiciones del cromo, conservando idéntico el estado final
- [x] 2.5 Comprobar que el bloom se mantiene, por ser un efecto estático y no movimiento

## 3. Buscador operable con teclado

- [x] 3.1 Añadir a `Buscador.tsx` el índice de resultado activo y su marca visual (D2)
- [x] 3.2 Mover el activo con flecha abajo y flecha arriba, con tope en los extremos y sin que el foco salga del campo
- [x] 3.3 Elegir el resultado activo con Enter, con el mismo efecto que el clic: selección y enfoque de cámara
- [x] 3.4 Cerrar la lista de resultados con Escape sin limpiar selección ni filtros, dejando esa segunda capa para un Escape posterior
- [x] 3.5 Exponer la lista de resultados y el resultado activo a las tecnologías de asistencia, manteniendo el foco en el campo
- [x] 3.6 Reproducir el mismo comportamiento en el selector de materia de la calculadora, que hoy duplica la estructura del buscador. Extraído a `ui/useComboMaterias.ts` en vez de copiarlo por tercera vez: mismo razonamiento que `ui/intentos/`

## 4. Atajo de enfoque de la búsqueda

- [x] 4.1 Añadir a `useTeclado.ts` el atajo que lleva el foco al campo de búsqueda, pasando por la comprobación de campo editable que el módulo ya tiene (D3)
- [x] 4.2 Comprobar que la tecla del atajo se escribe con normalidad dentro del buscador, del editor de intentos y de los campos de la calculadora
- [x] 4.3 Fijar la tecla elegida tras comprobar que no colisiona con atajos del navegador. **Elegidas `/` y `Ctrl`/`⌘`+`K`**, como proponía el diseño

## 5. Estado en texto y atajos visibles

- [x] 5.1 Revisar las superficies donde un estado de materia se comunica solo con un punto de color y añadir su nombre en texto. Los estados ya estaban en texto desde `plan-de-inscripcion`; el hueco real estaba en `Semestres`, cuyo punto distingue compuerta de sector **solo por color**
- [x] 5.2 Comprobar que el umbral del índice se nombra en texto además de colorear el número
- [x] 5.3 Comprobar que el bloqueo por prelación y el bloqueo por crédito se distinguen por texto en toda superficie donde aparezcan
- [x] 5.4 Añadir a la interfaz la referencia de atajos de teclado, con lo que hace cada tecla (D7). Va junto a los controles de cámara, **no** como quinta pestaña de la leyenda: esa barra ya llevaba cuatro a `text-[10px]` y una quinta la dejaría ilegible
- [x] 5.5 Indicar en la interfaz que Escape limpia selección y filtros cuando hay alguno activo

## 6. Semántica del lienzo

- [x] 6.1 Dar al lienzo de la escena un nombre y una descripción que expliquen qué representa y qué codifican el radio y el ángulo (D5)
- [x] 6.2 Ofrecer desde el lienzo la vía hacia la vista de lista como equivalente textual, sin prometer que la escena sea recorrible
- [x] 6.3 Anunciar el cambio de selección de forma no interruptiva, sin mover el foco (D6)
- [x] 6.4 Coalescer las ráfagas de anuncios para que recorrer una cadena de prelaciones con las flechas no genere un torrente
- [x] 6.5 Comprobar que el foco permanece en el campo de búsqueda cuando la selección cambia desde ahí

## 7. Cierre

- [ ] 7.1 Recorrer la aplicación completa con un lector de pantalla real, comprobando en particular el recorrido rápido por flechas. **NO HECHO**: no hay lector de pantalla en este entorno. Lo verificable por máquina sí está comprobado —el lienzo se anuncia, la lista de resultados expone `listbox`/`option`/`aria-activedescendant`, y 6 pulsaciones de flecha producen **1** anuncio y no 6— pero cómo suena eso de verdad sigue sin oírse
- [x] 7.2 Recorrer la aplicación completa solo con teclado, sin tocar el ratón, incluyendo cargar una nota y calcular una definitiva. Hecho: `/` → escribir → `Enter` selecciona la materia, y desde el panel se registra un intento que llega a `localStorage` y mueve el índice a 7,00
- [x] 7.3 Ejecutar `npm run test` y `npm run build`
- [x] 7.4 Actualizar `docs/05-interfaz.md` con el atajo de búsqueda, las dos capas de Escape y el comportamiento con movimiento reducido
- [x] 7.5 Anotar la conclusión sobre el contraste del texto de 10 y 11 píxeles, y si merece un cambio propio.

  **Medido, y el diseño se equivocaba.** Escribí que «pasa el contraste por poco»; no pasa. Sobre `--color-void-soft` (#0b0e17):

  | Color | Contraste | Mínimo 4,5:1 |
  |---|---|---|
  | `slate-600` #475569 | 2,54:1 | **falla** |
  | `slate-500` #64748b | 4,05:1 | **falla** |
  | `slate-400` #94a3b8 | 7,52:1 | pasa |
  | `slate-300` #cbd5e1 | 12,98:1 | pasa |

  **Merece un cambio propio, y no se hace aquí.** Son 101 usos de `text-slate-500`/`600` en 15 archivos, 62 de ellos a 10–11 px. Subirlos a `slate-400` arregla el contraste pero funde dos niveles de la jerarquía de texto —`slate-400` ya es el escalón de encima— y eso es rediseñar la paleta, que es no-objetivo declarado de este cambio. La decisión real no es «qué color», sino «cuántos niveles de gris debe tener el cromo», y merece mirarse entera.
