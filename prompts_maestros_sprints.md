# Prompts Maestros por Sprint — HomiMatchApp
**Sprints 7 al 23** | Fase 2: Características Avanzadas (Post-v0)

> Contexto base: La aplicación HomiMatchApp es una app de React Native + TypeScript que conecta personas buscando piso o compañeros de habitación. Usa Supabase (DB + Auth + Storage + Realtime), Firebase Cloud Messaging para push, y React Navigation. El stack de estilos sigue un sistema de glassmorphism con tokens centralizados. En este punto ya existe la v0 funcional con: autenticación, perfiles con fotos, sistema de swipe/matching, gestión de pisos, chat básico, filtros de búsqueda por género, y un rediseño visual completo.

---

## Sprint 7 — Sistema de Gestión de Gastos

Implementa un sistema completo de gestión de gastos compartidos para pisos en HomiMatchApp.

**Lo que debes crear:**

1. **Pantalla `FlatExpensesScreen`**: lista de gastos del piso con creación de nuevos gastos. Cada gasto tiene: descripción, importe total, pagador (uno de los compañeros del piso), y distribución entre los miembros del piso. Usa el estilo glassmorphism existente.

2. **Pantalla `FlatSettlementScreen`**: resumen de liquidaciones entre compañeros. Calcula automáticamente quién le debe cuánto a quién y permite marcar deudas como saldadas.

3. **Servicio `flatExpenseService`**: funciones CRUD para gastos. Un gasto tiene campos: `id`, `flat_id`, `description`, `amount`, `paid_by` (user_id), `split_between` (array de user_ids), `created_at`. Los splits pueden ser iguales o personalizados.

4. **Servicio `flatSettlementService`**: lógica para calcular el balance neto de cada miembro y generar las liquidaciones mínimas necesarias (algoritmo greedy: el que más debe paga al que más se le debe primero).

5. **Edge Functions de Supabase**:
   - `flat-expenses`: GET (listar gastos del piso) y POST (crear gasto nuevo)
   - `flat-settlements`: GET (calcular liquidaciones pendientes) y POST (marcar como saldado)

6. **Tablas en Supabase**:
   - `flat_expenses`: `id`, `flat_id`, `description`, `amount`, `paid_by`, `created_at`
   - `flat_expense_splits`: `id`, `expense_id`, `user_id`, `amount`
   - `flat_settlements`: `id`, `flat_id`, `from_user`, `to_user`, `amount`, `settled_at`

7. **Integración en navegación**: añade acceso a estas pantallas desde el tab de gestión del piso (`RoomManagementScreen`).

**Restricciones técnicas:**
- Solo los miembros del piso pueden ver y crear gastos
- El cálculo de deudas debe actualizarse automáticamente al añadir un gasto o liquidar
- Los imports de Supabase usan el cliente configurado globalmente en `src/lib/supabase.ts`
- Sigue el patrón de los servicios existentes (async/await, tipado con interfaces TypeScript)

---

## Sprint 8 — Correcciones UI/UX

Corrige los problemas visuales y de experiencia detectados en la v0 de HomiMatchApp.

**Fixes a realizar:**

1. **`LoginScreen`**: ajusta el layout para que funcione correctamente cuando el teclado está visible. El botón de login no debe quedar tapado. Revisa el padding inferior y usa `KeyboardAvoidingView` si es necesario.

2. **`RegisterScreen`** (todas las fases del registro multi-fase): verifica que los inputs no queden ocultos bajo el teclado en ninguna fase. Añade scroll si el contenido supera la pantalla.

3. **`ProfileDetailScreen`**: corrige los márgenes y espaciados inconsistentes. Las secciones de intereses (chips) deben verse completas sin cortes. Las fotos de perfil deben tener la relación de aspecto correcta.

4. **`SwipeScreen`**: corrige el comportamiento de las cards durante el swipe. Si hay renders dobles o flickering al pasar cards, identifica la causa en el estado y corrígela. Asegúrate de que el gesto de swipe no interfiere con los botones de acción.

5. **Optimización de renders**: revisa los componentes que se re-renderizan innecesariamente. Aplica `React.memo`, `useCallback` o `useMemo` donde corresponda para evitar renders en cascada.

6. **Errores visuales generales**: repasa todas las pantallas en modo claro buscando textos cortados, overlaps de elementos, o elementos fuera de los límites de pantalla. Corrígelos con estilos correctos (evita valores hardcodeados en px; usa porcentajes o Dimensions cuando sea necesario).

