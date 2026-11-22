# Guía técnica de PyProjectCSCI

Esta guía describe el código actual que revisé en el repositorio. **Final Exam Review** tiene su propio brief. Cuando AntiGravity lo implemente, añade los archivos y decisiones que realmente se usaron.

## Qué hiciste y cómo lo puedes contar

La web toma un programa de consola en Python y lo convierte en una explicación interactiva para el equipo. Félix planteó que el equipo pudiera ver qué ocurre al elegir a un miembro, cómo se alinean las dos listas y cómo se transforma una línea del archivo. AntiGravity ayudó con la implementación. Si te preguntan por una decisión, habla de la necesidad que viste y de cómo comprobaste que la interfaz ayuda a entenderla.

> Mi equipo tenía que explicar el código, y leerlo en una sola pantalla no bastaba para seguir lo que cambiaba. Planteé un mapa del código, un simulador y trazas por pasos. Usé IA para ayudar a construir la página. Separé el programa de Python de la experiencia que lo explica, así que puedo enseñar cada paso sin depender de que todos tengan Python instalado para ver la demo.

## Cómo está armada

| Pieza | Qué hace y cómo justificarla |
|---|---|
| React y `src/App.jsx` | Organiza cada vista en componentes. Guarda la pestaña, el tema y el estado del tutor. React sirve aquí porque la pantalla cambia al elegir opciones y avanzar pasos. |
| Vite y `vite.config.js` | Levanta la página en desarrollo y genera los archivos para alojarla con `npm run build`. |
| Tailwind y `src/index.css` | Tailwind resuelve el espaciado y el diseño adaptable. Las variables de CSS mantienen los colores, sombras y estados consistentes entre temas. |
| Framer Motion y Lucide | Motion anima cambios que el alumno puede seguir. Lucide da iconos consistentes a los controles. Los textos deben seguir explicando el resultado con movimiento reducido. |
| `src/data/projectData.js` | Centraliza datos de muestra y material del proyecto. Varias vistas comparten esa información. |
| `src/data/finalExamData.js` | Define las 12 semanas del repaso de examen final, el banco fijo de 24 preguntas originales (con respuestas y explicaciones), la mezcla de Semana 8 (semanas 1–6) y el simulacro mixto de 18 preguntas. |
| `src/components/exam/FinalExamReview.jsx` | Controla la vista **Final Exam Review**: selector superior (**Weeks 1–12**, **Code Flow Lab**, **Mock Exam**), portada con progreso guardado en `localStorage` (`csci1380_final_exam_review_v1`), accesos directos a flujos de código, práctica semana por semana con scroll hacia arriba, simulacro mixto sin pistas y reintento enfocado en errores. |
| `src/components/exam/WeekInteractiveLab.jsx` | Implementa las actividades interactivas acotadas en JS para cada semana (ordenar pasos `.py`, `input()` vs `int()`, modos de archivo `r`/`w`/`a`, casos límite de `if/else`, `elif` y lógica, trazador de `for`/`while`, `break` vs `continue` y fin de ciclo, repaso 1–6, `def` vs llamada, `print` vs `return` y alcance local, listas/tuplas/sets/diccionarios y flujo Cargar → Editar → Guardar). |
| `src/data/codeFlowData.js`, `src/data/flowAudioMeta.js` y `src/components/exam/CodeFlowPlayground.jsx` | Implementan el **Code Flow Lab** independiente (fuera de la práctica semanal) con 9 temas y 19 escenarios paso a paso verificados contra `py -3`. Separa visualmente el puntero deslizante de ejecución/índice (azul con `layoutId`) de los cambios de valor en memoria (verde esmeralda con transición `antes → después`), e incluye narraciones de audio neuronales HD pre-generadas en `public/audio/flows/*.mp3` con sincronización automática de pasos y guion desplegable (cero consumo de cuota API en producción). |
| `student_club_directory.py` y `directory.txt` | Son para ejecutar el programa real en Python. Python abre y escribe el archivo de trabajo. La vista web de simulación se mueve con el estado de React y una copia de texto; no abre tu archivo de Windows. |

## Qué hace cada vista

- **Code** divide el código en partes que se pueden explicar durante la presentación. **File Parser** enseña lo que le pasa a una línea antes de llegar a las dos listas.
- **Simulator** recrea el menú y los cambios en JavaScript. Cuando el archivo visual se actualiza, cambia una variable de la web. Al simular un reinicio, se reconstruye el diagrama a partir de ese texto.
- **choose_member** muestra la diferencia entre el número que ve el usuario, que empieza en 1, y la posición de la lista, que empieza en 0. **Quiz & Script** repasa el proyecto y apoya la presentación.
- **Final Exam Review** (pestaña 1 por defecto, separada visualmente de las 5 vistas del proyecto) añade una guía de práctica para todo el grupo de CSCI 1380 (semanas 1–12). Incluye portada con inicio en un clic, selector por semana con actividades visuales interactivas (sliders de límites, diagramas de flujo, marcos Global/Local, grilla 2D de ciclos anidados, pista de `break`/`continue`, cintas de índices con puntero animado, comparador visual de archivos y explorador de estructuras) y preguntas una por una, además de un simulacro mixto de 18 preguntas sin pistas ni soluciones durante el intento y reintento de errores. Se retiró el reparto de exposición de **Project Quiz** para que cualquier compañero de clase pueda estudiar ahí.

