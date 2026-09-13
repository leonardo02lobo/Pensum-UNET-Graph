## Context

`useVista.ts` son 46 líneas y una decisión bien tomada:

> *«Se navega escribiendo el fragmento, no el estado: así el botón atrás del navegador queda dentro del mismo flujo y no hay dos fuentes de verdad.»*

El problema es el alcance. El fragmento codifica la vista y nada más; las otras cuatro piezas de estado compartible viven en `useState` dentro de `App.tsx`:

```
   useVista  ──→  vista                    en el fragmento  ✓

   useState  ──→  seleccion                efímero  ✗
   useState  ──→  sectorFiltrado           efímero  ✗
   useState  ──→  semestreFiltrado         efímero  ✗
   useState  ──→  estadoFiltrado           efímero  ✗
   useState  ──→  materiaCalculada         efímero  ✗  y además duplica
                                                        `seleccion`
```

`materiaCalculada` es el caso más llamativo: el grafo sabe qué materia mira el usuario, la calculadora tiene su propio `Selector` con la misma función `buscar()`, y ninguna de las dos se lo cuenta a la otra.

Y los filtros son tres, se eligen en dos componentes distintos (uno de ellos con pestañas), componen entre sí y no se muestran en ninguna parte. `Esc` los limpia los tres a la vez; eso está documentado en `docs/05-interfaz.md` y en ningún píxel de la pantalla.

Este cambio no inventa un principio nuevo. Aplica el que ya está escrito a las cuatro piezas que se quedaron fuera.

## Goals / Non-Goals

**Goals:**

- Que una pantalla concreta del grafo sea una dirección que se pueda enviar.
- Que recargar no cueste el contexto.
- Que la materia elegida no se pierda al cambiar de pestaña.
- Que el estado de filtrado sea visible y retirable desde un solo sitio.
- Que no aparezca una segunda fuente de verdad junto al fragmento — el fallo exacto que `useVista` evitó.

**Non-Goals:**

- Meter el historial académico en la URL. Son datos personales, no caben y no deben viajar.
- Compartir planes de evaluación. Son papel de borrador por decisión explícita (D7 de `calculadora-nota-final`).
- Enlaces cortos, QR o cualquier cosa que necesite servidor.
- Rediseñar los controles de filtrado. Los chips **muestran y quitan**; elegir se sigue haciendo donde se hace hoy.
- Un botón de «copiar enlace». La barra de direcciones ya es ese botón.

## Decisions

### D1 — Segmento para la materia, parámetros para los filtros

```
   #/grafo
   #/grafo/425401
   #/grafo/425401?sector=programacion&estado=disponible&semestre=4
   #/calculadora/425401
   #/plan?estado=disponible
```

La materia es **de qué va** la pantalla, y va en la ruta. Los filtros son **cómo la estás mirando**, y van en parámetros. La distinción no es estética: un enlace a una materia sigue teniendo sentido si se le quitan los parámetros, y uno con filtros y sin materia también.

El identificador es el `id` de materia, que ya es la clave del `Historial` en `localStorage` y del `Map` de `grafo.materias`. No hace falta inventar un esquema de URL.

*Alternativa descartada:* todo en parámetros (`#/grafo?materia=425401&…`). Más uniforme de analizar, pero pierde la jerarquía y hace que un enlace a una materia se lea como una consulta en vez de como un sitio.

### D2 — El fragmento se analiza con una función pura y probada

`useVista` deja de ser un `Record` de cuatro claves y pasa a:

```ts
interface Direccion {
  vista: Vista
  materia: string | null
  sector: Sector | null
  estado: EstadoMateria | null
  semestre: number | null
}

leerDireccion(fragmento: string): Direccion   // pura
escribirDireccion(d: Direccion): string       // pura
```

Ambas se prueban sin navegador, como el resto del modelo. La app ya tiene esa frontera —`data/`, `model/`, `layout/`, `progreso/` no importan React ni three.js— y el análisis de un fragmento con casos inválidos es precisamente el tipo de código que se rompe en silencio si solo se prueba a mano.

