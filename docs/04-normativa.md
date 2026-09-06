# Normativa

Todo el cálculo académico sigue las **Normas para la Evaluación del Rendimiento
Estudiantil de la UNET (C-3)**. Cada regla lleva su artículo citado en el código, porque
son decisiones normativas y no de criterio del proyecto: si cambian, cambia la ley, no
nuestra opinión.

## La cadena completa

```
   actividad con puntaje libre       Art. 42  → a %, y del % a nota por la Tabla 1
            ↓
   NOTA DEL PARCIAL  1,0 – 9,0       Art. 40  → × ponderación, a dos decimales
            ↓
   APORTE PONDERADO                  Art. 41  → Σ; cincuenta centésimas suben
            ↓
   DEFINITIVA  1 – 9 (entero)        Art. 39  → aprobatorias 5 a 9
            ↓
   ÍNDICE ACADÉMICO                  Art. 47 / 49
```

Los tres primeros eslabones los cubre la **calculadora** (`#/calculadora`,
`src/evaluacion/`); el último, la capa de **progreso** (`src/progreso/`).

---

## Tabla de conversión (Art. 42)

`src/data/tablaConversion.ts`. **Es un dato, no una fórmula.**

La tabla es irregular: ocho calificaciones reciben dos porcentajes y el resto uno solo.
El mejor ajuste lineal —`1 + (pct − 7) / 11`— se desvía más de media décima en **35 de
sus 89 celdas**, y se desvía justo donde importa:

```
   48 % → 4,8      50 % → 4,9
   49 % → 4,8      51 % → 5,0   ← el único porcentaje que da 5,0
```

El 5,0 es la única calificación con un solo porcentaje asociado: no hay margen.
Interpolar aquí sería aprobar o reprobar gente por redondeo.

Se almacena como **81 umbrales** (el porcentaje mínimo que alcanza cada calificación de
1,0 a 9,0 en décimas) en vez de 101 filas. Es equivalente y hace evidentes los saltos
dobles: 17→19, 28→30, 39→41, 48→50, 54→56, 62→64, 73→75, 84→86.

| Constante | Valor |
|---|---|
| `VERSION_TABLA` | `UE19` — la marca que trae el documento fuente |
| `PORCENTAJE_MINIMO` | 7 (por debajo, todo es 1,0) |
| `PORCENTAJE_MAXIMO` | 95 (desde ahí, todo es 9,0) |

