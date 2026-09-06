## 1. Andamiaje del proyecto

- [x] 1.1 Inicializar proyecto React + Vite + TypeScript en la raíz del repo
- [x] 1.2 Configurar Tailwind y definir los tokens de color de los ocho sectores como variables CSS, consumidas desde la config de Tailwind (D7)
- [x] 1.3 Instalar dependencias del modelo: `graphology`, `graphology-dag`, `graphology-traversal`
- [x] 1.4 Instalar dependencias del render: `react-force-graph-3d`, `three`
- [x] 1.5 Configurar Vitest y un script `validate` que corra la validación del dataset
- [x] 1.6 Definir la estructura de carpetas que materializa la frontera modelo/render de D6: `src/data/`, `src/model/`, `src/layout/`, `src/view/`, `src/ui/`

## 2. Dataset del pensum

- [x] 2.1 Definir los tipos TypeScript de `Materia`, `Sector`, `Gate` y `Pensum` según el esquema de la spec `pensum-dataset`
- [x] 2.2 Transcribir las 58 materias con nombre, semestre, UC y horas, tomando el contenido del Canva (06/05/2026) como autoridad (D1)
- [x] 2.3 Cruzar los códigos de asignatura del PDF oficial sobre cada materia y marcar `fuente` como `canva`, `pdf` o `fusion`
- [x] 2.4 Asignar ids provisionales en kebab-case a `Automatización` y a las cuatro `Electiva`, dejando `codigo: null`
- [x] 2.5 Cargar las prelaciones como arreglos de ids, verificando cada una contra ambas fuentes
- [x] 2.6 Cargar los correquisitos declarados en ambos sentidos (los dos pares de Laboratorio de Física)
- [x] 2.7 Cargar las nueve compuertas por créditos como atributo `gate` del nodo, incluyendo los dos casos mixtos (Ecología, TAP Tesis) y los porcentajes (D2)
- [x] 2.8 Asignar `sector` a las 54 materias sectorizadas y `null` a las cuatro Electivas, siguiendo la taxonomía de D5
- [x] 2.9 Añadir los metadatos del dataset: fecha de última verificación, referencias de ambas fuentes, y las discrepancias resueltas de D1
- [x] 2.10 Registrar el catálogo de 13 electivas del Canva como dato de referencia, sin convertirlas en nodos del grafo

## 3. Validación del dataset

- [x] 3.1 Implementar validación de unicidad de ids y de resolución de todas las referencias de `prelaciones` y `correquisitos`
- [x] 3.2 Implementar detección de ciclos sobre el grafo dirigido de prelaciones
- [x] 3.3 Implementar validación de coherencia temporal: toda prelación debe estar en un semestre estrictamente anterior
- [x] 3.4 Implementar validación de simetría de correquisitos y de que ambos comparten semestre
- [x] 3.5 Implementar validación de conteos: 58 materias en total, 54 sectorizadas, y la distribución por sector de la spec
- [x] 3.6 Correr `validate` sobre el dataset curado y dejarlo pasando en verde

## 4. Modelo de grafo

- [x] 4.1 Construir el grafo `graphology` desde el dataset, con aristas de prelación en sentido `requisito → materia` y correquisitos como tipo aparte (spec `graph-model`)
- [x] 4.2 Implementar la consulta de cono de ancestros, devolviendo materias, aristas y la compuerta por separado
- [x] 4.3 Implementar la consulta de cono de descendientes
- [x] 4.4 Implementar orden topológico y profundidad por materia
- [x] 4.5 Implementar la clasificación de aristas en `intra-sector` y `cruce-sector`
- [x] 4.6 Implementar la búsqueda por nombre y código, insensible a acentos y mayúsculas
- [x] 4.7 Escribir las pruebas del modelo en Node sin DOM, cubriendo los escenarios de la spec (cono de Ingeniería de Software, salidas de Programación II, profundidad 9)

## 5. Layout analítico

