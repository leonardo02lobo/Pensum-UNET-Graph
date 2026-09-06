# Interfaz

## Dos vistas

| Ruta | Vista |
|---|---|
| `#/`, `#/grafo`, fragmento desconocido | Grafo orbital 3D |
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

## Componentes

| Componente | Qué hace |
|---|---|
| `Cabecera` | Índice con dos decimales (Art. 55) y la señal del umbral normativo en que cae. Avance en U.C. |
| `Buscador` | Por nombre o código, insensible a acentos y mayúsculas. Elegir un resultado enfoca la cámara. |
| `Leyenda` | Cuatro pestañas: **sectores**, **estados**, **compuertas** y **datos**. Las tres primeras filtran el grafo; la cuarta expone procedencia, discrepancias, inferencias y el respaldo. |
| `Semestres` | Aísla un anillo. El grafo completo responde «cómo se conecta la carrera»; esto responde «qué veo este semestre». |
| `Controles` | Giro automático, vista inicial y vista cenital. Sin un «volver a la vista inicial», quien orbita de más no tiene retorno. |
| `PanelDetalle` | Materia seleccionada: datos, prelaciones directas, qué desbloquea, correquisitos, compuerta y estado. Incluye el editor de intentos. |
| `EditorIntentos` | Captura de intentos en la escala del Art. 39. |
| `Respaldo` | Exportar / importar el historial en JSON. |
| `Calculadora` | Plan de evaluación por materia, validación del Art. 32, definitiva y «¿cuánto me falta?». |
| `Conversor` | Porcentaje ↔ nota por la Tabla 1 del Art. 42. |
| `PestanasVista` | Alterna grafo ↔ calculadora. |

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
