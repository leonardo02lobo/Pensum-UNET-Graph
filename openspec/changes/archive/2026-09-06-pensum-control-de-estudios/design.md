## Context

El dataset se construyó fusionando dos fuentes: el Canva de un estudiante (06/05/2026) y el PDF del sitio de la UNET. Ambas resultaron incompletas frente a una tercera que apareció después: el **informe académico de Control de Estudios**, que es el registro vivo de la Universidad.

El descubrimiento vino de importar un historial real. La aplicación mostró **7,17** donde el informe dice **7,21**. El parseo del informe reproduce el 7,21 exactamente —937 / 130 = 7,2077, que con el redondeo del Art. 55 da 7,21—, así que el error no estaba en el cálculo sino en el dataset:

```
   diferencia de 4 U.C. aprobadas (128 oficiales vs 124 calculadas)

     3 U.C.   Actividad Deportiva I, II y III — no existían en el dataset
     1 U.C.   Investigación de Operaciones I — 3 en el dataset, 4 en el informe
```

Y al sumar todo el informe apareció algo mayor: la carrera son **171 U.C.** con solo lo que él lista, no 155. El dataset declaraba 155 y sus materias sumaban 155 — coherente consigo mismo, y equivocado.

## Goals / Non-Goals

**Goals:**

- Que el índice calculado sobre un historial real coincida con el de Control de Estudios.
- Adoptar Control de Estudios como autoridad de códigos, unidades de crédito y existencia de materias.
- Modelar la línea de Actividad Deportiva como un brazo propio del pensum.
- Que el total de la carrera no pueda volver a divergir de sus materias sin que una prueba lo señale.

**Non-Goals:**

- Renumerar los identificadores. Son la clave del historial persistido.
- Modelar el catálogo real de electivas. El pensum sigue con cuatro ranuras genéricas.
- Inventar los siete códigos de deportivas que el informe no muestra.

## Decisions

### D1 — Control de Estudios manda sobre las otras dos fuentes

Orden de autoridad, de mayor a menor:

```
   Control de Estudios (informe académico)   ← registro vivo de la Universidad
   Canva (06/05/2026)                        ← contenido curado, más nuevo que el PDF
   PDF del sitio                             ← el más antiguo
```

El informe gana en **códigos, unidades de crédito y existencia** de materias. Las otras dos siguen aportando lo que el informe no trae: prelaciones, correquisitos, compuertas por créditos y semestre nominal — el informe agrupa por semestre pero no declara qué prela de qué.

Cada materia mantiene su campo `fuente`, que ahora admite `control-estudios`.

### D2 — Los identificadores no se tocan; solo cambia `codigo`

Veintiún materias tienen un código distinto al registrado, y tres que estaban vacíos ahora se conocen. Es tentador adoptar los códigos nuevos como `id`, ya que el `id` se derivó del código.

**No.** El `id` es la clave del historial persistido en `localStorage` y de los archivos exportados. Renumerarlo dejaría huérfano el historial de cualquiera que ya haya cargado sus notas, sin aviso y sin forma de recuperarlo. El `id` es un identificador interno estable; el `codigo` es un dato.

```
   id:     '424301'      ← no cambia nunca
   codigo: '0416304T'    ← se actualiza contra Control de Estudios
```

*Alternativa descartada:* renumerar y migrar el historial. Añade una migración con riesgo real a cambio de una coherencia puramente estética.

### D3 — La Actividad Deportiva es un sector propio

Diez materias de 1 U.C., sin prelaciones entre ellas ni con nada más. No encajan en ninguno de los ocho sectores existentes: no son formación integral en el sentido de Lenguaje o Ciencia y Sociedad, ni comparten nada con ellas.

Como el ancho de cada brazo es proporcional a su número de materias, diez las convierten en un brazo visible —el tercero más ancho— y su ausencia de aristas lo hace un abanico limpio, fácil de leer.

**Dónde va en el orden cíclico.** El orden vigente se eligió para acortar las aristas que cruzan brazos. Insertar el nuevo sector **entre `grado` y `formacion`** no rompe ninguna adyacencia existente, porque `grado` no tiene cruces:

```
   formacion → gestion → matematica → ciencias → sistemas
             → programacion → datos → grado → DEPORTIVA → (vuelve a formacion)
```

*Alternativa descartada:* insertarlo junto a `formacion`, que separaría `gestion` de `formacion` y alargaría el cruce de Economía → Legislación.

