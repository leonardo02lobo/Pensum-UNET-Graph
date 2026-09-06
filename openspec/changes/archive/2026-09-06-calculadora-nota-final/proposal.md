## Why

La aplicación ya sabe qué materias tienes aprobadas y qué índice llevas, pero solo a partir de calificaciones **definitivas** que hay que teclear a mano. Del semestre en curso no sabe nada: mientras cursas, la pregunta diaria no es «¿cuál es mi índice?» sino **«¿cuánto necesito en el último parcial para aprobar?»**.

Esa cuenta se hace mal a mano con notable facilidad, y siempre en contra del estudiante:

- **La frontera para aprobar no es 5,00 sino 4,50.** El Art. 41 redondea la sumatoria y cincuenta centésimas suben a la unidad superior. Media unidad de margen que casi nadie considera.
- **La conversión de porcentaje a nota no es una regla de tres.** El Art. 42 remite a una tabla irregular donde el 50 % es 4,9 y el 51 % es 5,0. Un punto porcentual decide, y el 5,0 es la única nota que recibe un solo porcentaje.
- **Un NP no se salta, pesa cero.** El Art. 31 le quita valor a la sumatoria, no reduce el denominador.

Y hay algo que solo esta aplicación puede hacer: como conoce las unidades de crédito de las 58 materias, puede **validar el plan de evaluación contra el Art. 32** y avisar cuando el reparto de ponderaciones no cumple la norma. Una calculadora genérica acepta cualquier cosa; esta puede decirte que a tu materia de 4 U.C. le faltan parciales.

## What Changes

- **Pestaña nueva de calculadora**, accesible por ruta con hash (`#/calculadora`), separada de la vista del grafo.
- **Tabla de conversión del Art. 42 transcrita como dato**, no como fórmula. Verificada celda a celda contra dos fuentes independientes: el PDF C-3 y la [tabla oficial en línea](https://www.unet.edu.ve/~frsilva/TablaConversion.php). El mejor ajuste lineal falla en 35 de sus 89 celdas.
- **Captura de cada parcial en cualquiera de las dos escalas de la norma**: puntos de 0 a 100 (Art. 31), que es como el profesor suele reportarlos, o la calificación de 1,0 a 9,0 (Art. 40). Los puntos se convierten con la tabla y se conserva el valor original.
- **Conversor porcentaje ↔ nota** como herramienta aparte, para quien tenga «17 de 20» en vez de una nota en escala.
- **Plan de evaluación por materia del pensum**: eliges una de las 58 materias y declaras sus parciales con su ponderación.
- **Validación normativa del Art. 32** según las unidades de crédito de la materia elegida, **avisando sin bloquear**:

  | U.C. | Parciales | Cada una | Materias del pensum |
  |---|---|---|---|
  | 1 | 2 | 40 % – 60 % | 7 |
  | 2 – 3 | 3 | 20 % – 40 % | 36 |
  | 4 o más | 4 *(3 con autorización)* | 10 % – 35 % | 12 |

- **Cálculo de la calificación definitiva** siguiendo la cadena de la norma: ponderación de cada parcial aproximada a dos decimales (Art. 40), sumatoria con redondeo desde cincuenta centésimas (Art. 41), resultado entero acotado a la escala 1–9 (Art. 39).
- **«¿Cuánto me falta?»** con sus tres desenlaces —ya está, en juego, ya no alcanza— y una tabla de cuánto haría falta para cada calificación objetivo del 5 al 9.
- **Registrar la definitiva como intento**, cerrando el circuito con el índice académico y con el estado de la materia en el grafo.

**Fuera de alcance en este cambio:**
- Actividades con puntaje libre anidadas dentro de cada parcial (Art. 42 aplicado por actividad). El conversor aparte cubre el caso sin duplicar la interfaz.
- Persistir el plan de evaluación. Es papel de borrador: se pierde al recargar. Lo que sí perdura es la definitiva, si decides registrarla.
- Calculadora para materias fuera del pensum.
- Evaluación diferida (Art. 33) como concepto propio: sustituye la nota de un parcial y no necesita modelo aparte.

## Capabilities

### New Capabilities

- `tabla-conversion`: La tabla del Artículo 42 como dato verificado y su conversión en ambos sentidos entre porcentaje y calificación de 1,0 a 9,0.
- `plan-de-evaluacion`: El modelo del plan —parciales, ponderaciones, notas y la condición NP— junto con las validaciones del Artículo 32 contra las unidades de crédito de la materia.
- `nota-definitiva`: El cálculo normativo puro: ponderación del Artículo 40, sumatoria y redondeo del Artículo 41, y la resolución de «cuánto necesito» para cada calificación objetivo.
- `pestana-calculadora`: La vista — navegación por hash, elección de materia, captura del plan, conversor, avisos normativos y el registro de la definitiva como intento.

### Modified Capabilities

Ninguna. `historial-academico` y `progreso-en-grafo` se consumen tal como están: la calculadora escribe un intento por la misma vía que el panel de detalle.

## Impact

- **Módulo nuevo**: `src/evaluacion/` (tabla, plan, validaciones y cálculo), puro y testeable en Node como `progreso/` y `model/`. Ninguna dependencia nueva.
- **Enrutado por hash**: unas veinte líneas propias en lugar de `react-router`, que sería desproporcionado para dos vistas. Da URL compartible y botón atrás.
- **El esquema persistido no cambia.** Al no guardarse el plan, no hay salto de versión ni migración; el historial sigue en la versión 1.
- **El dataset no se toca.** La calculadora lee `uc` de cada materia para validar, y nada más.
- **Tres materias quedan fuera por construcción**: los nodos de Servicio Comunitario tienen 0 U.C. y ninguna regla del Art. 32 les aplica. La interfaz debe decirlo, no fallar en silencio.
- **Riesgo de precisión heredado**: el Art. 40 manda aproximar cada ponderación a dos decimales antes de sumar. Con pesos como 33,33 % eso mueve centésimas, y las centésimas deciden en la frontera del 4,50. Es la misma clase de trampa que el redondeo del Art. 55 y se fija con pruebas.
