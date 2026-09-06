## Context

La aplicación tiene hoy el pensum como dato estático y puro: 58 materias, sus prelaciones, sus correquisitos y sus doce compuertas por créditos. La arquitectura mantiene una frontera dura — `data/`, `model/` y `layout/` no importan React ni three.js y corren en Node.

Lo que falta es el estudiante. Este cambio añade una segunda capa de datos, esta vez mutable y personal, sin romper esa frontera y sin backend.

La norma aplicable es **C-3, Normas para la Evaluación del Rendimiento Estudiantil**, Capítulo VII (Artículos 46–55), complementada por el Art. 21 (retiros), el Art. 37 (suficiencia), el Art. 39 (escala) y el Art. 48 (equivalencias). El documento está escaneado, sin capa de texto; se transcribió leyendo las páginas.

Tres hallazgos de esa lectura gobiernan el diseño:

1. **La escala es 1–9 en enteros**, no 0–20. Aprobatorias 5–9, reprobatorias 1–4.
2. **El índice computa lo cursado, no lo aprobado** (Art. 47a). Las materias reprobadas pesan.
3. **El Art. 49 hace que repetir no borre el pasado**: a partir del tercer intento se promedian todos menos el primero.

## Goals / Non-Goals

**Goals:**

- Un índice académico que sea **correcto justo cuando el estudiante ha repetido**, que es cuando más le importa y cuando un promedio casero falla.
- Convertir las doce compuertas por créditos de dato inerte en estado personal.
- Responder «¿qué puedo inscribir?» sin que el usuario tenga que razonarlo.
- Mantener el cálculo **puro y probado sin navegador**, como el resto del modelo.
- Que perder el navegador no signifique perder la carrera registrada.

**Non-Goals:**

- Sincronización entre dispositivos, cuentas o cualquier forma de backend.
- Proyecciones y simulaciones («qué necesito para llegar a 6,00»).
- El Índice Total del Cuadro de Honor (C-19: IA × IE × IP). El Índice de Eficiencia sale casi gratis de estos datos, pero queda fuera para no ampliar el alcance.
- Carga masiva de notas. La captura entra solo por el panel de la materia.

## Decisions

### D1 — El historial es una lista de intentos, no una nota

```ts
interface Intento {
  tipo: 'regular' | 'equivalencia' | 'suficiencia' | 'retiro' | 'en-curso'
  nota: number | null        // 1..9 entera; null si no aplica
  desincorporado?: boolean   // solo para tipo 'retiro'
  periodo?: string           // etiqueta libre del lapso, opcional
}

type Historial = Record<string /* id de materia */, Intento[]>
```

El Art. 49 depende de **cuántas veces** se cursó la materia, así que el número de intentos es dato de primera clase. Guardar «una nota por materia» lo haría incalculable.

*Alternativa descartada:* una sola nota por materia. Se construye en un cuarto del tiempo y acierta mientras nadie repita; falla en silencio para quien arrastra materias, y el error va **a favor** del estudiante — el peor sentido, porque nadie lo reporta.

### D2 — Las dos reglas del Art. 49 son la misma regla

> «Cuando por aplazamiento se curse de nuevo, la calificación obtenida **elimina la anterior**. Cuando la misma asignatura se cursa por **tercera o más veces**, se promediarán todas las calificaciones **excepto la primera obtenida**.»

```
  intentos computables      nota efectiva
  ─────────────────────────────────────────────
  [3]                       3
  [3, 6]                    6         ← "elimina la anterior"
  [3, 4, 6]                 5,0       ← media de (4, 6)
  [3, 4, 6, 8]              6,0       ← media de (4, 6, 8)
```

«Elimina la anterior» no es un caso aparte: es el promedio de un solo elemento. Una sola expresión cubre ambos:

```ts
notaEfectiva(xs) = xs.length === 1 ? xs[0] : media(xs.slice(1))
```

Que la norma parezca tener dos reglas y en realidad tenga una es el tipo de cosa que conviene dejar escrita, porque invita a implementarlas por separado y a divergir.

### D3 — Dos banderas por intento, nunca una

Los casos especiales no se comportan igual respecto a créditos y a índice, así que colapsarlos en un solo booleano «aprobada» da números equivocados:

| Tipo de intento | Otorga U.C. | Pesa en el índice | Norma |
|---|---|---|---|
| Regular, nota ≥ 5 | ✅ | ✅ | Art. 47 |
| Regular, nota ≤ 4 | ❌ | ✅ | Art. 47a |
| Equivalencia / traslado | ✅ | ❌ | Art. 48 |
| Suficiencia aprobada | ✅ | ✅ | Art. 37 P.2 |
| Suficiencia reprobada | ❌ | ❌ | Art. 37 P.3 |
| Retiro **con** desincorporación | ❌ | ❌ | Art. 21 P.1a |
| Retiro **sin** desincorporación | ❌ | ✅ | Art. 21 P.1b |
| En curso | ❌ | ❌ | — |

La consecuencia que más sorprende: **«U.C. aprobadas» y «U.C. del índice» son conjuntos distintos**. Una materia por equivalencia abre compuertas pero no mueve el índice.

### D4 — Solo los intentos que pesan cuentan como «veces cursada»

Un retiro con desincorporación no afecta el historial académico (Art. 21 P.1a), así que tampoco debe contar al aplicar el Art. 49. La secuencia de intentos que alimenta `notaEfectiva` es la de los intentos con `pesaEnIndice`, no la lista cruda.

Es una **interpretación**, no una cita: la norma no dice literalmente qué cuenta como «vez cursada». Queda en Preguntas Abiertas.

### D5 — El redondeo del Art. 55 no es `toFixed`