**Criterio de éxito**: la app no debe tener ningún error visual obvio en LoginScreen, RegisterScreen, ProfileDetailScreen ni SwipeScreen al hacer scroll, abrir el teclado, o interactuar con los gestos de swipe.

---

## Sprint 9 — Refactorización v1: Separación de Estilos

Refactoriza la capa de estilos de HomiMatchApp separando los estilos inline de los componentes a archivos dedicados, y establece un sistema de tokens de diseño.

**Lo que debes hacer:**

1. **Crea la carpeta `src/styles/`** con la siguiente estructura:
   ```
   src/styles/
   ├── tokens/
   │   ├── colors.ts       # paleta de colores y semántica (primary, surface, text, etc.)
   │   ├── spacing.ts      # escala de spacing (xs, sm, md, lg, xl, xxl)
   │   └── fonts.ts        # tamaños de fuente y pesos
   ├── screens/            # estilos de cada pantalla
   │   ├── LoginScreen.styles.ts
   │   ├── RegisterScreen.styles.ts
   │   ├── SwipeScreen.styles.ts
   │   ├── ProfileDetailScreen.styles.ts
   │   ├── ChatScreen.styles.ts
   │   ├── MatchesScreen.styles.ts
   │   ├── FiltersScreen.styles.ts
   │   ├── EditProfileScreen.styles.ts
   │   ├── FlatExpensesScreen.styles.ts
   │   ├── FlatSettlementScreen.styles.ts
   │   └── ... (una por cada pantalla existente)
   └── common.ts           # estilos reutilizables: containers, cards, inputs, headers
   ```

2. **Extrae los StyleSheets**: cada pantalla actualmente tiene su `StyleSheet.create` inline al final del archivo. Muévelo a su archivo `.styles.ts` correspondiente y haz el import en la pantalla. El archivo de estilos exporta un único objeto `styles` por defecto.

3. **Aplica tokens**: sustituye los valores hardcodeados de colores, spacings y tamaños de fuente por referencias a los tokens. Ejemplo: en lugar de `color: '#FFFFFF'` usa `colors.white`; en lugar de `padding: 16` usa `spacing.md`.

4. **`common.ts`**: extrae los estilos repetidos en múltiples pantallas (por ejemplo, el contenedor base con fondo gradiente, el estilo de botón primario, el estilo de input) a este archivo y reutilízalos importándolos.

5. **No cambies la lógica**: esta refactorización es puramente estructural. El comportamiento visual debe quedar idéntico antes y después.

**Resultado esperado**: ~50 archivos modificados/creados. El código queda más limpio y los estilos son fáciles de modificar globalmente cambiando un token.

---

## Sprint 10 — Recuperación de Contraseñas

Implementa el flujo completo de recuperación de contraseña por email en HomiMatchApp.

**Lo que debes crear:**

1. **`ForgotPasswordScreen`**: pantalla accesible desde `LoginScreen` (enlace "¿Olvidaste tu contraseña?"). Tiene un campo de email y un botón de enviar. Al enviarlo, llama al servicio de recuperación y muestra un mensaje de confirmación ("Te hemos enviado un email con las instrucciones").

2. **`ResetPasswordScreen`**: pantalla que se abre cuando el usuario toca el enlace del email de recuperación. Tiene dos campos (nueva contraseña y confirmación) y un botón de guardar. Valida que ambas contraseñas coincidan y cumplan los requisitos mínimos.

3. **Servicio de recuperación** (en `authService` o archivo propio):
   - `sendPasswordResetEmail(email: string)`: llama a `supabase.auth.resetPasswordForEmail()` con la URL de redirect correcta
   - `updatePassword(newPassword: string)`: llama a `supabase.auth.updateUser({ password: newPassword })`

4. **Deep linking**: configura el deep link `homimatch://reset-password` para que Android e iOS abran `ResetPasswordScreen` cuando el usuario toca el enlace del email. Configura:
   - En Android: `AndroidManifest.xml` con el intent filter correspondiente
   - En iOS: `Info.plist` con el URL scheme
   - En el navegador: maneja el parámetro de sesión que devuelve Supabase en la URL de reset

5. **Integración en `AppNavigator`**: añade `ForgotPasswordScreen` y `ResetPasswordScreen` al stack de navegación de autenticación (fuera del flujo autenticado).

6. **Testing del flujo**: verifica que el flujo completo funciona: usuario en LoginScreen → toca "¿Olvidaste tu contraseña?" → introduce email → recibe email → toca enlace → abre ResetPasswordScreen → introduce nueva contraseña → vuelve a LoginScreen.

