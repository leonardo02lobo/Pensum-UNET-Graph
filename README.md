# Pensum UNET · Grafo — Documentación

Documentación técnica de **Pensum-UNET-Graph**: el pensum de Ingeniería en Informática
de la UNET (68 materias, 46 prelaciones, 12 compuertas por créditos) representado como
un grafo dirigido acíclico navegable en 3D, con cálculo del índice académico y de la
calificación definitiva según las normas de la Universidad.

> El código vive en la rama `leonardo02lobo/Pensum-UNET`. Esta rama
> (`leonardo02lobo/Documentation`) contiene solo la documentación.

## Qué resuelve

El pensum ya existe en papel: una lámina de Canva y un PDF institucional. Lo que no
existe es la forma de **consultarlo**. Preguntas como «¿qué necesito antes de Ingeniería
del Software?», «¿qué se me cae si repruebo Programación II?» o «¿qué puedo inscribir el
semestre que viene?» obligan a seguir líneas con el dedo sobre una imagen de 1900 px.

La aplicación convierte esas tres preguntas en tres gestos: pasar el cursor, seleccionar
un nodo y mirar qué queda encendido.

Encima de esa base estática se monta una capa personal:

| Capa | Qué aporta | Dónde vive |
|---|---|---|
| **Pensum** | Materias, prelaciones, correquisitos, compuertas | `src/data/` — estático |
| **Grafo** | DAG, conos de dependencia, orden topológico | `src/model/` — derivado |
| **Historial** | Intentos del estudiante por materia | `localStorage` — personal |
| **Progreso** | Índice académico, U.C. aprobadas, estado de cada materia | Derivado, nunca persistido |
| **Evaluación** | Plan de parciales y nota definitiva proyectada | Solo en memoria |

## Mapa de la documentación

| Documento | Contenido |
|---|---|
| [Arquitectura](docs/01-arquitectura.md) | Capas, frontera modelo/render, flujo de datos, decisiones estructurales |
| [Modelo de datos](docs/02-modelo-de-datos.md) | Esquema del pensum, los tres tipos de relación, reglas de validación, procedencia |
| [Layout y render](docs/03-layout-y-render.md) | Geometría del sunburst orbital, tokens de color, capa de etiquetas |
| [Normativa](docs/04-normativa.md) | C-3 artículo por artículo: índice académico, plan de evaluación, nota definitiva |
| [Interfaz](docs/05-interfaz.md) | Componentes, navegación por teclado, rutas, persistencia y respaldo |
| [Desarrollo](docs/06-desarrollo.md) | Scripts, pruebas, flujo OpenSpec, cómo editar el pensum, deuda de datos |

## Arranque rápido

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # 233 pruebas en 7 archivos
npm run validate  # solo la integridad del dataset
npm run build     # tsc -b && vite build
```

## Pila técnica

| | |
|---|---|
| **Construcción** | Vite 7 · TypeScript 5.9 · React 19 |
| **Grafo** | graphology · graphology-dag · graphology-traversal |
| **Render 3D** | three.js 0.185 · react-force-graph-3d |
| **Estilos** | Tailwind CSS 4 (`@tailwindcss/vite`) |
| **Pruebas** | Vitest 3, entorno `node` — sin DOM |
| **Especificación** | OpenSpec (`openspec/`), esquema `spec-driven` |

Sin backend: todo corre en el navegador y el historial se guarda en `localStorage`.

## Advertencia de alcance

El cálculo del índice y de la definitiva es **referencial**. No sustituye a Control de
Estudios: hay supuestos declarados como tales en [Normativa](docs/04-normativa.md#supuestos-abiertos)
y deuda de datos pendiente de confirmar en [Desarrollo](docs/06-desarrollo.md#deuda-de-datos).
