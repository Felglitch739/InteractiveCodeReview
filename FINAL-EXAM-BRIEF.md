# Final Exam Review para AntiGravity

Implementa una sección **Final Exam Review** en el proyecto PyProjectCSCI. Su propósito es practicar lo que vimos en Intro to Python (CSCI 1380), además de la guía interactiva del Student Club Member Directory. La fuente del alcance son los resúmenes de [Weekly Material](https://brightspace.utrgv.edu/d2l/le/lessons/89532/units/2687535). Usamos las páginas de las semanas 1 a 12 y sus listas de temas. Las diapositivas, las grabaciones, el contenido de los labs y el de los homeworks quedan fuera de esta revisión. Esto es una guía de práctica y no establece qué aparecerá en el final.

## Temario y ejercicio propuesto

| Semana | Qué dice Weekly Material | Ejercicio nuevo para la web |
|---|---|---|
| [1](https://brightspace.utrgv.edu/d2l/le/lessons/89532/lessons/2687547) | Qué es programar, dónde entra Python e instalar y ejecutar programas. | Ordenar los pasos para guardar y ejecutar un archivo .py. |
| [2](https://brightspace.utrgv.edu/d2l/le/lessons/89532/lessons/2687548) | Variables, entrada y salida, tipos y conversiones. | Predecir qué pasa con `input()` antes y después de convertir con `int()`. |
| [3](https://brightspace.utrgv.edu/d2l/le/lessons/89532/lessons/2687549) | Abrir, cerrar, leer y escribir archivos. Modos `r`, `w` y `a`. | Elegir un modo y ver el contenido simulado del archivo antes y después. |
| [4](https://brightspace.utrgv.edu/d2l/le/lessons/89532/lessons/2687550) | Expresiones booleanas, `if` y `if/else`. | Cambiar un valor y seguir qué rama se ejecuta, incluyendo un caso límite. |
| [5](https://brightspace.utrgv.edu/d2l/le/lessons/89532/lessons/2687551) | `elif`, condicionales anidados y operadores lógicos. | Elegir qué condición se evalúa y qué rama corre en una clasificación. |
| [6](https://brightspace.utrgv.edu/d2l/le/lessons/89532/lessons/2687552) | `for`, `while` y recorrer listas. | Avanzar un ciclo por pasos y ver el índice, el valor y la salida. |
| [7](https://brightspace.utrgv.edu/d2l/le/lessons/89532/lessons/2687578) | Ciclos anidados, `break`, `continue` y evitar ciclos infinitos. | Comparar la salida de dos variantes. Identificar la condición o actualización que hace terminar el ciclo. |
| [8](https://brightspace.utrgv.edu/d2l/le/lessons/89532/lessons/2687579) | Repaso y midterm. La página indica cobertura de semanas 1–6. | Repaso mixto opcional de semanas 1–6, reutilizando ejercicios. No añadir un tema nuevo. |
| [9](https://brightspace.utrgv.edu/d2l/le/lessons/89532/lessons/2687580) | Funciones predefinidas y propias. Definir y llamar funciones. | Distinguir `def` de la llamada y elegir cuándo aparece la salida. |
| [10](https://brightspace.utrgv.edu/d2l/le/lessons/89532/lessons/2687581) | Funciones con y sin valor de retorno, `return`, alcance y parámetros. | Comparar `print` con `return` y seguir una variable local al llamar la función. |
| [11](https://brightspace.utrgv.edu/d2l/le/lessons/89532/lessons/2687582) | Listas, tuplas, sets y diccionarios. Acceder y modificar datos. Estructuras anidadas. | Elegir la estructura según el problema y seguir acceso por índice/clave, duplicados y un dato anidado. Evitar depender del orden de un set. |
| [12](https://brightspace.utrgv.edu/d2l/le/lessons/89532/lessons/2687583) | Integrar funciones, datos y archivos. Diseñar y dividir un programa en módulos. | Ordenar cargar → editar → guardar y explicar qué función recibe y devuelve cada cosa. Relacionarlo con el proyecto. |

## Experiencia propuesta

- Agrega **Final Exam Review** como entrada visible en la navegación de `src/App.jsx`. La primera pantalla debe decir qué se practica y permitir empezar con un clic. Interior con selector por semana, un ejercicio a la vez y progreso visible. Usa los rótulos existentes en inglés y explicaciones breves en inglés sencillo. Si cambias el selector numérico, actualiza el texto del pie y protege el ejercicio contra cambios de pestaña al contestar.
- Para cada tema usa una muestra corta, una interacción con propósito y una explicación del resultado. Usa predecir salida, elegir rama, rastrear valores o ver un archivo simulado. Incluye al menos una actividad por cada semana con temas y cubre todos los subtemas de la tabla en el banco. Los ejemplos y preguntas deben ser originales. Las llamadas `replace()` y `split()` pertenecen al recorrido del proyecto y solo se mencionan como ampliación si se enlazan.
- Incluye un simulacro mixto con resultados y revisión de respuestas. Las preguntas se validan con respuestas y explicaciones fijas. El simulacro no muestra las soluciones ni abre pistas durante el intento. Permite volver a practicar los errores. Guarda progreso en este navegador con una clave específica y explica cuándo se reinicia.
- Reusa los tokens de `src/index.css`, React, Tailwind y los componentes existentes cuando convenga. Asegura que el texto y el código se lean en claro y oscuro. Da espacio a la pregunta y al resultado. En móvil el código puede tener su propio scroll horizontal, la página completa debe caber. Usa botones semánticos, foco visible, navegación por teclado, feedback textual y movimiento reducido. Comprueba estados inicial, incorrecto, correcto, completado y reinicio.
- Usa trazas predefinidas o simulaciones acotadas en JS. Evita ejecutar texto escrito por el usuario. El repaso funciona sin Gemini, cuenta ni micrófono. Si agregas el botón de tutor en práctica, pasa tema, semana y nivel de principiante por el flujo de pregunta existente y distingue la práctica del tutor del proyecto. Si no cabe sin cambiar el tutor, déjalo como seguimiento. En el simulado no lo abras como pista.
- Mantén el trabajo en el repo que ya existe. No leas archivos de credenciales ni agregues claves al cliente, dependencias innecesarias o acceso a Brightspace. Conserva las vistas del proyecto. Entrega local, sin publicar ni hacer push.

## Qué revisar antes de darlo por terminado

Corre `npm run build`. Prueba una respuesta incorrecta y una correcta, navegación de teclado y móvil, modo claro/oscuro, reinicio, progreso al recargar y acceso a las cinco vistas actuales. Verifica que cada semana de la tabla aparezca y que las salidas de los ejemplos coincidan con Python. Actualiza la guía técnica con los archivos reales y decisiones de la sección nueva después de implementarla.
