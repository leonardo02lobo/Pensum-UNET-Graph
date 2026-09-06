## Context

La aplicación cubre hoy los dos extremos de la vida académica: el plan de estudios (el grafo) y el resultado consolidado (el índice, a partir de calificaciones definitivas). Falta el tramo intermedio — cómo se llega a esa definitiva mientras cursas.

La norma aplicable es **C-3, Normas para la Evaluación del Rendimiento Estudiantil**, Capítulo IV (Art. 31–33) y Capítulo VI (Art. 39–42). El documento está escaneado y se transcribió leyendo las páginas.

Lo que emergió de esa lectura es que **no hay un cálculo, hay una cadena de cuatro eslabones**, cada uno con su propio redondeo:

```
   actividad con puntaje libre        Art. 42
   (17 de 20 en un quiz)              → a porcentaje, y del porcentaje a nota por Tabla 1
            │
            ▼
   NOTA DEL PARCIAL   1,0 – 9,0       Art. 40
   (enteros y décimas)                → × su ponderación, aproximando a dos decimales
            │
            ▼
   APORTE PONDERADO                   Art. 41
            │                         → Σ; cincuenta o más centésimas suben
            ▼
   CALIFICACIÓN DEFINITIVA  1 – 9     Art. 39
   (entero; 5 aprueba)                → aprobatorias 5 a 9
            │
            ▼
   ÍNDICE ACADÉMICO                   Art. 47/49   ← ya construido
```

El último eslabón ya existe. Este cambio construye los tres anteriores y los enchufa.

## Goals / Non-Goals

**Goals:**

- Responder «¿cuánto necesito?» con el umbral correcto, que es **4,50 y no 5,00**.
- Convertir porcentajes a notas con la tabla oficial, sin aproximarla con una fórmula.
- Aprovechar que la aplicación conoce las U.C. de cada materia para **revisar el plan del profesor** contra el Art. 32.
- Mantener el cálculo puro y probado sin navegador, como el resto del modelo.
- Cerrar el circuito: definitiva → intento → índice → compuertas → grafo.

**Non-Goals:**

- Persistir el plan de evaluación. Es borrador.
- Actividades con puntaje libre anidadas por parcial.
- Materias fuera del pensum.
- Predecir o sugerir notas. La app calcula lo que la norma dice, no aconseja.

## Decisions

### D1 — La Tabla 1 se transcribe como dato; calcularla estaría mal

El Art. 42 convierte porcentajes a la escala 1,0–9,0 mediante una tabla. **No es lineal ni regular.** Ocho notas reciben dos porcentajes y el resto uno solo:

```
   2,0 ← 17 y 18       4,8 ← 48 y 49       7,0 ← 73 y 74
   3,0 ← 28 y 29       5,3 ← 54 y 55       8,0 ← 84 y 85
   4,0 ← 39 y 40       6,0 ← 62 y 63
```

El mejor ajuste lineal, `nota = 1 + (pct − 7) / 11`, **falla por más de media décima en 35 de las 89 celdas**. Y falla justo donde duele:

```
      48 % → 4,8       50 % → 4,9
      49 % → 4,8       51 % → 5,0   ← aprueba
```

El 5,0 es la única nota con un solo porcentaje asociado. No hay margen de error.