---

## Sprint 11 — Mejoras UI de Detalles

Mejora la interfaz de las pantallas de detalle de perfiles y pisos en HomiMatchApp.

**Lo que debes hacer:**

1. **`ProfileDetailScreen`**: rediseña el layout siguiendo el estilo glassmorphism del resto de la app. La pantalla debe:
   - Mostrar las fotos del perfil en un carrusel con paginación (bullets o números)
   - Mostrar el nombre, edad, género y ciudad en un header flotante sobre la última foto
   - Organizar la información en secciones con tarjetas glassmorphism: "Sobre mí", "Mis intereses" (chips), "Lo que busco", "Mi situación" (tiene piso / busca piso)
   - Los botones de like/dislike deben estar visibles en la parte inferior sin tapar el contenido
   - Asegúrate de que el scroll funciona correctamente

2. **`RoomDetailScreen`**: mejora la presentación del piso con:
   - Carrusel de fotos del piso
   - Información clara del piso: dirección, precio, habitaciones disponibles, servicios incluidos
   - Sección de roommates actuales con sus avatares
   - Reglas del piso en formato legible
   - Botón de contactar / solicitar unirse (según el estado del match)

3. **Actualización del tema global**: si durante el rediseño detectas valores de color o spacing que deberían estar en los tokens pero no están, añádelos a los archivos de tokens de `src/styles/tokens/`.

4. **`FlatExpensesScreen`** (fix menor): corrige cualquier problema visual que exista en la pantalla de gastos (padding, alineación, overflow de texto).

**Restricción**: no cambies la lógica de negocio ni las llamadas a servicios. Solo modifica la capa de presentación.

---

## Sprint 12 — Sistema de Invitaciones

Implementa un sistema de códigos de invitación para que los propietarios puedan invitar a compañeros a unirse a su piso.

**Lo que debes crear:**

1. **Fase 4 del registro (`Phase4Invitation`)**: nueva pantalla en el flujo de registro multi-fase. Aparece después de la fase de género y pregunta al usuario si tiene un código de invitación. Dos opciones: "Tengo un código" (muestra input para introducirlo) y "No tengo código" (continúa al flujo normal). Si introduce un código válido, el usuario queda asociado al piso.

2. **Servicio `roomInvitationService`**:
   - `generateInviteCode(flatId: string)`: genera un código único (6-8 caracteres alfanuméricos) y lo guarda en Supabase
   - `validateInviteCode(code: string)`: verifica que el código existe, no ha expirado y el piso tiene habitaciones disponibles
   - `joinFlatWithCode(code: string, userId: string)`: asocia al usuario al piso, asigna habitación disponible, y devuelve los datos del piso

3. **Edge Function `room-invitations`**:
   - POST `/generate`: genera y devuelve un nuevo código para el piso del propietario autenticado
   - POST `/join`: valida el código y une al usuario al piso
   - GET `/validate/:code`: verifica si un código es válido sin unirse aún

4. **Tabla `room_invitation_codes`**: `id`, `flat_id`, `code` (único), `created_by`, `created_at`, `expires_at` (nullable), `used_by` (nullable), `used_at` (nullable)

5. **UI en `RoomManagementScreen`**: botón "Generar código de invitación" que muestra el código generado con opción de copiarlo al portapapeles y compartirlo.

6. **Matches automáticos**: cuando un usuario se une a un piso mediante código de invitación, crea automáticamente registros de match entre él y todos los compañeros existentes del piso con estado `accepted` (son compañeros, ya se conocen).

7. **`RoomDetailScreen`**: muestra la lista de roommates actuales del piso (nombre + foto).

---

## Sprint 13 — Push Notifications

Implementa el sistema completo de notificaciones push en HomiMatchApp usando Firebase Cloud Messaging.

**Lo que debes crear:**

1. **Configuración de Firebase**:
   - Integra `@react-native-firebase/app` y `@react-native-firebase/messaging`
   - Configura `google-services.json` en Android y `GoogleService-Info.plist` en iOS
   - Solicita permisos de notificaciones al usuario al abrir la app

2. **Servicio `pushTokenService`**:
   - `registerToken()`: obtiene el FCM token del dispositivo y lo guarda en Supabase vinculado al usuario autenticado (`push_tokens` table: `user_id`, `token`, `platform`, `updated_at`)
   - `removeToken()`: elimina el token al hacer logout

