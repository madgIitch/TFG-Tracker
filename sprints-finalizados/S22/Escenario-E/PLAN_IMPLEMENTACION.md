# Plan de implementación — Filtros, Premium y Google Login

> Fecha: 2026-03-16
> Rama: `main`

---

## Contexto

### Estado actual del código

| Área | Estado |
|------|--------|
| `FiltersScreen` | Tiene budget slider, zonas, género, lifestyle, intereses y reglas. **Faltan**: rango de edad, ciudad, nº habitaciones, tipo de usuario, contador de filtros activos, bloqueos premium |
| `SwipeFiltersContext` | Ya persiste en AsyncStorage — hay que extender el tipo `SwipeFilters` |
| `is_premium` | **No existe** en ningún tipo ni servicio — todo desde cero |
| Google login | `LoginScreen` llama directamente a `loginWithSession()` sin comprobar si el usuario es nuevo |

---

## Fase 1 — PremiumContext

### Objetivo
Crear la infraestructura de premium que usarán las demás fases.

### Archivos a modificar / crear

#### 1. Tipo `User` (donde esté definido, p.ej. `src/types/user.ts`)
```ts
// Añadir campo:
is_premium: boolean;
```

#### 2. `src/context/PremiumContext.tsx` ← **nuevo**
- Lee `is_premium` del perfil del usuario en Supabase al montar
- Expone:
  ```ts
  isPremium: boolean
  loading: boolean
  refetch: () => void
  ```
- Si no hay usuario autenticado → `isPremium = false`

#### 3. `App.tsx`
- Añadir `<PremiumProvider>` dentro de `<AuthProvider>`, antes de `<SwipeFiltersProvider>`

```tsx
// Jerarquía resultante:
<AuthProvider>
  <PremiumProvider>        ← nuevo
    <SwipeFiltersProvider>
      ...
    </SwipeFiltersProvider>
  </PremiumProvider>
</AuthProvider>
```

---

## Fase 2a — Extender tipos y contexto de filtros

### Objetivo
Ampliar `SwipeFilters` con los nuevos campos antes de tocar la UI.

### Archivos a modificar

#### `src/context/SwipeFiltersContext.tsx`

**Nuevos campos en `SwipeFilters`:**
```ts
city: string[];           // ['Sevilla', 'Madrid', ...]
roomCount: number[];      // [1, 2, 3, 4]  (4 = "4+")
userType: string[];       // ['student', 'professional', 'any']
ageRange: [number, number]; // [18, 60]
```

**Actualizar `DEFAULT_FILTERS`:**
```ts
city: [],
roomCount: [],
userType: [],
ageRange: [18, 60],
```

**Nueva función utilitaria exportada:**
```ts
export function countActiveFilters(filters: SwipeFilters): number
```
Itera todas las claves y suma las que difieran del valor por defecto. Usado en `FiltersScreen` (contador en header) y en `HomeScreen` (badge en botón de filtros).

---

## Fase 2b — UI de nuevos filtros en FiltersScreen

### Objetivo
Añadir las nuevas secciones en la pantalla de filtros con el diseño glassmorphism del proyecto.

### Nuevos filtros

| Filtro | UI | ¿Premium? |
|--------|-----|-----------|
| Ciudad | Chips múltiple (Madrid, Barcelona, Sevilla, Valencia, Bilbao…) | No |
| Nº habitaciones | Chips (1, 2, 3, 4+) | No |
| Tipo de usuario | Chips (Estudiante, Profesional, Cualquiera) | No |
| Rango de edad | Dual-thumb slider (18–60) | **Sí** |
| Género (ya existe) | Mantener actual — añadir lock premium | **Sí** (avanzado) |

### Archivos a modificar

#### `src/screens/FiltersScreen.tsx`
- Añadir secciones: Ciudad, Nº habitaciones, Tipo de usuario
- Rango de edad: envuelto en `PremiumLockWrapper`
- Filtro Género avanzado: envuelto en `PremiumLockWrapper`
- **Contador de filtros activos** en el header (usar `countActiveFilters`):
  ```
  "Filtros  •  3 activos"   ← texto junto al título o badge naranja
  ```
- Reorganizar el footer: botón "Resetear todo" (secundario) + "Aplicar filtros" (primario)