**Consecuencia sobre la costura.** El ángulo inicial sitúa la costura del sunburst en el límite entre el último sector y el primero, que es donde cuelgan las etiquetas de semestre. Con el sector nuevo la costura pasa a estar entre `deportiva` y `formacion` — sigue siendo un límite sin materias, así que las etiquetas siguen sin pisar nada.

### D4 — El total de la carrera pasa a 178 U.C.

```
   155   dataset actual
   + 12   TAP Tesis y TAP Pasantía a 12 cada una, no 6
   +  1   Investigación de Operaciones I, 4 en vez de 3
   + 10   las diez Actividad Deportiva
   ────
   178
```

Los TAP eran una **inferencia de este proyecto** que resultó equivocada: el PDF daba 12 U.C. al bloque TAP sin desglosar y el Canva lo partía en dos nodos, así que se repartió 6 y 6. El informe muestra 12 en cada uno. Quedó anotado desde el principio como deuda de datos, y era la que más pesaba porque entra al índice justo al final de la carrera.

Los umbrales por porcentaje se recalculan solos desde `UC_TOTALES`: TAP Tesis pasa de 124 a **143** U.C. y TAP Pasantía de 155 a **178**.

### D5 — La invariante que faltaba: las U.C. deben sumar el total

El dataset declaraba 155 y sus materias sumaban 155. Coherente, y equivocado — porque nada comprobaba que ese 155 fuera el de la carrera real. La coherencia interna no detecta un dato importado mal.

Se añade la validación de que `Σ uc == UC_TOTALES`. No habría atrapado el error original, pero **sí impide que el dataset se desfase de su propio total** al añadir o corregir materias, que es exactamente lo que este cambio hace y lo que volverá a hacerse cuando aparezcan los códigos que faltan.

Es la misma clase de red que las validaciones de ciclos y coherencia temporal: barata, y encuentra el error en el commit en vez de en la pantalla.

### D6 — Los siete códigos que faltan se declaran vacíos, no inventados

El informe solo lista `Actividad Deportiva I`, `II` y `III`, con los códigos `0007002T`, `0007005T` y `0007008T`. Saltan de tres en tres, lo que sugiere un patrón — pero deducir `0007011T` para la cuarta sería inventar.

Las siete restantes van con `codigo: null` y quedan registradas en `meta.inferencias`, igual que se hizo con las electivas. El dataset ya admite ese estado y la interfaz ya lo muestra como «sin código registrado».

## Risks / Trade-offs

**[El pensum del informe es el de una cohorte concreta]** → Los planes de estudio cambian y el informe refleja el de este estudiante. Si otro cursa un pensum distinto, el dataset no le servirá. Es una limitación estructural del proyecto —modela una carrera, no todas sus versiones— y conviene que la fecha de verificación quede visible.

**[Diez actividades deportivas es dato del usuario, no del informe]** → El informe lista tres. Que sean diez viene de lo que el estudiante sabe de su universidad. Se registra como tal en `meta.inferencias` para que la procedencia no se confunda con la del informe.

**[Cambiar el total mueve las compuertas por porcentaje]** → Un historial ya cargado verá moverse su avance y el estado de los TAP. Es la corrección buscada, no un efecto secundario, pero conviene que el cambio de total sea visible al usuario y no silencioso.

**[La geometría del sunburst cambia]** → Nueve brazos en vez de ocho reordena todos los ángulos. Las pruebas de separación mínima entre nodos y de encuadre de cámara deben volver a pasar; si el anillo interior se aprieta, el tamaño de los nodos se ajusta solo porque se deriva de la separación mínima.

## Open Questions

- **¿Cuáles son los códigos de `Actividad Deportiva IV` a `X`?** El patrón de tres en tres lo sugiere, pero hace falta confirmarlo con Control de Estudios.
- **¿Las diez actividades deportivas tienen prelación entre sí** —hay que aprobar la I antes de la II— o se cursan en cualquier orden? Se asume lo segundo, que es lo que el informe insinúa al mostrarlas en semestres distintos y no consecutivos.
- **¿En qué semestre cae cada una?** El informe las ubica en I, II y III según el semestre en que se inscribieron, no según el plan. Se reparten una por semestre del 1 al 10, que es lo que hace que formen una línea legible, pero es una decisión de presentación más que un dato.
- **¿Qué otras materias usan la escala APROBADO/REPROBADO?** El informe confirma las dos de Servicio Comunitario. Puede haber más sin identificar.
