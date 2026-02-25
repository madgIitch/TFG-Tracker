# Prompts de evaluación de sprints — TFG Tracker

Colección de prompts para pedir a Claude que evalúe métricas de un sprint finalizado a partir del código/diff.

---

## PROMPT 1 — D3 + D6 (coherencia arquitectural y consistencia de estilos)

> Actúa como evaluador técnico de un TFG de ingeniería software. Voy a mostrarte el código/diff de un sprint y necesito que me puntúes dos métricas de 1 a 5 de forma razonada y objetiva. Evalúa EXCLUSIVAMENTE estas dos métricas:
>
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> D3 — Coherencia arquitectural (architecturalCoherence)
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> Definición: ¿el código generado respeta la estructura de carpetas, los imports, el naming y los patrones arquitectónicos del proyecto al editar varios archivos?
>
> Escala:
> 1 — Incoherente: rompe la estructura, mezcla patrones, imports incorrectos
> 2 — Bajo: varias desviaciones claras respecto al resto del proyecto
> 3 — Aceptable: sigue la arquitectura en general con alguna excepción
> 4 — Bueno: coherente con el proyecto, mínimas desviaciones menores
> 5 — Excelente: perfectamente alineado con la arquitectura existente en todos los archivos
>
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> D6 — Consistencia de estilos (styleConsistency) → Subdimensión: Naming, estructura de archivos y patrones de código
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> Definición: ¿el código del sprint sigue las mismas convenciones de naming (variables, funciones, componentes), estructura de archivos y patrones de código (hooks, utils, tipos, etc.) que el resto del proyecto?
>
> Escala:
> 1 — Muy inconsistente: naming y estructura dispares con el resto del código
> 2 — Inconsistente: varias desviaciones notables de convenciones
> 3 — Aceptable: sigue las convenciones en general, alguna excepción
> 4 — Consistente: estilo uniforme con pocas excepciones menores
> 5 — Muy consistente: naming, estructura y patrones perfectamente uniformes

**Uso:** Proporcionar antes el listado de ficheros modificados (A/M/D) y el código de los ficheros clave nuevos o modificados del sprint, junto con 2-3 ficheros pre-existentes de referencia para que tenga baseline.

---

## PROMPT 2 — uiUxQuality (calidad visual y usabilidad)

> Actúa como evaluador técnico de un TFG de ingeniería software. A partir de las capturas de pantalla y/o el código de las pantallas nuevas o modificadas en este sprint, puntúa la siguiente métrica de 1 a 5 de forma razonada y objetiva:
>
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> uiUxQuality — Calidad UI/UX
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> Definición: resultado visual y usabilidad de las pantallas entregadas en el sprint. ¿La UI es coherente con el design system del proyecto, es usable y visualmente cuidada?
>
> Escala:
> 1 — Muy deficiente: layout inutilizable, sin coherencia visual
> 2 — Deficiente: problemas visuales visibles, usabilidad comprometida
> 3 — Aceptable: funcional pero con inconsistencias o falta de pulido
> 4 — Buena: coherente con el design system, usable y visualmente correcta
> 5 — Excelente: UI pulida, microinteracciones, feedback al usuario, perfectamente integrada

**Uso:** Proporcionar capturas de pantalla de las pantallas nuevas y/o el código JSX/TSX de las screens añadidas en el sprint. Si las capturas no están disponibles, evaluar desde el código.

---

## PROMPT COMBINADO — D3 + D6 + uiUxQuality en un solo paso

> Actúa como evaluador técnico de un TFG de ingeniería software. Voy a mostrarte el código/diff de un sprint y necesito que me puntúes tres métricas de 1 a 5 de forma razonada y objetiva.
>
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> D3 — Coherencia arquitectural (architecturalCoherence)
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ¿El código respeta estructura de carpetas, imports, naming y patrones del proyecto al editar varios archivos?
> 1 Incoherente · 2 Bajo · 3 Aceptable · 4 Bueno · 5 Excelente
>
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> D6 — Consistencia de estilos (styleConsistency)
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ¿Sigue las mismas convenciones de naming, estructura de archivos y patrones de código que el resto del proyecto?
> 1 Muy inconsistente · 2 Inconsistente · 3 Aceptable · 4 Consistente · 5 Muy consistente
>
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> uiUxQuality — Calidad UI/UX
> ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
> ¿La UI es coherente con el design system del proyecto, es usable y visualmente cuidada?
> 1 Muy deficiente · 2 Deficiente · 3 Aceptable · 4 Buena · 5 Excelente
>
> Para cada métrica: indica la puntuación, los argumentos que la justifican (evidencias concretas del código/capturas) y las desviaciones detectadas.

---

## Notas de uso

- Proporcionar siempre **ficheros de referencia pre-existentes** (2-3 screens o services del sprint anterior) para que el evaluador tenga baseline de comparación.
- Incluir el **listado de ficheros modificados** con su estado (A=añadido, M=modificado, D=eliminado).
- Para uiUxQuality, si existen capturas en `capturas/actual/`, adjuntarlas. Si no, indicarlo explícitamente para que evalúe desde el código.
- Estos prompts están diseñados para evaluar **un escenario a la vez** o **dos en paralelo** para comparación directa.
