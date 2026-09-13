## Context

La app tiene hoy dos vistas y un solo camino hacia el historial. El grafo orbital ocupa la ventana entera; el cromo 2D flota encima en las cuatro esquinas; la única puerta de entrada a una nota es `EditorIntentos`, dentro de `PanelDetalle`, que solo se monta si `seleccion !== null` — y `seleccion` solo cambia al clicar un nodo 3D, elegir un resultado del buscador o pulsar una flecha.

```
        historial vacío  ─────────────────────────────┐
                                                      │
   índice «—»  ·  casi todo gris  ·  0 disponibles    │  el estado
   calculadora sin contexto                           │  dominante
                                                      │  de la
        ↓ para salir de aquí                          │  primera
                                                      │  visita
   30 × (localizar disco 17 px → clic → panel →       │
         «añadir» → tipo → nota → guardar → cerrar)   │
                                                      │
        ≈ 210 interacciones ───────────────────────────┘
```

El cálculo que haría falta ya está escrito y probado: `estadosDeTodas()` devuelve el estado de las 58 materias, y `'disponible'` está documentado en el propio módulo como *«prelaciones cumplidas y compuerta cumplida: es lo inscribible»*. `resumen()` devuelve índice, U.C. y avance. **No falta modelo. Falta una superficie que lo muestre en forma de lista.**

Esa misma superficie resuelve tres problemas más que no parecen el mismo: es la única vista que cabe en un teléfono, es el equivalente textual de un `<canvas>` que ningún lector de pantalla puede anunciar, y es lo que se muestra cuando WebGL no está disponible. Cuatro deudas, un artefacto.

## Goals / Non-Goals

**Goals:**

- Que «¿qué puedo inscribir?» se responda **sin interacción**, desde la cabecera.
- Bajar el coste de cargar un semestre de ~35 interacciones a ~6.
- Que la captura rápida sea **imposible de usar para destruir historial**.
- Una sola definición de la escala del Art. 39, compartida por panel y lista.
- Que la lista derive de los mismos `estados` y `resumen` que el grafo, sin abrir una segunda fuente de verdad.

**Non-Goals:**

- Hacer responsive el cromo del grafo. La lista cabe en un móvil; la escena orbital no, y arreglarla es otro cambio.
- Anillo de foco global, `prefers-reduced-motion`, atajo del buscador.
- Chips de filtro activo, materia en la URL.
- Proyecciones («qué necesito para 6,00») y simulación de inscripción.
- Importar historial desde PDF o captura de Control de Estudios.

## Decisions

### D1 — Tercera vista, no un panel dentro del grafo

`useVista` crece a tres rutas:

```ts
const RUTAS = {
  '': 'grafo', '#/': 'grafo', '#/grafo': 'grafo',
  '#/plan': 'plan',            // ← nueva
  '#/calculadora': 'calculadora',
}
```

La lista necesita la ventana entera para ser útil: 58 filas con nota editable no caben en una isla flotante sobre el lienzo, y meterla ahí la condenaría a ser un resumen en vez de una herramienta de carga.

Además, ser una ruta es lo que la hace servir de **reserva**: `#/plan` es a la vez algo que el usuario elige y algo a lo que la app cae sola cuando el grafo no es viable (D6). Un panel no puede ser un destino.

*Alternativa descartada:* un cajón lateral sobre el grafo. Ahorra la ruta, pero deja la lista compitiendo por el ancho con `PanelDetalle` y no da URL compartible ni fallback.

### D2 — `SelectorNota` y `FormularioIntento` se extraen, no se copian

Hoy viven dentro de `EditorIntentos.tsx` como funciones locales. La lista necesita el primero en cada fila y el segundo desplegable.

```
            ANTES                              DESPUÉS

  EditorIntentos.tsx                  ui/intentos/SelectorNota.tsx
  ├── SelectorNota      (local)       ui/intentos/FormularioIntento.tsx
  ├── FormularioIntento (local)       ui/intentos/consecuencia.ts
  └── consecuencia()    (local)                    ▲         ▲
                                                   │         │
                                         EditorIntentos   FilaMateria
                                          (panel)         (lista)
```

Copiar cuesta menos hoy y garantiza que dentro de tres meses haya dos escalas del Art. 39 en circulación y una esté mal. La app ya evitó exactamente este fallo una vez con los tokens de color (`@theme static` + `leerTokens()`): una sola definición, dos consumidores. Mismo patrón, otro dominio.