Procedencia: transcrita del PDF C-3 (Tabla 1) y contrastada celda a celda contra la
[tabla oficial en línea](https://www.unet.edu.ve/~frsilva/TablaConversion.php). Ambas
coinciden.

---

## Plan de evaluación (Art. 31, 32, 40)

`src/evaluacion/plan.ts`.

Un `Parcial` guarda **las dos escalas de la norma**: `puntos` (0–100, Art. 31, que es como
el profesor suele reportar) y `nota` (1,0–9,0 en décimas, Art. 40, siempre el valor
canónico). Cuando el parcial llega en puntos, `nota` es su conversión por la Tabla 1, y
se conserva el original para no perder lo que el estudiante tecleó al reabrir el plan.

**Un NP no se salta: gasta su ponderación** (Art. 31, Parágrafo Primero). Aporta cero y
no devuelve su peso al reparto.

### Validación del Artículo 32

La aplicación conoce las U.C. de cada materia, así que puede revisarle el plan al
profesor:

| U.C. | Parciales | Cada una | Literal | Materias del pensum |
|---|---|---|---|---|
| 1 | 2 | 40 – 60 % | a | 17 |
| 2 – 3 | 3 | 20 – 40 % | b | 35 |
| 4 o más | 4 *(3 con autorización)* | 10 – 35 % | c | 13 |

**Avisa sin bloquear.** El literal c admite autorización de la Unidad de Evaluación para
usar tres parciales, y la aplicación no puede saber si esa autorización existe. Impedir
el cálculo dejaría al estudiante sin herramienta justo cuando su curso real se aparta del
papel.

Las tres materias de 0 U.C. (los nodos de Servicio Comunitario) devuelven `null`:
inventarles una regla sería peor que decir que no aplica.

`planSugerido()` reparte las ponderaciones por igual y **ajusta el último parcial** para
que la suma dé exactamente 100: con 3 parciales, 33,33 × 3 son 99,99 y el plan quedaría
incompleto de salida, que es una forma tonta de recibir al usuario.

---

## Calificación definitiva (Art. 39, 40, 41)

`src/evaluacion/definitiva.ts`.

### Para aprobar hacen falta 4,50, no 5,00

El Art. 41 redondea la sumatoria: cincuenta o más centésimas suben a la unidad inmediata
superior. La pregunta «¿cuánto necesito?» se resuelve contra media unidad menos. Se
generaliza sin casos especiales: para la definitiva **N**, la suma debe caer en
`[N − 0,50, N + 0,50)`.

Media unidad de margen que casi nadie considera al calcular a mano.

### Acotar la escala absorbe un caso especial

`definitivaDeSuma()` acota a `[1, 9]`. Eso hace que el Art. 31, Parágrafo Segundo —si
todas las parciales son NP la suma es cero y la definitiva queda en 1— salga solo, sin
una rama aparte.

### Qué devuelve `null` y por qué

`definitiva(plan)` devuelve `null` si las ponderaciones no suman 100 —normalizarlas
produciría un número silenciosamente equivocado— y también mientras queden parciales
pendientes: eso todavía es una proyección, no una definitiva.

### «¿Cuánto me falta?»

`necesarioPara(plan, objetivo)` devuelve uno de tres desenlaces:

| Desenlace | Significa |
|---|---|
| `asegurado` | Ni con 1,0 en todo lo pendiente se pierde el objetivo |
| `en-juego` | Devuelve la nota mínima uniforme necesaria, redondeada **hacia arriba** a la décima |
| `inalcanzable` | Ni con 9,0 en todo lo pendiente se alcanza |

`tablaDeObjetivos()` lo hace para cada calificación del 5 al 9, y `rangoAlcanzable()`
da la definitiva mínima y máxima todavía posibles.

---

## Índice académico (Cap. VII, Art. 46 – 55)

`src/progreso/indice.ts`.

```
        Σ (nota efectiva × U.C.)          escala 1–9 entera (Art. 39)
  IA = ──────────────────────────         3 decimales de cálculo,
                Σ U.C.                    2 de registro (Art. 55)

   < 3,60  pierde inscripción (Art. 51)   ≥ 5,10  puede graduarse (Art. 54)
   ≥ 5,00  aprueba la materia             > 6,00  cuadro de honor (C-19)
```

### El Art. 49 tiene una sola regla, no dos

La norma parece decir dos cosas —«la calificación obtenida elimina la anterior» y «a la
tercera o más veces se promedian todas excepto la primera»— pero es **una sola regla**:
«elimina la anterior» es el promedio de un solo elemento. Implementarlas por separado
invita a que diverjan.

```
  [3]          → 3
  [3, 6]       → 6      ← "elimina la anterior"
  [3, 4, 6]    → 5      ← promedio de (4, 6). NO 6, NO 4,33
  [3, 4, 6, 8] → 6      ← promedio de (4, 6, 8)
```

Repetir no borra el pasado: quien reprueba dos veces y saca 9 **no obtiene 9**.

### «U.C. aprobadas» y «U.C. del índice» son conjuntos distintos

Cada intento lleva dos banderas independientes —`otorgaCreditos()` y `pesaEnIndice()`—
porque no coinciden:

| Tipo de intento | Otorga U.C. | Pesa en el índice | Norma |
|---|---|---|---|
| Cursada, nota ≥ 5 | ✅ | ✅ | Art. 47 |
| Cursada, nota ≤ 4 | ❌ | ✅ | Art. 47a |
| Equivalencia | ✅ | ❌ | Art. 48 |
| Suficiencia aprobada | ✅ | ✅ | Art. 37 P.2 |
| Suficiencia reprobada | ❌ | ❌ | Art. 37 P.3 |
| Retiro **con** desincorporación | ❌ | ❌ | Art. 21 P.1a |
| Retiro **sin** desincorporación | ❌ | ✅ | Art. 21 P.1b |
| En curso | ❌ | ❌ | — |

### Dos redondeos encadenados (Art. 55)

«Se calculará con tres decimales y se registrará con dos. Cinco o más milésimas se
aproximarán a una centésima más.» Son dos redondeos, no uno:
`redondearNormativo(x) = medioArriba(medioArriba(x, 3), 2)`.

Antes de redondear se corrige el error de coma flotante con `toPrecision(15)`: sin eso,
`6.715 × 100` da `671.4999999999999`, `Math.round` bajaría a 671 y saldría 6,71 donde la
norma exige 6,72.

### Umbrales normativos

| Umbral | Condición | Norma |
|---|---|---|
| `pierde-inscripcion` | < 3,60 | Art. 51 |
| `insuficiente` | < 5,10 | por debajo del mínimo de graduación |
| `apto` | ≥ 5,10 | Art. 54 |
| `cuadro-de-honor` | > 6,00 | C-19, Art. 4 |

La cabecera muestra el índice **con su umbral**, porque el número solo no dice nada: 5,09
y 5,11 se parecen mucho y significan cosas opuestas.

---

## Del índice al grafo: los cinco estados

`src/progreso/estados.ts`. Saber qué materias tienes aprobadas convierte las doce
compuertas por créditos de dato inerte en estado personal, y el grafo en un mapa de
progreso:

```
  aprobada     ·  en curso  ·  DISPONIBLE  ·  falta prelación  ·  falta crédito
                              └─ prelaciones ✓ y compuerta ✓
                                 la respuesta a "¿qué inscribo?"
```

La prelación se comprueba **antes** que la compuerta: a una materia le puede faltar todo,
y lo primero que hay que resolver es la cadena de materias.

`estadosDeTodas()` calcula el avance en U.C. una sola vez y precalcula el conjunto de
aprobadas, porque cada materia lo consulta una vez por prelación y recorrer los intentos
cada vez sería cuadrático sin motivo.

`materiasDisponibles()` es la respuesta directa a «qué veo el próximo semestre».

---

## Supuestos abiertos

Interpretaciones del proyecto, marcadas como tales en el código y pendientes de confirmar
con Control de Estudios:

- **¿Un retiro con desincorporación cuenta como «vez cursada»** a efectos del Art. 49?
  Se asume que no, por coherencia con el Art. 21 — pero la norma no lo dice literalmente.
  En la implementación, `notaEfectiva()` solo considera intentos que pesan en el índice,
  así que un retiro con desincorporación no gasta un turno.
- **¿El Art. 40 aproxima a dos decimales cada aporte o el total?** Se asume cada aporte.
  Con ponderaciones como 33,33 % la diferencia son centésimas — que es justo lo que decide
  en la frontera del 4,50. El criterio vive en una sola función (`aportePonderado`) con su
  prueba.
- **¿Los cursos intensivos** (C-21, C-41) cuentan como intento normal para el Art. 49?
- **¿La calificación de una evaluación diferida** (Art. 33) sustituye la del parcial o se
  promedia con ella? Se asume sustitución.
- **¿TAP Tesis y TAP Pasantía usan la escala 1–9 o APROBADO/REPROBADO** (Art. 39,
  Parágrafo Único)? Son 12 U.C. cada una — 24 de las 178 de la carrera — entrando al
  cálculo justo cuando el número decide la graduación. Ver
  [Desarrollo → Deuda de datos](06-desarrollo.md#deuda-de-datos).

El cálculo es **referencial** y no sustituye a Control de Estudios.