## Decisiones de implementación en Final Exam Review

- **Separación entre vista pública y portal privado del equipo:** La ruta raíz (`/`) muestra únicamente **Final Exam Review** (semanas 1–12 y simulacro mixto) para compartir con todo el grupo sin exponer el código del proyecto del equipo; el Voice Tutor usa ahí un contexto general del curso (`scope="exam"`). Las 5 vistas del proyecto (`Code`, `File Parser`, `Simulator`, `choose_member`, `Project Quiz`) viven en un portal privado accesible en `/team` o mediante un subdominio dedicado (`team.*` / `club.*`, soportado con `vercel.json`) detrás de un PIN (`src/components/TeamAccessGate.jsx` + `api/verify-pin.js`, variable `TEAM_PIN` en Vercel con valor por defecto `1380`).
- **Protección de cuota de API:** `api/_rateLimit.js` aplica límites por IP y globales en `/api/live-token`, `/api/transcribe`, `/api/tts` y `/api/tutor`, y el cliente desconecta automáticamente WebSockets inactivos tras 90 segundos. Los laboratorios interactivos y el simulacro funcionan al 100% sin consumir API.
- **Enlace controlado con el tutor:** En el modo de práctica semanal hay un botón opcional (*Ask Tutor (Exam Practice)*) que reutiliza el flujo existente `onAskTutor` pasando un prefijo claro con la semana, el tema y el nivel de principiante, separado del proyecto del club. Durante el simulacro mixto no se muestra este botón ni pistas.
- **Persistencia local y reinicio:** El progreso se guarda en el navegador bajo la clave `csci1380_final_exam_review_v1` (respuestas de práctica, laboratorios completados, última semana y mejor puntaje del simulacro) y se borra únicamente con el botón **Reset progress** o al limpiar el almacenamiento del navegador.
- **Accesibilidad, teclado y móvil:** `src/App.jsx` actualiza los atajos a `1–6`, pero bloquea el cambio de pestaña por número cuando hay un ejercicio o simulacro activo (`data-lock-tab-keys="true"`) o un campo enfocado. `src/App.jsx` usa `<MotionConfig reducedMotion="user">` y `src/index.css` agrega `prefers-reduced-motion` y foco visible (`:focus-visible`). Los bloques de código tienen su propio scroll horizontal para que la página quepa en 375 px sin desbordamiento.
- **Verificación local:** Se comprobaron todas las salidas de ejemplo con Python 3 (`py -3`), pasó `npm run build`, y se verificaron en `http://localhost:5173/` las 6 pestañas, las 12 semanas, respuestas incorrecta/correcta, bloqueo de atajos, persistencia al recargar, simulacro sin pistas, reinicio, modo claro/oscuro y vista móvil `375×812` sin errores de consola.

## Cómo funciona el tutor

El componente `src/components/VoiceTutorDrawer.jsx` recibe preguntas de texto y puede pedir permiso de micrófono. El camino por servidor usa `/api/tutor` para responder, `/api/transcribe` para pasar audio a texto y `/api/tts` para generar voz. El modo Live tiene otra ruta. Pide un token temporal mediante `/api/live-token` y abre una conversación por WebSocket con Gemini. Las utilidades de audio convierten y reproducen datos que el navegador puede usar. El tutor trae instrucciones específicas del proyecto. La navegación del repaso y la calificación de preguntas tienen que funcionar por sí solas.

Vercel es la ruta de despliegue documentada para esos endpoints. El servidor lee `GEMINI_API_KEY`. Hay un atajo de desarrollo con `VITE_GEMINI_API_KEY` o clave ingresada en el navegador. Las variables `VITE_…` pueden quedar visibles en el cliente. Para compartir la web, usa la clave del servidor y evita el atajo del cliente. No se verificó aquí el despliegue ni el micrófono en producción.

## Por qué estas decisiones ayudan

- El menú interactivo deja aprender al cambiar un dato y ver el efecto de inmediato. Las animaciones tienen valor cuando dejan seguir un índice o una variable.
- Separar el proyecto y el examen evita que las preguntas de todo el curso se mezclen con la exposición del directorio. Una práctica clara da una respuesta comprobable incluso si el tutor no está disponible.
- Puedes demostrar la diferencia entre **leer código**, **simularlo en el navegador** y **ejecutarlo con Python**. Si te preguntan cómo probaste un ejemplo, muestra la salida que esperabas y compárala con la de Python.