3. **Servicio `notificationService`**:
   - Maneja notificaciones en foreground (muestra una notificación local si la app está abierta)
   - Maneja notificaciones en background (el handler de FCM se encarga)
   - Maneja el tap en notificación (navegación por deep link al contenido relevante)
   - Excepción: si el usuario ya está en el chat del que llega la notificación, no la muestra

4. **Edge Functions de Supabase** (se llaman desde los triggers de Supabase o desde otras edge functions):
   - `push-new-message`: envía push al destinatario cuando llega un mensaje nuevo en el chat
   - `push-match-status`: envía push cuando cambia el estado de un match (nuevo match, rechazo)
   - `push-flat-expense`: envía push a todos los compañeros cuando se crea un nuevo gasto
   - `push-flat-settlement`: envía push cuando alguien liquida una deuda
   - `push-room-assignment`: envía push cuando el propietario asigna una habitación a un compañero

5. **Deep linking desde notificaciones**: configurar el payload de cada tipo de notificación con datos suficientes para navegar directamente al contenido:
   - Mensaje → abre `ChatScreen` del chat correspondiente
   - Match → abre `MatchesScreen`
   - Gasto → abre `FlatExpensesScreen`

6. **Permisos Android**: configura en `AndroidManifest.xml` los permisos necesarios para notificaciones y el canal de notificaciones por defecto.

---

## Sprint 14 — Chats en Tiempo Real

Implementa mensajería en tiempo real y rediseña la UI del sistema de chat en HomiMatchApp.

**Lo que debes implementar:**

1. **Supabase Realtime en `ChatScreen`**:
   - Suscríbete al canal de mensajes del chat actual usando `supabase.channel()` con filtros por `chat_id`
   - Cuando llega un mensaje nuevo, añádelo al estado local sin recargar todos los mensajes
   - Implementa autoscroll automático al recibir un mensaje nuevo (si el usuario está en el fondo del scroll) o al enviar un mensaje propio
   - Al desmontar el componente, cancela la suscripción

2. **Orden de chats en `MatchesScreen`**:
   - La lista de chats debe ordenarse por el timestamp del último mensaje (más reciente primero)
   - Muestra un indicador de mensajes no leídos (punto o número) en los chats con mensajes no leídos
   - Suscríbete en tiempo real a los cambios en los chats del usuario para que el orden se actualice automáticamente

3. **Rediseño de `ChatScreen`** con glassmorphism:
   - Header con foto y nombre del contacto, con botón de volver
   - Burbujas de mensaje diferenciadas: las tuyas a la derecha (color primario), las del otro a la izquierda (glassmorphism)
   - Timestamps en los mensajes, agrupados por día ("Hoy", "Ayer", fecha completa)
   - Input de texto en la parte inferior con botón de enviar, que no tape los mensajes cuando el teclado está abierto

4. **Rediseño de `MatchesScreen`**:
   - Lista de matches con foto, nombre y último mensaje (preview truncado)
   - Indicador de tiempo del último mensaje (hace X min, hace X horas, etc.)
   - Sección separada para nuevos matches sin mensajes aún

5. **Actualización UI de formularios**: con el nuevo sistema de estilos y glassmorphism, actualiza la UI de:
   - `EditProfileScreen`, `CreateFlatScreen`, `RoomEditScreen`, `RoomManagementScreen`
   - `FlatExpensesScreen`, `FlatSettlementScreen`
   - Asegúrate de que todos siguen el mismo lenguaje visual

---

## Sprint 15 — UI Fix Global

Realiza una corrección masiva de problemas de UX en todas las pantallas de HomiMatchApp, con foco especial en el comportamiento del teclado y la adaptación a distintos tamaños de pantalla.

**Lo que debes corregir:**

1. **Autoscroll con teclado**: en todas las pantallas con formularios, el contenido debe hacer scroll automáticamente para que el campo de input activo no quede tapado por el teclado. Implementa esto de forma consistente en:
   - Todas las fases del registro (`Phase1Email`, `Phase2Name`, `Phase3BirthDate`, `Phase3Gender`)
   - `EditProfileScreen`
   - `CreateFlatScreen` y `RoomEditScreen`
   - `ForgotPasswordScreen` y `ResetPasswordScreen`
   - Usa `KeyboardAwareScrollView` o una solución propia con `KeyboardAvoidingView` + `ScrollView`

2. **Pantallas de registro**: revisa el flujo completo de registro en un dispositivo pequeño (320pt de ancho). Asegúrate de que todos los elementos caben y son accesibles.

