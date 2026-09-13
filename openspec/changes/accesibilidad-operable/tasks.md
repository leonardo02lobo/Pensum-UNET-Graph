## 1. Foco visible

- [ ] 1.1 Añadir un token `--color-focus` a `@theme static` en `src/index.css`, midiendo su contraste contra `--color-void` y contra `--color-void-soft` antes de fijarlo (D1)
- [ ] 1.2 Añadir la regla global de `:focus-visible` con grosor y separación, de modo que ningún componente tenga que declarar su propio indicador
- [ ] 1.3 Verificar que el anillo aparece al tabular y no al hacer clic con el ratón
- [ ] 1.4 Comprobar el anillo sobre el cromo translúcido: leyenda, control de semestres, panel de detalle y pestañas de vista
- [ ] 1.5 Comprobar el anillo sobre la escena, donde el bloom puede lavarlo, y ajustar grosor o color si hace falta
- [ ] 1.6 Recorrer cada vista completa con el tabulador y corregir todo control interactivo que la regla global no alcance o que quede fuera del orden de tabulación

## 2. Movimiento reducido

- [ ] 2.1 Observar `prefers-reduced-motion` con `matchMedia` y su evento de cambio, de modo que la preferencia se respete en caliente (D4)
- [ ] 2.2 Impedir que la rotación automática arranque por sí sola con la preferencia activa, dejando el control operable para quien la pida
- [ ] 2.3 Resolver las órdenes de cámara `inicial`, `cenital` y `enfocar` como salto directo al encuadre final, sin recorrido
- [ ] 2.4 Desactivar las transiciones del cromo, conservando idéntico el estado final
- [ ] 2.5 Comprobar que el bloom se mantiene, por ser un efecto estático y no movimiento

## 3. Buscador operable con teclado

- [ ] 3.1 Añadir a `Buscador.tsx` el índice de resultado activo y su marca visual (D2)
- [ ] 3.2 Mover el activo con flecha abajo y flecha arriba, con tope en los extremos y sin que el foco salga del campo
- [ ] 3.3 Elegir el resultado activo con Enter, con el mismo efecto que el clic: selección y enfoque de cámara
- [ ] 3.4 Cerrar la lista de resultados con Escape sin limpiar selección ni filtros, dejando esa segunda capa para un Escape posterior
- [ ] 3.5 Exponer la lista de resultados y el resultado activo a las tecnologías de asistencia, manteniendo el foco en el campo
- [ ] 3.6 Reproducir el mismo comportamiento en el selector de materia de la calculadora, que hoy duplica la estructura del buscador

## 4. Atajo de enfoque de la búsqueda

- [ ] 4.1 Añadir a `useTeclado.ts` el atajo que lleva el foco al campo de búsqueda, pasando por la comprobación de campo editable que el módulo ya tiene (D3)
- [ ] 4.2 Comprobar que la tecla del atajo se escribe con normalidad dentro del buscador, del editor de intentos y de los campos de la calculadora
- [ ] 4.3 Fijar la tecla elegida tras comprobar que no colisiona con atajos del navegador

## 5. Estado en texto y atajos visibles

- [ ] 5.1 Revisar las superficies donde un estado de materia se comunica solo con un punto de color y añadir su nombre en texto
- [ ] 5.2 Comprobar que el umbral del índice se nombra en texto además de colorear el número
- [ ] 5.3 Comprobar que el bloqueo por prelación y el bloqueo por crédito se distinguen por texto en toda superficie donde aparezcan
- [ ] 5.4 Añadir a la interfaz la referencia de atajos de teclado, con lo que hace cada tecla (D7)
- [ ] 5.5 Indicar en la interfaz que Escape limpia selección y filtros cuando hay alguno activo

## 6. Semántica del lienzo

- [ ] 6.1 Dar al lienzo de la escena un nombre y una descripción que expliquen qué representa y qué codifican el radio y el ángulo (D5)
- [ ] 6.2 Ofrecer desde el lienzo la vía hacia la vista de lista como equivalente textual, sin prometer que la escena sea recorrible
- [ ] 6.3 Anunciar el cambio de selección de forma no interruptiva, sin mover el foco (D6)
- [ ] 6.4 Coalescer las ráfagas de anuncios para que recorrer una cadena de prelaciones con las flechas no genere un torrente
- [ ] 6.5 Comprobar que el foco permanece en el campo de búsqueda cuando la selección cambia desde ahí

## 7. Cierre

- [ ] 7.1 Recorrer la aplicación completa con un lector de pantalla real, comprobando en particular el recorrido rápido por flechas
- [ ] 7.2 Recorrer la aplicación completa solo con teclado, sin tocar el ratón, incluyendo cargar una nota y calcular una definitiva
- [ ] 7.3 Ejecutar `npm run test` y `npm run build`
- [ ] 7.4 Actualizar `docs/05-interfaz.md` con el atajo de búsqueda, las dos capas de Escape y el comportamiento con movimiento reducido
- [ ] 7.5 Anotar la conclusión sobre el contraste del texto de 10 y 11 píxeles, y si merece un cambio propio