**La validación es tolerante y parcial**: un sector inexistente se descarta, pero no invalida la materia ni el resto de los filtros. La regla la hereda de `useVista`, que ya trata el fragmento desconocido cayendo en el grafo «sin error».

### D3 — El fragmento es la única fuente de verdad, no una copia sincronizada

Éste es el riesgo central del cambio y la decisión que lo contiene.

```
       ✗ LO QUE NO HAY QUE HACER           ✓ LO QUE SE HACE

   useState(seleccion) ⇄ fragmento      fragmento ──→ Direccion ──→ render
        ▲         ▲                          ▲
        │         └── efecto que             │
   clic ┘             sincroniza        clic ─┘ (escribe el fragmento)

   dos verdades, y un efecto            una verdad; el clic no cambia
   en medio que las cruza               estado, cambia la dirección
```

Cuatro `useState` desaparecen de `App.tsx`. Un clic en un nodo no llama a `setSeleccion`: escribe el fragmento, y el render sigue. Es más indirecto y es el precio de no tener dos verdades — exactamente el razonamiento que `useVista` ya dejó escrito para la vista.

### D4 — `push` para vistas, `replace` para selección y filtros

```
   cambio de vista        ──→  location.hash = …        (entrada nueva)
   cambio de selección    ──→  history.replaceState(…)  (reemplaza)
   cambio de filtro       ──→  history.replaceState(…)  (reemplaza)
```

Sin esto, recorrer diez materias con las flechas deja diez entradas en el historial y el botón de retroceso se vuelve inútil: para volver a donde estabas hay que pulsarlo diez veces. Con flechas de navegación, que invitan a recorrer rápido, esto se nota de inmediato.

La vista sí empuja, porque cambiar de vista **es** navegar y el usuario espera poder volver — que es lo que `useVista` ya garantiza hoy.

Consecuencia técnica: `replaceState` no dispara `hashchange`. El estado de la aplicación tiene que actualizarse en el mismo gesto que reemplaza la dirección, no esperando al evento.

### D5 — `materiaCalculada` y `seleccion` se funden

Hoy son dos estados con dos selectores de materia. Pasan a ser **el mismo dato** —`Direccion.materia`— con dos usos:

```
   Direccion.materia ──┬──→  grafo:        selección + panel + enfoque
                       └──→  calculadora:  materia del plan
```

`elegirMateriaCalculada` conserva su efecto secundario útil: crear `planInicial(materia)` si esa materia no tiene plan en la sesión. Eso deja de dispararse al elegir y pasa a dispararse al **entrar en la calculadora con una materia**, venga de donde venga.

Los planes siguen viviendo solo en memoria, indexados por materia. Nada de eso cambia.

### D6 — Los chips van bajo la cabecera, y solo muestran y quitan

```
   ┌──────────┬───────────────┬──────────────┐
   │ Índice   │ Unidades      │ Inscribible  │
   └──────────┴───────────────┴──────────────┘
   ┌─────────────────────────────────────────┐
   │ Programación ✕   Disponible ✕   S4 ✕    │  Limpiar todo │
   └─────────────────────────────────────────┘
```

Bajo la cabecera porque es donde ya está el aviso de almacenamiento, en la columna de «lo que la app te está diciendo sobre tu estado». Y porque la banda inferior —donde viven los controles de filtrado— es justo la que `cromo-adaptable` va a descongestionar.

**No sustituyen a los controles de origen.** Un chip que también permitiera *elegir* duplicaría la leyenda y la barra de semestres. Mostrar y quitar es el hueco que falta; elegir ya está resuelto.

Los chips son además la contraparte visible de `Esc`, que `accesibilidad-operable` va a exponer en la interfaz: ver qué hay que limpiar y poder limpiarlo con el puntero.

### D7 — El enfoque inicial por enlace se dispara una vez

`orden` lleva un `nonce` precisamente para que enfocar dos veces la misma materia vuelva a mover la cámara. Llegar por URL tiene que producir **un** enfoque y no quedar reenfocando en cada render, ni reenfocar cuando el usuario ya orbitó por su cuenta.