3. **`ProfileDetailScreen` y `RoomDetailScreen`**: verifica en múltiples tamaños de pantalla que el layout es correcto, los carruseles de fotos funcionan, y los botones de acción no quedan cortados.

4. **`ForgotPasswordScreen` y `ResetPasswordScreen`**: corrige cualquier problema de layout. El formulario debe estar centrado verticalmente cuando no hay teclado y subir cuando el teclado aparece.

5. **`SwipeScreen` con estilos relativos**: reemplaza todos los valores de posición y tamaño hardcodeados en px por valores relativos (porcentajes de `Dimensions.get('window')`) para que las cards de swipe se vean bien en pantallas de distintos tamaños.

6. **`TabBar`**: verifica que la barra de navegación inferior no queda cortada en dispositivos con notch inferior (iPhone con home indicator). Aplica `paddingBottom` con `useSafeAreaInsets()` si es necesario.

7. **`MatchesScreen`**: ajusta el padding y spacing para que la lista de matches no tenga espacio excesivo ni insuficiente.

8. **Porcentajes de compatibilidad**: si el porcentaje calculado puede salir de rango (< 0 o > 100), añade un clamp para asegurar que siempre está entre 0 y 100.

---

## Sprint 16 — Swipe Porcentual

Implementa un sistema de compatibilidad porcentual visible en las cards de swipe de HomiMatchApp.

**Lo que debes implementar:**

1. **Cálculo de porcentaje de compatibilidad**: crea una función `calculateCompatibility(userProfile, candidateProfile, userFilters)` que devuelva un número de 0 a 100. Factores a considerar (con pesos configurables):
   - Coincidencia en rango de precio buscado
   - Coincidencia de ciudad/zona
   - Coincidencia de intereses (porcentaje de intereses en común)
   - Compatibilidad de estilos de vida
   - Coincidencia en tipo de usuario (tiene piso / busca piso)
   - Preferencias de género del compañero

2. **Visualización en cards de swipe**: en cada card del `SwipeScreen`, añade un badge o indicador visual que muestre el porcentaje de compatibilidad. Puede ser:
   - Un badge circular en la esquina superior derecha con el número y color (verde > 70%, amarillo 40-70%, rojo < 40%)
   - Una barra de progreso en la parte inferior de la card

3. **`SwipeScreenV2`**: crea una nueva versión del SwipeScreen que incorpore este sistema. Mantén la funcionalidad de swipe existente (gestos, botones de like/dislike) y añade la compatibilidad. Usa el nombre `SwipeScreenV2` o actualiza el existente si prefieres.

4. **Mejoras en el algoritmo de recomendaciones** (backend): ordena los candidatos devueltos por la Edge Function de recomendaciones por porcentaje de compatibilidad descendente, para que los más compatibles aparezcan primero en el stack de swipe.

5. **Correcciones en backend de matches**: verifica que la lógica de matches funciona correctamente con el nuevo sistema. Cuando ambos usuarios se dan like mutuamente, el match debe crearse correctamente y aparecer en `MatchesScreen`.

6. **Optimización de queries**: si la query de perfiles candidatos hace demasiadas llamadas o es lenta, optimízala con una query única que traiga todos los datos necesarios para calcular la compatibilidad.

---

## Sprint 17 — Hotfixes

Corrige los errores críticos detectados inmediatamente después del sprint de swipe porcentual.

**Hotfixes a realizar:**

1. **Hotfix principal**: identifica y corrige el error crítico que impide el funcionamiento correcto de alguna funcionalidad core. Revisa los logs de error y el comportamiento en los commits `a2ec3d6` y `964a01a`. Los síntomas más probables son:
   - El porcentaje de compatibilidad no se calcula o muestra incorrectamente
   - Las cards de swipe no cargan o se quedan en estado de carga infinita
   - El match no se crea cuando ambos usuarios se dan like
   - La navegación falla después de un swipe

2. **Verifica regresiones**: después de los cambios del Sprint 16, comprueba que las funcionalidades anteriores siguen funcionando:
   - El flujo de registro completo (4 fases)
   - El chat en tiempo real
   - Las push notifications
   - La gestión de gastos

3. **Correcciones de estabilidad**: si hay crashes o comportamientos inesperados en producción derivados de los últimos sprints, corrígelos con el menor impacto posible en el código.

**Nota**: este sprint es de hotfixes urgentes. Mantén los cambios mínimos y enfocados. No añadas funcionalidades nuevas.

