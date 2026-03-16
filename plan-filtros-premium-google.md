# Plan de implementación — Filtros avanzados, Premium y Google Login

> Fecha: 2026-03-16 · Rama: `main` · Restricción: no modificar esquema de BD

---

## Estado actual del código

| Área | Estado |
|------|--------|
| `FiltersScreen` | Tiene budget slider, zonas, género, lifestyle, intereses y reglas. **Faltan**: rango de edad, ciudad, nº habitaciones, tipo de usuario, contador de filtros activos, bloqueos premium |
| `SwipeFiltersContext` | Ya persiste en AsyncStorage — hay que extender el tipo `SwipeFilters` |
| `is_premium` | No existe en ningún tipo ni servicio — todo desde cero |
| `profileService.getProfileRecommendations` | Recibe filtros pero no tiene los nuevos campos — hay que alinear el payload |
| Google login | `LoginScreen` llama `loginWithGoogle()` sin comprobar si el usuario es nuevo |

---

## Orden de implementación

```
Fase 1  →  PremiumContext                      (base para todo lo demás)
Fase 2a →  Extender SwipeFilters type/ctx      (antes de tocar UI)
Fase 2b →  UI nuevos filtros en FiltersScreen  (depende de 2a)
Fase 2c →  PremiumLockWrapper                  (depende de Fase 1)
Fase 2d →  Alinear payload de filtros          (depende de 2a)
Fase 3  →  Google Login: primer acceso         (independiente, paralelo a Fase 2)
```

---

## Fase 1 — PremiumContext

### Objetivo
Infraestructura de premium que usarán las fases 2c y 2b.

### Archivos

#### `src/types/user.ts` (o donde esté el tipo `User`)
```ts
// Añadir campo:
is_premium: boolean;
```

#### `src/context/PremiumContext.tsx` ← nuevo
```ts
interface PremiumContextValue {
  isPremium: boolean;
  loading: boolean;
  refetch: () => void;
}
```
- Lee `is_premium` del perfil del usuario en Supabase al montar.
- Si no hay usuario autenticado → `isPremium = false`.
- Exponer vía `usePremium()` hook.

#### `App.tsx`
```tsx
// Jerarquía resultante:
<AuthProvider>
  <PremiumProvider>          {/* nuevo */}
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

### Archivos

#### `src/types/swipeFilters.ts`
```ts
// Añadir a SwipeFilters:
city: string[];              // ['Sevilla', 'Madrid', ...]
roomCount: number[];         // [1, 2, 3, 4]  (4 = "4+")
userType: string[];          // ['student', 'professional', 'any']
ageRange: [number, number];  // [18, 60]
```

#### `src/context/SwipeFiltersContext.tsx`
```ts
// Actualizar DEFAULT_FILTERS:
city: [],
roomCount: [],
userType: [],
ageRange: [18, 60],
```

Migración defensiva al cargar de AsyncStorage: si el objeto guardado no tiene alguno de los nuevos campos, rellenar con defaults (evitar crash por JSON antiguo).

```ts
// Nueva función utilitaria exportada:
export function countActiveFilters(filters: SwipeFilters): number
```

Itera todas las claves y suma las que difieran del valor por defecto. Se usará en `FiltersScreen` (contador en header) y en `HomeScreen` (badge en botón de filtros si lo hay).

---

## Fase 2b — UI de nuevos filtros en FiltersScreen

### Nuevos filtros

| Filtro | UI | ¿Premium? |
|--------|-----|-----------|
| Ciudad | Chips múltiple (Madrid, Barcelona, Sevilla, Valencia, Bilbao…) | No |
| Nº habitaciones | Chips (1, 2, 3, 4+) | No |
| Tipo de usuario | Chips (Estudiante, Profesional, Cualquiera) | No |
| Rango de edad | Dual-thumb slider (18–60) | **Sí** |
| Género (ya existe) | Mantener actual — añadir lock premium | **Sí** |

### Archivos

#### `src/screens/FiltersScreen.tsx`
- Añadir secciones: Ciudad, Nº habitaciones, Tipo de usuario.
- Rango de edad: envuelto en `<PremiumLockWrapper>`.
- Filtro Género avanzado: envuelto en `<PremiumLockWrapper>`.
- **Contador de filtros activos** en el header usando `countActiveFilters`:
  ```
  "Filtros  •  3 activos"
  ```
- Footer reorganizado:
  - Botón "Resetear todo" (secundario, outline)
  - Botón "Aplicar filtros" (primario, filled)

#### `src/screens/FiltersScreen.styles.ts`
Añadir estilos para:
- `activeFilterBadge` — pastilla/badge con número de filtros activos
- `lockOverlay` — overlay semitransparente sobre sección bloqueada
- `upgradeBanner` — fila con icono candado + "Solo Premium" + botón CTA

---

## Fase 2c — PremiumLockWrapper

### Objetivo
Componente reutilizable que bloquea cualquier sección si el usuario no es premium.

### Archivo: `src/components/PremiumLockWrapper.tsx` ← nuevo

```ts
interface Props {
  children: React.ReactNode;
  featureName?: string;       // "Filtro de edad", "Filtro de género"...
  onUpgradePress?: () => void;
}
```

**Comportamiento:**
- `isPremium === true` → renderiza `children` normalmente.
- `isPremium === false` → renderiza `children` con `pointerEvents="none"` + overlay:
  - Fondo semitransparente (`rgba(255,255,255,0.75)`)
  - Icono candado (`Ionicons lock-closed`)
  - Texto "Solo disponible en Premium"
  - Botón "Mejorar plan" → navega a pantalla de upgrade (o modal provisional)

---

## Fase 2d — Alinear payload de filtros con el servicio

### Objetivo
Que `getProfileRecommendations` reciba los nuevos campos para filtrado server-side.

### Archivos

#### `src/services/profileService.ts`
```ts
// Extender el tipo del parámetro filters:
getProfileRecommendations(filters: SwipeFilters): Promise<Profile[]>