### D3 — La captura rápida solo escribe donde no hay nada

Ésta es la decisión que hace segura toda la vista.

```
  intentos de la materia        qué ofrece la fila
  ────────────────────────────────────────────────────────────────
  []                            [1 2 3 4 │ 5 6 7 8 9]  ← clic escribe
                                                          un intento
                                                          regular

  [{regular, 7}]                7   ·  ✎ editar          ← clic abre
                                                          el editor
                                                          completo

  [{regular,3},{regular,4},     5,0  ·  3 intentos ·  ✎  ← idem, y
   {regular,6}]                        (Art. 49)           avisa de
                                                           que hay
                                                           historial
```

Un clic sobre una fila con historial **no puede** significar «reemplaza lo que había». La captura rápida y el modelo de intentos del Art. 49 están en tensión directa: el modelo es una lista precisamente porque el orden y el número importan, y un gesto de un solo clic no puede expresar «inserta aquí» ni «corrige el segundo».

La regla es también la que permite que la lista sea rápida: como el caso frecuente (carga inicial, todo vacío) es el caso escribible, no hace falta confirmación en ningún clic.

*Alternativa descartada:* permitir sobrescribir con un diálogo de confirmación. Treinta confirmaciones durante la carga inicial anulan la ganancia, y el diálogo aparece justo donde el usuario ya no está prestando atención.

### D4 — El tipo por defecto es `regular`; lo demás baja al editor

La lista ofrece nueve botones y nada más. `equivalencia`, `suficiencia`, `retiro` y `en-curso` son minoría en cualquier historial real y cada uno arrastra consecuencias normativas que hay que **leer** antes de elegir (`consecuencia()` cita el artículo aplicable: Art. 48 para equivalencia, Art. 37 para suficiencia, Art. 21 para retiro). Ese texto no cabe en una fila y no debe abreviarse.

### D5 — La celda de inscribibles, y el vacío como invitación

```
  ┌──────────┬─────────────────┬────────────────────┐
  │ Índice   │ Unidades        │ Inscribible        │
  │  6,47    │  62 / 178       │  7 materias        │  ← control:
  │ apto     │  ▰▰▰▱▱▱▱        │  19 U.C.        →  │    #/plan
  └──────────┴─────────────────┴────────────────────┘    + estado
                                                          disponible
  con historial vacío:
  ┌──────────┬─────────────────┬────────────────────┐
  │ Índice   │ Unidades        │ Empieza aquí       │
  │   —      │  0 / 178        │  Carga tus notas → │
  │ sin cursar│ ▱▱▱▱▱▱▱        │                    │
  └──────────┴─────────────────┴────────────────────┘
```

Con el historial vacío el conteo de disponibles es «las del primer semestre», que no es un logro ni una respuesta — presentarlo como tal sería ruido. Ese hueco es el mejor sitio de la pantalla para el único siguiente paso que tiene sentido.

`estadoFiltrado` ya vive en `App` y baja a `Leyenda`; la cabecera y la lista lo leen sin refactor. Deja de ser «el filtro de la leyenda» y pasa a ser «el filtro de estado de la aplicación».

### D6 — WebGL se detecta antes de montar la escena

Hoy `GrafoOrbital` se monta en cuanto `tamano.ancho > 0`, y si no hay contexto WebGL el resultado es un lienzo negro con un error en consola. La comprobación es barata y se hace una vez:

```
  arranque
     │
     ├─ ¿hay contexto WebGL utilizable?
     │        no ──→ vista = 'plan',  aviso: «el grafo 3D no está
     │                                 disponible en este navegador»
     │        sí ──→ vista = la de la URL
```

Cae en `plan` en vez de en un cartel de error porque la app **sigue siendo útil entera** sin el grafo: índice, estados, captura, calculadora y respaldo no dependen de three.js. Sería raro bloquear todo eso por el render.

### D7 — La lista no calcula nada

`Plan.tsx` recibe `grafo`, `estados`, `resumen` e `historial` y solo agrupa y presenta. Los conteos por semestre y por filtro se derivan de `estados`, no de un recorrido propio del historial.

