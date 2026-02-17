# Protocolo del Experimento Comparativo — Escenarios A–D

**Proyecto:** Análisis comparativo de duplas IA–IDE en desarrollo móvil
**Caso práctico:** Replicación del MVP v0 de HomiMatchApp
**Fecha de creación:** 5 febrero 2026
**Última actualización:** 18 febrero 2026

---

## 1. Objetivo

Comparar cuatro duplas modelo–entorno (Escenarios A–D) replicando el mismo tramo funcional del proyecto, manteniendo constantes requisitos, arquitectura y desarrollador. La evaluación se rige por las seis dimensiones del marco definido en el capítulo de materias relacionadas.

---

## 2. Escenarios evaluados

| ID | Dupla IA–IDE | Modelo | Entorno | Rol |
|----|-------------|--------|---------|-----|
| **A** | Codex (+Claude Code) en VS Code | GPT-4 / Claude Sonnet | Visual Studio Code | Baseline |
| **B** | Gemini Code Assist en VS Code | Gemini 1.5 Pro | Visual Studio Code | Replicación |
| **C** | Codex en Cursor | GPT-4o (Codex) | Cursor | Replicación |
| **D** | Gemini en Antigravity | Gemini 1.5 Pro | Antigravity | Replicación |

---

## 3. Condiciones controladas

### 3.1 Factores constantes
- **Desarrollador**: Pepe Ortiz Roldán (mismo para los 4 escenarios).
- **Requisitos funcionales**: MVP v0 — Sprints 1-6 (autenticación, navegación, perfiles con fotos, matching swipe, habitaciones, filtros, UI glassmorphism).
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
Qué parte del repositorio usa realmente la herramienta.

| Indicador | Cómo se mide |
|-----------|-------------|
| Archivos leídos por la IA durante el sprint | Logs de la herramienta / observación directa |
| Mecanismo de retrieval usado | Documentar: indexado, RAG, adjuntos manuales, context window |
| Proporción del repo accesible vs. repo total | Ficheros accedidos / ficheros totales (script Git) |

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

- [ ] **Sprint 1**: Autenticación (login, registro, Google Sign-In) + navegación básica funcional
- [ ] **Sprint 2**: Navegación por tabs + registro multi-fase
- [ ] **Sprint 3**: Edición de perfiles + subida de múltiples fotos
- [ ] **Sprint 4**: Sistema de swipe + habitaciones/pisos + chat básico
- [ ] **Sprint 5**: Filtros de género y preferencias funcionales
- [ ] **Sprint 6**: UI glassmorphism aplicado de forma consistente
- [ ] **Paridad funcional**: Todas las funcionalidades del baseline están presentes

---

## 6. Protocolo de registro de datos

### 6.1 Durante cada sprint

Archivo `log-[escenario]-sprint-[N].md`:

```markdown
# Sprint [N] — Escenario [A/B/C/D]

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
- Archivos leídos por la IA: N / N total
- Mecanismo de retrieval: [indexado / RAG / manual / context window]

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

Archivo `resumen-escenario-[A/B/C/D].md`:

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
| Archivos accedidos / total repo | N/N (X%) |
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
- Sprint 1: ✅/❌
- Sprint 2: ✅/❌
- Sprint 3: ✅/❌
- Sprint 4: ✅/❌
- Sprint 5: ✅/❌
- Sprint 6: ✅/❌
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
- Valoraciones 1–5 de coherencia y consistencia
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
1. Se implementan todas las funcionalidades (Sprints 1–6)
2. Paridad funcional con el baseline
3. El código compila sin errores de TypeScript
4. Se registran todas las métricas de las 6 dimensiones
5. TTS ≤ 150% del baseline

**Parcialmente exitoso:**
- Al menos 4 de 6 sprints completados
- Métricas registradas para lo implementado
- Documentado qué faltó y por qué

**Fallido:**
- Menos de 4 sprints completados, o métricas no registradas, o reglas violadas

---

## 10. Tabla comparativa final

Al completar los 4 escenarios, consolidar:

| Dimensión | Indicador clave | A (Baseline) | B | C | D |
|-----------|----------------|---|---|---|---|
| **D5 Eficiencia** | TTS total (h) | 70.7 | ? | ? | ? |
| | Iteraciones (commits) | 15 | ? | ? | ? |
| | Retrabajo (commits) | ? | ? | ? | ? |
| **D4 Éxito operac.** | Builds ok (%) | ? | ? | ? | ? |
| | Tests pass (%) | ? | ? | ? | ? |
| **D6 Calidad** | TS warnings | ? | ? | ? | ? |
| | Linter warnings | ? | ? | ? | ? |
| | Consistencia estilos (1–5) | ? | ? | ? | ? |
| **D1 Contexto** | Archivos accedidos (%) | ? | ? | ? | ? |
| **D2 Autonomía** | Ratio autonomía (%) | ? | ? | ? | ? |
| **D3 Multiarchivo** | Archivos modificados | ? | ? | ? | ? |
| | Coherencia arquitect. (1–5) | ? | ? | ? | ? |
| **Interv. humana** | Ediciones manuales | ? | ? | ? | ? |
| | Prompts correctivos | ? | ? | ? | ? |
| | Propuestas rechazadas | ? | ? | ? | ? |
| | Verificación (h) | ? | ? | ? | ? |
| **Aceptación** | Sprints completados | 6/6 | ?/6 | ?/6 | ?/6 |

---

*Documento creado: 5 febrero 2026*
*Última actualización: 18 febrero 2026*
*Autor: Pepe Ortiz Roldán*
