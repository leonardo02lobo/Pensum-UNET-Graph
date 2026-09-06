## Why

El informe académico de Control de Estudios reveló que el dataset está desactualizado en cosas que no son cosméticas. Al importar un historial real, la aplicación calculó **7,17** donde el informe oficial dice **7,21**: no por un error de cálculo —el parseo del informe reproduce el 7,21 exactamente— sino porque al dataset le faltan materias y tiene unidades de crédito equivocadas.

Y hay algo peor de fondo: el dataset declara un total de **155 U.C.**, pero el informe implica **171** con solo las materias que él lista. Esa diferencia descalibra las dos compuertas por porcentaje —TAP Tesis al 80 % y TAP Pasantía al 100 %— que se resuelven contra el total de la carrera.

El informe de Control de Estudios es mejor fuente que el Canva y que el PDF de la web: es el registro vivo de la Universidad. Este cambio lo adopta como autoridad para códigos, unidades de crédito y existencia de materias.

## What Changes

- **Nueva línea de Actividad Deportiva**: diez materias, `Actividad Deportiva I` a `X`, de 1 U.C. cada una, sin prelaciones entre ellas. Forman un sector propio y un brazo propio en el grafo. El informe solo lista las tres que el estudiante lleva inscritas (`0007002T`, `0007005T`, `0007008T`); las siete restantes se declaran sin código, pendientes de confirmar.
- **Unidades de crédito corregidas** contra el informe:
  - `TAP Tesis` y `TAP Pasantía`: de 6 a **12 cada una**. Eran una inferencia de este proyecto —el PDF daba 12 al bloque TAP sin desglosar— y resultó equivocada.
  - `Investigación de Operaciones I`: de 3 a **4**.
- **Total de la carrera de 155 a 178 U.C.**, que es la suma real: 155 + 12 (TAP) + 1 (Inv. de Operaciones I) + 10 (deportivas). Los umbrales por porcentaje pasan a 143 (80 %) y 178 (100 %).
- **Veintiún códigos actualizados** al formato vigente de Control de Estudios, que además rellenan tres que estaban vacíos:

  | | dataset | Control de Estudios |
  |---|---|---|
  | Estructura de Datos | `424301` | `0416304T` |
  | Programación II | `425401` | `0415405T` |
  | Organización del Computador | `426502` | `0436505T` |
  | Sistemas Operativos | `425603` | `0435607T` |
  | Ingeniería Económica | `134708` | `0134805T` |
  | **Automatización** | *(sin código)* | `0236509T` |
  | **Seminario Servicio Comunitario** | *(sin código)* | `1000001T` |
  | **Proyecto Servicio Comunitario** | *(sin código)* | `1000002T` |

- **`Análisis Numérico` pasa a llamarse `Métodos Numéricos`**, que es su nombre actual.
- **Validación nueva: la suma de las U.C. de las materias debe igualar el total declarado.** Su ausencia es lo que permitió que el dataset conviviera con un total equivocado sin que nada protestara.
- **Nueva validación de la línea deportiva**: diez materias, 1 U.C. cada una, sin prelaciones.

**Fuera de alcance:**
- Los siete códigos de las actividades deportivas que el informe no lista.
- El catálogo real de electivas cursadas: el informe muestra las trece ofertas, pero el pensum sigue modelando cuatro ranuras genéricas.
- Un tipo de intento «aprobado sin nota» para la escala APROBADO/REPROBADO del Art. 39 Parágrafo Único. Hoy esas materias se representan como equivalencia, que se comporta bien pero se etiqueta mal.

## Capabilities

### Modified Capabilities

- `pensum-dataset`: cambian los requisitos de conteo (58 → 68 materias), la taxonomía gana un noveno sector, el total de unidades de crédito pasa a 178, y se añade la invariante de que las U.C. de las materias sumen ese total. Se incorpora Control de Estudios como tercera fuente y como autoridad sobre las otras dos.
- `orbital-graph-view`: el sunburst pasa de ocho brazos a nueve, con el nuevo sector insertado en el orden cíclico.
- `graph-interaction`: la leyenda pasa de listar ocho sectores a nueve.
- `indice-academico`: el umbral del 80 % pasa de 124 sobre 155 a 143 sobre 178.

### New Capabilities

Ninguna. Este cambio corrige y amplía lo que ya existe.

## Impact

- **Los identificadores NO cambian.** Solo se actualiza el campo `codigo`. El `id` es la clave del historial persistido y de los archivos exportados: renumerarlo invalidaría el historial de cualquiera que ya haya cargado sus notas.
- **`UC_TOTALES` pasa de 155 a 178** en `data/types.ts`. Afecta a `gateEnUC()` para las compuertas por porcentaje y al «X / total» de la cabecera.
- **Las pruebas de conteo cambian**: 58 → 68 materias, 54 → 64 sectorizadas, y la distribución por sector gana `deportiva: 10`.
- **El layout se recalcula solo.** El ancho de cada brazo es proporcional a su número de materias, así que añadir un sector reordena los ángulos sin tocar el render. Las pruebas de separación mínima y de encuadre deben volver a verificarse con la nueva geometría.
- **Sin cambio en el esquema persistido.** Al no tocar los `id`, el historial sigue en la versión 1 y los archivos exportados siguen siendo válidos.
- **El índice del historial importado pasará de 7,17 a 7,21**, coincidiendo con Control de Estudios. Es la comprobación de que el cambio hizo lo que dice.
