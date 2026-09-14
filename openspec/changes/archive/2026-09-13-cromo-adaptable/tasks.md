## 1. El ancho del panel como valor único

- [x] 1.1 Crear `src/ui/panel.ts` con `ANCHO_PANEL` y `MARGEN_PANEL` como única definición del ancho del panel de detalle (D3)
- [x] 1.2 Reapuntar `PanelDetalle.tsx` a ese valor en lugar de la clase literal `w-[22rem]`
- [x] 1.3 Reapuntar el desplazamiento de las islas superiores en `App.tsx`, eliminando el `right: '24rem'` escrito a mano
- [x] 1.4 Eliminar la constante `ANCHO_PANEL = 368` de `GrafoOrbital.tsx` y pasar a `CapaEtiquetas` la geometría real que ocupa el panel, no una aproximación
- [x] 1.5 Comprobar en una ventana estrecha que las etiquetas suprimidas son exactamente las que caen bajo el panel, sin borrar etiquetas visibles

## 2. Los tramos

- [x] 2.1 Crear `src/ui/tramos.ts` con `ANCHO_MINIMO_GRAFO`, `ANCHO_DOS_COLUMNAS` y el tipo `Tramo`, documentando la aritmética del cromo que produce cada número (D1)
- [x] 2.2 Medir el ancho del contenedor raíz con `ResizeObserver` en `App.tsx` y derivar el tramo activo (D2)
- [x] 2.3 Comprobar que el tramo se recalcula al redimensionar sin recargar y sin parpadeo en el primer pintado

## 3. Reflujo del tramo compacto

- [x] 3.1 Colapsar `Leyenda` por defecto en el tramo compacto, reutilizando su mecanismo `abierta` existente (D5)
- [x] 3.2 Reducir `Semestres` a una forma que quepa cuando los diez botones no entran, conservando el acceso a los diez semestres y a «Todos»
- [x] 3.3 Ajustar la lista del semestre aislado para que no desborde el ancho disponible y siga siendo desplazable
- [x] 3.4 Recolocar o colapsar las islas de la esquina superior derecha cuando no quepan junto al buscador, conservando el ancho utilizable del buscador
- [x] 3.5 Comprobar que toda isla colapsada sigue siendo alcanzable desde un control visible, sin desaparecer sin rastro
- [x] 3.6 Verificar tramo por tramo que ningún par de islas se superpone en ningún ancho en que se ofrezca el grafo
- [x] 3.7 Verificar que en el tramo amplio la disposición es idéntica a la actual, isla por isla (D8)

## 4. El panel como hoja inferior

- [x] 4.1 Presentar `PanelDetalle` anclado al borde inferior por debajo de `ANCHO_DOS_COLUMNAS`, conservando su contenido completo y su desplazamiento
- [x] 4.2 Mantener visible la materia seleccionada en la escena cuando el panel es hoja
- [x] 4.3 Apartar las islas que quedarían bajo la hoja, en coordinación con el colapso de `Semestres` del paso 3.2
- [x] 4.4 Hacer que `CapaEtiquetas` suprima la franja inferior en vez de la lateral cuando el panel es hoja (D3)

## 5. Vista por defecto bajo el umbral

- [x] 5.1 Presentar la lista del pensum en lugar del grafo cuando el ancho esté por debajo de `ANCHO_MINIMO_GRAFO` y la URL no pida el grafo explícitamente (D4)
- [x] 5.2 Mostrar la nota de que el grafo 3D necesita una pantalla más ancha, con un control para verlo de todos modos
- [x] 5.3 Respetar el fragmento de la URL cuando pide el grafo, también bajo el umbral
- [x] 5.4 Comprobar que ensanchar la ventana estando en la lista no cambia de vista al usuario. **Falló en la primera implementación**: la caída era una derivación pura y se revertía al ensanchar, devolviendo al usuario al grafo. Se corrige fijando la caída en el fragmento (`#/plan`) en vez de derivarla en cada render

## 6. Interacción táctil del grafo

- [x] 6.1 Añadir a cada nodo una geometría de colisión mayor que su disco visible, transparente y sin escribir en el buffer de profundidad (D6)
- [x] 6.2 Verificar visualmente contra el estado actual que el bloom y el orden de transparencias no se degradan
- [x] 6.3 Comprobar que el tamaño visible de los discos no cambia
- [x] 6.4 Hacer que un toque sobre una materia ilumine su cono sin depender de `onNodeHover`, de modo que el cono sea alcanzable sin cursor
- [x] 6.5 Distinguir toque de órbita por el desplazamiento del gesto, de modo que arrastrar para orbitar no seleccione la materia bajo el dedo al soltar (D7). La decisión se extrajo a `view/gesto.ts` como función pura con 8 pruebas; el cableado a `pointerdown/move/up` **no se pudo ejercitar con un puntero real** (ver 7.2)
- [x] 6.6 Detener la rotación automática ante cualquier gesto sobre el lienzo, no solo al seleccionar, y reflejarlo en el control

## 7. Cierre

- [x] 7.1 Recorrer la aplicación a 1440, 1280, 1100, 1000, 900 y 375 px comprobando que en cada ancho o no hay solapes o la vista ofrecida es la lista. Barrido hecho con y sin panel abierto; **destapó dos fallos**: la leyenda expandida se salía por arriba a 900×800 con la hoja abierta, y la barra centrada pisaba el panel lateral entre 1100 y 1135 (umbral subido a 1160)
- [ ] 7.2 Probar la selección, el cono y la órbita en un dispositivo táctil real, en ambas orientaciones. **NO HECHO**: no hay dispositivo táctil en este entorno, y los eventos sintéticos no pasan por el raycaster de `react-force-graph`, así que el radio de acierto efectivo y el comportamiento del dedo siguen sin medirse
- [x] 7.3 Ejecutar `npm run test` y `npm run build`
- [x] 7.4 Actualizar `docs/05-interfaz.md` con los tramos, el diagrama del cromo por tramo y la regla de que el ancho del panel tiene una sola definición
- [x] 7.5 Registrar la decisión sobre los umbrales tras verificarlos en una tableta real, o dejar anotado que siguen sin verificar. **Verificados en navegador, no en tableta**: `ANCHO_DOS_COLUMNAS` pasa de 1100 a 1160 por medición directa (a 1100 con panel abierto la barra llega a 749 y el panel empieza en 732). `ANCHO_MINIMO_GRAFO = 900` sigue siendo un juicio sin medir: nadie ha mirado el grafo a 900 px en una pantalla real