Regla: la dirección dispara enfoque cuando la materia **cambia**, no cuando la dirección se vuelve a leer. Una recarga es un cambio de `null` a la materia; un render posterior no es nada.

## Risks / Trade-offs

- **Dos fuentes de verdad por la puerta de atrás.** El riesgo mayor: es muy fácil «arreglar» un caso raro añadiendo un `useState` que se sincroniza con el fragmento, y ahí se pierde todo lo ganado. → D3 es explícita y el escenario `Navegar escribiendo la dirección` la comprueba: editar el fragmento a mano debe producir exactamente el mismo estado que llegar con clics.

- **Romper enlaces que ya circulan.** `#/grafo` y `#/calculadora` existen. → Escenario propio (`Los enlaces anteriores siguen valiendo`) y el análisis tolerante de D2.

- **`replaceState` no dispara `hashchange`.** Si el estado se actualizara solo por el evento, la selección dejaría de responder al hacer clic. → D4 lo nombra; es el fallo más probable de la implementación.

- **Una URL con cuatro piezas es fea y larga.** → Se acepta. Solo aparecen los parámetros que están activos, y en el caso frecuente (una materia, sin filtros) queda `#/grafo/425401`, que se lee bien.

- **Los chips añaden una fila al cromo superior**, que ya va justo y que `plan-de-inscripcion` ensancha con la celda de inscribibles. → Es deuda declarada que recoge `cromo-adaptable`. Este cambio no debe intentar resolverla por su cuenta.

- **Interacción con `plan-de-inscripcion`.** Ese cambio eleva el filtro de estado a estado de aplicación y añade `#/plan`. → Si se implementa antes, este hereda un filtro ya unificado y una ruta más que codificar. Si se implementa después, hay que unificar aquí. El orden recomendado es `plan-de-inscripcion` primero.

- **`useVista` deja de ser trivial.** Pasa de 46 líneas a analizar rutas y parámetros con casos inválidos. → D2: funciones puras con pruebas propias, como el resto del modelo. Sin eso, este cambio degrada la calidad del proyecto en vez de mejorarla.

## Migration Plan

Sin migración de datos. El esquema de `localStorage` no se toca y el historial académico no entra en la URL en ningún momento.

Orden que mantiene la app funcionando en cada paso:

1. `leerDireccion` / `escribirDireccion` como funciones puras, con sus pruebas, sin conectarlas a nada.
2. Conectar la vista a la nueva representación, con el comportamiento actual intacto. Ningún cambio visible.
3. Mover `seleccion` al fragmento, con `replaceState` (D3, D4) y el enfoque inicial de D7.
4. Fundir `materiaCalculada` con `seleccion` (D5).
5. Mover los tres filtros al fragmento.
6. Añadir los chips (D6).

Reversión: los pasos 3 a 5 son los que quitan `useState` de `App.tsx` y conviene revertirlos en bloque si algo va mal, no por separado — revertir a medias es precisamente cómo se acaba con dos fuentes de verdad.

## Open Questions

- **¿Los filtros deben persistir entre sesiones**, además de vivir en la URL? Volver a la app con el filtro de la última visita puede desconcertar tanto como ayudar. La URL ya cubre el caso de compartir y recargar; se propone no persistir.
- **¿La vista `#/plan` de `plan-de-inscripcion` acepta materia en la ruta**, y qué significaría — ¿desplazar la lista hasta esa fila y resaltarla? Tiene sentido, pero se decide cuando esa vista exista.
- **¿Qué pasa si alguien comparte un enlace filtrado por estado?** Los estados dependen del historial de quien mira: `?estado=disponible` significa cosas distintas para dos personas. No es un error —el filtro es una lente, no un dato— pero conviene comprobar que no se lee como una afirmación sobre el pensum.
- **¿Conviene nombrar los parámetros en español**, como el resto del código, o en inglés por convención de URL? El proyecto es consistentemente español, incluido `#/calculadora`.