// Añadir al payload enviado a la Edge Function:
city: filters.city,
roomCount: filters.roomCount,
userType: filters.userType,
ageRange: filters.ageRange,
```

#### `supabase/functions/profiles/index.ts` (o la Edge Function correspondiente)
- Leer los nuevos campos del body/query.
- Aplicar filtros en la query de Supabase si los campos vienen informados (si el array está vacío, ignorar ese filtro).
- Mantener compatibilidad: si los campos no vienen (clientes viejos), comportamiento actual sin cambios.

---

## Fase 3 — Google Login: detección de primer acceso

### Problema
`LoginScreen` llama `authService.loginWithGoogle()` y si el usuario es nuevo, entra al app sin completar su perfil.

### Archivos

#### `src/services/authService.ts`
Modificar `loginWithGoogle()` para devolver `isNewUser`:

```ts
// Antes:
return { user, token, refreshToken }

// Después:
return { user, token, refreshToken, isNewUser: boolean }
```

**Cómo detectar si es nuevo** (opción recomendada): llamar a `profileService.getProfile(user.id)` — si devuelve 404/null, es nuevo. Más fiable que comparar timestamps.

**Criterio de "perfil completo"**: nombre, apellido, género, fecha de nacimiento y registro en `users`/`profiles`. Si falta alguno → `isNewUser = true`.

#### `src/screens/LoginScreen.tsx`
```ts
const result = await authService.loginWithGoogle();

if (result.isNewUser) {
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
  loginWithSession(result.user, result.token, result.refreshToken);
}
```

#### `src/screens/RegisterScreen.tsx`
- Leer `route.params?.googleUser` al montar.
- Si existe `googleUser`:
  - Saltar Fase 1 del registro (email/password) — ir directamente a Fase 2.
  - Pre-rellenar nombre y apellido.
  - Marcar `isGoogleUser: true` en el estado local.
  - Al completar el registro → llamar `loginWithSession()` con el token recibido por params, no crear sesión nueva.

#### `supabase/functions/auth-register-phase3/index.ts`
- Eliminar el `501` para usuarios Google.
- Completar `users`/`profiles` para el usuario ya autenticado por Google sin recrear el usuario auth.

---

## Checklist final

- [ ] `is_premium` añadido al tipo `User`
- [ ] `PremiumContext` creado y añadido al árbol de providers en `App.tsx`
- [ ] `SwipeFilters` extendido con `city`, `roomCount`, `userType`, `ageRange`
- [ ] Migración defensiva de AsyncStorage al cargar filtros guardados
- [ ] `countActiveFilters()` exportado y usado en `FiltersScreen` (header) y `HomeScreen` (badge)
- [ ] Secciones Ciudad, Nº habitaciones y Tipo de usuario añadidas a `FiltersScreen`
- [ ] Rango de edad y Género avanzado envueltos en `PremiumLockWrapper`
- [ ] `PremiumLockWrapper` componente creado
- [ ] Botón "Resetear todo" en footer de `FiltersScreen`
- [ ] Payload de `getProfileRecommendations` actualizado con nuevos campos
- [ ] Edge Function de perfiles lee y aplica los nuevos campos de filtros
- [ ] `authService.loginWithGoogle()` devuelve `isNewUser`
- [ ] `LoginScreen` redirige a registro si `isNewUser === true`
- [ ] `RegisterScreen` acepta `googleUser` por params y salta Fase 1
- [ ] `auth-register-phase3` elimina el `501` para Google y completa perfil sin recrear usuario auth
