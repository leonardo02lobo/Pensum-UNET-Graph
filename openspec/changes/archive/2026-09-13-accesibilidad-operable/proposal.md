## Why

Esta aplicación documentó su modelo de teclado en una tabla. `useTeclado` camina el grafo **por sus propias aristas** —`←` a la primera prelación, `→` a lo primero que se desbloquea, `↑↓` entre hermanas—, no secuestra la escritura mientras el foco está en un campo, y se apaga en la calculadora donde estorbaría. Es un trabajo deliberado y poco común.

Fuera del lienzo, nada de eso se sostiene:

```
  grep -E "focus:|focus-visible" src   →  7 coincidencias
                                          las 7 son focus:border en <input>

  ~40 elementos <button>               →  0 con indicador de foco propio
```

Tabular por la leyenda, por la barra de semestres, por el selector de nueve notas o por los enlaces de prelación del panel es navegar a ciegas. Y el camino más rápido de toda la app —escribir en el buscador y elegir un resultado— **obliga a soltar el teclado**: los ocho resultados solo se pueden clicar, no hay atajo para enfocar el campo y las flechas no los recorren.

Hay dos huecos más del mismo tipo:

- `grep -rn "reduced-motion" src` → **0**. La escena tiene rotación automática, transiciones de cámara y bloom, y no consulta la preferencia del sistema.
- El grafo es un `<canvas>` WebGL. Para un lector de pantalla **no existe**: ni la escena, ni las 58 materias, ni el cambio de selección al pulsar una flecha.

No es una auditoría de cumplimiento. Es que la app ya decidió ser operable con teclado y lo cumple solo dentro del lienzo.

## What Changes

- **Indicador de foco visible en todo control interactivo**, definido una sola vez y en contraste suficiente sobre el fondo casi negro de la aplicación. Se usa el foco visible del navegador, de modo que aparezca al tabular y no al hacer clic.
- **El buscador se opera sin soltar el teclado:**
  - Un atajo enfoca el campo desde cualquier parte de la vista grafo.
  - `↓` `↑` recorren los resultados, `Enter` elige, `Esc` cierra la lista antes de limpiar la selección.
  - La lista de resultados se anuncia como tal, con el resultado activo señalado.
- **La escena 3D deja de ser un agujero semántico.** El lienzo pasa a ser un elemento enfocable con nombre y descripción, y los cambios de selección —por clic, por flecha o por búsqueda— se anuncian sin robar el foco.
- **`prefers-reduced-motion` se respeta:** con la preferencia activa, la rotación automática no arranca sola, las transiciones de cámara se acortan a un salto y las transiciones del cromo se desactivan. El usuario conserva la posibilidad de activar la rotación a mano.
- **El estado no se comunica solo por color.** Los cinco estados de materia y las señales de umbral del índice ya tienen texto en el panel y en la leyenda; se cierra el hueco donde hoy solo hay un punto de color.
- **`Esc` se documenta en pantalla**, no solo en `docs/`.

**Fuera de alcance en este cambio:**
- Reescribir la escena 3D para que sea navegable por lector de pantalla nodo a nodo. El equivalente textual del pensum es la lista de `plan-de-inscripcion`; aquí solo se garantiza que el lienzo se anuncie y que la selección se comunique.
- Traducciones y dirección de escritura.
- Auditoría formal contra un nivel de conformidad, con su informe.
- Rediseño de la paleta. Los contrastes de texto se revisan y se corrigen donde fallen, pero los nueve colores de sector son un sistema de identificación ya decidido.
- El reflujo del cromo y el tamaño de los objetivos táctiles: eso es `cromo-adaptable`.

## Capabilities

### New Capabilities

- `accesibilidad-operable`: El foco visible como regla única, el respeto a la preferencia de movimiento reducido, el equivalente semántico del lienzo 3D y la regla de que ningún estado se comunique solo por color.

### Modified Capabilities

- `graph-navigation`: la navegación con teclado se extiende al buscador —atajo de enfoque, recorrido de resultados y elección— y los controles de cámara respetan la preferencia de movimiento reducido.
- `graph-interaction`: la búsqueda pasa a ser operable por completo con teclado, y el cambio de selección se anuncia a las tecnologías de asistencia.

## Impact

- **Una regla de foco global** en `src/index.css`, junto a los tokens. Es el sitio donde ya vive la definición única de cada color, y el foco es exactamente el mismo tipo de decisión: una definición, muchos consumidores.
- **Un token de color nuevo** para el anillo de foco. Debe contrastar contra `--color-void` (#05060a) y contra `--color-void-soft` (#0b0e17), que es el fondo de todas las islas.
- **`Buscador.tsx` gana estado de índice activo** y manejo de teclas propio. Es el componente que más crece.
- **`useTeclado.ts` gana el atajo de enfoque del buscador.** Su regla de no capturar el teclado mientras el foco está en un campo editable ya está escrita y hay que preservarla: el atajo no puede dispararse mientras se escribe.
- **La rotación automática y las órdenes de cámara** (`OrdenCamara`, con sus tipos `inicial`, `cenital` y `enfocar`) pasan a consultar la preferencia de movimiento. La preferencia puede cambiar en caliente, así que se observa, no se lee una vez.
- **Riesgo de anunciar demasiado.** Con navegación por flechas, cada pulsación cambia la selección; anunciar cada una convierte el recorrido de una cadena de prelaciones en un torrente. El anuncio tiene que ser educado.
- **Riesgo de atajo robado.** Un atajo de una sola tecla compite con la escritura y con los atajos del navegador. Hay que elegirlo de modo que no interfiera ni con el buscador ni con el editor de intentos.
- **Sin dependencias nuevas.** Todo se resuelve con atributos de HTML, `matchMedia` y CSS.