---

## Sprint 18 — Filtros Mejorados y Google Auth

Mejora el sistema de filtros de búsqueda y completa la integración con Google Sign-In en HomiMatchApp.

**Lo que debes implementar:**

1. **Actualización completa de `FiltersScreen`**:
   - Añade todos los filtros relevantes que puedan faltar: rango de precio, número de habitaciones, tipo de usuario (busca piso / tiene piso / ambos), ciudad, zona, rango de edad, género del compañero
   - Mejora la UX de los filtros: usa sliders para rangos numéricos, chips para selección múltiple, y toggles para opciones binarias
   - Añade un botón "Restablecer filtros" que vuelva a los valores por defecto
   - Muestra un contador de cuántos filtros están activos
   - Guarda los filtros aplicados en `AsyncStorage` para que persistan entre sesiones

2. **`PremiumContext`**: crea un contexto que gestione el estado premium del usuario. Por ahora, con lógica básica:
   - `isPremium: boolean` (leer de Supabase, tabla `profiles`, campo `is_premium`)
   - `premiumFeatures`: lista de features disponibles según el plan
   - `checkPremiumStatus()`: refresca el estado desde el backend
   - Algunos filtros avanzados estarán marcados como premium (bloqueados para usuarios free, con un icono de candado y prompt de upgrade)

3. **`MainNavigator` anclado**: corrige el problema de que el `MainNavigator` (con los tabs) se reinicia o "salta" en ciertas transiciones de navegación. El navigator debe mantenerse montado y el estado de los tabs debe persistir correctamente.

4. **Google Authentication finalizada**:
   - Completa el flujo de registro con Google: si el usuario se registra con Google y es la primera vez, llévalo al flujo de registro multi-fase para completar su perfil (nombre, fecha de nacimiento, género, ciudad)
   - Si ya tiene cuenta con Google, haz login directo
   - Maneja el caso de que el email de Google ya esté registrado con contraseña (muéstrale un mensaje apropiado)
   - Corrige cualquier error en `GoogleSignInButton` o en el servicio de auth de Google

5. **Corrección en `TabBarIcon`**: si los iconos de la barra de tabs tienen algún problema visual (tamaño incorrecto, color que no respeta el tema, etc.), corrígelo.

---

## Sprint 19 — Realtime y Estilos de Vida

Extiende el sistema de tiempo real a todas las pantallas relevantes y añade el campo de estilos de vida en los perfiles.

**Lo que debes implementar:**

1. **Supabase Realtime en todas las pantallas**:

   - **`FlatExpensesScreen`**: suscríbete a cambios en `flat_expenses` del piso actual. Cuando se añada o modifique un gasto, actualiza la lista automáticamente sin recargar.

   - **`FlatSettlementScreen`**: suscríbete a cambios en `flat_settlements`. Cuando alguien salda una deuda, actualiza el resumen.

   - **`MatchesScreen`**: ya tiene realtime para el orden de chats. Añade también suscripción a nuevos matches para que aparezcan sin recargar la pantalla.

   - **`RoomDetailScreen`**: suscríbete a cambios en los miembros del piso (cuando alguien se une o sale).

   - **`RoomManagementScreen`**: suscríbete a cambios en las habitaciones y asignaciones.

   En todos los casos: gestiona correctamente los canales (usar nombres únicos por pantalla + ID de recurso) y cancela las suscripciones en el `useEffect` cleanup.

2. **Campo "Estilos de vida" en perfiles**:
   - Añade un campo `lifestyle_habits` (array de strings) a la tabla `profiles` en Supabase
   - Define un conjunto predeterminado de opciones: "Madrugador", "Noctámbulo", "No fumador", "Fumador", "Deportista", "Tranquilo", "Sociable", "Trabajador desde casa", "Mascota", etc.
   - En `EditProfileScreen`: añade una sección de selección de estilos de vida con chips (selección múltiple, máximo 5)
   - En `ProfileDetailScreen`: muestra los estilos de vida del usuario con iconos o emojis representativos
   - Incluye los estilos de vida en el cálculo de compatibilidad del Sprint 16

3. **Inicio de Dark Mode**: prepara el terreno para el dark mode (Sprint 20):
   - Asegúrate de que `ThemeContext` existe y tiene la estructura correcta para soportar dos temas
   - Identifica qué colores hardcodeados hay en los componentes que dificultarán el dark mode y apúntalos (no los arregles aún, solo identifícalos)

