# Interfaz

## Tres vistas

| Ruta | Vista |
|---|---|
| `#/`, `#/grafo`, fragmento desconocido | Grafo orbital 3D |
| `#/plan` | El pensum como lista por semestre |
| `#/calculadora` | Calculadora de nota definitiva |

`useVista` escucha `hashchange` y navega **escribiendo el fragmento**, no el estado: así
el botón atrás del navegador queda dentro del mismo flujo y no hay dos fuentes de verdad.

## El cromo sobre el lienzo

La escena 3D ocupa toda la ventana. Encima va una capa `pointer-events-none` para que el
ratón llegue al lienzo; cada isla de interfaz lo reactiva para sí.

```
┌──────────────────────────────────────────────────────────────┐
│ Título · universidad · nº de materias                        │
│ Cabecera   ← índice académico y avance en U.C.               │
│ Buscador                              PestanasVista · Controles │
│ [aviso de almacenamiento]                                    │
│                                                              │
│                      G R A F O   3 D          PanelDetalle → │
│                                                (al seleccionar) │
│                                                              │
│ Leyenda                    Semestres                         │
└──────────────────────────────────────────────────────────────┘
```

Cuando el panel de detalle está abierto, los controles superiores se desplazan a `24rem`
del borde y la capa de etiquetas esquiva los 368 px del panel.

## El cromo se reacomoda por tramos

El cromo asumía un viewport que nunca se declaró: en todo `src/` había **una**
utilidad responsive. No fallaba solo en un teléfono — fallaba en una ventana de
portátil sin maximizar.

```
  ANCHO_MINIMO_GRAFO = 900        ANCHO_DOS_COLUMNAS = 1160
        │                                │
  0 ────┼────────────────────────────────┼──────────→
        │  estrecho  │    compacto       │   amplio
        │            │                   │
  la lista es el     leyenda colapsada   como siempre,
  destino; el grafo  semestres → select  sin tocar
  solo si se insiste panel → hoja        (D8)
```

Los dos umbrales salen de la aritmética de **este** cromo, medida en el
navegador, no de una tabla de dispositivos:

| Cuenta | Umbral |
|---|---|
| `Leyenda` termina en 320; `Semestres` (399 px) centrado empieza en `W/2 − 199,5` | se pisan por debajo de **1039** |
| Panel lateral empieza en `W − 368`; la barra centrada termina en `W/2 + 199,5` | se pisan por debajo de **1135** |

Manda la segunda, que es la más exigente. `ANCHO_DOS_COLUMNAS` se fija en 1160
para no depender de tres píxeles. Si el cromo crece, estos números dejan de
corresponder a lo que se midió: la cuenta está en `src/ui/tramos.ts` para que
quien los cambie sepa qué se estaba midiendo.

### Colapsar antes que encoger

Encoger produce texto de 9 px y objetivos táctiles imposibles. Colapsar conserva
el tamaño de todo lo que queda visible y mueve el coste a un clic. La regla que
lo mantiene honesto: **una isla colapsada sigue siendo alcanzable con un control
visible**, nunca desaparece sin rastro.

### El ancho del panel tenía tres definiciones

```
        ANTES                              DESPUÉS

  PanelDetalle   w-[22rem]          ui/panel.ts
  App            right: '24rem'     └─ ANCHO_PANEL, MARGEN_PANEL, franjaDelPanel
  GrafoOrbital   ANCHO_PANEL = 368
```

Las tres discrepaban en cuanto la ventana se estrechaba: el panel caía a
`max-w-[calc(100vw-2rem)]` pero la capa de etiquetas seguía suprimiendo una
franja de 368 px que ya no existía, **borrando etiquetas perfectamente
visibles**. Ahora `CapaEtiquetas` recibe la geometría real, y cuando el panel es
hoja esquiva el borde inferior en vez de una franja lateral inexistente.

### Bajo el umbral no se degrada el grafo: se ofrece otra cosa

A 900 px el panel abierto tapa más de media escena y los diez anillos dejan de
distinguirse. En vez de una versión peor del grafo, se muestra la lista con un
aviso y un **«Verlo igual →»**: hay tabletas donde el grafo es perfectamente
usable y el umbral se queda corto.

Solo `#/grafo` cuenta como intención explícita — la ausencia de fragmento y `#/`
son el destino por defecto, no una petición. Y la caída **se fija en el
fragmento**: si fuera una derivación, al ensanchar la ventana la condición se
revertiría y la aplicación devolvería al usuario al grafo por su cuenta. Mover a
alguien de sitio por redimensionar es peor que el problema que resuelve.

