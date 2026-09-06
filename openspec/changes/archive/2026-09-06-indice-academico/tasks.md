## 1. Modelo del historial

- [x] 1.1 Definir los tipos `Intento`, `TipoIntento` e `Historial` en `src/progreso/tipos.ts`, con la nota acotada a los enteros 1–9
- [x] 1.2 Implementar `otorgaCreditos(intento)` y `pesaEnIndice(intento)` según la tabla de D3, con el artículo citado en cada rama
- [x] 1.3 Escribir las pruebas de las dos banderas cubriendo los ocho tipos de intento de la spec

## 2. Cálculo del índice

- [x] 2.1 Implementar `notaEfectiva(intentos)` aplicando el Art. 49 en su forma unificada: un intento devuelve su nota, dos o más devuelven el promedio de todos menos el primero (D2)
- [x] 2.2 Filtrar los intentos que no pesan antes de aplicar el Art. 49, de modo que un retiro con desincorporación no cuente como vez cursada (D4)
- [x] 2.3 Implementar `redondearNormativo(valor)` con dos pasos explícitos a medio hacia arriba — tres decimales y luego dos — sin depender de `toFixed` (D5)
- [x] 2.4 Implementar `indiceAcumulado(historial, pensum)` como media ponderada por unidades de crédito (Art. 47)
- [x] 2.5 Implementar `ucAprobadas(historial, pensum)`, independiente del conjunto que pesa en el índice
- [x] 2.6 Implementar `compuertaCumplida(materia, ucAprobadas)` reutilizando `gateEnUC()` de `data/types.ts`, devolviendo también cuánto falta
- [x] 2.7 Implementar `umbralNormativo(indice)` con los cortes 3,60 · 5,10 · 6,00
- [x] 2.8 Escribir las pruebas del cálculo: el ejemplo del primer semestre que da 6,71, las cuatro filas del Art. 49, el redondeo de 6,715 → 6,72, y las equivalencias que suman crédito sin mover el índice

## 3. Estados derivados

- [x] 3.1 Implementar `estadoDeMateria(id, historial, grafo, ucAprobadas)` con los cinco estados, distinguiendo bloqueo por prelación de bloqueo por crédito (D6)
- [x] 3.2 Implementar `estadosDeTodas(...)` calculando el mapa completo de una pasada
- [x] 3.3 Escribir las pruebas de estados: historial vacío deja disponible el primer semestre; aprobar una materia libera a sus dependientes; una compuerta sin alcanzar produce bloqueo por crédito y no por prelación

## 4. Persistencia

- [x] 4.1 Definir el esquema persistido con campo `version` y la función de migración, aunque hoy solo exista la versión 1 (D8)
- [x] 4.2 Implementar `src/persistencia/historial.ts` sobre `localStorage`, con lectura tolerante: dato corrupto o inválido arranca vacío sin romper
- [x] 4.3 Tratar la versión futura sin sobrescribir el dato, informando en vez de perderlo
- [x] 4.4 Implementar exportar e importar JSON, validando el archivo antes de reemplazar el historial
- [x] 4.5 Escribir las pruebas de persistencia con un `localStorage` simulado: ida y vuelta, corrupto, versión desconocida

## 5. Captura desde el panel

- [x] 5.1 Construir el control de nota 1–9 con la frontera 4|5 marcada, sin decimales ni escala sobre 20
- [x] 5.2 Construir el selector de tipo de intento, exigiendo precisar el retiro y omitiendo la nota donde no aplica
- [x] 5.3 Explicar en una línea, al elegir el tipo, si otorga créditos y si pesa en el índice, citando el artículo
- [x] 5.4 Añadir al panel de detalle la lista de intentos con añadir, editar y eliminar, mostrando la nota efectiva resultante
- [x] 5.5 Añadir los controles de exportar e importar, con la advertencia de que el historial vive solo en este navegador

## 6. Progreso en el grafo

- [x] 6.1 Cablear el historial en `App` como estado, cargándolo al arrancar y persistiéndolo en cada cambio
- [x] 6.2 Añadir la cabecera con índice acumulado y unidades de crédito aprobadas sobre 155, con señal de umbral y estado vacío honesto
- [x] 6.3 Colorear los nodos por estado, componiendo con el color de sector en vez de sustituirlo
- [x] 6.4 Destacar la frontera de materias disponibles como el conjunto inscribible
- [x] 6.5 Mostrar en el panel de detalle la situación personal de la compuerta, con cuánto falta
- [x] 6.6 Actualizar la referencia de compuertas de la leyenda para reflejar el avance real
- [x] 6.7 Añadir el filtro por estado a la leyenda, componiendo con los filtros de sector y semestre existentes

## 7. Cierre

- [x] 7.1 Verificar los escenarios de las cuatro specs contra la aplicación corriendo
- [x] 7.2 Indicar en la interfaz que el cálculo es referencial y no sustituye a Control de Estudios
- [x] 7.3 Documentar en el README el modelo del historial, las reglas normativas implementadas con su artículo, y la fragilidad de `localStorage`
- [x] 7.4 Subir al README las preguntas abiertas de `design.md`, en particular las 6 U.C. inferidas de TAP y la interpretación del Art. 49 sobre retiros
