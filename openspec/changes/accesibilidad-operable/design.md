## Context

La app tiene un modelo de teclado escrito con cuidado, y vive entero dentro de `useTeclado.ts`: 83 líneas que caminan el grafo por sus aristas y que se abstienen explícitamente cuando el foco está en un campo editable. Fuera de ahí no hay nada.

```
   src/                        indicador de foco      movimiento reducido
   ├── ui/Leyenda.tsx          —                      —
   ├── ui/Semestres.tsx        —                      —
   ├── ui/Controles.tsx        —                      —   (rotación automática)
   ├── ui/EditorIntentos.tsx   —                      —   (9 botones por materia)
   ├── ui/PanelDetalle.tsx     —                      —
   ├── ui/Buscador.tsx         focus:border           —
   └── view/GrafoOrbital.tsx   —  (es un <canvas>)    —   (cámara, bloom)
```

Las 7 coincidencias de `focus:` son las de `focus:border-slate-500` en los dos `<input>` de búsqueda y en los campos de la calculadora. Ninguno de los ~40 `<button>` tiene indicador.

El caso más revelador es el buscador. Es el camino más rápido de la app —escribir tres letras y saltar a cualquier materia— y está construido como una lista de ocho `<button>` que solo responden a `onClick`. Para usarlo hay que escribir con el teclado y elegir con el ratón. En una app cuyo argumento es *«apuntar a discos de 17 px que se mueven es mal camino, usa las flechas»*, eso desentona.

Hay además dos huecos estructurales:

- `prefers-reduced-motion` no se consulta en ningún sitio, con rotación automática, transiciones de cámara y `UnrealBloomPass` en escena.
- El grafo es un `<canvas>`. Un lector de pantalla no ve la escena, ni las 58 materias, ni que una flecha cambió la selección.

## Goals / Non-Goals

**Goals:**

- Que la promesa de teclado que la app ya hace se cumpla en toda su superficie, no solo dentro del lienzo.
- Cerrar el camino más rápido de la app sin obligar a soltar el teclado.
- Que la aplicación no inicie movimiento contra la preferencia declarada del sistema.
- Que el lienzo deje de ser un agujero semántico, apoyándose en la lista como equivalente textual.
- Una sola definición del indicador de foco, como ya hay una sola definición de cada color.

**Non-Goals:**

- Hacer la escena 3D navegable nodo a nodo con lector de pantalla. El equivalente textual es la lista de `plan-de-inscripcion`; aquí se garantiza que el lienzo se anuncie y que la selección se comunique, no que la escena sea recorrible.
- Traducciones y dirección de escritura.
- Auditoría formal contra un nivel de conformidad, con informe.
- Rediseñar la paleta. Los nueve colores de sector son un sistema de identificación ya decidido y calibrado contra el bloom; se corrigen contrastes de **texto** donde fallen, no la identidad cromática.
- Tamaño de objetivos táctiles y reflujo del cromo (`cromo-adaptable`).

## Decisions

### D1 — El foco se define una vez, en `index.css`, junto a los tokens

```css
@theme static {
  --color-focus: <un valor que contraste con #05060a y con #0b0e17>;
}

:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
  border-radius: inherit;
}
```

Es exactamente el mismo patrón que el puente Tailwind↔WebGL: una definición, muchos consumidores. La alternativa —añadir `focus-visible:ring-…` a cuarenta botones— garantiza que el número 41 se escriba sin él.

`:focus-visible` y no `:focus` es lo que hace que el anillo aparezca al tabular y no al clicar. Sin esa distinción, cada clic deja un anillo y el equipo lo acaba quitando por ruido visual — que es como se llega a no tener ninguno.

El color no se fija aquí: hay que medirlo contra los dos fondos reales (`--color-void` para el lienzo, `--color-void-soft` para las islas translúcidas) y contra el bloom, que puede lavarlo. Queda como tarea con criterio, no como valor decidido a ojo.

### D2 — El buscador se vuelve un combo de verdad

