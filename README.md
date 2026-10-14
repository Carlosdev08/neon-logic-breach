# NEON BREACH — Neon Logic Breach

Juego de lógica y descifrado con estética cyberpunk, íntegramente en español. El jugador interpreta a un ciberoperador que debe resolver puzles numéricos para superar misiones ficticias antes de que se agote el tiempo o las oportunidades.

## Concepto del juego

**NEON BREACH** es una experiencia para un jugador ambientada en una ciudad cyberpunk. Cada misión plantea un reto de lógica: deducir un código de acceso a partir de los intentos y de las pistas que devuelve el terminal.

Todo el hacking mostrado es ficción y forma parte de los puzles. La aplicación no se conecta a redes reales, no escanea sistemas y no realiza intrusiones.

## Dirección visual y experiencia de usuario

- Interfaz oscura con acentos neón cian y magenta.
- Tipografía monoespaciada y estética de terminal futurista.
- Pantalla de inicio con el título **NEON BREACH** y el botón para iniciar una misión.
- Pantalla de juego organizada para mostrar la misión, el terminal interactivo, los intentos y las pistas.
- Diseño adaptable a móviles y escritorio.
- Textos, instrucciones, mensajes y controles en español.
- Controles accesibles mediante teclado, además de los controles en pantalla.

## Mecánicas principales

- **Cinco misiones** con dificultad progresiva.
- Cada reto utiliza un código numérico de cuatro cifras.
- El jugador introduce sus intentos mediante teclado en pantalla o teclado físico.
- El terminal indica qué cifras están en la posición correcta y cuáles aparecen en el código pero están en una posición incorrecta, sin revelar directamente la solución.
- Control de intentos, tiempo, puntuación y racha.
- Pistas para ayudar a deducir el código, con penalización de puntuación.
- Envío del intento con **Enter** y borrado con **Backspace**; posibilidad de limpiar la entrada y reiniciar una misión.
- Pantalla de resultado al completar o fallar una misión, con información de rendimiento.
- Continuación a la siguiente misión y persistencia local del progreso cuando corresponda.

## Arquitectura y tecnología

- **React** para la interfaz.
- **TypeScript** para tipado y mantenimiento del código.
- **Tailwind CSS** para los estilos.
- **Vite** y **TanStack Start / TanStack Router** para el entorno de aplicación y las rutas.
- Lógica del juego separada de los componentes visuales para facilitar las pruebas.
- Gestión explícita de estados de juego: inicio, partida activa, pausa, victoria y derrota.
- Persistencia local; el juego no necesita una API ni un backend para la mecánica principal.

## Accesibilidad, calidad y pruebas

- Controles por teclado y botones con etiquetas comprensibles.
- Validación de entradas para evitar códigos incompletos o cifras repetidas cuando no estén permitidas.
- Pruebas automatizadas de la lógica, el estado de la partida, el almacenamiento y las interacciones de la interfaz.
- Formateo, lint y compilación como comprobaciones de calidad.

## Desarrollo local

Requisitos: Node.js compatible con el proyecto y npm o Bun.

```bash
bun install
bun run dev
```

Con npm también se pueden instalar las dependencias y ejecutar los scripts equivalentes definidos en `package.json`.

## Comprobaciones

```bash
bun run test
bun run lint
bun run build
```

## Estado del despliegue

El despliegue debe validarse en una URL de vista previa antes de publicarse en producción. Una compilación correcta por sí sola no garantiza que la URL esté sirviendo la aplicación adecuada; por eso también se debe comprobar la carga de la pantalla inicial y el recorrido básico de una misión.

---

Proyecto independiente de lógica y entretenimiento. No contiene funciones de hacking real, escaneo de redes ni acceso a sistemas de terceros.