---

## Sprint 20 — Dark Mode

Implementa el modo oscuro completo en toda la aplicación HomiMatchApp.

**Lo que debes implementar:**

1. **Sistema de temas en `ThemeContext`**:
   - Define dos temas completos: `lightTheme` y `darkTheme`, cada uno con todas las variables de color necesarias: `background`, `surface`, `surfaceVariant`, `primary`, `onPrimary`, `text`, `textSecondary`, `border`, `inputBackground`, `cardBackground`, `tabBar`, etc.
   - El contexto expone: `theme` (objeto con los colores actuales), `isDark` (boolean), `toggleTheme()` (función para cambiar)
   - La preferencia se persiste con `AsyncStorage`
   - Al iniciar la app, carga la preferencia guardada (o detecta la preferencia del sistema con `Appearance.getColorScheme()`)

2. **Actualización de todos los estilos**: recorre todas las pantallas y componentes. En lugar de usar colores hardcodeados, usa `theme.background`, `theme.text`, etc. desde el contexto:
   - Usa `const { theme } = useTheme()` en cada pantalla
   - Los archivos `.styles.ts` deben convertirse en funciones que reciben `theme` como parámetro: `const styles = (theme: Theme) => StyleSheet.create({...})`
   - Asegúrate de que el efecto glassmorphism funciona bien en ambos modos (ajusta la opacidad del blur según el modo)

3. **Pantallas prioritarias** (empieza por estas):
   - `SwipeScreen`: las cards deben verse bien en modo oscuro
   - `ChatScreen` y `MatchesScreen`: burbujas de chat y lista de matches
   - `ProfileDetailScreen` y `RoomDetailScreen`: fondos y textos
   - `LoginScreen` y `RegisterScreen`: formularios de autenticación

4. **Persistencia y transición**:
   - La transición entre modos debe ser suave (no hay animación requerida, pero el cambio no debe causar un flash blanco)
   - El tema seleccionado debe mantenerse al cerrar y reabrir la app

5. **Toggle en la UI**: añade un switch de modo oscuro/claro en `EditProfileScreen` o en una pantalla de configuración, accesible desde el tab de perfil.

---

## Sprint 21 — Premium Features

Implementa la lógica inicial de características premium con limitaciones para usuarios free.

**Lo que debes implementar:**

1. **`PremiumContext` completado** (basado en el inicio del Sprint 18):
   - Campo `is_premium` en tabla `profiles` de Supabase (boolean, default false)
   - El contexto se inicializa leyendo este campo al hacer login
   - Expone: `isPremium`, `swipesRemaining` (para usuarios free), `canUseFeature(featureName: string)`

2. **Limitaciones para usuarios free**:
   - **Límite de swipes diarios**: los usuarios free tienen un límite de, por ejemplo, 20 swipes al día. Al llegar al límite, el `SwipeScreen` muestra un mensaje "Has alcanzado tu límite diario" con un prompt de upgrade
   - **Filtros avanzados bloqueados**: algunos filtros en `FiltersScreen` están reservados para premium. Muéstralos con un icono de candado 🔒 y al intentar usarlos, muestra un modal de upgrade
   - **Sin anuncios**: (placeholder para monetización futura)

3. **Validación de email mejorada** (edge function `auth-check-email`):
   - Antes de enviar el email de verificación en el registro, verifica que el formato es válido y que el dominio existe (DNS check básico)
   - Si el email parece inválido, devuelve un error descriptivo antes de intentar crear el usuario en Supabase

4. **UI para features premium**:
   - Crea un componente `PremiumBadge` que se muestra junto a las features de pago
   - Crea un modal o bottom sheet `PremiumUpgradeModal` con: descripción de los beneficios premium, botón "Obtener Premium" (que de momento puede navegar a una pantalla placeholder), y botón "Cerrar"
   - El modal se puede invocar desde cualquier parte de la app

---

## Sprint 22 — UI Dark Mode Refinamiento

Refina los detalles del modo oscuro y corrige problemas detectados tras la implementación inicial.

**Lo que debes corregir y mejorar:**

1. **`FormSection` para ambos modos**: el componente `FormSection` (usado en formularios de edición) debe adaptar sus colores al tema actual. Corrige el background del contenedor, el color del título de sección, y los bordes para que se vean bien tanto en claro como en oscuro.