#### `src/screens/FiltersScreen.styles.ts`
Añadir estilos para:
- `activeFilterBadge` — pastilla/badge con número de filtros activos
- `lockOverlay` — overlay semitransparente sobre sección bloqueada
- `upgradeBanner` — fila con icono candado + "Solo Premium" + botón

---

## Fase 2c — PremiumLockWrapper

### Objetivo
Componente reutilizable que envuelve cualquier sección de filtros y la bloquea si el usuario no es premium.

### Archivo a crear: `src/components/PremiumLockWrapper.tsx`

**Props:**
```ts
interface Props {
  children: React.ReactNode;
  featureName?: string;      // "Filtro de edad", etc.
  onUpgradePress?: () => void;
}
```

**Comportamiento:**
- Si `isPremium === true` → renderiza `children` normalmente
- Si `isPremium === false` → renderiza `children` con `pointerEvents="none"` + overlay:
  - Fondo semitransparente (`rgba(255,255,255,0.75)`)
  - Icono candado (Ionicons `lock-closed`)
  - Texto "Solo disponible en Premium"
  - Botón "Mejorar plan" → navega a pantalla de upgrade (o modal provisional)

---

## Fase 3 — Google Login: detección de primer acceso

### Problema
`LoginScreen` llama `authService.loginWithGoogle()` y si el usuario es nuevo en Supabase, entra directo al app **sin completar su perfil**.

### Solución

#### `src/services/authService.ts`
Modificar `loginWithGoogle()` para devolver también `isNewUser`:

```ts
// Antes:
return { user, token, refreshToken }

// Después:
return { user, token, refreshToken, isNewUser: boolean }
```

**Cómo detectar si es nuevo:**
Opción A (recomendada): Comparar `user.created_at` con `Date.now()` — si la diferencia es < 30 segundos, es nuevo.
Opción B (más fiable): Llamar a `profileService.getProfile(user.id)` y capturar el 404 — si no existe perfil, es nuevo.

#### `src/screens/LoginScreen.tsx`
```ts
const result = await authService.loginWithGoogle();

if (result.isNewUser) {
  // Redirigir al flujo de registro con datos pre-rellenos
  navigation.navigate('Register', {
    googleUser: {
      email: result.user.email,
      firstName: result.user.first_name,
      lastName: result.user.last_name,
      token: result.token,
      refreshToken: result.refreshToken,
    }
  });
} else {
  // Flujo actual: login directo
  loginWithSession(result.user, result.token, result.refreshToken);
}
```

#### `src/screens/RegisterScreen.tsx`
- Leer `route.params?.googleUser` al montar
- Si existe `googleUser`:
  - Saltar Fase 1 (email/password) — ir directamente a Fase 2
  - Pre-rellenar nombre y apellido en Fase 2
  - Marcar `isGoogleUser: true` en el estado
  - Al completar Fase 5 → llamar `loginWithSession()` con el token recibido por params (no crear nueva sesión)

---

## Orden de implementación

```
Fase 1  →  PremiumContext                  (base para todo lo demás)
Fase 2a →  Extender SwipeFilters type/ctx  (antes de tocar UI)
Fase 2b →  UI nuevos filtros               (depende de 2a)
Fase 2c →  PremiumLockWrapper              (depende de Fase 1)
Fase 3  →  Google first-time detection     (independiente, puede ir en paralelo con Fase 2)
```

---

## Checklist final

- [ ] `is_premium` añadido al tipo `User`
- [ ] `PremiumContext` creado y añadido al árbol de providers
- [ ] `SwipeFilters` extendido con `city`, `roomCount`, `userType`, `ageRange`
- [ ] `countActiveFilters()` exportado y usado en `FiltersScreen` y `HomeScreen`
- [ ] Secciones Ciudad, Nº habitaciones y Tipo de usuario añadidas a `FiltersScreen`
- [ ] Rango de edad envuelto en `PremiumLockWrapper`
- [ ] `PremiumLockWrapper` componente creado
- [ ] Botón "Resetear todo" en footer de `FiltersScreen`
- [ ] `authService.loginWithGoogle()` devuelve `isNewUser`
- [ ] `LoginScreen` redirige a registro si `isNewUser === true`
- [ ] `RegisterScreen` acepta `googleUser` por params y salta Fase 1