La razón es concreta: el estado de una materia depende de `ucAprobadas`, que depende del Art. 49, que depende del orden de los intentos. Cualquier recálculo paralelo en la vista es una segunda implementación de la norma esperando a divergir. `design.md` del cambio `indice-academico` ya fijó que el estado se **deriva y nunca se persiste**; esto es el mismo principio aplicado a la presentación.

## Risks / Trade-offs

- **La lista se vuelve la vista principal y el grafo, decorativo.** → Es un riesgo real: la lista es más rápida para todo lo transaccional. Se acepta, pero el grafo conserva lo que la lista no puede dar —la forma de la carrera, los conos de dependencia, las aristas que cruzan sectores— y la lista enlaza a él por materia (D1 de `vista-plan`). Si la lista terminara ganando, sería información sobre qué quiere la gente, no un fallo.

- **Duplicar la escala del Art. 39.** → D2: extracción obligatoria a `ui/intentos/`, no copia. Es la mitigación y es también la parte del trabajo que hay que hacer primero, antes de escribir una sola fila.

- **Borrado accidental de historial desde la lista.** → D3: la fila con historial no acepta escritura directa. Cubierto por tres escenarios de `captura-masiva`, incluido «no hay borrado accidental».

- **58 filas con selector de nueve botones = ~520 botones en el DOM.** → Renderizar el selector solo en las filas sin historial ya reduce el caso cargado. En el caso vacío (el peor) son 58 × 9; es mucho pero no patológico para React con teclas estables. Si midiera mal, el selector pasa a desplegarse por fila.

- **Tres vistas caben peor en `PestanasVista` que dos**, sobre todo en el ancho que hoy ya va justo. → Se acepta que quede apretado en este cambio; el reflow del cromo es el objeto de `cromo-adaptable`, que es el siguiente.

- **La celda de inscribibles empuja la cabecera a ~3 columnas** y la cabecera ya convive con el buscador y el título en la esquina superior izquierda. → Mismo caso anterior: es deuda declarada que recoge `cromo-adaptable`.

## Migration Plan

No hay migración de datos: el esquema de `localStorage` (`VERSION_ESQUEMA = 1`) no cambia. Este cambio solo añade superficies de lectura y una superficie de escritura que produce exactamente el mismo `Intento` que produce el panel.

Orden de implementación que mantiene la app funcionando en cada paso:

1. Extraer `ui/intentos/` y reapuntar `EditorIntentos` — sin cambio visible. Si esto rompe algo, se ve antes de construir nada encima.
2. Añadir la ruta `#/plan` y la lista en modo solo lectura.
3. Añadir la captura por fila con la regla de D3.
4. Añadir la celda de inscribibles a la cabecera.
5. Añadir la detección de WebGL y la caída a `plan`.

Reversión: cada paso es independiente; quitar la ruta `#/plan` devuelve la app al comportamiento actual, porque `useVista` ya trata cualquier fragmento desconocido como `grafo`.

## Open Questions

- **¿La lista debe ofrecer también el semestre completo de una vez** («marcar todo el semestre 1 como aprobado con nota X»)? Ahorraría más, pero un semestre entero con la misma nota es poco realista y el gesto es peligroso. Se deja fuera hasta ver si alguien lo pide.
- **¿Qué pasa con `TAP Tesis` y `TAP Pasantía`** en la lista? **Resuelto en parte durante la implementación.** Las U.C. ya no están inferidas: el dataset registra 12 para cada una, adoptadas de Control de Estudios, y deja constancia en `meta.discrepancias` de que la inferencia previa de 6+6 era incorrecta. Lo que **sigue abierto es la escala**: `Materia` no tiene campo que la exprese, así que la lista les ofrece los mismos nueve botones del Art. 39 que a todo lo demás. Si su escala real fuese APROBADO/REPROBADO (Art. 39, Parágrafo Único), 24 U.C. estarían entrando al índice con una nota que no existe. Resolverlo exige un campo nuevo en el dataset y toca el cálculo del índice, no solo la presentación — es un cambio propio, no un ajuste de esta lista.
- **¿El umbral de viewport que dispara la caída a `plan`** (aparte de WebGL) se decide aquí o en `cromo-adaptable`? Se propone que lo decida `cromo-adaptable`, que es donde vive el resto del razonamiento sobre anchos; aquí solo se garantiza que `plan` **puede** ser el destino.