```
   estado nuevo:  activo: number | null   ← índice dentro de resultados

   ┌─────────────────────────────┐
   │ progra                      │  ← el foco NUNCA sale del <input>
   ├─────────────────────────────┤
   │ ● Programación I       S3   │
   │ ● Programación II      S4   │ ← activo, marcado visualmente
   │ ● Programación III     S5   │
   └─────────────────────────────┘

   ↓ ↑   mueven `activo`, con tope en los extremos
   Enter elige el activo
   Esc   cierra la lista  ─┐
                           ├─ dos capas: la lista primero,
   Esc   limpia todo     ─┘   el grafo después
```

**El foco no se mueve a los resultados.** Se queda en el `<input>` y la relación con el elemento activo se expresa semánticamente. Mover el foco real obligaría a devolverlo al campo en cada pulsación y rompería la escritura.

El tope en los extremos, en vez de dar la vuelta: con ocho resultados como máximo, dar la vuelta desorienta más de lo que ahorra.

**Las dos capas de `Esc`** son la parte delicada. Hoy `useTeclado` intercepta `Esc` y limpia selección y filtros, salvo si el foco está en un campo, donde solo lo abandona. Con la lista abierta hay un tercer estado: cerrar la lista sin tocar el grafo. El orden es de lo más local a lo más global, que es lo que el usuario espera.

### D3 — El atajo de búsqueda respeta la regla que ya existe

`useTeclado` ya comprueba si el foco está en un `input`, `textarea` o elemento editable antes de actuar. El atajo entra **por esa misma puerta**: si esa comprobación se salta, escribir la tecla del atajo dentro del editor de intentos o del campo de parciales de la calculadora secuestraría el foco a mitad de frase.

Qué tecla concreta queda abierto (ver preguntas abiertas). El criterio es que no compita con la escritura ni con un atajo del navegador.

### D4 — Movimiento reducido: limita lo que la app inicia, no lo que el usuario pide

```
                         preferencia activa
   rotación automática   no arranca sola   ·  el botón sigue funcionando
   transición de cámara  salto directo     ·  el encuadre final es el mismo
   transiciones del cromo desactivadas     ·  el estado final es el mismo
   bloom                 se mantiene       ·  no es movimiento
```

La distinción importa: `prefers-reduced-motion` pide que el sistema no mueva cosas por su cuenta, no que el usuario pierda una función. Quitar el botón de rotación sería tratar una preferencia como una incapacidad.

El bloom se queda. Es un efecto estático y está deliberadamente contenido (0.32 / 0.25 / 0.6, con la nota en `index.css` de que el lima se bajó por quedar sobre el umbral). Apagarlo cambiaría la identidad de la escena sin resolver ninguna molestia de movimiento.

Se observa con `matchMedia(...).addEventListener('change', …)` y no se lee una vez: la preferencia se cambia en caliente, sobre todo en escritorio.

### D5 — El lienzo se anuncia y delega; no se hace navegable

```
   <canvas>  ──  nombre: «Grafo del pensum, 58 materias»
                 descripción: qué codifica el radio y el ángulo
                 y dónde está la misma información en texto  ──→  #/plan

   selección cambia  ──→  región de anuncio educada (no roba el foco)
```

Hacer la escena recorrible nodo a nodo con lector de pantalla sería construir un árbol paralelo de 58 nodos con sus aristas — es decir, reconstruir la lista dentro del canvas. La lista ya existe (`plan-de-inscripcion`) y es mejor en ese medio. La decisión es **delegar explícitamente**, no simular.

*Alternativa descartada:* espejo DOM oculto de los 58 nodos con sus prelaciones. Duplica el modelo, se desincroniza, y ofrece una experiencia peor que la lista que ya vamos a tener.

### D6 — El anuncio de selección tiene que ser educado

Con `←→↑↓` cada pulsación cambia la selección. Recorrer una cadena de seis prelaciones dispara seis anuncios; si cada uno interrumpe al anterior o se encola, el recorrido se vuelve inusable — justo la función que la app hizo bien.

El anuncio debe ser no-interruptivo y coalescer las ráfagas: importa dónde acabaste, no cada paso intermedio. Y nunca mueve el foco, que puede estar en el buscador.

Este es el punto donde es más fácil hacer daño creyendo que se ayuda: un anuncio mal puesto es peor que ninguno.