### Tocar y orbitar son gestos distintos

El cono de dependencias entraba solo por `onNodeHover`, y en táctil no hay
hover. Ahora un toque lo enciende además de seleccionar.

Los discos miden 17 px y se mueven al orbitar. El área de acierto es **2,2×** el
radio visible: una malla transparente hermana, sin escribir en el buffer de
profundidad para no velar el bloom. No se agranda el disco — su tamaño ya
codifica información.

`onNodeClick` dispara al soltar, así que un arrastre que termina sobre un nodo
lo seleccionaría, y como la cámara acaba de moverse el usuario no sabría por qué
se abrió un panel. Por encima de 6 px de desplazamiento el gesto es una órbita,
no un toque (`view/gesto.ts`). Por lo mismo, la rotación automática se detiene
ante **cualquier** gesto sobre el lienzo, no solo al seleccionar.

## Componentes

| Componente | Qué hace |
|---|---|
| `Cabecera` | Índice con dos decimales (Art. 55) y la señal del umbral normativo en que cae. Avance en U.C. Y **cuántas materias puedes inscribir**, que lleva a la lista filtrada. |
| `Buscador` | Por nombre o código, insensible a acentos y mayúsculas. Elegir un resultado enfoca la cámara. |
| `Leyenda` | Cuatro pestañas: **sectores**, **estados**, **compuertas** y **datos**. Las tres primeras filtran el grafo; la cuarta expone procedencia, discrepancias, inferencias y el respaldo. |
| `Semestres` | Aísla un anillo. El grafo completo responde «cómo se conecta la carrera»; esto responde «qué veo este semestre». |
| `Controles` | Giro automático, vista inicial y vista cenital. Sin un «volver a la vista inicial», quien orbita de más no tiene retorno. |
| `PanelDetalle` | Materia seleccionada: datos, prelaciones directas, qué desbloquea, correquisitos, compuerta y estado. Incluye el editor de intentos. |
| `EditorIntentos` | Captura de intentos en la escala del Art. 39. |
| `Respaldo` | Exportar / importar el historial en JSON. |
| `Calculadora` | Plan de evaluación por materia, validación del Art. 32, definitiva y «¿cuánto me falta?». |
| `Conversor` | Porcentaje ↔ nota por la Tabla 1 del Art. 42. |
| `Plan` | El pensum como lista por semestre: estado, créditos, captura de notas y saltos al grafo y a la calculadora. |
| `PestanasVista` | Alterna entre las tres vistas. Sin WebGL no ofrece la del grafo. |

## La lista responde lo que el grafo no

El grafo contesta «cómo se conecta la carrera». La lista contesta «qué hago con
ella», y es además la única vista que cabe en una pantalla estrecha y el
equivalente textual de un `<canvas>` que ningún lector de pantalla anuncia.

El dato que el estudiante viene a buscar —*qué puedo inscribir el semestre que
viene*— estaba a cuatro pasos: leyenda → pestaña «estados» → clic en
«Disponible» → leer el grafo. Ahora está en la cabecera, y es un control:

```
┌──────────┬─────────────────┬────────────────────┐
│ Índice   │ Unidades        │ INSCRIBIBLE        │
│  7,00    │  10 / 178       │  21 materias       │ → #/plan
│ cuadro   │  ▰▱▱▱▱▱▱        │  32 U.C. · ver →   │   + filtro
└──────────┴─────────────────┴────────────────────┘
```

Con el historial vacío esa celda no cuenta disponibles —serían «las del primer
semestre», que no es un logro ni una respuesta— sino que invita a cargarlo.

### Una materia con historial no se sobrescribe desde la lista

Cada fila sin intentos lleva la escala del Art. 39 y un clic registra un
intento `regular`. Cargar un semestre pasa de ~35 interacciones a ~6.

Pero **una fila que ya tiene historial no acepta escritura directa**: muestra su
nota efectiva y obliga a abrir el editor completo.

```
 intentos                  qué ofrece la fila
 ─────────────────────────────────────────────────────────
 []                        [1 2 3 4 │ 5 6 7 8 9]   escribe
 [{regular,7}]             7  · Editar             no escribe
 [{3},{4},{6}]             5,0 · 3 intentos · ✎    no escribe
```

La razón es el Art. 49: la nota efectiva depende del **orden y del número** de
intentos, y un gesto de un solo clic no puede expresar «corrige el segundo».
Como el caso frecuente —la carga inicial, todo vacío— es justo el escribible, no
hace falta confirmación en ningún clic.

