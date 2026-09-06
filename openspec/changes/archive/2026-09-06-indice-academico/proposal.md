## Why

El grafo del pensum sabe cómo se conecta la carrera, pero no sabe nada del estudiante que lo mira. Las **doce compuertas por créditos** que modelamos con tanto cuidado (12, 78, 90, 100, 110, 126 U.C., 80 %, 100 %) son hoy una tabla de consulta inerte: la app puede decir que Electiva I necesita 90 U.C., pero no si tú las tienes.

En cuanto la app conozca el historial, dos cosas se vuelven posibles de golpe: el **índice académico** —el número que decide si te gradúas (≥ 5,10), si entras al Cuadro de Honor (> 6,00) o si pierdes la inscripción (< 3,60)— y la **frontera de materias disponibles**, que responde la pregunta que un estudiante trae de verdad: *«¿qué puedo inscribir el semestre que viene?»*.

El cálculo tiene que ser correcto donde más importa. El Artículo 49 de las normas hace que un estudiante que reprueba dos veces y luego saca 9 **no obtenga 9**, sino la media con su segundo intento. Un promedio casero se equivoca ahí, y se equivoca a favor del estudiante — el peor sentido posible.

## What Changes

- **Historial académico por materia** como lista de **intentos**, no como una nota suelta. El Art. 47a computa lo *cursado*, no lo aprobado: un 3 en Física II pesa igual que un 9.
- **Cálculo del índice fiel a la norma** (C-3, Cap. VII):
  - Media ponderada por unidades de crédito (Art. 47).
  - **Art. 49 — repeticiones**: el segundo intento elimina al primero; a partir del tercero se promedian todos **excepto el primero**.
  - Tres decimales de cálculo, dos de registro, con redondeo hacia arriba desde cinco milésimas (Art. 55).
- **Casos especiales con dos banderas independientes** por intento — si otorga créditos y si pesa en el índice — porque no coinciden:
  - Equivalencia o traslado: da créditos, **no** entra al índice (Art. 48).
  - Suficiencia aprobada: da créditos y entra. Suficiencia reprobada: **ninguna de las dos** (Art. 37).
  - Retiro con desincorporación: no afecta el historial. Retiro sin desincorporación: **sí** pesa (Art. 21).
- **Escala 1–9 entera** en toda la interfaz, con 5 como nota mínima aprobatoria (Art. 39). No 0–20.
- **Captura desde el panel de detalle** de cada materia: registrar intentos, su tipo y su nota.
- **Cabecera con índice acumulado y U.C. aprobadas** sobre el total de 155, con señal de color contra los umbrales normativos.
- **Las compuertas se vuelven personales**: cada materia con `gate` pasa de mostrar su umbral a mostrar cuánto te falta.
- **El grafo se colorea por estado**: aprobada, en curso, disponible, bloqueada por prelación, bloqueada por crédito. La frontera de disponibles se ilumina sola.
- **Persistencia en `localStorage`**, versionada y con migración, más **exportar e importar JSON** como red de seguridad. Sin backend.

**Fuera de alcance en este cambio:**
- Carga masiva por semestre (el control de semestre existe, pero la captura entra solo por el panel).
- Proyecciones del tipo «qué promedio necesito para llegar a 6,00».
- Índice de Eficiencia y el Índice Total del Cuadro de Honor (C-19).
- Perfiles múltiples en el mismo navegador, y cualquier sincronización entre dispositivos.

## Capabilities

### New Capabilities

- `historial-academico`: El registro del estudiante — intentos por materia, tipos de intento, estados derivados y el esquema versionado que se persiste.
- `indice-academico`: El cálculo normativo puro — nota efectiva por materia según el Art. 49, media ponderada del Art. 47, redondeo del Art. 55, unidades de crédito aprobadas y evaluación de umbrales.
- `captura-de-notas`: El registro de intentos desde el panel de detalle de cada materia, con la escala 1–9 y los tipos de intento especiales.
- `progreso-en-grafo`: Lo que el historial cambia en la escena y el cromo — estado por materia, compuertas evaluadas contra los créditos reales, frontera de materias disponibles, y la cabecera con índice y créditos.

### Modified Capabilities

- `pensum-dataset`: sin cambios de requisitos. El dataset sigue siendo estático; el historial vive aparte y nunca lo modifica.

## Impact

- **Módulos nuevos**: `src/progreso/` (modelo e índice, puros y testeables en Node) y `src/persistencia/` (capa fina de `localStorage`). Ninguna dependencia nueva.
- **Frontera preservada**: el cálculo del índice no importa React ni three.js, igual que `model/` y `layout/`. Las reglas del Art. 49 y las banderas del Art. 48 son exactamente lo que debe cubrirse con pruebas sin navegador.
- **El dataset no se toca**: `pensum.ts` sigue siendo la verdad estática del plan de estudios. El historial es una capa encima, referenciada por `id` de materia.
- **Se reutiliza `gateEnUC()`** de `data/types.ts`, que ya resuelve los umbrales por porcentaje contra las 155 U.C. de la carrera.
- **Riesgo de pérdida de datos**: `localStorage` desaparece al limpiar datos del sitio, no sincroniza entre dispositivos y no existe en ventana privada. Por eso el exportar/importar entra en el alcance aunque la captura sea solo por panel: perder una carrera entera por un clic accidental no es aceptable.
- **Deuda de datos que ahora pesa**: `TAP Tesis` y `TAP Pasantía` llevan 6 U.C. cada una **inferidas** por este proyecto. Si su escala real fuese APROBADO/REPROBADO (Art. 39, Parágrafo Único) en vez de 1–9, 12 U.C. estarían entrando mal al índice. Queda registrado como pregunta abierta.
