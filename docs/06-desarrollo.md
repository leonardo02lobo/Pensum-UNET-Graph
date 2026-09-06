# Desarrollo

## Scripts

| Comando | Qué hace |
|---|---|
| `npm run dev` | Vite en `http://localhost:5173` |
| `npm test` | Vitest, una pasada — 233 pruebas en 7 archivos |
| `npm run test:watch` | Vitest en modo vigilancia |
| `npm run validate` | Solo la integridad del dataset (`pensum.validate.test.ts`) |
| `npm run build` | `tsc -b && vite build` |
| `npm run preview` | Sirve el build |

## Pruebas

Entorno `node`, sin DOM. Se prueban las capas puras, que son las que pueden estar mal de
forma silenciosa:

| Archivo | Pruebas | Cubre |
|---|---|---|
| `evaluacion/evaluacion.test.ts` | 54 | Plan, Art. 32, aportes, definitiva, «cuánto falta» |
| `progreso/progreso.test.ts` | 53 | Art. 49, banderas de crédito/índice, redondeo, estados |
| `data/pensum.validate.test.ts` | 38 | Las ocho reglas de integridad del dataset |
| `data/tablaConversion.test.ts` | 25 | Tabla del Art. 42, umbrales, ida y vuelta |
| `model/graph.test.ts` | 24 | DAG, conos, orden topológico, profundidades, búsqueda |
| `layout/orbital.test.ts` | 20 | Arcos, determinismo, separación, encuadre, aristas hacia afuera |
| `persistencia/historial.test.ts` | 19 | Carga, corrupción, versión futura, export/import |

La configuración vive en `vite.config.ts` (`test.include: ['src/**/*.test.ts']`), así que
los `.tsx` quedan fuera por construcción: no hay pruebas de componente, y no las hace
falta mientras el cálculo esté en módulos puros.

## Editar el pensum

Todo está en `src/data/pensum.ts`. Después de tocarlo:

```bash
npm run validate
```

Comprueba unicidad de ids, referencias resueltas, ausencia de ciclos, coherencia
temporal, simetría de correquisitos, conteos por sector, cuadre de créditos y campos
básicos. Si el JSON miente, el layout dibujaría una carrera que no existe y nadie se
enteraría — por eso la validación corre antes que el render.

Al añadir o mover una materia hay que actualizar también:

- `CONTEO_POR_SECTOR`, `TOTAL_MATERIAS` y `TOTAL_SECTORIZADAS` en `src/data/validate.ts`.
  Es deliberado: el ancho de cada brazo del grafo es proporcional a ese número, así que
  cambiar de sector cambia el dibujo de la carrera y debe ser un acto consciente.
- `UC_TOTALES` en `src/data/types.ts` si cambia la suma de créditos — calibra las dos
  compuertas por porcentaje. La regla `creditos-cuadran` no deja que se olvide.
- Al añadir un sector: `SECTORES` en `types.ts`, `ORDEN_SECTORES` en `layout/orbital.ts`,
  `NOMBRE_SECTOR` y el respaldo en `view/tokens.ts`, y el token `--color-sector-*` en
  `src/index.css`. Sin el token, el puente Tailwind↔WebGL avisa por consola y cae en el
  valor de respaldo.
- `meta.verificado`, y `meta.discrepancias` / `meta.inferencias` si el dato viene de una
  fuente en conflicto o de una deducción.

## Flujo OpenSpec

El proyecto usa **OpenSpec** (esquema `spec-driven`) en `openspec/`:

```
openspec/
├── specs/                       capacidades vigentes (9)
├── changes/<nombre>/            propuesta en curso
│   ├── proposal.md              por qué y qué cambia
│   ├── design.md                decisiones (D1, D2, …) que el código cita
│   ├── tasks.md                 desglose ejecutable
│   └── specs/<capacidad>/       delta de la spec
└── changes/archive/<fecha>-<nombre>/   cambios ya aplicados
```

Las trece capacidades vigentes: `pensum-dataset`, `graph-model`, `graph-navigation`,
`graph-interaction`, `orbital-graph-view`, `progreso-en-grafo`, `historial-academico`,
`captura-de-notas`, `indice-academico`, `plan-de-evaluacion`, `nota-definitiva`,
`tabla-conversion`, `pestana-calculadora`.

Los comentarios del código citan estas decisiones por su identificador (`D1`, `D4`,
`design.md, D7`). Ese es el enlace entre la explicación y la implementación: al leer un
`// design.md, D4` en `notaEfectiva()` se sabe que la interpretación está argumentada y
dónde.

Comandos disponibles como slash-commands del proyecto (`.claude/commands/opsx/`):
`propose`, `explore`, `apply`, `update`, `sync`, `archive`.

### Estado de los cambios

Cuatro cambios aplicados y archivados; ninguno en curso.

