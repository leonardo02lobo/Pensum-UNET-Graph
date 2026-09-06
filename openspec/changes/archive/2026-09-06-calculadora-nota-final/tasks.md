## 1. Tabla de conversión del Artículo 42

- [x] 1.1 Transcribir en `src/data/tablaConversion.ts` los 81 umbrales de la tabla (nota → porcentaje mínimo), tal como están en `design.md` D1, con la referencia UE19 y el enlace a la tabla oficial
- [x] 1.2 Implementar `notaDePorcentaje(pct)` reconstruyendo la tabla desde los umbrales, con saturación en 1,0 por debajo de 7 y en 9,0 desde 95
- [x] 1.3 Implementar `porcentajeMinimoDeNota(nota)` para responder «qué porcentaje necesito»
- [x] 1.4 Implementar `notaDePuntaje(obtenido, maximo)` pasando por el valor porcentual (Art. 42), rechazando máximo no positivo y obtenido mayor que el máximo
- [x] 1.5 Escribir las pruebas de la tabla: cobertura completa de 0 a 100 sin huecos, las 81 notas de la escala, las ocho notas de doble porcentaje, la frontera 48·49·50·51·52, ida y vuelta para las 81 notas, y que el ajuste lineal falla en más de un tercio de las celdas

## 2. Plan de evaluación y validaciones

- [x] 2.1 Definir en `src/evaluacion/plan.ts` los tipos `Parcial` y `PlanEvaluacion`, con ponderación, calificación opcional y condición NP
- [x] 2.2 Implementar la validación de calificación de parcial: de 1,0 a 9,0 en décimas (Art. 40), y la exclusión mutua entre NP y calificación
- [x] 2.3 Implementar `sumaDePonderaciones(plan)` informando el faltante o el exceso respecto a 100
- [x] 2.4 Implementar `reglaArticulo32(uc)` devolviendo número de parciales, rango de ponderación y literal aplicable, con el caso de 0 U.C. como «no aplica»
- [x] 2.5 Implementar `validarArticulo32(plan, uc)` devolviendo la lista de discrepancias, cada una con su literal citado y el parcial concreto cuando corresponda — siempre como aviso, nunca como bloqueo (D5)
- [x] 2.6 Implementar `planSugerido(uc)` con el número normativo de parciales y las ponderaciones repartidas por igual
- [x] 2.7 Escribir las pruebas de validación: los tres literales, materia de 4 U.C. con 3 parciales, ponderación fuera de rango, plan conforme sin avisos, y materia de 0 U.C.

## 3. Cálculo de la definitiva

- [x] 3.1 Implementar `aportePonderado(parcial)` como calificación × ponderación aproximado a dos decimales (Art. 40, D4), con NP aportando cero
- [x] 3.2 Implementar `acumulado(plan)` sumando los aportes de los parciales evaluados
- [x] 3.3 Implementar `definitiva(plan)` con el redondeo desde cincuenta centésimas (Art. 41) y el acotado a la escala 1–9 (Art. 39), que absorbe el caso de todas NP (D3)
- [x] 3.4 Devolver `null` como definitiva cuando las ponderaciones no sumen 100, en vez de normalizarlas (D6)
- [x] 3.5 Implementar `necesarioPara(plan, objetivo)` contra el umbral `objetivo − 0,50` (D2), redondeando el resultado hacia arriba a la décima
- [x] 3.6 Implementar los tres desenlaces: ya asegurada, en juego, ya no alcanza
- [x] 3.7 Implementar `rangoAlcanzable(plan)` con la definitiva mínima y máxima todavía posibles
- [x] 3.8 Implementar `tablaDeObjetivos(plan)` con lo necesario para cada calificación de 5 a 9, marcando las inalcanzables
- [x] 3.9 Escribir las pruebas del cálculo: el ejemplo 30/30/40 con 6,0·7,5·5,0 que da 6, la frontera 4,50 contra 4,49, el redondeo del necesario de 6,23 a 6,3, un NP que consume su peso, todas NP dando 1, y el plan incompleto sin definitiva

## 4. Enrutado por hash

- [x] 4.1 Implementar `useVista()` en `src/ui/`: lee el fragmento de la URL, escucha `hashchange` y expone la vista actual con su cambiador (D8)
- [x] 4.2 Tratar el fragmento desconocido como el grafo, sin error
- [x] 4.3 Añadir la conmutación de pestañas visible en ambas vistas

## 5. La pestaña

- [x] 5.1 Construir el selector de materia reutilizando la búsqueda existente, mostrando U.C. y la regla del Artículo 32 aplicable
- [x] 5.2 Construir la tabla de parciales: añadir, editar, eliminar, ponderación, calificación 1,0–9,0 y marca de NP
- [x] 5.3 Mostrar siempre la suma de ponderaciones, para que un plan incompleto se note sin buscarlo
- [x] 5.4 Mostrar los avisos del Artículo 32 citando el literal, señalando el parcial concreto cuando aplique
- [x] 5.5 Construir el panel de resultados: acumulado, definitiva o proyección, rango alcanzable y los tres desenlaces bien diferenciados
- [x] 5.6 Construir la tabla de objetivos del 5 al 9 con las calificaciones inalcanzables marcadas
- [x] 5.7 Construir el conversor: puntaje sobre máximo, porcentaje → nota y nota → porcentaje mínimo
- [x] 5.8 Mantener el plan en memoria indexado por materia durante la sesión, sin persistirlo (D7)
- [x] 5.9 Indicar que el resultado proviene de aplicar la norma al plan declarado y no sustituye a Control de Estudios

## 6. Cierre del circuito con el índice

- [x] 6.1 Ofrecer registrar la definitiva como intento regular de esa materia, solo cuando esté determinada
- [x] 6.2 Advertir antes de registrar si la materia ya tiene intentos, para distinguir corregir de repetir
- [x] 6.3 Verificar que al registrar se recalculan índice, unidades de crédito, compuertas y estado en el grafo

## 8. Captura en la escala de 0 a 100

- [x] 8.1 Añadir `puntos` al `Parcial` como escala del Art. 31, con `nota` siempre como su conversión por la Tabla 1, y `parcialDesdePuntos()`
- [x] 8.2 Validar los puntos: rango de 0 a 100 y correspondencia con la calificación declarada
- [x] 8.3 Conmutador por parcial entre las dos escalas, conservando el valor al cambiar
- [x] 8.4 Mostrar la calificación equivalente junto al aporte cuando el parcial se capture en puntos
- [x] 8.5 Escribir las pruebas: conversión de 78 a 7,4, el aporte sobre la convertida, la frontera 50/51, puntos fuera de rango y puntos que no concuerdan con la nota

## 9. Confirmación al registrar

- [x] 9.1 Recordar en la sesión qué definitiva se registró por materia
- [x] 9.2 Bloquear el botón y confirmar con un mensaje tras registrar, para que un doble clic no duplique el intento
- [x] 9.3 Volver a habilitarlo si la definitiva cambia

## 7. Cierre

- [x] 7.1 Verificar los escenarios de las cuatro specs contra la aplicación corriendo
- [x] 7.2 Documentar en el README la cadena completa de la norma con sus artículos, la frontera del 4,50 y por qué la tabla es dato y no fórmula
- [x] 7.3 Subir al README las preguntas abiertas de `design.md`, en particular la interpretación del Artículo 40 sobre dónde se aproxima a dos decimales
