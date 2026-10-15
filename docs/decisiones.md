# Decisiones de implementación

## Íconos de sensores en canvas

Los sensores se dibujan con trazados de Canvas (`Path2D`/`arc` + líneas) en lugar de usar PNG o sprites externos. Esta decisión mantiene la vista ligera, evita dependencias de assets y permite que el estado visual del sensor (activo, alerta, offline) se genere dinámicamente a partir del estado real de la cama y del zoom actual.

## Etapa 5: motor de simulación

La lógica del simulador vive en `src/config/sim.js` y en los módulos de `src/sim`, con el objetivo de mantener los parámetros de riego, suelo, fertilizante, salud y rendimiento separados del estado de la interfaz. El motor avanza por semanas con `advanceWeek()` en `src/core/engine.js`, y el panel del mes usa `getDate()` para mantener una vista de calendario consistente. Además, el flujo de agua se calcula en orden de cama y se penaliza a la zona C cuando hay escasez, sin dejar debug temporales de caudal en la interfaz principal.
