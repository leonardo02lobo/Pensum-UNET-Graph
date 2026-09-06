## 1. Total de la carrera y la invariante que faltaba

- [x] 1.1 Subir `UC_TOTALES` de 155 a 178 en `src/data/types.ts`, con el desglose comentado: 155 + 12 (TAP) + 1 (Inv. de Operaciones I) + 10 (deportivas)
- [x] 1.2 Añadir a `validate.ts` la comprobación de que la suma de las U.C. de las materias iguale `UC_TOTALES`, informando ambos valores y su diferencia al fallar (D5)
- [x] 1.3 Verificar que las compuertas por porcentaje se recalculan solas: TAP Tesis 80 % → 143 U.C., TAP Pasantía 100 % → 178 U.C.

## 2. Correcciones contra Control de Estudios

- [x] 2.1 Corregir `TAP Tesis` y `TAP Pasantía` a 12 U.C. cada una, y retirar de `meta.inferencias` la de las 6 U.C. repartidas, que el informe desmiente
- [x] 2.2 Corregir `Investigación de Operaciones I` a 4 U.C.
- [x] 2.3 Renombrar `Análisis Numérico` a `Métodos Numéricos`, conservando su `id`
- [x] 2.4 Actualizar los 21 códigos contra el informe, **sin tocar ningún `id`** (D2), incluidos los tres que estaban vacíos: `Automatización` → `0236509T`, `Seminario Servicio Comunitario` → `1000001T`, `Proyecto Servicio Comunitario` → `1000002T`
- [x] 2.5 Añadir `control-estudios` como valor de `fuente` y marcar con él las materias cuyo dato viene del informe

## 3. Línea de Actividad Deportiva

- [x] 3.1 Añadir el sector `deportiva` a `SECTORES` y a `NOMBRE_SECTOR`, con su token de color en `index.css`
- [x] 3.2 Insertarlo en `ORDEN_SECTORES` entre `grado` y `formacion`, que es donde no rompe ninguna adyacencia existente (D3)
- [x] 3.3 Añadir las diez materias `Actividad Deportiva I` a `X`, de 1 U.C., sin prelaciones ni correquisitos, repartidas una por semestre del 1 al 10
- [x] 3.4 Poner los códigos conocidos en las tres primeras y `null` en las siete restantes, registrándolas en `meta.inferencias` junto con que el número diez lo aporta el usuario, no el informe (D6)

## 4. Metadatos y procedencia

- [x] 4.1 Añadir el informe académico de Control de Estudios como tercera fuente en `meta.fuentes`, declarada como autoridad de códigos, U.C. y existencia (D1)
- [x] 4.2 Registrar en `meta.discrepancias` las correcciones que el informe impone sobre las fuentes anteriores
- [x] 4.3 Actualizar la fecha de última verificación

## 5. Validaciones y pruebas

- [x] 5.1 Actualizar los conteos: 68 materias, 64 sectorizadas, y `deportiva: 10` en la distribución por sector
- [x] 5.2 Añadir las pruebas de la línea deportiva: son diez, de 1 U.C., sin prelaciones ni correquisitos, y todas del sector `deportiva`
- [x] 5.3 Añadir la prueba de que las U.C. suman 178, y una que confirme que alterar una materia la hace fallar
- [x] 5.4 Actualizar las pruebas del layout para nueve sectores: orden cíclico, arcos contiguos que suman 360°, y que `deportiva` no tiene aristas
- [x] 5.5 Volver a verificar la separación mínima entre nodos y el encuadre de cámara con la geometría nueva

## 6. Comprobación de punta a punta

- [x] 6.1 Regenerar el historial desde el informe académico y comprobar que el índice da **7,21**, coincidiendo con Control de Estudios
- [x] 6.2 Comprobar que las U.C. aprobadas dan 128, las del informe
- [x] 6.3 Verificar en el navegador que el sunburst dibuja los nueve brazos y que la línea deportiva se lee como un abanico sin aristas

## 7. Cierre

- [x] 7.1 Actualizar el README: tres fuentes con su orden de autoridad, total de 178 U.C., la línea deportiva y por qué los `id` no cambian aunque sí los códigos
- [x] 7.2 Sustituir en el README la deuda de datos resuelta —las U.C. de los TAP— por las preguntas abiertas nuevas: los siete códigos que faltan, si las deportivas prelan entre sí y en qué semestre cae cada una
