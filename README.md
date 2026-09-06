# Pensum UNET · Grafo

Un grafo es la relación entre varios objetos. Este proyecto aplica esa idea al pensum
de **Ingeniería en Informática de la UNET**: 68 materias, ~50 prelaciones y 12 compuertas
por créditos, navegables en 3D.

El pensum ya existe en papel (una lámina de Canva y un PDF institucional). Lo que falta
ahí es poder **consultarlo**: responder «¿qué necesito antes de Ingeniería del Software?»
o «¿qué se me cae si repruebo Programación II?» obliga a seguir líneas con el dedo a
través de 1900 px. Aquí basta con pasar el cursor.

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # 233 pruebas
npm run validate  # solo la integridad del dataset
npm run build
```

## El diseño en una frase

```
   radio     = semestre    → los anillos concéntricos son el tiempo
   ángulo    = sector      → cada brazo es un área de conocimiento
   elevación = desempate   → separa materias que caen en la misma celda
```

El ancho angular de cada brazo es **proporcional a su número de materias**, así que
Matemática y Modelado (11) sale siendo el brazo más ancho de la carrera. Eso es verdad,
y el diseño lo dice sin escribirlo.

Como el radio crece con el semestre y toda prelación va de un semestre anterior a uno
posterior, **todas las aristas apuntan hacia afuera**: la dirección se lee sin flechas.
Hay una prueba que lo verifica (`orbital.test.ts`), y si falla es que el dataset tiene
una prelación temporalmente incoherente.

Dos cosas que la geometría revela sin que nadie las programe:

- **Programación II es el cruce.** Sus tres aristas salientes van a otro brazo. Es el
  punto donde la carrera se abre en abanico.
- **Ingeniería del Software es el sumidero.** Tres brazos distintos convergen en él.

## Índice académico

La app calcula el índice según las **Normas para la Evaluación del Rendimiento
Estudiantil de la UNET** (C-3, Cap. VII). Cada regla lleva su artículo citado en el
código, porque son decisiones normativas y no de criterio nuestro.

```
        Σ (nota efectiva × U.C.)          escala 1–9 entera (Art. 39)
  IA = ──────────────────────────         3 decimales de cálculo,
                Σ U.C.                    2 de registro (Art. 55)

   < 3,60  pierde inscripción (Art. 51)   ≥ 5,10  puede graduarse (Art. 54)
   ≥ 5,00  aprueba la materia             > 6,00  cuadro de honor (C-19)
```

**El Art. 49 tiene una sola regla, no dos.** La norma dice que el segundo intento
«elimina» al primero y que a partir del tercero se promedian «todas excepto la
primera» — pero lo primero es el promedio de un solo elemento:

```
  [3]          → 3
  [3, 6]       → 6      ← "elimina la anterior"
  [3, 4, 6]    → 5      ← promedio de (4, 6). NO 6, NO 4,33
  [3, 4, 6, 8] → 6      ← promedio de (4, 6, 8)
```

Repetir no borra el pasado: quien reprueba dos veces y saca 9 **no obtiene 9**.

**«U.C. aprobadas» y «U.C. del índice» son conjuntos distintos.** Cada intento lleva
dos banderas independientes, porque no coinciden:

| Tipo de intento | Otorga U.C. | Pesa en el índice | Norma |
|---|---|---|---|
| Cursada, nota ≥ 5 | ✅ | ✅ | Art. 47 |
| Cursada, nota ≤ 4 | ❌ | ✅ | Art. 47a |
| Equivalencia | ✅ | ❌ | Art. 48 |
| Suficiencia aprobada | ✅ | ✅ | Art. 37 P.2 |
| Suficiencia reprobada | ❌ | ❌ | Art. 37 P.3 |
| Retiro **con** desincorporación | ❌ | ❌ | Art. 21 P.1a |
| Retiro **sin** desincorporación | ❌ | ✅ | Art. 21 P.1b |

Como consecuencia, saber qué materias tienes aprobadas convierte las **doce compuertas
por créditos** de dato inerte en estado personal, y el grafo en un mapa de progreso:

```
  aprobada     ·  en curso  ·  DISPONIBLE  ·  falta prelación  ·  falta crédito
                              └─ prelaciones ✓ y compuerta ✓
                                 la respuesta a "¿qué inscribo?"
```

### La cadena completa de la norma

El índice es el último eslabón de cuatro, cada uno con su artículo y su propio redondeo.
La **calculadora** (pestaña aparte, `#/calculadora`) cubre los tres primeros:

```
   actividad con puntaje libre       Art. 42  → a %, y del % a nota por la Tabla 1
            ↓
   NOTA DEL PARCIAL  1,0 – 9,0       Art. 40  → × ponderación, a dos decimales
            ↓
   APORTE PONDERADO                  Art. 41  → Σ; cincuenta centésimas suben
            ↓
   DEFINITIVA  1 – 9 (entero)        Art. 39  → aprobatorias 5 a 9
            ↓
   ÍNDICE ACADÉMICO                  Art. 47/49
```