**Verificación:** la tabla se transcribió del PDF y se contrastó celda a celda contra la [tabla oficial en línea de la UNET](https://www.unet.edu.ve/~frsilva/TablaConversion.php). Ambas coinciden.

**Forma de almacenamiento.** En vez de las 101 filas, se guardan los **81 umbrales inferiores** (uno por cada décima de 1,0 a 9,0), que reconstruyen la tabla completa sin pérdida — comprobado: la reconstrucción es idéntica al original y cubre 0–100 sin huecos.

```
  nota → porcentaje mínimo que la alcanza

  1.0:7   1.1:8   1.2:9   1.3:10  1.4:11  1.5:12  1.6:13  1.7:14  1.8:15
  1.9:16  2.0:17  2.1:19  2.2:20  2.3:21  2.4:22  2.5:23  2.6:24  2.7:25
  2.8:26  2.9:27  3.0:28  3.1:30  3.2:31  3.3:32  3.4:33  3.5:34  3.6:35
  3.7:36  3.8:37  3.9:38  4.0:39  4.1:41  4.2:42  4.3:43  4.4:44  4.5:45
  4.6:46  4.7:47  4.8:48  4.9:50  5.0:51  5.1:52  5.2:53  5.3:54  5.4:56
  5.5:57  5.6:58  5.7:59  5.8:60  5.9:61  6.0:62  6.1:64  6.2:65  6.3:66
  6.4:67  6.5:68  6.6:69  6.7:70  6.8:71  6.9:72  7.0:73  7.1:75  7.2:76
  7.3:77  7.4:78  7.5:79  7.6:80  7.7:81  7.8:82  7.9:83  8.0:84  8.1:86
  8.2:87  8.3:88  8.4:89  8.5:90  8.6:91  8.7:92  8.8:93  8.9:94  9.0:95

  por debajo de 7 → 1,0      ·      95 o más → 9,0
```

La tabla lleva la marca **UE19** en el documento, que sugiere versión de la Unidad de Evaluación. Se registra esa referencia junto al dato, por si algún día cambia.

*Alternativa descartada:* interpolar con la fórmula lineal. Ahorra 81 líneas y se equivoca en el 39 % de los casos.

### D2 — La frontera para aprobar es 4,50

El Art. 41 redondea la sumatoria y «cincuenta o más centésimas se aproximan a la unidad inmediata superior». Por tanto:

```
   suma ≥ 4,50   →   definitiva 5   →   APROBADO
   suma = 4,49   →   definitiva 4   →   reprobado
```

Se generaliza sin casos especiales: **para obtener la definitiva N, la suma debe caer en `[N − 0,50 , N + 0,50)`**. De ahí sale directamente el cálculo de lo que falta:

```
   necesario(N) = (N − 0,50 − acumulado) / peso_restante
```

Con tres desenlaces:

```
   ≤ 1,0   →  YA ESTÁ        ni con la nota mínima lo pierdes
   > 9,0   →  YA NO ALCANZA  ni con 9,0 en todo lo que falta llegas
   resto   →  EN JUEGO       necesitas al menos X
```

El valor necesario se redondea **hacia arriba a la décima**: si sale 6,23, hace falta 6,3. Redondear a 6,2 daría un número inalcanzable disfrazado de suficiente.

### D3 — NP consume su ponderación; y el acotado a 1 absorbe el caso extremo

El Art. 31 dice que la condición NP «no tendrá valor asociado para la sumatoria ponderada definitiva»: aporta cero, **no reduce el denominador**. Un parcial no presentado gasta su peso.

El Parágrafo Segundo añade que si todas las parciales son NP, la definitiva se establece en uno. No hace falta tratarlo aparte: como la escala del Art. 39 empieza en 1, **acotar la definitiva a `[1, 9]` produce ese resultado por sí solo** — con todo en NP la suma es cero y el acotado la sube a 1.

Es el mismo patrón que el Art. 49 del cambio anterior: la norma parece tener un caso especial y en realidad es una consecuencia de la regla general.

### D4 — Cada aporte se redondea a dos decimales antes de sumar

Art. 40: «Las ponderaciones de cada evaluación se calcularán sobre esta base, aproximando con dos dígitos decimales».

Se lee como que **el aporte de cada parcial** —nota × peso— se redondea a dos decimales, y luego se suman los aportes ya redondeados. Con ponderaciones como 33,33 % la diferencia frente a sumar sin redondear es de centésimas… que es exactamente la magnitud que decide en la frontera del 4,50.

Es una **interpretación**, no una cita literal: la norma no dice explícitamente si se aproxima cada aporte o el total. Queda en Preguntas Abiertas y se fija con una prueba para que el criterio sea visible y cambiable en un solo sitio.

### D5 — El Art. 32 se avisa, no se bloquea

El número de parciales y el rango de cada ponderación dependen de las unidades de crédito:

| U.C. | Parciales | Rango por parcial | Materias del pensum |
|---|---|---|---|
| 1 | 2 | 40 % – 60 % | 7 |
| 2 – 3 | 3 | 20 % – 40 % | 36 |
| 4 o más | 4 | 10 % – 35 % | 12 |

La aplicación conoce las U.C., así que puede comprobarlo. Pero **avisa y calcula igual**: el Art. 32c admite que la Unidad de Evaluación autorice tres parciales en materias de cuatro créditos, y la app no puede saber si esa autorización existe. Bloquear dejaría al estudiante sin herramienta justo cuando su curso real se aparta del papel.

El aviso cita el artículo, porque su valor no es corregir el formulario sino informar: *«tu profesor puso 3 parciales en una materia de 4 U.C.; el Art. 32c exige 4, salvo autorización»*.

*Alternativa descartada:* bloquear el cálculo. Convierte una norma con excepciones en una regla rígida.

*Alternativa descartada:* validar solo que los pesos sumen 100. Renuncia al único aporte que una calculadora genérica no puede dar.

### D6 — Sin las ponderaciones completas no se inventa una definitiva

Si las ponderaciones no suman 100, el cálculo carece de sentido: normalizarlas produciría un número silenciosamente equivocado.

La decisión es no mostrar definitiva y decir cuánto falta por asignar. No es un bloqueo de captura —se puede seguir escribiendo— es que **el resultado se niega a existir mientras el plan esté incompleto**, que es distinto de mostrar un número provisional que el usuario tomaría por bueno.

### D7 — El plan es borrador; la definitiva es el hecho duradero

El plan de evaluación **no se persiste**. Vive en memoria mientras dura la sesión, indexado por materia para que cambiar de asignatura y volver no lo borre, pero se pierde al recargar.

Lo que sí perdura es su resultado: al pulsar «registrar», la definitiva entra al historial como un intento regular por la misma vía que el panel de detalle, y desde ahí mueve el índice, las compuertas y el estado en el grafo.

Consecuencia práctica: **el esquema persistido no cambia** y el historial sigue en la versión 1. No hay migración que escribir.

### D8 — Enrutado por hash, no `react-router`

Dos vistas no justifican una dependencia de enrutado. Un `hashchange` propio da URL compartible (`#/calculadora`) y botón atrás en unas veinte líneas.

### D9 — `evaluacion/` es puro

```
   src/data/         pensum + tabla de conversión (dato transcrito)
   src/evaluacion/   plan · validaciones Art. 32 · definitiva · cuánto falta
                     sin React, sin DOM, probable en Node
   src/ui/           la pestaña
```

Misma frontera que `progreso/` y por la misma razón: las reglas de los Art. 40, 41 y 42 son justo lo que hay que cubrir con pruebas citando su artículo, y no deberían necesitar un navegador.

## Risks / Trade-offs

**[La interpretación del Art. 40 puede ser la equivocada]** → D4 decide redondear cada aporte antes de sumar. Si Control de Estudios sumara sin redondear, la definitiva podría diferir en una unidad justo en la frontera. Mitigación: el criterio vive en una sola función con su prueba, y cambiarlo es una línea.

**[Mostrar «necesitas 6,3» proyecta una certeza que el curso no garantiza]** → El profesor puede cambiar el plan, añadir una diferida o evaluar sobre otro puntaje. La interfaz debe presentar el número como lo que es: el resultado de aplicar la norma al plan que el estudiante declaró, no una promesa.

**[La Tabla 1 podría actualizarse]** → Lleva la marca UE19. Se guarda esa referencia junto al dato para que una futura discrepancia sea rastreable en vez de misteriosa.

**[Un plan que viola el Art. 32 puede ser el correcto]** → Por eso D5 avisa en vez de bloquear. El aviso puede resultar ruidoso para quien tiene autorización especial; si molesta, se le añade un modo de silenciarlo.

**[Perder el plan al recargar puede frustrar]** → Es la contrapartida aceptada de D7. Si se vuelve incómodo, persistirlo es aditivo y no rompe nada de lo construido.

## Open Questions

- **¿El Art. 40 aproxima cada aporte o el total?** D4 asume lo primero. Conviene confirmarlo con Control de Estudios: en la frontera del 4,50 cambia el resultado.
- **¿Qué hace la evaluación de suficiencia (Art. 34–38) en esta pantalla?** Es una vía alterna a las parciales, no un parcial más. Hoy queda fuera; el historial ya la modela como tipo de intento.
- **¿Cómo declara un estudiante que su profesor tiene la autorización del Art. 32c** para usar tres parciales en una materia de cuatro créditos? Hoy solo se le avisa.
- **Las materias en escala APROBADO/REPROBADO** (Art. 39, Parágrafo Único) no tienen parciales que ponderar. En el dataset son los tres nodos de Servicio Comunitario, todos con 0 U.C., pero puede haber más sin identificar.
- **¿La calificación de una diferida sustituye la del parcial o se promedia con ella?** El Art. 33 no lo precisa; hoy se asume sustitución, que es lo que el modelo permite sin campos extra.