Los tipos especiales (equivalencia, suficiencia, retiro, en curso) entran solo
por el editor completo, que se despliega en la propia fila: cada uno arrastra
una consecuencia normativa que hay que leer, y ese texto no cabe en una línea.

### La escala está definida una sola vez

`ui/intentos/` contiene `SelectorNota`, `FormularioIntento` y `consecuencia()`.
Los consumen el panel de detalle y la lista. Si alguna vez hubiera dos
definiciones de la escala del Art. 39, una de ellas estaría mal — es el mismo
razonamiento que el puente Tailwind↔WebGL de los tokens de color.

### Sin WebGL la aplicación no se queda en blanco

`hayWebGL()` se comprueba una vez antes de montar la escena. Si falla, la vista
es la lista, con aviso explícito, y la pestaña del grafo no se ofrece: una
pestaña que al pulsarla no lleva a ninguna parte es peor que no tenerla. Todo lo
demás —notas, índice, calculadora, respaldo— no depende de three.js y sigue
funcionando.

### El editor de intentos no acepta cualquier número

La escala es la del Art. 39: **nueve enteros**, con la frontera 4|5 marcada. Nada de
campos numéricos libres ni de escala sobre 20 — el error más fácil de cometer aquí es
teclear una nota de otra universidad. Al elegir el tipo de intento se muestra su
consecuencia citando la norma («Otorga créditos, no pesa en el índice — Art. 48»).

### El conversor existe para no anidar actividades

Quien tiene «17 de 20» lo convierte ahí y escribe la calificación resultante en su
parcial. Es más simple que modelar actividades dentro de cada parcial, y cubre el mismo
caso.

## Navegación por teclado

Recorrer una cadena de prelaciones con el ratón obliga a apuntar a discos de 17 px que
además se mueven al orbitar. Con las flechas se camina el grafo **por sus propias
aristas**:

| Tecla | Acción |
|---|---|
| `←` | La primera prelación: lo que hace falta antes |
| `→` | Lo primero que se desbloquea |
| `↑` `↓` | Rota entre las materias hermanas — las que comparten el mismo requisito |
| `Esc` | Limpia selección y filtros; si el foco está en un campo, solo lo abandona |

Sin selección, la primera flecha entra por el principio del orden topológico. El teclado
**no secuestra** la escritura: mientras el foco esté en un `input`, `textarea` o elemento
editable, las flechas se comportan como siempre. En la calculadora está desactivado,
donde estorbaría.

## Persistencia

El historial vive en `localStorage`, bajo la clave `pensum-unet:historial`, con número de
versión de esquema (`VERSION_ESQUEMA = 1`).

```json
{ "version": 1, "historial": { "425401": [{ "tipo": "regular", "nota": 7 }] } }
```

### Qué puede salir mal, y qué hace la aplicación

| Situación | Comportamiento |
|---|---|
| No hay almacenamiento (ventana privada, bloqueado) | Avisa: «tu historial no se conservará» |
| Contenido ilegible o que no cumple el esquema | Arranca en blanco y **no sobrescribe**: borrar la evidencia sería peor |
| Guardado por una versión posterior | Se respeta intacto, se avisa y se trabaja en blanco |
| Cuota llena al guardar | `guardarHistorial` devuelve `false` sin lanzar |

La función `migrar()` existe desde la versión 1, aunque hoy no tenga nada que hacer:
añadirla después de que la gente ya tenga notas cargadas es mucho más caro.

La validación de forma (`esHistorial`) es estructural, no de confianza: comprueba tipo de
intento, nota entera en 1–9, y los campos opcionales.

### El respaldo no es un extra

`localStorage` desaparece al limpiar los datos del sitio, no existe en ventana privada y
no cruza dispositivos. Sin backend, **exportar es la única red de seguridad** — por eso
la advertencia es explícita y no letra pequeña. Exportar/importar JSON está en la pestaña
**Datos** de la leyenda.

Al importar, un archivo de versión posterior se rechaza con mensaje explícito en vez de
migrarse a ciegas.

## Lo que no se guarda

Los **planes de evaluación** viven solo en memoria. Se indexan por materia para que
cambiar de asignatura y volver no los pierda dentro de la misma sesión, pero se pierden
al recargar: son papel de borrador. Lo que perdura es su resultado, si el estudiante elige
registrarlo como intento.

Al registrar una definitiva desde la calculadora se recuerda cuál se registró por materia,
de modo que un doble clic o una vuelta a la pestaña no añadan el mismo intento dos veces.
Si la definitiva cambia, vuelve a poder registrarse.