**Para aprobar hace falta 4,50, no 5,00.** El Art. 41 redondea la sumatoria, así que la
pregunta «¿cuánto necesito?» se resuelve contra media unidad menos. Se generaliza sin
casos especiales: para la definitiva **N** la suma debe caer en `[N − 0,50, N + 0,50)`.

**La tabla del Art. 42 es dato, no fórmula.** Convierte porcentaje a nota y es
irregular: ocho calificaciones reciben dos porcentajes y el resto uno. El mejor ajuste
lineal falla en **35 de sus 89 celdas**, justo donde importa:

```
   48 % → 4,8      50 % → 4,9
   49 % → 4,8      51 % → 5,0   ← el único porcentaje que da 5,0
```

Transcrita del PDF C-3 y contrastada celda a celda contra la
[tabla oficial en línea](https://www.unet.edu.ve/~frsilva/TablaConversion.php).

**Un NP no se salta, gasta su ponderación** (Art. 31). Y si todas lo son, la definitiva
es 1 — que sale sola de acotar la escala a `[1, 9]`, sin caso especial.

**La app le revisa el plan al profesor.** Como conoce las U.C. de cada materia, valida el
número de parciales y sus ponderaciones contra el Art. 32, y **avisa sin bloquear**: el
literal c admite excepciones autorizadas que la app no puede conocer.

| U.C. | Parciales | Cada una | Materias |
|---|---|---|---|
| 1 | 2 | 40 – 60 % | 7 |
| 2 – 3 | 3 | 20 – 40 % | 36 |
| 4 o más | 4 *(3 con autorización)* | 10 – 35 % | 12 |

El plan de evaluación **no se guarda**: es papel de borrador y se pierde al recargar. Lo
que perdura es su resultado, si eliges registrarlo como intento.

### Dónde vive tu historial

En `localStorage`, **solo en este navegador**. Se pierde al limpiar los datos del sitio,
no existe en ventana privada y no viaja a otros dispositivos. Sin backend no hay otra:
por eso hay **exportar/importar JSON** en la pestaña «Datos» de la leyenda, y conviene
usarlo. El registro lleva número de versión y pasa por una función de migración; un dato
corrupto o de una versión posterior no se sobrescribe.

El cálculo es **referencial** y no sustituye a Control de Estudios.

## Estructura

```
src/
├── data/         pensum.ts (fuente de verdad) · types.ts · validate.ts
├── model/        grafo graphology, conos, orden topológico, búsqueda
├── layout/       cálculo analítico de posiciones (r, θ, y)
├── evaluacion/   plan de evaluación, validaciones Art. 32, nota definitiva
├── progreso/     historial, índice académico, estados derivados
├── persistencia/ localStorage, versión, migración, export/import
├── view/         render three.js + tokens de color
└── ui/           cromo 2D en Tailwind: panel, buscador, leyenda, cabecera
```

**La frontera modelo/render es deliberada.** `data/`, `model/`, `layout/`, `evaluacion/` y
`progreso/` no importan React ni three.js: son puros y corren en Node. `persistencia/` es la única
parte de la capa de progreso que toca el navegador. `react-force-graph-3d` consume coordenadas
ya calculadas y no devuelve nada hacia el modelo. Si algún día se quieren shaders custom
(pulsos viajando por las aristas, nodos que respiran), el render migra a
`react-three-fiber` sin tocar los datos ni los algoritmos.

Tailwind no puede estilizar WebGL, así que los colores de sector viven **una sola vez**
como variables CSS en `src/index.css` y los leen tanto Tailwind (cromo 2D) como los
materiales de three.js (`view/tokens.ts`). Cambiar un token mueve las dos cosas a la vez.

## Editar el pensum

Todo está en `src/data/pensum.ts`. Cada materia:

```ts
{
  id: '425401', codigo: '425401', nombre: 'Programación II',
  semestre: 4, uc: 3, horas: { teoria: 2, practica: 0, lab: 3 },
  sector: 'programacion',
  prelaciones: ['424301'],   // arista dirigida: define el DAG
  correquisitos: [],         // bidireccional, mismo semestre
  gate: null,                // umbral de créditos: atributo, NO arista
  fuente: 'fusion',
}
```

Tres tipos de relación, deliberadamente separados (el Canva dibujaba los tres igual):

| | Qué es | Cómo se modela |
|---|---|---|
| **Prelación** | Hay que aprobar X antes | Arista dirigida del DAG |
| **Correquisito** | Se cursan en paralelo | Par simétrico, fuera del DAG |
| **Compuerta** | Hay que acumular N créditos | `gate` en el nodo, sin arista |

La compuerta es atributo y no arista porque un nodo-compuerta añadiría ~50 aristas y
rompería los conos de dependencia (todo sería ancestro de todo). Hay casos mixtos:
Ecología requiere Química General I **y** 100 U.C.

Después de editar, `npm run validate` comprueba unicidad de ids, referencias resueltas,
ausencia de ciclos, coherencia temporal, simetría de correquisitos y los conteos por
sector. Si el JSON miente, el layout dibujaría una carrera que no existe y nadie se
enteraría — por eso la validación corre antes que el render.

## Procedencia de los datos

Tres fuentes, por orden de autoridad:

1. **Informe Académico de Control de Estudios** — el registro vivo de la Universidad.
   Manda en **códigos, unidades de crédito y existencia** de materias. No declara
   prelaciones ni compuertas.
2. **Canva** (John Llanes, 06/05/2026) — aporta lo que el informe no cubre: prelaciones,
   correquisitos, compuertas por créditos y semestre nominal.
3. **[PDF oficial UNET](https://www.unet.edu.ve/informatica/Servicios/Pensum/PensumNuevo.pdf)** — el más antiguo, fuente de último recurso.

El informe corrigió cosas que no eran cosméticas: la carrera son **178 U.C.**, no 155;
los TAP son 12 U.C. cada uno, no 6; y faltaba una línea entera de diez **Actividad
Deportiva**. Veintiún códigos estaban desfasados — el pensum fue renumerado.

**Los `id` no cambian, aunque sí los códigos.** El `id` es la clave del historial
persistido y de los archivos exportados: renumerarlo dejaría huérfanas las notas de quien
ya las tuviera cargadas. El `codigo` es un dato; el `id`, un identificador interno estable.

Las discrepancias resueltas y las inferencias están declaradas en `pensum.meta`, no
escondidas, y se consultan en la app (pestaña **Datos** de la leyenda).

La comprobación de que todo esto es correcto: cargar el informe académico real produce
un índice de **7,21** con **128 U.C.** aprobadas, que es exactamente lo que dice Control
de Estudios.

### Deuda de datos — pendiente de confirmar con Control de Estudios

- **Los códigos de `Actividad Deportiva IV` a `X`.** El informe solo lista las tres
  inscritas y sus códigos saltan de tres en tres (`0007002T`, `0007005T`, `0007008T`);
  deducir el resto sería inventar. Van con `codigo: null`.
- **Que las actividades deportivas sean diez** lo aporta el estudiante, no el informe.
- **¿Prelan entre sí las deportivas?** Se asume que no, porque el informe las muestra en
  semestres no consecutivos.
- **¿En qué semestre cae cada deportiva?** Se reparten una por semestre, que es lo que
  hace legible la línea, pero es decisión de presentación más que dato.
- **¿Cuenta un retiro con desincorporación como «vez cursada»** a efectos del Art. 49?
  Asumimos que no, por coherencia con el Art. 21 — pero la norma no lo dice literalmente.
  Es interpretación nuestra, marcada como tal en el código.
- **¿Los cursos intensivos** (C-21, C-41) cuentan como intento normal para el Art. 49?
- **¿El Art. 40 aproxima a dos decimales cada aporte o el total?** Asumimos cada aporte.
  Con ponderaciones como 33,33 % la diferencia son centésimas — que es justo lo que decide
  en la frontera del 4,50. El criterio vive en una sola función con su prueba.
- **¿La calificación de una evaluación diferida** (Art. 33) sustituye la del parcial o se
  promedia con ella? Se asume sustitución.

- **Códigos faltantes**: `Automatización` y las cuatro `Electiva` no tienen código en
  ninguna fuente. Llevan id provisional en kebab-case.
- **Metodología de la Investigación**: 110 U.C. (Canva, adoptado) vs 120 U.C. (PDF).
- **Inglés I / II**: semestres II/III (Canva, adoptado) vs III/IV (PDF). Como Inglés I
  está gated a 12 U.C., el semestre es nominal.
- **Proyecto Servicio Comunitario**: el Canva lo dibuja en el semestre 5 con una arista
  desde Seminario Servicio Comunitario, también del 5. Una prelación dentro del mismo
  semestre es incoherente, así que se ubicó en el 6. **Inferido.**
- **TAP Tesis / TAP Pasantía**: el PDF registra el bloque TAP completo con 12 U.C. sin
  desglosar; el Canva lo parte en dos nodos. Se repartió 6/6. **Inferido.**
- **Investigación de Operaciones I**: se tomó la prelación explícita del PDF
  (Matemática IV) sobre la adyacencia visual del Canva (Análisis Numérico).
- **Taxonomía de sectores**: no existe en ninguna fuente oficial; se derivó de los
  prefijos de código departamentales (826 Matemática, 846/842 Física, 914 Química,
  1013 Economía, 1023 Inglés, 1032/1033 Formación) más una partición temática del
  bloque 41x/42x de Informática. Vive como campo editable del dataset.

## Fuera de alcance por ahora

Estado del usuario (materias aprobadas y progreso), vista malla 2D alternable, el
catálogo de electivas como nodos navegables, y otras carreras. El modelo está diseñado
para admitir lo primero sin refactor.
