# Modelo de datos

Toda la fuente de verdad está en `src/data/pensum.ts`. El esquema, en `src/data/types.ts`,
que **no importa nada**: es la frontera de datos, y el modelo, el layout y el render
dependen de estos tipos, nunca al revés.

## Una materia

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

| Campo | Notas |
|---|---|
| `id` | Identificador estable. Es el código cuando existe; kebab-case provisional cuando ninguna fuente lo provee. |
| `codigo` | Código oficial de asignatura, o `null`. Trece materias no lo tienen todavía: las cuatro Electivas, los dos TAP y siete Actividad Deportiva. |
| `horas` | `null` cuando la fuente no desglosa la carga horaria. |
| `sector` | `null` en las cuatro Electivas: orbitan libres, fuera de los brazos. |
| `prelaciones` | Ids requeridos, interpretados como **conjunción**. |
| `gate` | `{ kind: 'uc', uc }` o `{ kind: 'pct', pct }`, o `null`. |
| `fuente` | `control-estudios` · `canva` · `pdf` · `fusion` — procedencia del registro. |

## Los tres tipos de relación

El Canva original dibujaba los tres igual. Separarlos es lo que hace consultable el
pensum:

| | Qué significa | Cómo se modela |
|---|---|---|
| **Prelación** | Hay que aprobar X antes | Arista dirigida `requisito → materia` del DAG |
| **Correquisito** | Se cursan en paralelo | Par simétrico, fuera del DAG |
| **Compuerta** | Hay que acumular N créditos | Campo `gate` del nodo, sin arista |

El sentido de la arista es `requisito → materia`, de modo que recorrer hacia adelante
responde «qué desbloqueo» y hacia atrás «qué necesito».

Hay casos mixtos: **Ecología y Contaminación Ambiental** exige Química General I **y**
100 U.C. acumuladas. Prelación y compuerta se interpretan como conjunción.

## Cifras del dataset

| | |
|---|---|
| Materias | 68 (64 sectorizadas + 4 Electivas) |
| Prelaciones | 46 aristas dirigidas |
| Pares de correquisitos | 2 |
| Compuertas por créditos | 12 |
| Semestres | 1 – 10 |
| Unidades de crédito | 178 (`UC_TOTALES`) |
| Profundidad máxima del DAG | 8 aristas |
| Catálogo de electivas | 13 (dato de referencia, **no** nodos) |

Las diez **Actividad Deportiva** son materias de 1 U.C. sin prelaciones entre sí: forman
un brazo propio y no participan del DAG más que como nodos aislados.

Las cuatro `Electiva` del grafo son **ranuras**, no asignaturas concretas: el catálogo de
13 electivas ofertadas se muestra en la interfaz pero no genera nodos.

### Las doce compuertas

| Materia | Umbral |
|---|---|
| Inglés I | 12 U.C. |
| Seminario Servicio Comunitario | 78 U.C. |
| Proyecto Servicio Comunitario | 78 U.C. |
| Electiva I – IV | 90 U.C. cada una |
| Ecología y Contaminación Ambiental | 100 U.C. |
| Metodología de la Investigación | 110 U.C. |
| Seminario | 126 U.C. |
| TAP Tesis | 80 % de las U.C. de la carrera → 143 U.C. |
| TAP Pasantía | 100 % de las U.C. de la carrera → 178 U.C. |

Los umbrales porcentuales se resuelven contra `UC_TOTALES` con `gateEnUC()`
(`Math.ceil`), así que **el total declarado de la carrera los calibra**. Un total
equivocado descalibra silenciosamente las dos compuertas de fin de carrera — por eso
existe la regla `creditos-cuadran`, que exige que la suma de las U.C. de las materias
iguale el total declarado.

## Los nueve sectores

La taxonomía **no existe en ninguna fuente oficial**. Se derivó de los prefijos de código
departamentales (826 Matemática, 846/842 Física, 914 Química, 1013 Economía, 1023 Inglés,
1032/1033 Formación) más una partición temática del bloque 41x/42x de Informática. Vive
como campo editable del dataset.

| Sector | Nombre visible | Materias |
|---|---|---|
| `matematica` | Matemática y Modelado | 11 |
| `formacion` | Formación Integral | 10 |
| `deportiva` | Actividad Deportiva | 10 |
| `programacion` | Programación y Software | 8 |
| `sistemas` | Sistemas, Hardware y Redes | 7 |
| `ciencias` | Ciencias Básicas | 6 |
| `datos` | Datos e Información | 5 |
| `grado` | Trabajo de Grado | 4 |
| `gestion` | Gestión y Economía | 3 |

