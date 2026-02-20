# read-audit.ps1

Script de PowerShell para auditar qué ficheros lee Claude Code durante una sesión de trabajo. Registra cada llamada a `Get-Content`, `Select-String` y `rg` en un CSV acumulativo dentro del repositorio.

---

## Cómo funciona

El script se carga mediante **dot-sourcing** (`. .\scripts\read-audit.ps1`), lo que permite que sus funciones queden disponibles en la sesión de PowerShell actual.

Una vez cargado, reemplaza temporalmente los comandos `Get-Content`, `Select-String` y `rg` por versiones instrumentadas que:

1. Registran en el CSV: timestamp, sesión, tag, comando, ruta del fichero y directorio de trabajo.
2. Delegan en el comando original para que el comportamiento sea transparente.

Al llamar a `Stop-ReadAudit`, los comandos originales se restauran.

### Dónde se guarda el CSV

Siempre en:
```
<raíz del repo>/.audit/read-audit-global.csv
```
La carpeta `.audit/` se crea automáticamente si no existe. El CSV es **acumulativo**: cada sesión añade filas al mismo fichero, nunca lo sobreescribe.

---

## Uso

```powershell
# 1. Cargar el script (una vez por sesión de PowerShell)
. .\scripts\read-audit.ps1

# 2. Iniciar la grabación
Start-ReadAudit -ConversationTag "sprint-14-scenarioA"

# 3. Trabaja con normalidad (Claude Code, rg, Get-Content, etc.)
#    Cada lectura queda registrada.

# 4. Parar la grabación
Stop-ReadAudit

# 5. Consultar resultados
Get-ReadAuditSummary    # totales globales del CSV
Get-ReadAuditSessions   # una fila por sesión
```

> El parámetro `-ConversationTag` es opcional. Si se omite, se usa el `SessionId` (fecha-hora).

---

## Funciones

### `Start-ReadAudit`

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `-ConversationTag` | `string` | *(SessionId)* | Etiqueta libre para identificar la sesión (p.ej. el sprint o el chat) |
| `-LogPath` | `string` | `.audit\read-audit-global.csv` | Ruta alternativa para el CSV |

Imprime la ruta del log al activarse.

### `Stop-ReadAudit`

Sin parámetros. Restaura `Get-Content`, `Select-String` y `rg` a sus versiones originales e imprime la ruta del log.

### `Get-ReadAuditSummary`

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `-LogPath` | `string` | `.audit\read-audit-global.csv` | Ruta del CSV a analizar |

Devuelve un objeto con:
- `TotalReadEvents` — número total de lecturas registradas
- `UniqueFilesRead` — número de ficheros distintos leídos

### `Get-ReadAuditSessions`

| Parámetro | Tipo | Default | Descripción |
|---|---|---|---|
| `-LogPath` | `string` | `.audit\read-audit-global.csv` | Ruta del CSV a analizar |

Devuelve una tabla con una fila por sesión:
- `SessionId`, `ConversationTag`
- `StartTimestamp`, `EndTimestamp`
- `TotalReadEvents`, `UniqueFilesRead`

---

## Esquema del CSV

| Columna | Descripción |
|---|---|
| `Timestamp` | ISO 8601 — momento exacto de la lectura |
| `SessionId` | Identificador único de la sesión (yyyyMMdd-HHmmss) |
| `ConversationTag` | Etiqueta proporcionada al iniciar |
| `Command` | `Get-Content`, `Select-String` o `rg` |
| `Path` | Ruta tal como se pasó al comando |
| `ResolvedPath` | Ruta absoluta resuelta |
| `Exists` | `True` / `False` — si el fichero existía en el momento de la lectura |
| `WorkingDirectory` | Directorio de trabajo en ese momento |

---

## Ver el CSV

```powershell
# En tabla interactiva (requiere Windows)
Import-Csv .\.audit\read-audit-global.csv | Out-GridView

# En consola
Import-Csv .\.audit\read-audit-global.csv | Format-Table

# Filtrar por tag
Import-Csv .\.audit\read-audit-global.csv |
  Where-Object ConversationTag -eq "sprint-14-scenarioA" |
  Select-Object Timestamp, Command, ResolvedPath
```

---

## Notas

- Si ya hay una sesión activa y llamas a `Start-ReadAudit` de nuevo, lanza un error. Llama primero a `Stop-ReadAudit`.
- El CSV acumula todas las sesiones históricas. Para empezar desde cero, borra `.audit\read-audit-global.csv`.
- Añade `.audit/` al `.gitignore` si no quieres versionar los logs.