> «El índice académico se calculará con tres decimales y se registrará con dos. Cinco o más milésimas se aproximarán a una centésima más.»

`(6.715).toFixed(2)` devuelve `"6.71"` en JavaScript, porque 6.715 no es representable exactamente en punto flotante y el valor real queda por debajo. La norma exige `6,72`. Hay que redondear en dos pasos explícitos, a medio hacia arriba:

```
  valor crudo → 3 decimales (medio arriba) → 2 decimales (medio arriba)
```

Es un detalle de una línea que decide si el número que ve el estudiante coincide con el de Control de Estudios.

### D6 — Estado derivado, nunca almacenado

El estado de cada materia —aprobada, en curso, disponible, bloqueada— **se calcula** a partir del historial y del grafo. No se guarda.

```
        historial (única fuente de verdad)
              │
              ├──▶ U.C. aprobadas ──▶ ¿compuerta abierta?
              │                              │
              ├──▶ materias aprobadas ──▶ ¿prelaciones cumplidas?
              │                              │
              └──▶ nota efectiva ──▶ índice   ▼
                                         estado de cada materia
```

Guardar el estado invitaría a que se desincronizara del historial. Con 58 materias el recálculo completo es instantáneo.

**Estados y su regla:**

```
  aprobada     hay un intento que otorga U.C.
  en curso     hay un intento 'en-curso'
  disponible   no aprobada, todas sus prelaciones aprobadas,
               y su compuerta cumplida            ← LA FRONTERA
  bloqueada    le falta alguna prelación
  sin crédito  prelaciones cumplidas pero compuerta no alcanzada
```

`disponible` es la respuesta a «qué inscribo el semestre que viene», y es la razón de ser del cambio.

### D7 — El cálculo es puro; la persistencia es una capa aparte

```
  src/progreso/       modelo del historial + cálculo del índice
                      sin React, sin DOM, testeable en Node
  src/persistencia/   localStorage, versión, migración, export/import
                      la única parte que toca el navegador
```

Igual que la frontera modelo/render del cambio anterior. Las reglas del Art. 49 y las banderas del Art. 48 son precisamente lo que quieres cubrir con pruebas, y no deberían necesitar un navegador para correr.

### D8 — `localStorage` versionado, con export/import como red de seguridad

Para 58 materias el historial pesa unos 4 KB. `localStorage` es síncrono, encaja bien con React y sobra de capacidad.

*Alternativa descartada:* IndexedDB. Asíncrono y ceremonioso para este tamaño; no compensa.

*Alternativa descartada:* solo URL compartible. Pierdes todo al cerrar la pestaña sin copiar.

El registro persistido lleva `version` y pasa por una función de migración al leerse. Sin eso, el primer cambio de esquema borra las carreras de todos los que ya cargaron notas.

**Exportar/importar entra en el alcance aunque la captura sea solo por panel.** `localStorage` desaparece al limpiar datos del sitio, no existe en ventana privada y no cruza dispositivos; sin una vía de respaldo, un clic accidental borra una carrera entera y no hay vuelta atrás.

### D9 — La escala es 1–9 entera en toda la interfaz

Nada de campos numéricos libres ni de 0–20. Un selector de nueve valores, con la frontera 4|5 marcada visualmente. El Art. 39 también prevé materias en escala APROBADO/REPROBADO, que se representan con el tipo de intento correspondiente en vez de una nota.

## Risks / Trade-offs

**[Perder `localStorage` es perder la carrera registrada]** → Exportar/importar JSON en el alcance, y aviso visible de que los datos viven solo en este navegador. Es mitigación, no solución: sin backend no hay otra.

**[Las 6 U.C. de TAP Tesis y TAP Pasantía son inferidas por este proyecto]** → Si su escala real fuese APROBADO/REPROBADO, 12 U.C. entrarían mal al índice justo al final de la carrera, cuando el número decide la graduación. Ya está anotado en `pensum.meta.inferencias`; el cambio lo hereda y lo sube a Pregunta Abierta.

**[La interpretación del Art. 49 sobre retiros no está citada]** → D4 decide que un retiro con desincorporación no cuenta como «vez cursada». Es razonable y coherente con el Art. 21, pero es lectura nuestra. Se documenta en el código y se expone en la interfaz al registrar ese tipo de intento.

**[Un cálculo equivocado se ve autorizado]** → Mostrar un índice con dos decimales junto a umbrales normativos proyecta una precisión que obliga. Mitigación: cubrir con pruebas cada regla citando su artículo, e indicar en la interfaz que el cálculo es referencial y no sustituye a Control de Estudios.

**[Migración de esquema]** → Campo `version` y función de migración desde el primer día, aunque hoy solo exista la versión 1. Añadirlo después es mucho más caro.

## Open Questions

- **¿Cuenta un retiro con desincorporación como «vez cursada»** a efectos del Art. 49? D4 asume que no. Conviene confirmarlo con Control de Estudios.
- **¿TAP Tesis y TAP Pasantía usan escala 1–9 o APROBADO/REPROBADO?** Afecta 12 U.C. y, con ellas, el índice final de graduación.
- **¿Qué otras materias son de escala APROBADO/REPROBADO** según el Art. 39 Parágrafo Único? `Servicio Comunitario` tiene 0 U.C. y se autorresuelve —peso cero en la media ponderada—, pero puede haber más.
- **¿Los cursos intensivos** (C-21, C-41) cuentan como intento normal a efectos del Art. 49, o tienen tratamiento propio?
- **¿Debe la aplicación permitir registrar materias fuera del pensum** (cursadas antes de un cambio de carrera, Art. 53)? Hoy el historial se indexa por `id` del dataset, así que no.