Esos conteos están fijados en `CONTEO_POR_SECTOR` y los verifica la validación: mover una
materia de sector sin actualizar el conteo hace fallar `npm run validate`. Es
deliberado — el ancho de cada brazo del grafo es proporcional a este número, así que un
cambio de sector cambia el dibujo de la carrera.

## Validación del dataset

`src/data/validate.ts` corre en `npm run validate` y dentro de la suite. Es la red que
evita que un error de transcripción llegue al grafo: si el JSON miente, el layout dibuja
una carrera que no existe y nadie se entera. **No depende de graphology** — la detección
de ciclos es propia (DFS tricolor) para que la validación de datos no arrastre la capa de
modelo.

| Regla | Qué comprueba |
|---|---|
| `ids-unicos` | Ningún id repetido |
| `referencias-resueltas` | Toda prelación y correquisito apunta a un id existente |
| `sin-ciclos` | El grafo de prelaciones es acíclico; informa el ciclo encontrado |
| `coherencia-temporal` | Todo requisito está en un semestre **estrictamente anterior** |
| `simetria-correquisitos` | La relación se declara en ambos sentidos y en el mismo semestre |
| `conteos` | 68 materias, 64 sectorizadas y el reparto por sector |
| `creditos-cuadran` | La suma de las U.C. de las materias iguala `UC_TOTALES` |
| `campos-basicos` | Semestre 1–10 entero, U.C. no negativas, sin autorreferencia, sector conocido |

`validarPensum()` devuelve una lista de `Problema { regla, mensaje }`. Lista vacía es
dataset válido.

La regla `coherencia-temporal` es la que sostiene la propiedad geométrica del layout:
como el radio crece con el semestre y todo requisito está en un semestre anterior,
**todas las aristas apuntan hacia afuera** y la dirección se lee sin flechas.

## La API del grafo

`construirGrafo(pensum)` devuelve un `PensumGraph { dag, materias, correquisitos, pensum }`.
Sobre él:

| Función | Devuelve |
|---|---|
| `conoAncestros(g, id)` | Todo lo que hay que aprobar antes, transitivamente |
| `conoDescendientes(g, id)` | Todo lo que se desbloquea al aprobarla, transitivamente |
| `prelacionesDirectas` / `desbloqueaDirecto` | Vecinos inmediatos, para el panel de detalle |
| `correquisitosDe(g, id)` | El otro extremo de cada par |
| `ordenTopologico(g)` | Orden lineal compatible con las prelaciones |
| `profundidades(g)` | Camino más largo desde cualquier raíz, por materia |
| `aristas(g)` | Todas las prelaciones con su clasificación |
| `clasificarArista` | `intra-sector` o `cruce-sector` |
| `buscar(g, texto)` | Por nombre o código, insensible a acentos y mayúsculas |

Un `Cono` devuelve `{ materias, aristas, gate }`. La compuerta viaja **aparte** porque no
es un nodo del cono: es una condición sobre créditos acumulados.

`calcularResaltado(g, id)` (en `model/resaltado.ts`) empaqueta ancestros, descendientes,
correquisitos y claves de arista para el render. Ancestros y descendientes se devuelven
por separado porque «lo que necesito antes» y «lo que desbloqueo después» son preguntas
distintas y el diseño las distingue visualmente.

## Procedencia de los datos

Fusión de tres fuentes en conflicto, con una jerarquía explícita:

1. **Informe Académico de Control de Estudios** (05/09/2026) — **autoridad** en códigos,
   unidades de crédito y existencia de materias. Es el registro vivo de la Universidad.
2. **Canva** (John Llanes, 06/05/2026) — manda en contenido y estructura de prelaciones.
3. **[PDF oficial UNET](https://www.unet.edu.ve/informatica/Servicios/Pensum/PensumNuevo.pdf)**
   — respaldo para lo que las otras dos no cubren.

Adoptar Control de Estudios como autoridad no fue una preferencia: al importar un
historial real, la aplicación calculaba **7,17** donde el informe oficial dice **7,21** —
no por un error de cálculo, sino porque al dataset le faltaban materias y tenía U.C.
equivocadas.

`pensum.meta` declara **10 discrepancias** y **7 inferencias**, con su razón. No están
escondidas: se consultan en la aplicación, en la pestaña **Datos** de la leyenda. El
dataset lleva fecha de última verificación (`meta.verificado`: 2026-09-06).
