## 1. Extraer las piezas de captura

- [x] 1.1 Crear `src/ui/intentos/SelectorNota.tsx` moviendo el componente local de `EditorIntentos.tsx` sin cambiar su comportamiento: nueve enteros del Art. 39, separación en la frontera 4|5, distinción aprobatoria/reprobatoria (D2)
- [x] 1.2 Crear `src/ui/intentos/consecuencia.ts` con `ETIQUETA_TIPO` y `consecuencia(intento)`, que cita el artículo aplicable a cada tipo
- [x] 1.3 Crear `src/ui/intentos/FormularioIntento.tsx` moviendo el formulario completo de `EditorIntentos.tsx`
- [x] 1.4 Reapuntar `EditorIntentos.tsx` a las tres piezas extraídas y comprobar que el panel de detalle se comporta exactamente igual que antes — este paso no debe tener efecto visible
- [x] 1.5 Verificar que no queda ninguna segunda definición de la escala 1–9 ni de las etiquetas de tipo fuera de `src/ui/intentos/`

## 2. La ruta y el armazón de la vista

- [x] 2.1 Añadir `plan` a `Vista` y `#/plan` a `RUTAS` y `FRAGMENTO` en `src/ui/useVista.ts`, dejando intacto el comportamiento de fragmento desconocido → grafo
- [x] 2.2 Añadir `Plan` a `PestanasVista` como tercera pestaña, visible en las tres vistas
- [x] 2.3 Crear `src/ui/Plan.tsx` con el armazón de la vista y su cabecera propia, recibiendo `grafo`, `estados`, `resumen` e `historial` por props, sin calcular nada por su cuenta (D7)
- [x] 2.4 Enrutar la vista en `App.tsx` junto a las dos existentes

## 3. La lista en solo lectura

- [x] 3.1 Agrupar las materias por semestre en orden ascendente, ordenando cada grupo por nombre con `localeCompare(…, 'es')` como ya hace `Semestres.tsx`
- [x] 3.2 Renderizar cada grupo con su encabezado: número de semestre, conteo de materias y total de unidades de crédito
- [x] 3.3 Renderizar cada fila con nombre, código, punto de sector, unidades de crédito y estado, tomando el color de `leerTokens()`
- [x] 3.4 Comunicar el estado por texto además de por color, distinguiendo bloqueo por prelación de bloqueo por crédito
- [x] 3.5 Construir la vista con elementos semánticos, de modo que la agrupación por semestre y las cifras se anuncien a un lector de pantalla
- [x] 3.6 Comprobar que toda la vista se recorre con el tabulador en orden de lectura

## 4. Filtrado por estado compartido

- [x] 4.1 Elevar `estadoFiltrado` a filtro de estado de la aplicación, leído por la leyenda, por la cabecera y por la lista, sin duplicar el estado
- [x] 4.2 Aplicar el filtro a la lista: omitir los grupos de semestre que quedan sin materias, en vez de mostrarlos vacíos
- [x] 4.3 Mostrar el conteo y el total de unidades de crédito del conjunto filtrado
- [x] 4.4 Ofrecer quitar el filtro desde la propia lista
- [x] 4.5 Comprobar que el filtro elegido en la lista sigue aplicado al cambiar al grafo, y al revés

## 5. Navegación desde la lista

- [x] 5.1 Añadir en cada fila la acción de abrir la materia en el grafo, que cambia de vista, la selecciona y ordena el enfoque de cámara reutilizando `irA` de `App.tsx`
- [x] 5.2 Añadir en cada fila la acción de abrir la materia en la calculadora, reutilizando `elegirMateriaCalculada` para que llegue con el plan inicial creado y sin pedir búsqueda

## 6. Captura por fila

- [x] 6.1 Renderizar `SelectorNota` en las filas de materias **sin** intentos; elegir una nota registra un intento `regular` con esa nota (D3, D4)
- [x] 6.2 Renderizar en las filas **con** intentos la nota efectiva en vez del selector, sin aceptar escritura directa
- [x] 6.3 Señalar en las filas con más de un intento cuántos hay, para que la nota efectiva del Art. 49 no se lea como una nota suelta
- [x] 6.4 Ofrecer en toda fila desplegar `FormularioIntento` en su sitio, sin sacar al usuario de la lista ni perder la posición de desplazamiento
- [x] 6.5 Comprobar que ningún clic sobre una fila con historial elimina ni reemplaza un intento
- [x] 6.6 Comprobar que registrar una nota actualiza índice, créditos y los estados de las materias dependientes sin recargar ni cambiar de vista
- [x] 6.7 Medir el render de la lista con el historial vacío —el caso con más selectores en el DOM— y, si va mal, pasar el selector a desplegarse por fila. **Medido**: 68 filas, 825 botones, 1494 nodos DOM; en build de producción 0–2 ms por registro y 139 ms hasta `DOMContentLoaded`. No hace falta diferir el selector. Los 75 ms observados en desarrollo eran del doble render de `StrictMode`.

## 7. Lo inscribible en la cabecera

- [x] 7.1 Derivar de `estados` el conteo de materias en estado `disponible` y la suma de sus unidades de crédito
- [x] 7.2 Añadir a `Cabecera.tsx` la tercera celda con ambas cifras, como control que lleva a `#/plan` con el filtro de estado `disponible` aplicado (D5)
- [x] 7.3 Sustituir esa celda por la invitación a cargar el historial cuando no haya ningún intento registrado, en vez de presentar el primer semestre como un resultado
- [x] 7.4 Comprobar que la celda se actualiza al registrar un intento desde cualquiera de las dos superficies de captura

## 8. La lista como vista de reserva

- [x] 8.1 Implementar la detección de un contexto WebGL utilizable, ejecutada una sola vez antes de montar `GrafoOrbital` (D6)
- [x] 8.2 Forzar la vista `plan` cuando no haya WebGL, cualquiera que sea el fragmento de la URL, y no montar la escena 3D
- [x] 8.3 Mostrar en ese caso un aviso que explique que el grafo 3D no está disponible en este navegador, dejando el resto de la aplicación operativa. También se retira la pestaña «Grafo»: una pestaña que al pulsarla no lleva a ninguna parte es un control muerto

## 9. Cierre

- [x] 9.1 Comprobar que la lista, el grafo y la cabecera muestran el mismo estado y las mismas cifras para la misma materia después de registrar intentos desde ambas superficies
- [x] 9.2 Ejecutar `npm run test` y `npm run build`
- [x] 9.3 Actualizar `docs/05-interfaz.md` con la tercera vista, la tabla de componentes y la regla de que una materia con historial no se sobrescribe desde la lista
- [x] 9.4 Registrar en el documento de diseño la decisión que se tome sobre `TAP Tesis` y `TAP Pasantía` en la lista, o dejarla anotada como pendiente si sigue abierta