### D7 — Los atajos se exponen en la interfaz

Hoy la tabla de teclas vive en `docs/05-interfaz.md`. Un atajo que nadie descubre no existe, y `Esc` —que limpia selección y los tres filtros a la vez— es hoy la única forma rápida de salir de un estado filtrado.

Va junto al resto de la referencia consultable, que es la leyenda: ya tiene cuatro pestañas y es donde el usuario busca «cómo funciona esto».

## Risks / Trade-offs

- **Anunciar de más.** Es el riesgo más serio: la navegación por flechas puede convertirse en un torrente. → D6, con escenario propio (`El anuncio no atropella la navegación por flechas`). Hay que probarlo con un lector real, no razonarlo.

- **El atajo de una tecla secuestra la escritura.** → D3: entra por la comprobación de campo editable que `useTeclado` ya tiene, y hay escenario explícito (`El atajo no se dispara al escribir`).

- **Las dos capas de `Esc` confunden.** Un usuario que pulsa `Esc` esperando limpiar el grafo y solo cierra la lista puede pulsarlo dos veces sin entender por qué. → Se acepta: es la convención de cualquier combo, y la alternativa (limpiar el grafo con la lista abierta) es peor.

- **El anillo de foco choca con el bloom.** El halo de los nodos puede lavar un anillo fino en la zona central de la escena. → El color y el grosor se miden contra los dos fondos reales antes de fijarlos (D1); es tarea con criterio, no valor a ojo.

- **`:focus-visible` no llega a los elementos que no son controles nativos.** Si algún elemento interactivo no es `<button>`, `<a>` o `<input>`, la regla global no lo alcanza. → El escenario `Ningún control queda fuera del orden de tabulación` obliga a recorrer cada vista entera y encontrarlos.

- **Este cambio no vuelve accesible la escena 3D**, y podría leerse como si lo hiciera. → Está declarado como no-objetivo y D5 lo dice explícitamente: el lienzo delega en la lista. Conviene que el texto de la interfaz también lo diga, para no prometer de más.

## Migration Plan

Sin migración de datos ni cambios de esquema.

Orden de implementación, de menos a más riesgo:

1. Regla global de foco y token de color, con el contraste medido contra ambos fondos (D1). Efecto inmediato en toda la app y reversible en una línea.
2. Recorrido de cada vista con el tabulador, corrigiendo lo que la regla global no alcance.
3. Movimiento reducido: rotación, cámara y transiciones del cromo (D4).
4. Buscador operable con teclado (D2) y atajo de enfoque (D3).
5. Texto además de color donde falte, y referencia de atajos en la leyenda (D7).
6. Semántica del lienzo y anuncio de selección (D5, D6) — lo último, porque es lo que exige probar con un lector de pantalla real.

Reversión: cada paso es independiente. El 6 es el que conviene poder revertir solo, porque es el único cuyo fallo empeora la experiencia en vez de dejarla como estaba.

## Open Questions

- **¿Qué tecla para el atajo de búsqueda?** `/` es la convención web y no colisiona con nada del navegador, pero es un carácter imprimible y depende del teclado. Se propone `/` con `⌘K`/`Ctrl+K` como alternativa, a confirmar.
- **¿Qué color para el anillo de foco?** Debe contrastar con `--color-void` y `--color-void-soft` sin competir con los nueve colores de sector ni con el bloom. Candidato natural es un neutro claro; hay que medirlo.
- **¿Dónde vive la referencia de atajos?** Se propone una quinta pestaña en la leyenda, pero ya son cuatro y la barra de pestañas va justa a `text-[10px]`. Puede que colisione con el reflujo de `cromo-adaptable`.
- **¿Hay que revisar el contraste del texto a `text-[10px]` y `text-[11px]`?** La app usa mucho texto de 10 y 11 px en `text-slate-500` sobre casi negro. Pasa el contraste por poco, pero el tamaño es el problema real y no está en el alcance de este cambio. Queda anotado por si merece uno propio.
- **¿Se anuncian también los cambios de filtro**, además de los de selección? Filtrar por sector cambia el grafo entero sin cambiar la selección, y hoy no produce ningún anuncio.