- [x] 5.1 Implementar el cálculo de radio a partir del semestre (spec `orbital-graph-view`)
- [x] 5.2 Implementar el reparto de arcos angulares por sector, proporcional al número de materias y en el orden cíclico de D4
- [x] 5.3 Implementar la distribución angular de las materias dentro del arco de su sector para cada semestre
- [x] 5.4 Implementar el escalonamiento simétrico en elevación para desambiguar materias que comparten celda
- [x] 5.5 Implementar la órbita libre para las materias con `sector: null`
- [x] 5.6 Escribir pruebas del layout: reproducibilidad, monotonía radial, toda prelación apunta hacia afuera, y separación mínima entre cualquier par de materias

## 6. Render 3D

- [x] 6.1 Montar `react-force-graph-3d` alimentado por el modelo, con las posiciones del layout fijadas en `fx/fy/fz` y sin simulación
- [x] 6.2 Materializar los nodos con el color de su sector, leído de las variables CSS al montar
- [x] 6.3 Aplicar el material de compuerta (translúcido, desaturado, con distintivo del umbral) a las materias con `gate != null`, independientemente de su posición
- [x] 6.4 Dibujar las prelaciones como aristas dirigidas, diferenciando visualmente `intra-sector` de `cruce-sector`
- [x] 6.5 Dibujar los correquisitos como vínculos cortos sin dirección y con estilo propio
- [x] 6.6 Configurar la cámara orbital con límites de zoom y una posición inicial desde la que se aprecien anillos y brazos
- [x] 6.7 Añadir bloom post-processing y ajustar la estética general de la escena

## 7. Interacción

- [x] 7.1 Implementar el hover: iluminar cono de ancestros y descendientes, distinguirlos entre sí, atenuar el resto, restaurar al salir (spec `graph-interaction`)
- [x] 7.2 Implementar la visibilidad de etiquetas: solo en hover, selección y materias del cono
- [x] 7.3 Implementar la selección por clic, con persistencia del cono al retirar el cursor y limpieza al hacer clic en vacío
- [x] 7.4 Construir el panel de detalle en Tailwind con todos los campos de la spec, omitiendo con elegancia los ausentes
- [x] 7.5 Implementar la navegación desde el panel hacia prelaciones, correquisitos y desbloqueos, con enfoque de cámara
- [x] 7.6 Construir el campo de búsqueda incremental con enfoque de cámara al elegir un resultado y estado vacío informativo
- [x] 7.7 Construir la leyenda de sectores con filtrado por sector
- [x] 7.8 Construir la referencia consultable de compuertas por créditos con las materias que habilita cada umbral
- [x] 7.9 Mostrar la procedencia de los datos: fecha de última verificación y ambas fuentes

## 9. Navegación

- [x] 9.1 Añadir `anguloInicial` al layout para situar la costura del sunburst, y `referencias()` con los anclajes de anillos y brazos
- [x] 9.2 Dibujar los anillos guía por semestre en la escena
- [x] 9.3 Sustituir las etiquetas de sprite por una capa HTML proyectada, con resolución de colisiones en pantalla y esquivo del panel de detalle
- [x] 9.4 Etiquetar siempre los anillos (S1…S10) y los brazos con el nombre de su sector
- [x] 9.5 Construir el recorrido por semestre: control S1…S10, aislamiento del anillo, lista con total de U.C. y salto a materia
- [x] 9.6 Construir los controles de cámara: vista inicial, vista cenital y rotación automática
- [x] 9.7 Implementar la navegación con teclado (flechas y Escape), sin secuestrar el foco de la búsqueda

## 8. Cierre

- [x] 8.1 Verificar los escenarios de las cuatro specs contra la aplicación corriendo
- [x] 8.2 Documentar en el README la estructura del proyecto, la frontera modelo/render y cómo editar el dataset
- [x] 8.3 Registrar en el README las preguntas abiertas de `design.md` como deuda de datos pendiente de confirmar con Control de Estudios