2. **Correcciones en múltiples pantallas**: revisa en modo oscuro cada pantalla y corrige los elementos que no se adaptan correctamente:
   - Textos blancos sobre fondo blanco (o negros sobre negro)
   - Inputs con fondo hardcodeado que no respeta el tema
   - Iconos con color fijo que no cambia con el tema
   - Bordes con colores hardcodeados
   - Modales y bottom sheets con fondo incorrecto

3. **Owner puede buscar owner**: corrige el bug por el cual un usuario con tipo "owner" (tiene piso) no podía ver en sus recomendaciones a otros owners. La lógica de recomendaciones debe permitir que un owner busque otro owner para intercambios o colaboraciones. Actualiza la Edge Function de recomendaciones para eliminar esta restricción incorrecta.

4. **Sistema de perfil activo/inactivo**:
   - Añade campo `is_active` (boolean, default true) a la tabla `profiles`
   - En `EditProfileScreen` o en la configuración, añade un toggle "Perfil activo" que permita al usuario pausar su visibilidad en el swipe
   - Los perfiles inactivos no aparecen en las recomendaciones de swipe
   - Cuando el perfil está inactivo, muestra un banner informativo en la app

5. **Merge y limpieza**: después de las correcciones, asegúrate de que no hay ramas de feature sin mergear y que el código está limpio (sin console.logs de debug, sin código comentado innecesario).

---

## Sprint 23 — Ciudades y Zonas

Implementa un sistema completo de ubicaciones geográficas con ciudades españolas y zonas en HomiMatchApp.

**Lo que debes crear:**

1. **Población de la base de datos** con datos geográficos de España:
   - Crea scripts Python para extraer y normalizar datos de OpenStreetMap o fuentes públicas:
     - `extract_geojson.py`: extrae ciudades/municipios de un archivo GeoJSON
     - `extract_places.py`: extrae barrios/distritos de cada ciudad
     - `normalize_areas.py`: normaliza y limpia los nombres de zonas
     - `filter_cities_by_places.py`: filtra ciudades por número mínimo de barrios
   - Genera SQLs de inserción masiva para las tablas `cities` y `areas`
   - Foco en las ciudades más grandes (Madrid, Barcelona, Valencia, Sevilla, Zaragoza, Málaga, Murcia, Palma, Las Palmas, Bilbao...)

2. **Tablas en Supabase**:
   - `cities`: `id`, `name`, `province`, `autonomous_community`, `population`, `latitude`, `longitude`
   - `areas`: `id`, `city_id`, `name`, `type` (district/neighborhood)

3. **Edge Function `locations`**:
   - GET `/cities`: lista de ciudades (con búsqueda por nombre)
   - GET `/cities/:cityId/areas`: zonas de una ciudad
   - GET `/cities/nearby`: ciudades cercanas a una coordenada (para el boost por proximidad)

4. **Servicio `locationService`**:
   - `searchCities(query: string)`: busca ciudades por nombre
   - `getAreasForCity(cityId: string)`: obtiene las zonas de una ciudad
   - `getNearbyCities(cityId: string, radiusKm: number)`: ciudades cercanas

5. **Integración en perfiles**:
   - En `EditProfileScreen`: sustituye el campo de ciudad libre por un selector de ciudad con búsqueda autocomplete, y un selector de zona/barrio dependiente de la ciudad elegida
   - Campo `preferred_city_id` y `preferred_area_id` en `profiles`

6. **Integración en pisos**:
   - En `CreateFlatScreen` y `RoomEditScreen`: selector de ciudad y zona para el piso
   - Campo `city_id` y `area_id` en la tabla de pisos

7. **Filtros por ubicación**:
   - En `FiltersScreen`: selector de ciudad y zona
   - La Edge Function de recomendaciones filtra por ciudad (y opcionalmente por zona)
   - Las ciudades cercanas reciben una penalización menor en lugar de excluirse completamente

8. **Función "Borrar perfil"**: añade opción en la configuración del perfil para eliminar permanentemente la cuenta. Muestra un diálogo de confirmación con texto de advertencia. Al confirmar, elimina los datos del usuario de Supabase Auth y de la tabla `profiles` (y en cascada sus datos relacionados).

9. **`KeyboardAwareContainer`** (componente reutilizable): crea un componente wrapper que gestione automáticamente el comportamiento del teclado en cualquier pantalla. Úsalo en todas las pantallas con formularios como sustituto de las soluciones individuales de sprints anteriores.

---

*Fin de los prompts maestros — Sprints 7 al 23*

*Proyecto: HomiMatchApp | TFG — Pepe Ortiz Roldán | Enero 2026*
