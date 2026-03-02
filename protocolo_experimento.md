# Protocolo del Experimento Comparativo — Escenarios A–E

**Proyecto:** Análisis comparativo de duplas IA–IDE en desarrollo móvil
**Caso práctico:** Replicación de las características avanzadas post-v0 de HomiMatchApp (Sprints 7–23)
**Fecha de creación:** 5 febrero 2026
**Última actualización:** 2 marzo 2026

---

## 1. Objetivo

Comparar cinco duplas modelo–entorno (Escenarios A–E) replicando el tramo funcional de los Sprints 7–23 del proyecto (características avanzadas post-v0, commits #32–#155), manteniendo constantes requisitos, arquitectura y desarrollador. Cada escenario parte del mismo punto de partida (v0 completado) y debe implementar las 17 funcionalidades descritas en los sprints. La evaluación se rige por las seis dimensiones del marco definido en el capítulo de materias relacionadas.

---

## 2. Escenarios evaluados

| ID | Dupla IA–IDE | Modelo | Entorno | Rol | Prioridad |
|----|-------------|--------|---------|-----|-----------|
| **A** | Codex (+Claude Code) en VS Code | GPT-4 / Claude Sonnet | Visual Studio Code | Baseline | Alta |
| **B** | Gemini Code Assist en VS Code | Gemini 2.0 Pro | Visual Studio Code | Replicación (best-effort) | Baja |
| **C** | Codex en Windsurf | GPT-4o (Codex) | Windsurf | Replicación | Alta |
| **D** | Gemini en Antigravity | Gemini 2.0 Pro | Antigravity | Replicación | Alta |
| **E** | Claude Code en VS Code | Claude Sonnet | Visual Studio Code | Replicación prioritaria | Alta |

### Notas sobre cambios respecto a la versión inicial del protocolo

**Escenario C — Cursor → Windsurf:**
Cursor fue sustituido por Windsurf. Ambos son forks de Visual Studio Code orientados a programación mediante agentes de IA, comparten la misma arquitectura de indexación de repositorio y el mismo flujo de trabajo (prompt de feature/contexto → plan de implementación propuesto por la IA → aprobación humana → implementación). Las diferencias relevantes son la política de modelos disponibles (Windsurf no impone restricciones en la elección de modelo, Cursor sí) y el precio/cuota de tokens. A efectos experimentales ambos representan la misma categoría de dupla.

**Escenario B — Best-effort:**
Debido a las limitaciones intrínsecas de Gemini como modelo (gestión de la ventana de contexto, tendencia a la alucinación en tareas largas), el escenario B en VS Code nativo resulta el más difícil de avanzar. Se mantiene en el experimento con prioridad baja: su valor principal es documentar empíricamente las debilidades del modelo sin asistencia de un IDE agentico, que sirven de contraste con el Escenario D (mismo modelo, con Antigravity).

**Escenario E — Incorporación:**
Se añade Claude Code en VS Code como quinto escenario. La justificación es doble: (1) es la opción más cercana a un IDE agentico dentro del ecosistema VS Code nativo —mayor autonomía que Codex, propone planes de implementación en tareas complejas y accede al contexto de forma más eficiente—; (2) permite comparar directamente el efecto del IDE (VS Code nativo vs. Windsurf/Antigravity) manteniendo como referencia un modelo de alto rendimiento (Claude Sonnet). Los Escenarios A, C, D y E tienen prioridad alta; B avanza en paralelo en la medida en que el tiempo lo permite.

---

## 3. Condiciones controladas

### 3.1 Factores constantes
- **Desarrollador**: Pepe Ortiz Roldán (mismo para los 5 escenarios).
- **Punto de partida**: v0 del proyecto ya completada (Sprints 0–6: autenticación, navegación, perfiles, matching, habitaciones, filtros, UI glassmorphism). Todos los escenarios arrancan desde el mismo código base v0.
- **Requisitos funcionales**: Sprints 7–23 — características avanzadas post-v0 (gastos compartidos, correcciones UI/UX, refactorización, recuperación de contraseñas, mejoras UI detalle, invitaciones, push notifications, chats en tiempo real, UI fix global, swipe porcentual, hotfixes, filtros mejorados + Google Auth, realtime + estilos de vida, dark mode, premium features, dark mode refinamiento, ciudades y zonas).
- **Stack**: React Native + Expo + TypeScript + Supabase (PostgreSQL, Auth, Storage).
- **Arquitectura**: Estructura de carpetas y patrones idénticos.
- **Esquema de BD**: Mismo esquema PostgreSQL en Supabase.
- **Suite de aceptación**: Misma checklist de aceptación por feature + suite mínima de tests unitarios.

### 3.2 Factor variable
- **Dupla IA–IDE**: Cada escenario utiliza exclusivamente su dupla asignada.
  - No se permite mezclar herramientas durante un escenario.
  - Si la IA falla, se resuelve manualmente; no se recurre a otra IA.
  - Se permite consultar documentación oficial (React Native, Supabase, etc.) pero no otras IAs.

---

## 4. Dimensiones y métricas (alineadas con el marco del TFG)

Las seis dimensiones del marco se operativizan mediante las fuentes de datos primarias (Git, CI local) y las métricas derivadas descritas a continuación.

### 4.1 Fuentes de datos primarias

| Fuente | Qué se recoge | Cuándo |
|--------|---------------|--------|
| **Git** | Commits por sprint, diffs, ficheros tocados | Script automático al cierre de cada sprint |
| **CI local / containers** | Ejecuciones de tests (Jest/RTL) por commit, proporción pass/fail | Tras cada commit |

### 4.2 Métricas derivadas

| Métrica | Definición | Fuente |
|---------|-----------|--------|
| **TTS del sprint** | t_fin − t_inicio (cronómetro de trabajo efectivo, no calendario) | Registro manual + timestamps de commits |
| **Iteraciones** | Número de commits hasta cerrar el sprint | Git log |
| **Verificación** | Tiempo dedicado a ejecutar tests y depurar fallos | Registro manual |
| **Intervención humana** | Ediciones manuales + prompts correctivos + propuestas rechazadas | Registro manual |

### 4.3 Operativización por dimensión

#### D1 — Contexto efectivo
Qué parte del repositorio usa realmente la herramienta. Se desglosa en dos sub-métricas complementarias:

| Indicador | Cómo se mide |
|-----------|-------------|
| **D1a** — Operaciones de lectura de ficheros | Logs de la herramienta / observación directa. Ratio = lecturas / total ficheros repo. Nota: puede ser >1 en IDEs con recuperación activa (relecturas). |
| **D1b** — Coherencia contextual percibida | Escala 1–5: ¿la IA demostró entender el contexto del proyecto sin que se le indicara explícitamente? (1 = nula, 3 = parcial, 5 = total). Permite comparación homogénea entre escenarios independientemente del mecanismo de retrieval. |
| Mecanismo de retrieval | Documentar: indexado, RAG, adjuntos manuales, context window, mixto |

**Nota metodológica:** El ratio D1a no es directamente comparable entre escenarios porque depende del mecanismo de retrieval: los IDEs con indexación vectorial (Windsurf, Antigravity) no generan lecturas explícitas rastreables, mientras que VS Code nativo sí. D1b es la métrica principal de comparación cruzada.

#### D2 — Autonomía vs. control
Grado de agencia del modelo y frecuencia de puntos de control.

| Indicador | Cómo se mide |
|-----------|-------------|
| Acciones autónomas por sprint | Contar ejecuciones de terminal, ediciones, y planes sin aprobación previa |
| Puntos de control (review/approval) | Contar veces que el desarrollador revisa/aprueba antes de que se aplique un cambio |
| Ratio autonomía | Acciones autónomas / (autónomas + controladas) |

#### D3 — Edición multiarchivo y coherencia
Capacidad de modificar varios ficheros manteniendo coherencia arquitectónica.

| Indicador | Cómo se mide |
|-----------|-------------|
| Archivos modificados por sprint | `git diff --stat` por sprint |
| Tamaño medio de diffs (líneas añadidas + eliminadas) | `git diff --shortstat` |
| Coherencia arquitectónica | Valoración 1–5: ¿respeta patrones, imports, naming del proyecto? |

#### D4 — Éxito operacional
Tasa de builds exitosos y fallos de entorno.

| Indicador | Cómo se mide |
|-----------|-------------|
| Builds exitosos / builds totales | Registro de `expo start`, `tsc --noEmit` |
| Fallos de entorno | Errores no atribuibles al código (dependencias rotas, configs, permisos) |
| Tests pass / tests totales por commit | CI local (Jest) |

#### D5 — Eficiencia total
TTS + iteraciones + retrabajo.

| Indicador | Cómo se mide |
|-----------|-------------|
| TTS acumulado del escenario | Suma de TTS de todos los sprints |
| Iteraciones totales (commits) | `git log --oneline --no-merges \| wc -l` |
| Retrabajo | Commits dedicados a corregir propuestas de la IA incompatibles con la arquitectura |

#### D6 — Calidad mantenible
Warnings estáticos + consistencia de estilos.

| Indicador | Cómo se mide |
|-----------|-------------|
| TypeScript warnings | `tsc --noEmit` al cierre del sprint |
| Linter warnings | `eslint src/ --format json` al cierre del sprint |
| Consistencia de estilos | Valoración 1–5: ¿naming, estructura de archivos, patrones uniformes? |

---

## 5. Diseño de tests y aceptación

Se mantiene una **suite mínima de tests unitarios** (Jest / React Testing Library) y se complementa con una **checklist de aceptación por feature** que se verifica al cerrar cada sprint.

### Checklist de aceptación por sprint

- [ ] **Sprint 7**: Sistema de gestión de gastos compartidos (FlatExpensesScreen, liquidaciones, cálculo automático de deudas)
- [ ] **Sprint 8**: Correcciones UI/UX (fixes en Login, Register, ProfileDetail, SwipeScreen)
- [ ] **Sprint 9**: Refactorización v1 (separación de estilos en *.styles.ts, tokenización de colores/spacing/fonts)
- [ ] **Sprint 10**: Recuperación de contraseñas (ForgotPassword, ResetPassword, deep linking desde email)
- [ ] **Sprint 11**: Mejoras UI de detalles (rediseño ProfileDetail, RoomDetail, tema global)
- [ ] **Sprint 12**: Sistema de invitaciones (Phase4Invitation, códigos de invitación, matches automáticos entre roommates)
- [ ] **Sprint 13**: Push notifications (Firebase Cloud Messaging, deep linking, notificaciones por tipo)
- [ ] **Sprint 14**: Chats en tiempo real (Supabase Realtime, autoscroll, orden por último mensaje, UI glass chat)
- [ ] **Sprint 15**: UI fix global (autoscroll en inputs con teclado, fixes en todas las pantallas, porcentajes de compatibilidad)
- [ ] **Sprint 16**: Swipe porcentual (cálculo de compatibilidad, SwipeScreenV2, mejoras en algoritmo de recomendaciones)
- [ ] **Sprint 17**: Hotfixes (correcciones urgentes de errores críticos)
- [ ] **Sprint 18**: Filtros mejorados + Google Auth (actualización de filtros, lógica premium inicial, MainNavigator anclado)
- [ ] **Sprint 19**: Realtime y estilos de vida (subscripción realtime en todas las pantallas, campo estilos de vida, inicio dark mode)
- [ ] **Sprint 20**: Dark mode (sistema de temas claro/oscuro completo, persistencia de preferencia, transiciones suaves)
- [ ] **Sprint 21**: Premium features (contexto Premium, limitaciones free, validación de email)
- [ ] **Sprint 22**: Dark mode refinamiento (FormSection ambos modos, owner busca owner, perfil activo/inactivo)
- [ ] **Sprint 23**: Ciudades y zonas (scripts de datos geográficos, backend ubicaciones, filtros por ciudad/zona, capacidad del piso, borrar perfil)
- [ ] **Paridad funcional**: Todas las funcionalidades del baseline (Sprints 7–23) están presentes

---

## 6. Protocolo de registro de datos

### 6.1 Durante cada sprint

Archivo `log-[escenario]-sprint-[N].md`:

```markdown
# Sprint [N] — Escenario [A/B/C/D/E]

## Datos generales
- Fecha inicio: YYYY-MM-DD HH:MM
- Fecha fin: YYYY-MM-DD HH:MM
- TTS (trabajo efectivo): X.Xh
- Funcionalidad objetivo: [Descripción]

## Fuentes primarias
- Commits realizados: N
- Ficheros creados: N
- Ficheros modificados: N
- Tests ejecutados: N (pass: N, fail: N)

## Métricas derivadas
- Iteraciones (commits hasta cerrar sprint): N
- Tiempo de verificación (tests + debug): X.Xh
- Intervención humana:
  - Ediciones manuales: N
  - Prompts correctivos: N
  - Propuestas rechazadas: N

## Dimensiones observadas
### Contexto efectivo
- D1a — Archivos leídos por la IA: N / N total (ratio puede ser >1 en VS Code nativo)
- D1b — Coherencia contextual percibida: X/5
- Mecanismo de retrieval: [indexado / RAG / manual / context window / mixto]

### Autonomía vs control
- Acciones autónomas: N
- Puntos de control: N

### Coherencia multiarchivo
- Coherencia arquitectónica: X/5

### Éxito operacional
- Builds exitosos / totales: N/N
- Fallos de entorno: N

### Calidad mantenible
- TS warnings: N
- Linter warnings: N
- Consistencia de estilos: X/5

## Incidencias
1. [Descripción] — Tipo: [lógica/tipado/integración/alucinación/entorno] — Resolución: Xmin
2. ...

## Observaciones
- [Notas libres sobre la experiencia]
```

### 6.2 Al cierre de cada escenario

Archivo `resumen-escenario-[A/B/C/D/E].md`:

```markdown
# Resumen — Escenario [X]: [Dupla]

## Métricas consolidadas

### Eficiencia total (D5)
| Métrica | Valor | vs. Baseline (A) |
|---------|-------|-------------------|
| TTS total | X.Xh | +/-X% |
| Iteraciones (commits) | N | +/-N |
| Retrabajo (commits correctivos) | N | +/-N |

### Éxito operacional (D4)
| Métrica | Valor |
|---------|-------|
| Builds exitosos / totales | N/N (X%) |
| Tests pass / totales (último commit) | N/N (X%) |
| Fallos de entorno | N |

### Calidad mantenible (D6)
| Métrica | Valor |
|---------|-------|
| TS warnings | N |
| Linter warnings | N |
| Consistencia de estilos | X/5 |

### Contexto efectivo (D1)
| Métrica | Valor |
|---------|-------|
| D1a — Operaciones de lectura / total repo | N/N (X%) |
| D1b — Coherencia contextual percibida (avg) | X/5 |
| Mecanismo principal | [descripción] |

### Autonomía vs control (D2)
| Métrica | Valor |
|---------|-------|
| Acciones autónomas totales | N |
| Puntos de control totales | N |
| Ratio autonomía | X% |

### Edición multiarchivo (D3)
| Métrica | Valor |
|---------|-------|
| Archivos modificados (total) | N |
| Tamaño medio de diff por sprint | +N/-N líneas |
| Coherencia arquitectónica media | X/5 |

### Intervención humana
| Métrica | Valor |
|---------|-------|
| Ediciones manuales | N |
| Prompts correctivos | N |
| Propuestas rechazadas | N |
| Verificación (tiempo debug+tests) | X.Xh |

## Checklist de aceptación
- Sprint 7 (Gastos): ✅/❌
- Sprint 8 (UI/UX fixes): ✅/❌
- Sprint 9 (Refactorización): ✅/❌
- Sprint 10 (Recuperación contraseñas): ✅/❌
- Sprint 11 (UI detalles): ✅/❌
- Sprint 12 (Invitaciones): ✅/❌
- Sprint 13 (Push notifications): ✅/❌
- Sprint 14 (Chats realtime): ✅/❌
- Sprint 15 (UI fix global): ✅/❌
- Sprint 16 (Swipe porcentual): ✅/❌
- Sprint 17 (Hotfixes): ✅/❌
- Sprint 18 (Filtros + Google Auth): ✅/❌
- Sprint 19 (Realtime + estilos de vida): ✅/❌
- Sprint 20 (Dark mode): ✅/❌
- Sprint 21 (Premium features): ✅/❌
- Sprint 22 (Dark mode refinamiento): ✅/❌
- Sprint 23 (Ciudades y zonas): ✅/❌
- Paridad funcional: ✅/❌

## Observaciones narrativas
### Fortalezas
1. ...

### Debilidades
1. ...

### Experiencia general
[Párrafo]
```

---

## 7. Herramientas de medición

### Automatizadas (script al cierre de sprint)
```bash
# Commits del sprint
git log --oneline --no-merges --after="YYYY-MM-DD" --before="YYYY-MM-DD"

# Ficheros tocados y tamaño de diffs
git diff --stat <commit-inicio>..<commit-fin>
git diff --shortstat <commit-inicio>..<commit-fin>

# TypeScript warnings
tsc --noEmit 2>&1 | grep -c "error TS"

# Linter warnings
eslint src/ --format json | jq '[.[].messages | length] | add'

# Tests
npx jest --ci --json 2>/dev/null | jq '{total: .numTotalTests, passed: .numPassedTests, failed: .numFailedTests}'
```

### Manuales
- Cronómetro de trabajo efectivo (TTS)
- Clasificación de incidencias (tipo + tiempo de resolución)
- Valoraciones 1–5 de coherencia, consistencia y coherencia contextual (D1b)
- Conteo de acciones autónomas / puntos de control

---

## 8. Reglas del experimento

### 8.1 Permitido
- Usar la dupla IA–IDE asignada sin restricciones
- Consultar documentación oficial (React Native, Supabase, TypeScript, etc.)
- Consultar Stack Overflow / GitHub Issues para problemas de librerías
- Revisar y modificar código generado por la IA
- Rechazar sugerencias y escribir código manualmente
- Usar herramientas de desarrollo estándar (ESLint, TypeScript, debugger)
- Consultar el código del baseline (A) para verificar requisitos funcionales

### 8.2 Prohibido
- Mezclar duplas IA–IDE durante un escenario
- Copiar código del baseline o de otros escenarios
- Usar otras IAs no asignadas para generar código
- Pedir a terceros que escriban código
- Modificar requisitos para adaptarlos a limitaciones de la IA
- Manipular métricas (commits artificiales, código innecesario para inflar LOC, etc.)

### 8.3 Situaciones especiales

**Fallo completo de la IA en una tarea:**
1. Registrar como "propuesta rechazada"
2. Reformular el prompt 2–3 veces
3. Si persiste, resolver manualmente y documentar como intervención humana
4. No recurrir a otra IA

**Bug crítico que bloquea el progreso:**
1. Documentar tiempo de verificación (debug)
2. Si la IA no ayuda, debugging manual con herramientas estándar
3. Registrar como fallo de entorno o incidencia según corresponda

**Divergencia arquitectónica respecto al baseline:**
- Permitida si se cumplen los requisitos funcionales
- Documentar en coherencia arquitectónica (D3) y observaciones

---

## 9. Criterios de éxito de un escenario

**Exitoso:**
1. Se implementan todas las funcionalidades (Sprints 7–23)
2. Paridad funcional con el baseline
3. El código compila sin errores de TypeScript
4. Se registran todas las métricas de las 6 dimensiones
5. TTS ≤ 150% del baseline

**Parcialmente exitoso:**
- Al menos 13 de 17 sprints completados
- Métricas registradas para lo implementado
- Documentado qué faltó y por qué

**Fallido:**
- Menos de 13 sprints completados, o métricas no registradas, o reglas violadas

**Escenario B — criterio especial (best-effort):**
- Se documenta lo avanzado sin exigencia de completar los 17 sprints
- El valor es empírico: registrar las limitaciones del modelo en condiciones VS Code nativo

---

## 10. Tabla comparativa final

Al completar los escenarios prioritarios (A, C, D, E), consolidar:

| Dimensión | Indicador clave | A (Baseline) | B | C | D | E |
|-----------|----------------|---|---|---|---|---|
| **D5 Eficiencia** | TTS total (h) | ? | ? | ? | ? | ? |
| | Iteraciones (commits) | ? | ? | ? | ? | ? |
| | Retrabajo (commits) | ? | ? | ? | ? | ? |
| **D4 Éxito operac.** | Builds ok (%) | ? | ? | ? | ? | ? |
| | Tests pass (%) | ? | ? | ? | ? | ? |
| **D6 Calidad** | TS warnings | ? | ? | ? | ? | ? |
| | Linter warnings | ? | ? | ? | ? | ? |
| | Consistencia estilos (1–5) | ? | ? | ? | ? | ? |
| **D1 Contexto** | D1a — Ratio acceso | ? | ? | ? | ? | ? |
| | D1b — Coherencia contextual (1–5) | ? | ? | ? | ? | ? |
| **D2 Autonomía** | Ratio autonomía (%) | ? | ? | ? | ? | ? |
| **D3 Multiarchivo** | Archivos modificados | ? | ? | ? | ? | ? |
| | Coherencia arquitect. (1–5) | ? | ? | ? | ? | ? |
| **Interv. humana** | Ediciones manuales | ? | ? | ? | ? | ? |
| | Prompts correctivos | ? | ? | ? | ? | ? |
| | Propuestas rechazadas | ? | ? | ? | ? | ? |
| | Verificación (h) | ? | ? | ? | ? | ? |
| **Aceptación** | Sprints completados | ?/17 | ?/17 | ?/17 | ?/17 | ?/17 |

---

*Documento creado: 5 febrero 2026*
*Última actualización: 2 marzo 2026*
*Autor: Pepe Ortiz Roldán*