| Cambio | Qué trajo |
|---|---|
| `archive/2026-09-06-pensum-graph-3d` | Dataset, grafo, layout orbital y render |
| `archive/2026-09-06-indice-academico` | Historial, índice, estados y persistencia |
| `archive/2026-09-06-calculadora-nota-final` | Tabla del Art. 42, plan de evaluación, definitiva |
| `archive/2026-09-06-pensum-control-de-estudios` | Realineación del dataset con Control de Estudios |

## El último cambio: `pensum-control-de-estudios`

Es el cambio con más consecuencias sobre el dataset, y conviene conocerlo antes de tocar
`pensum.ts`.

El informe académico de Control de Estudios reveló que el dataset estaba desactualizado
en cosas que no eran cosméticas. Al importar un historial real, la aplicación calculaba
**7,17** donde el informe oficial dice **7,21** — no por un error de cálculo, sino porque
al dataset le faltaban materias y tenía U.C. equivocadas.

Peor de fondo: el dataset declaraba **155 U.C.** y el informe implicaba **171** solo con
las materias que lista. Esa diferencia descalibraba las dos compuertas por porcentaje
(TAP Tesis al 80 %, TAP Pasantía al 100 %).

Qué cambió:

- **Línea nueva de Actividad Deportiva**: diez materias de 1 U.C., sin prelaciones entre
  sí, con sector y brazo propios. El informe solo lista las tres que el estudiante lleva
  inscritas; las siete restantes quedan sin código, pendientes de confirmar.
- **U.C. corregidas**: TAP Tesis y TAP Pasantía de 6 a **12 cada una** (la partición 6/6
  era una inferencia de este proyecto y resultó equivocada); Investigación de Operaciones I
  de 3 a **4**.
- **Total de 155 a 178 U.C.**; umbrales por porcentaje a 143 (80 %) y 178 (100 %).
- **Veintiún códigos actualizados** al formato vigente de Control de Estudios, que además
  rellenaron tres que estaban vacíos (Automatización, Seminario y Proyecto de Servicio
  Comunitario).
- **`Análisis Numérico` pasó a `Métodos Numéricos`.**
- **Regla de validación nueva** (`creditos-cuadran`): la suma de las U.C. de las materias
  debe igualar el total declarado. Su ausencia es lo que permitió que el dataset
  conviviera con un total equivocado sin que nada protestara.

El informe de Control de Estudios pasa a ser la autoridad para códigos, unidades de
crédito y existencia de materias, por encima del Canva y del PDF de la web.

## Deuda de datos

Pendiente de confirmar con Control de Estudios:

- **La escala de TAP Tesis y TAP Pasantía.** Ya son 12 U.C. cada una, confirmadas por
  Control de Estudios, pero si su escala real fuese APROBADO/REPROBADO (Art. 39, Parágrafo
  Único) en vez de 1–9, serían 24 U.C. entrando mal al cálculo justo al final de la
  carrera, cuando el número decide la graduación.
- **Códigos faltantes**: las cuatro `Electiva`, los dos `TAP` y siete `Actividad
  Deportiva` (el informe solo lista las tres que el estudiante cursó). Llevan id
  provisional en kebab-case.
- **Metodología de la Investigación**: 110 U.C. (Canva, adoptado) vs 120 U.C. (PDF).
- **Inglés I / II**: semestres II/III (Canva, adoptado) vs III/IV (PDF). Como Inglés I
  está gated a 12 U.C., el semestre es nominal.
- **Proyecto Servicio Comunitario**: el Canva lo dibuja en el semestre 5 con una arista
  desde Seminario Servicio Comunitario, también del 5. Una prelación dentro del mismo
  semestre es incoherente, así que se ubicó en el 6. **Inferido.**
- **Investigación de Operaciones I**: se tomó la prelación explícita del PDF (Matemática IV)
  sobre la adyacencia visual del Canva (Análisis Numérico).
- **Taxonomía de sectores**: no existe en ninguna fuente oficial. Ver
  [Modelo de datos](02-modelo-de-datos.md#los-nueve-sectores).

Los supuestos normativos abiertos están en
[Normativa → Supuestos abiertos](04-normativa.md#supuestos-abiertos).

## Convenciones

- **Idioma**: identificadores y comentarios en español, igual que el dominio. Los tipos
  de la norma conservan su vocabulario (`prelacion`, `correquisito`, `suficiencia`,
  `desincorporado`).
- **Citar el artículo, no el criterio.** Cada regla normativa lleva su artículo en el
  comentario. Cuando la interpretación es del proyecto, se dice explícitamente y se
  enlaza al `design.md` correspondiente.
- **`readonly` por defecto** en las interfaces de datos: el pensum es inmutable y el
  historial se reemplaza, nunca se muta.
- **Nada de React ni three.js** en `data/`, `model/`, `layout/`, `evaluacion/` y
  `progreso/`. Si un import de esos aparece ahí, la frontera se rompió.

## Fuera de alcance

Vista de malla 2D alternable, el catálogo de electivas como nodos navegables, otras
carreras y cualquier forma de backend o sincronización entre dispositivos.
