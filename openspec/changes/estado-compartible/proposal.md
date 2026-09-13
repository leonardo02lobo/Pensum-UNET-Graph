## Why

`useVista` codifica en la URL exactamente una cosa: cuál de las vistas está abierta. Todo lo demás —la materia seleccionada y los tres filtros— vive en `useState` y se evapora al recargar.

Eso tiene tres consecuencias que se notan a diario:

**No se puede señalar nada.** Un estudiante que quiere enseñarle a otro por qué Programación II está bloqueada no tiene forma de enviarle esa pantalla. `#/grafo` lleva al grafo, no a la materia.

**Cambiar de vista cuesta volver a buscar.** Tienes `425401` seleccionada en el grafo, cambias a la calculadora, y el `Selector` te pide que la busques otra vez — la misma función `buscar()`, el mismo texto, la misma materia. La app olvida en el cambio de pestaña lo que acaba de saber.

**Los filtros son invisibles.** Hay tres, en tres esquinas distintas, y componen entre sí:

```
   sector    →  Leyenda, pestaña «sectores»     abajo-izquierda
   estado    →  Leyenda, pestaña «estados»      abajo-izquierda, otra pestaña
   semestre  →  Semestres                       abajo-centro
                            ↓
             componen en el grafo, pero en ningún sitio
             se ve «qué estoy filtrando ahora mismo»
```

Si filtras por sector, cambias a la pestaña «compuertas» y te olvidas, el grafo queda medio apagado sin ninguna explicación a la vista. `Esc` los limpia los tres de golpe — y eso está en `docs/05-interfaz.md`, no en la pantalla.

El proyecto ya decidió que la URL es el sitio donde vive lo compartible: *«se navega escribiendo el fragmento, no el estado: así el botón atrás del navegador queda dentro del mismo flujo y no hay dos fuentes de verdad»*. La decisión es buena; está aplicada a una sola cosa de las cinco que la merecen.

## What Changes

- **La materia seleccionada entra en la URL.** `#/grafo/425401` selecciona esa materia, abre su panel y enfoca la cámara. Recargar la conserva; el enlace lleva a otro al mismo sitio.
- **Los filtros entran en la URL.** Sector, estado y semestre se codifican como parámetros del fragmento, de modo que «el pensum filtrado por lo que puedo inscribir del sector Programación» sea una dirección y no una secuencia de clics.
- **La materia cruza entre vistas.** Pasar del grafo a la calculadora lleva la materia seleccionada consigo, y al revés. Nadie vuelve a buscar lo que ya estaba elegido.
- **Chips de filtro activo.** Los filtros vigentes se muestran juntos, en un solo sitio, con el nombre de lo que filtran y un control para quitar cada uno y para quitarlos todos. Es el estado que hoy solo existe en tres esquinas distintas.
- **El historial del navegador se comporta.** Elegir materia tras materia no llena el historial de entradas: la navegación entre vistas empuja, y el cambio de selección o de filtro reemplaza.

**Fuera de alcance en este cambio:**
- Meter el historial académico en la URL. Son datos personales y no caben; `localStorage` y el respaldo JSON siguen siendo su único hogar.
- Compartir un plan de evaluación de la calculadora. Los planes son papel de borrador y viven solo en memoria por decisión explícita.
- Enlaces cortos, códigos QR o cualquier forma de compartir que necesite un servidor.
- Rediseñar los controles de filtrado. Los chips muestran y quitan; elegir sigue haciéndose donde se hace hoy.
- Un botón de «copiar enlace». La barra de direcciones ya es ese botón.

## Capabilities

### New Capabilities

- `estado-compartible`: Qué parte del estado de la aplicación vive en la URL —vista, materia seleccionada y filtros—, cómo se codifica, cómo se comporta el historial del navegador y cómo se recupera un fragmento inválido.
- `filtros-visibles`: La presentación conjunta de los filtros activos, con su nombre, su retirada individual y su retirada completa.

### Modified Capabilities

- `graph-interaction`: la selección deja de ser estado efímero y pasa a estar direccionada; cerrar el panel se refleja en la dirección.
- `pestana-calculadora`: la materia elegida se comparte entre vistas y se codifica en el fragmento, de modo que la calculadora deje de pedir una búsqueda que ya se hizo.

## Impact

- **`useVista.ts` deja de ser un mapa de cuatro claves.** Hoy `RUTAS` traduce fragmento a vista con un `Record`; pasa a analizar un fragmento con segmento y parámetros. Es el archivo que más cambia, y el que más conviene mantener pequeño y probado sin navegador.
- **Estado que desaparece de `App.tsx`.** `seleccion`, `sectorFiltrado`, `semestreFiltrado` y `estadoFiltrado` son hoy cuatro `useState`; pasan a derivarse de la dirección. El riesgo es acabar con dos fuentes de verdad —el `useState` y el fragmento— que es justo lo que la decisión original de `useVista` quería evitar.
- **`materiaCalculada` y `seleccion` convergen.** Hoy son dos estados distintos, cada uno con su forma de elegir materia. Compartirlos exige decidir si son el mismo dato con dos usos o dos datos que se sincronizan.
- **Las órdenes de cámara se disparan desde la dirección.** `orden` usa un `nonce` para que enfocar dos veces la misma materia vuelva a mover la cámara; llegar por URL tiene que producir un enfoque inicial sin quedar atrapado en un bucle de re-enfoque.
- **Interacción con `plan-de-inscripcion`.** Ese cambio eleva el filtro de estado a estado de la aplicación y añade la vista `#/plan`; este lo lleva a la URL. Si se implementan en orden, el segundo hereda un filtro ya unificado; si no, hay que unificarlo aquí.
- **Interacción con `accesibilidad-operable`.** Ese cambio expone `Esc` en la interfaz; los chips son la otra mitad de lo mismo —ver qué hay que limpiar y poder limpiarlo con el puntero.
- **Riesgo de romper enlaces existentes.** `#/grafo` y `#/calculadora` ya circulan. Deben seguir funcionando exactamente igual.
- **Sin dependencias nuevas.** El proyecto decidió que dos vistas no justificaban un enrutador; cinco piezas de estado en el fragmento tampoco lo justifican, pero el análisis del fragmento deja de ser trivial y merece pruebas propias.
