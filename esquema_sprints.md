# Esquema de Sprints - Proyecto HomiMatchApp

**Total de commits analizados**: 266
**Periodo**: Diciembre 2025 - Enero 2026
**Autor principal**: Pepe Ortiz Roldán (97%)

---

## Resumen Ejecutivo

El proyecto HomiMatchApp se desarrolló siguiendo una metodología incremental organizada en sprints funcionales. Inicialmente se establecieron 6 sprints hasta alcanzar la versión v0, seguidos de sprints adicionales para implementar características avanzadas, optimizaciones y refinamientos.

---

## Fase 1: Sprints Originales (hasta v0)

### Sprint 0: Setup Inicial y Planificación
**Periodo**: 1-7 diciembre 2025
**Commits**: #1-#6 (6 commits)

**Objetivo**: Establecer la arquitectura base del proyecto y planificar la UI/UX.

**Funcionalidades principales**:
- Análisis y diseño de interfaz de usuario (`uiAnalysis.md`)
- Configuración inicial del proyecto React Native
- Setup de entorno Android e iOS
- Configuración de ESLint, Prettier y herramientas de desarrollo
- Estructura de carpetas y arquitectura base

**Commits representativos**:
- `6ebc2d8` - Create uiAnalysis.md
- `5ae8f27` - setup
- `3bb2309` - api

**Tecnologías configuradas**: React Native, TypeScript, Supabase, Firebase, ESLint, Prettier

---

### Sprint 1: Fundamentos y Autenticación
**Periodo**: 7-12 diciembre 2025
**Commits**: #7-#10 (4 commits)

**Objetivo**: Implementar el sistema de autenticación y navegación básica.

**Funcionalidades principales**:
- Sistema de autenticación completo (login/registro)
- Navegación básica de la aplicación (AppNavigator, MainNavigator)
- Componentes de UI reutilizables (Button, Input, TextArea)
- Servicios de backend (authService, profileService, roomService)
- Sistema de temas (ThemeContext)
- Integración con Supabase

**Commits representativos**:
- `b3642d5` - Fundamentos y Autenticación
- `f2060a8` - api + theming
- `1fd8a45` - auth hecho

**Screens implementadas**: LoginScreen, RegisterScreen, SwipeScreen

---

### Sprint 2: Sistema de Navegación y Perfiles
**Periodo**: 12 diciembre 2025
**Commits**: #11-#13 (3 commits)

**Objetivo**: Completar el sistema de navegación con tabs y mejorar el registro multi-fase.

**Funcionalidades principales**:
- Navegación por tabs (TabNavigator)
- Iconos personalizados para tabs (TabBarIcon)
- Pantallas principales: Home, Matches
- Registro en múltiples fases (Phase1Email, Phase2Name, Phase3BirthDate)
- Integración con Google Sign-In

**Commits representativos**:
- `bb79a16` - inicio 2º sprint
- `379ff78` - Sprint 2 Inicio ESTABLE
- `9d9a1db` - registro en 3 fases no terminado

**Avances**: Sistema de navegación funcional con 3 pantallas principales

---

### Sprint 3: Gestión de Perfiles y Fotos
**Periodo**: 16-19 diciembre 2025
**Commits**: #14-#15 (2 commits)

**Objetivo**: Implementar la gestión completa de perfiles con subida de fotos.

**Funcionalidades principales**:
- Edición de perfiles completa (EditProfileScreen)
- Sistema de subida de fotos múltiples (ImageUpload)
- Visualización detallada de perfiles (ProfileDetailScreen)
- Servicio de gestión de fotos de perfil (profilePhotoService)
- Backend para almacenamiento de imágenes
- Componentes Chip y ChipGroup para selección de intereses

**Commits representativos**:
- `208d5bb` - profile v1 back + front
- `69a33a6` - sprint 3 hecho

**Features**: Gestión completa de perfiles con múltiples fotos

---

### Sprint 4: Sistema de Matching y Habitaciones (v0)
**Periodo**: 20 diciembre 2025
**Commits**: #16 (1 commit masivo)

**Objetivo**: Implementar el core del sistema de matching y gestión de pisos.

**Funcionalidades principales**:
- Sistema de swipe para matching
- Gestión completa de habitaciones/pisos:
  - CreateFlatScreen
  - RoomDetailScreen
  - RoomEditScreen
  - RoomManagementScreen
  - RulesManagementScreen
  - ServicesManagementScreen
- Chat entre matches (ChatScreen)
- Sistema de filtros de búsqueda (FiltersScreen, SwipeFiltersContext)
- Sistema de recomendaciones de perfiles
- Gestión de servicios y características del piso
- Asignación de habitaciones (roomAssignmentService)
- Sistema de rechazo de swipes (swipeRejectionService)
- Gestión de extras del piso (roomExtrasService)
- Fotos de habitaciones (roomPhotoService)
- Logo y branding de la aplicación

**Commits representativos**:
- `2e5340c` - v0

**Milestone**: Primera versión funcional completa (v0) con 71 archivos modificados

---

### Sprint 5: Refinamiento de Género y Filtros
**Periodo**: 21-22 diciembre 2025
**Commits**: #17-#23 (7 commits)

**Objetivo**: Mejorar el sistema de filtros con opciones de género y preferencias avanzadas.

**Funcionalidades principales**:
- Sistema de géneros completo (gender.ts)
- Fase 3 del registro con selección de género (Phase3Gender)
- Filtros avanzados de género y preferencias
- Refinamiento del sistema de recomendaciones
- Testing de filtros con diferentes configuraciones
- Mejoras en el sistema de filtros de búsqueda
- Refactorización de filtros para incluir:
  - Género del usuario
  - Preferencias de género de compañeros
  - Filtros de "tener piso" vs "buscar piso"

**Commits representativos**:
- `8f4bb47` - generos
- `7cae727` - generos ya se crean bien desde el registro
- `3ad0a39` - testing filtros
- `a3acba6` - primer refinamiento de filtros

**Merge**: PR #2 - filtros-de-genero

---

### Sprint 6: UI Redesign y Mejoras UX
**Periodo**: 22 diciembre 2025
**Commits**: #24-#31 (8 commits)

**Objetivo**: Rediseño completo de la interfaz con glassmorphism y mejoras de UX.

**Funcionalidades principales**:
- Rediseño visual con efecto glassmorphism
- Actualización de todos los componentes UI:
  - Button, Chip, ChipGroup
  - Input, TextArea, FormSection
  - ImageUpload, GoogleSignInButton
- Mejoras en SwipeScreen con animaciones
- Refinamiento de ChatScreen con nuevo diseño
- Actualización de ProfileDetailScreen y FiltersScreen
- Integración de react-native-blur para efectos visuales
- Optimización de componentes con nuevos estilos

**Commits representativos**:
- `58e4d93` - avanzandooo
- `d3b6fed` - actualizando components
- `004e706` - glassmorfismo
- `361e444` - seguimos bregando ahora con el swipe

**Merge**: PR #3 - UI-Redesign

---

## Fase 2: Características Avanzadas (Post-v0)

### Sprint 7: Sistema de Gestión de Gastos
**Periodo**: 22-23 diciembre 2025
**Commits**: #32-#38 (7 commits)

**Objetivo**: Implementar sistema completo de gestión de gastos compartidos.

**Funcionalidades principales**:
- Pantalla de gastos del piso (FlatExpensesScreen)
- Sistema de liquidación de gastos (FlatSettlementScreen)
- Servicios de gestión:
  - flatExpenseService
  - flatSettlementService
- Backend para gastos compartidos
- Gastos específicos por persona
- Histórico de gastos y liquidaciones
- Cálculo automático de deudas entre compañeros

**Commits representativos**:
- `b51d267` - pagos v.0
- `8aa99be` - resumen pagos
- `786b8ae` - v1 de pagos
- `293ea92` - gastos finalizados en principio

**Merge**: PR #4 - gestion-de-gastos

**Features**: Sistema completo de gestión financiera para pisos compartidos

---

### Sprint 8: Correcciones UI/UX
**Periodo**: 23-24 diciembre 2025
**Commits**: #39-#41 (3 commits)

**Objetivo**: Corregir problemas detectados en la interfaz de usuario.

**Funcionalidades principales**:
- Correcciones en LoginScreen y RegisterScreen
- Mejoras en ProfileDetailScreen
- Fixes en SwipeScreen
- Optimización de renders
- Corrección de errores visuales

**Commits representativos**:
- `ecc6bca` - primer fix
- `13f4052` - segundo fix

**Merge**: PR #5 - UI-fix

---

### Sprint 9: Refactorización v1
**Periodo**: 24 diciembre 2025
**Commits**: #42-#46 (5 commits)

**Objetivo**: Refactorizar el código separando estilos de componentes.

**Funcionalidades principales**:
- Separación de estilos en archivos independientes (*.styles.ts)
- Creación de carpeta src/styles/screens/
- Tokenización de estilos (colors, spacing, fonts)
- Archivo común de estilos compartidos (common.ts)
- Reorganización de estructura de archivos
- Mejora de mantenibilidad del código

**Commits representativos**:
- `c580386` - refactorizandoo
- `b7335a0` - primer refactor
- `6779b93` - tokenizacion
- `fb6fa2e` - refactor guay

**Merge**: PR #6 - refactorizacion-v1

**Resultado**: Código más limpio y mantenible con 50 archivos refactorizados

---

### Sprint 10: Recuperación de Contraseñas
**Periodo**: 24-27 diciembre 2025
**Commits**: #47-#51 (5 commits)

**Objetivo**: Implementar sistema completo de recuperación de contraseñas.

**Funcionalidades principales**:
- Pantalla de olvido de contraseña (ForgotPasswordScreen)
- Pantalla de reseteo de contraseña (ResetPasswordScreen)
- Servicio de recuperación en backend
- Deep linking para reseteo desde email
- Configuración de permisos para manejar URLs
- Testing del flujo completo

**Commits representativos**:
- `9476ab5` - recuperacion de contraseñas??
- `34aaeb1` - hmmm
- `ec37331` - recuperacion de contradseña puesta ya

**Merge**: PR #7 - recuperacion-de-contraseñas

---

### Sprint 11: Mejoras UI de Detalles
**Periodo**: 27 diciembre 2025
**Commits**: #52-#55 (4 commits)

**Objetivo**: Mejorar la UI de pantallas de detalle de perfiles y pisos.

**Funcionalidades principales**:
- Rediseño de ProfileDetailScreen
- Mejoras visuales en RoomDetailScreen
- Actualización del tema global
- Fixes menores de UI en FlatExpensesScreen

**Commits representativos**:
- `4965638` - UI dek profile actualizado
- `ea7e248` - UI de piso mejorada
- `ff181ce` - UI fix

---

### Sprint 12: Sistema de Invitaciones
**Periodo**: 27 diciembre 2025
**Commits**: #56-#58 (3 commits)

**Objetivo**: Implementar sistema de invitaciones para unirse a pisos.

**Funcionalidades principales**:
- Fase 4 del registro con código de invitación (Phase4Invitation)
- Servicio de gestión de invitaciones (roomInvitationService)
- Backend para invitaciones (room-invitations)
- Validación de códigos de invitación
- Integración con sistema de navegación
- Matches automáticos entre compañeros de piso
- Visualización de roommates en RoomDetailScreen

**Commits representativos**:
- `9bef2fa` - sistema de invitaciones pretest
- `881a819` - sistema de invitaciones guay salvo que pase algo
- `2ecbb98` - matches entre compañeros de piso, y correcciones UI/UX

---

### Sprint 13: Push Notifications
**Periodo**: 27-28 diciembre 2025
**Commits**: #59-#69 (11 commits)

**Objetivo**: Implementar sistema completo de notificaciones push.

**Funcionalidades principales**:
- Integración con Firebase Cloud Messaging
- Servicio de gestión de tokens (pushTokenService)
- Servicio de notificaciones local (notificationService)
- Backend para diferentes tipos de notificaciones:
  - push-new-message (nuevos mensajes)
  - push-match-status (cambios en matches)
  - push-flat-expense (nuevos gastos)
  - push-flat-settlement (liquidaciones)
  - push-room-assignment (asignaciones de habitación)
- Deep linking para navegar desde notificaciones
- Sistema para no mostrar notificaciones si ya estás en el chat
- Configuración de permisos Android

**Commits representativos**:
- `b32dfd4` - preconfig a firebase
- `aa1223b` - push funcionando en background
- `276a4bc` - push en chats fore and back funcionando
- `0e90d26` - deeplink
- `8c01592` - resto de push

**Merge**: PR #8 - push-notifications

**Resultado**: Sistema completo de notificaciones en tiempo real

---

### Sprint 14: Chats en Tiempo Real
**Periodo**: 28-29 diciembre 2025
**Commits**: #70-#89 (20 commits)

**Objetivo**: Implementar mensajería en tiempo real y mejoras UI.

**Funcionalidades principales**:
- Subscripción a cambios en tiempo real (Supabase Realtime)
- Actualización automática de chats
- Autoscroll en mensajes nuevos
- Orden correcto de chats por último mensaje
- UI mejorada para ChatScreen con glassmorphism
- Rediseño de MatchesScreen
- Mejoras en ProfileDetailScreen y RoomDetailScreen
- Actualización de UI de formularios:
  - EditProfileScreen
  - CreateFlatScreen
  - RoomEditScreen
  - RoomManagementScreen
  - FlatExpensesScreen
  - FlatSettlementScreen

**Commits representativos**:
- `9b85d8d` - mensajes en vivo
- `f5fa6ad` - mensajes autoscrool y orden de chats
- `63a1fcc` - ui glass chat v1
- `8a416c2` - UI MATCHES
- `15a2c46` - fin rework UI

**Merge**: PR #9 - chats-en-realtime

**Resultado**: Mensajería instantánea completamente funcional

---

### Sprint 15: UI Fix Global
**Periodo**: 29-30 diciembre 2025
**Commits**: #90-#102 (13 commits)

**Objetivo**: Correcciones masivas de UI/UX en todas las pantallas.

**Funcionalidades principales**:
- Autoscroll en inputs cuando aparece teclado
- Mejoras en todas las pantallas de registro
- Actualización de ProfileDetailScreen y RoomDetailScreen
- Fixes en ForgotPassword y ResetPasswordScreen
- Mejoras en SwipeScreen con estilos relativos
- Correcciones en TabBar
- Ajustes en MatchesScreen
- Optimización de porcentajes de compatibilidad

**Commits representativos**:
- `9260262` - UI fix
- `902786a` - inputs autoscroll
- `11d80b8` - UI fix + autoscroll en todo menos Filtros
- `16cd84b` - SwipeScreen con relativos UI
- `b25b5d5` - fixin tabbar

**Periodo intenso**: 13 commits en 2 días con múltiples mejoras visuales

---

### Sprint 16: Swipe Porcentual
**Periodo**: 30-31 diciembre 2025
**Commits**: #103-#110 (8 commits)

**Objetivo**: Implementar sistema de compatibilidad porcentual en swipes.

**Funcionalidades principales**:
- Cálculo de porcentaje de compatibilidad
- Visualización de compatibilidad en cards
- Nueva versión de SwipeScreen (SwipeScreenV2)
- Mejoras en algoritmo de recomendaciones
- Correcciones en backend de matches
- Optimización de queries de perfiles

**Commits representativos**:
- `6e70006` - porcentual
- `0c3c3ba` - esta casi
- `ba2fff9` - estado de guardado
- `211ec2a` - arreglando backend y fix swipe

**Merge**: PR #10 - swipe-porcentual

---

### Sprint 17: Hotfixes
**Periodo**: 31 diciembre 2025 - 1 enero 2026
**Commits**: #109-#110 (2 commits)

**Objetivo**: Correcciones urgentes de errores críticos.

**Commits representativos**:
- `a2ec3d6` - hotfix
- `964a01a` - hotfix 2

**Merge**: PR #11 - UI-rework (consolidación de cambios)

---

## Fase 3: Características Premium y Optimización

### Sprint 18: Filtros Mejorados y Google Auth
**Periodo**: 1-2 enero 2026
**Commits**: #112-#117 (6 commits)

**Objetivo**: Mejorar sistema de filtros y completar integración con Google.

**Funcionalidades principales**:
- Actualización completa del sistema de filtros
- Lógica básica para funcionalidades premium (PremiumContext)
- Mejoras en navegación principal (MainNavigator anclado)
- Finalización de Google Authentication
- Correcciones en TabBarIcon

**Commits representativos**:
- `f5d656c` - inicio de google
- `cec4969` - update filters (por Raquezin)
- `86ae66e` - rama cerrada

**Merge**:
- PR #12 - feat/edit-filters
- PR #13 - google-auth

---

### Sprint 19: Realtime y Estilos de Vida
**Periodo**: 2 enero 2026
**Commits**: #118-#122 (5 commits)

**Objetivo**: Actualización en tiempo real y nueva funcionalidad de estilos de vida.

**Funcionalidades principales**:
- Subscripción realtime para todas las pantallas:
  - FlatExpensesScreen
  - FlatSettlementScreen
  - MatchesScreen
  - RoomDetailScreen
  - RoomManagementScreen
- Nuevo campo de estilos de vida en perfiles
- Inicio de Dark Mode

**Commits representativos**:
- `7bce248` - realtime
- `7269870` - realtime 2
- `398c347` - Estilos de vida
- `a83bfed` - inicio dark

---

### Sprint 20: Dark Mode
**Periodo**: 2 enero 2026
**Commits**: #121-#128 (8 commits)

**Objetivo**: Implementar modo oscuro completo en toda la aplicación.

**Funcionalidades principales**:
- Sistema de temas claro/oscuro
- ThemeContext mejorado con toggle
- Actualización de todos los estilos para soportar dark mode
- Persistencia de preferencia de tema
- Transiciones suaves entre temas
- Adaptación de colores para mejor legibilidad

**Commits representativos**:
- `0f0968b` - avanzando
- `6c4094d` - avnazandoo swipe
- `7418d22` - darkmode v1

**Merge**:
- PR #14 - UI-dark-mode
- PR #15 - UI-dark-mode (fixes)

**Resultado**: Aplicación completamente adaptada a modo claro y oscuro

---

### Sprint 21: Premium Features
**Periodo**: 2 enero 2026
**Commits**: #129-#130 (2 commits, por Raquezin)

**Objetivo**: Implementar lógica inicial de características premium.

**Funcionalidades principales**:
- Contexto de Premium con lógica de suscripción
- Limitaciones para usuarios free
- Validación de email mejorada (auth-check-email)
- UI para mostrar features premium

**Commits representativos**:
- `dcbb9ac` - edit filters and sample logic for premium
- `80a49ac` - try 1

---

### Sprint 22: UI Dark Mode Refinamiento
**Periodo**: 2-3 enero 2026
**Commits**: #131-#138 (8 commits)

**Objetivo**: Refinar detalles del modo oscuro y correcciones.

**Funcionalidades principales**:
- Mejoras en FormSection para ambos modos
- Correcciones en múltiples pantallas
- Owner puede buscar owner (antes no podía)
- Sistema de perfil activo/inactivo
- Merging de branches

**Commits representativos**:
- `5406bb3` - UI 2
- `d733cee` - owner ya puede buscar owner
- `f065d09` - perfil activo

**Merge**: PR #16 - UI-dark-mode (refinamientos)

---

### Sprint 23: Ciudades y Zonas
**Periodo**: 3 enero 2026
**Commits**: #139-#155 (17 commits)

**Objetivo**: Implementar sistema completo de ubicaciones con ciudades y zonas.

**Funcionalidades principales**:
- Población de base de datos con ciudades españolas
- Scripts de extracción de datos geográficos:
  - extract_geojson.py
  - extract_places.py
  - normalize_areas.py
  - filter_cities_by_places.py
- Datos de áreas y lugares por ciudad
- Backend de ubicaciones (locations)
- Servicio de ubicaciones (locationService)
- Filtros por ciudad y zona
- Proximidad de ciudades
- Sistema de zonas para pisos
- Perfiles con preferencias de ubicación
- Capacidad del piso y filtros asociados
- Función de borrar perfil
- KeyboardAwareContainer para mejor UX (por Raquezin)
- Sistema responsive

**Commits representativos**:
- `3100411` - populate v1
- `374307a` - populate tuned
- `9288c07` - backend listo
- `78e44e5` - front casi ya
- `242e32f` - capacidad del piso + filtros

**Merge**: PR #20 - Ciudades-y-zonas

**Resultado**: Sistema completo de geolocalización con +1.5M líneas de datos

---

### Sprint 24: Registro con Google y Onboarding
**Periodo**: 3-5 enero 2026
**Commits**: #156-#167 (12 commits)

**Objetivo**: Mejorar registro con Google y crear onboarding interactivo.

**Funcionalidades principales**:
- Flujo de registro con Google simplificado
- Onboarding interactivo multipasos:
  - Bienvenida
  - Funcionalidades principales
  - Cómo funciona el matching
  - Configuración de ubicación
  - Selección de intereses
  - Subida de foto de perfil
- OnboardingScreen con navegación por gestos
- Actualización de dependencias
- Resolución de nombre en todo el sistema (firstName + lastName)
- Utilidad para manejo de nombres (name.ts)

**Commits representativos**:
- `5108d69` - google register solucionado
- `d29bf19` - onboarding v1
- `f624b9e` - onboarding guay
- `d4f9413` - nombre resuelto
- `b3b6d73` - onboarding hecho

**Merge**: PR #21 - google-register

**Features**: Experiencia de primer uso completamente renovada

---

### Sprint 25: Testing Integral
**Periodo**: 6-12 enero 2026
**Commits**: #168-#194 (27 commits)

**Objetivo**: Implementar suite completa de testing.

**Funcionalidades principales**:
- Tests de base de datos (database-tests.sql)
- Seed de datos básicos (seed-basic.sql)
- Tests de Edge Functions:
  - auth-login.test.ts
  - auth-register-phase*.test.ts
  - matches.test.ts
  - profiles.test.ts
  - chats.test.ts
  - rooms.test.ts
  - room-assignments.test.ts
  - photos.test.ts
  - swipe-rejections.test.ts
  - invite-codes.test.ts
- Tests de servicios con Jest:
  - 20 archivos de tests para servicios
  - Configuración de Jest y setup
- CI/CD con GitHub Actions
- Documentación de testing:
  - DATABASE_TESTING.md
  - EDGE_FUNCTIONS_TESTING.md
  - SERVICE_TESTS.md
- Correcciones en ProfileDetailScreen
- Mejoras en SwipeScreen cards
- Sistema de perfil activo
- Eliminación de display_name (usar firstName + lastName)

**Commits representativos**:
- `b5d4597` - test: add comprehensive database testing system
- `0a48e12` - feat: add comprehensive edge functions testing system
- `aee4017` - jest
- `40d0a84` - eliminando display_name de profiles

**Merge**: PR #22 - campos-mínimos-swipecard (con tests incluidos)

**Resultado**: Cobertura de testing completa en todos los niveles

---

### Sprint 26: Correcciones y Refinamientos
**Periodo**: 12-16 enero 2026
**Commits**: #195-#215 (21 commits)

**Objetivo**: Corregir bugs detectados y refinar funcionalidades.

**Funcionalidades principales**:
- Correcciones en SwipeScreen
- Fixes en ChatScreen UI
- Mejoras en sistema de recomendaciones de perfiles
- Corrección de filtros
- Servicio de límites de swipes (swipeLimitService)
- Backend para swipes (swipes/index.ts)
- Mejoras en profile sharing
- Función de eliminar match
- Barra de progreso de compatibilidad
- Validación de edad (18+ años)
- Sistema de solicitudes de mensaje (message-requests)
- Corrección de transiciones de estados de match
- Fix en teclado del chat
- Fix LINT masivo (41 archivos corregidos)
- Borrado automático de chats al hacer unmatch

**Commits representativos**:
- `8bc9935` - fixUI
- `ce4df25` - fix swipes
- `b3a0152` - profiles recommendations fix
- `559f133` - fixeando cosas
- `0555dec` - eliminar match y barra de progreso
- `3381a90` - validación de edad
- `2138df1` - funcion de envio de mensaje
- `eb2b921` - fix LINT
- `fee27d8` - fix transicion estados de match

**Periodo intenso**: 21 commits con múltiples correcciones críticas

---

### Sprint 27: Sharing y Flat Management
**Periodo**: 18-23 enero 2026
**Commits**: #216-#226 (11 commits)

**Objetivo**: Mejorar funcionalidades de compartir y gestión de pisos.

**Funcionalidades principales**:
- Flat-share-image: compartir imágenes del piso
- Room-share-image: compartir habitaciones específicas
- Mejoras en profileShare
- EditProfileScreen mejorado con crop de imágenes
- Componente RoomSelector para selección de habitación
- Utilidad para iconos (iconUtils.tsx)
- Mejoras visuales en RoomDetailScreen y RoomManagementScreen
- OnboardingScreen refinado con mejor UX
- Corrección de lógica de profile-recommendations
- Mejoras en MatchesScreen
- Actualización de README

**Commits representativos**:
- `3c2d3f1` - flat-share y room-share
- `85a0107` - profileshareUpdate
- `b8057ab` - hasta el cropeo
- `661c05d` - onboarding bien
- `15855e6` - edit profile hecho
- `b3bab4a` - matches screen hecho

---

### Sprint 28: Grupos de Gastos
**Periodo**: 23-25 enero 2026
**Commits**: #228-#238 (11 commits)

**Objetivo**: Implementar sistema de grupos independientes para gastos.

**Funcionalidades principales**:
- Grupos de gastos independientes del piso:
  - expenseGroupService
  - Backend expense-groups
  - Backend expense-group-invites
  - Backend group-expenses
- Pantalla de miembros del grupo (GroupMembersScreen)
- Notificaciones push para grupos (push-group-expense)
- Tests para expenseGroupService
- Sistema de invitaciones a grupos
- Mejoras en sistema de recomendaciones
- Nuevo modo de apariencia (owner/tenant/both)
- AppearanceModeSelector component
- Utilidad appearanceMode.ts
- Documentación de BBDD actual (bbddActual.md)

**Commits representativos**:
- `3d4ff6a` - grupos independientes de pisos
- `6a22187` - onboarding en backend y mejorando los grupos de gasto
- `3851db5` - push notifications grupos de gasto
- `02e0768` - grupos de gastos ya guay
- `bed23c2` - cambiando el tema del owner
- `cfedf88` - grupos de gastos finiquitao

**Features**: Sistema flexible de gastos compartidos más allá del piso

---

### Sprint 29: Lanzamiento Regional
**Periodo**: 25-26 enero 2026
**Commits**: #239-#249 (11 commits)

**Objetivo**: Preparar lanzamiento por provincias con seguridad mejorada.

**Funcionalidades principales**:
- Lanzamiento por provincias (geolocalización)
- Boost a usuarios de mismas provincias en recomendaciones
- Eliminación de claves hardcodeadas:
  - Uso de react-native-config
  - Variables de entorno (.env)
  - google-services.json.example
  - Tipos para react-native-config
- Configuración de JWT para Edge Functions (config.toml)
- Eliminación de logs de desarrollo
- Mejoras en componente FormSection
- Pulido de FiltersScreen y ProfileDetailScreen
- Zoom en imágenes de perfil (ProfileDetailScreen)
- Zoom en imágenes de habitaciones (RoomDetailScreen)
- OnboardingScreen con mejoras finales

**Commits representativos**:
- `a6fae1f` - vale gracias a Dios, el lanzamiento por provincias ya funciona
- `59c06cf` - quitando claves hardcodeadas
- `85de61b` - fix jwt
- `10f4f54` - boost a usuarios de las mismas provincias
- `1f785ce` - puliendo
- `a1fe6f1` - zoom en profiledetail funciona
- `ad6a3fd` - Zoom primera version funcional al menos

**Resultado**: App preparada para despliegue con seguridad mejorada

---

### Sprint 30: Stripe y Monetización
**Periodo**: 26-27 enero 2026
**Commits**: #250-#253 (4 commits)

**Objetivo**: Implementar sistema de suscripciones con Stripe.

**Funcionalidades principales**:
- Integración completa con Stripe:
  - stripeService
  - stripe-create-checkout-session
  - stripe-create-portal-session
  - stripe-subscription-status
  - stripe-webhook
- SubscriptionScreen para gestión de suscripciones
- AccountOptionsScreen para configuración de cuenta
- Webhooks de Stripe para actualización automática de estado
- Configuración de Stripe en Supabase (config.toml)
- Sistema de planes premium
- Portal de cliente de Stripe
- Gestión de estados de suscripción

**Commits representativos**:
- `78812e0` - implementacion de Stripe
- `03e9a8f` - stripe funcionando
- `149befa` - puliendo pantallas de suscripciones
- `0ee0189` - puliendo pantallas

**Features**: Sistema completo de monetización funcional

---

### Sprint 31: UX Final y Componentes Mejorados
**Periodo**: 28-29 enero 2026
**Commits**: #254-#266 (13 commits)

**Objetivo**: Refinamiento final de UX y componentes avanzados.

**Funcionalidades principales**:
- SwipeCard component independiente con diseño mejorado
- Nuevos componentes de UI:
  - LocationSearchInput
  - LocationSelector
  - BudgetRangeSlider
  - DualRangeSlider
  - RoommatesRangeSlider
- Mejoras en búsqueda de ubicaciones
- Zoom mejorado en imágenes (con gestos pinch)
- UX de mensajes sin match
- Boost de usuarios premium en recomendaciones
- Nuevos estilos de cards con información completa:
  - Ubicación (ciudad, zona, distancia)
  - Edad y género
  - Estilos de vida
  - Compatibilidad porcentual
  - Badges visuales
- Mejoras en ProfileDetailScreen con nuevo layout
- Sistema de solicitudes de mensaje
- Utilidad messageRequests.ts
- Refactorización del sistema de panners/sliders
- FlatExpensesScreen con mejoras finales

**Commits representativos**:
- `06b897a` - cambiando las cards
- `6c7bd7b` - seguim
- `d7cc0b8` - mejorando las cards
- `ce2f34b` - card light finiquitao
- `da4a3a7` - tarjeta hecha
- `d4e0154` - UX de busqueda en zonas mejorado
- `10e8ae4` - refactor de el panner
- `a827f77` - Zoom mejorado
- `3c40b4f` - UX de loss mensajes sin match
- `fc7fc8e` - boost de premium
- `892ada8` - ya estaría
- `a32d644` - fix rápido

**Resultado**: Aplicación pulida con componentes reutilizables y UX optimizada

---

## Análisis de Desarrollo

### Distribución de Esfuerzo por Área

**1. UI/UX (≈35% de commits)**
- Múltiples iteraciones de diseño
- Glassmorphism y efectos visuales
- Dark mode completo
- Responsive design
- Componentes reutilizables

**2. Backend y Servicios (≈25% de commits)**
- Edge Functions de Supabase
- Sistema de autenticación
- Servicios de negocio
- Webhooks y notificaciones

**3. Funcionalidades Core (≈20% de commits)**
- Sistema de matching
- Gestión de pisos
- Sistema de chat
- Gestión de gastos

**4. Testing y Calidad (≈10% de commits)**
- Tests de base de datos
- Tests de Edge Functions
- Tests de servicios
- CI/CD

**5. Optimizaciones y Refactoring (≈10% de commits)**
- Refactorización de código
- Separación de estilos
- Eliminación de código duplicado
- Mejoras de rendimiento

### Patrones de Desarrollo Observados

1. **Desarrollo Iterativo**: Múltiples pasadas sobre las mismas funcionalidades
2. **Sprints Cortos**: 2-5 días por sprint
3. **Commits Frecuentes**: 266 commits en ~2 meses
4. **Pull Requests**: 26 PRs para integración de features
5. **Hotfixes**: Respuesta rápida a bugs críticos
6. **Testing Tardío**: Tests implementados después de v0

### Hitos Importantes

| Fecha | Hito | Commits |
|-------|------|---------|
| 1 dic 2025 | Inicio del proyecto | #1 |
| 12 dic 2025 | Sprint 2 estable | #10 |
| 20 dic 2025 | **v0 - Primera versión funcional** | #16 |
| 22 dic 2025 | Sistema de filtros completo | #23 |
| 23 dic 2025 | Gestión de gastos | #38 |
| 24 dic 2025 | Refactorización v1 | #46 |
| 28 dic 2025 | Push notifications | #69 |
| 31 dic 2025 | Swipe porcentual | #108 |
| 2 ene 2026 | Dark mode | #126 |
| 3 ene 2026 | Ciudades y zonas | #155 |
| 8 ene 2026 | Testing completo | #180 |
| 26 ene 2026 | Integración Stripe | #251 |
| 29 ene 2026 | **Release final** | #266 |

---

## Tecnologías y Herramientas

### Frontend
- React Native
- TypeScript
- React Navigation
- React Native Gesture Handler
- React Native Reanimated
- React Native Blur
- React Native Config

### Backend
- Supabase (Database + Auth + Storage + Realtime)
- Deno (Edge Functions)
- PostgreSQL

### Servicios Externos
- Firebase Cloud Messaging
- Google Sign-In
- Stripe (Payments)
- OpenStreetMap (Geolocalización)

### Testing
- Jest
- GitHub Actions (CI/CD)

### Desarrollo
- ESLint
- Prettier
- Git Flow con Pull Requests

---

## Métricas del Proyecto

- **266 commits** en ~8 semanas
- **+5.25M líneas añadidas** (incluye datos geográficos)
- **-405K líneas eliminadas**
- **26 Pull Requests**
- **3 contribuidores**
- **~33 commits/semana** promedio
- **97% contribución** del autor principal

### Archivos Más Trabajados

1. **SwipeScreen.tsx** - 66 modificaciones
2. **ProfileDetailScreen.tsx** - 65 modificaciones
3. **EditProfileScreen.tsx** - 41 modificaciones
4. **FiltersScreen.tsx** - 33 modificaciones
5. **ChatScreen.tsx** - 31 modificaciones

---

## Conclusiones

El proyecto HomiMatchApp siguió una metodología de desarrollo ágil con sprints bien definidos, comenzando con una base sólida en los primeros 6 sprints hasta alcanzar la v0. Los sprints posteriores se enfocaron en:

1. **Refinamiento continuo** de UI/UX
2. **Características avanzadas** (gastos, notificaciones, grupos)
3. **Monetización** con Stripe
4. **Testing integral** en todas las capas
5. **Optimizaciones** de rendimiento y UX
6. **Preparación para producción** con seguridad mejorada

El desarrollo mostró una evolución natural desde funcionalidades básicas hacia características premium y optimizaciones, con una fuerte atención al detalle en la experiencia del usuario y la calidad del código.

---

## Análisis de Tiempo Efectivo de Desarrollo

### Metodología de Cálculo

Para obtener una estimación conservadora del tiempo de desarrollo efectivo, se aplicaron criterios diferenciados según la fase del proyecto, reconociendo las diferentes naturalezas del trabajo en cada etapa:

- **Fase 1 (Commits 1-16, hasta v0)**: Los gaps mayores a 16 horas se contabilizaron como 10 horas cada uno, reconociendo que la fase inicial incluye investigación, aprendizaje y diseño de arquitectura que requieren períodos de reflexión.
- **Fase 2 (Commits 17-266, desde v0)**: Los gaps mayores a 10 horas se excluyeron completamente del conteo, aplicando un criterio más estricto para la fase de desarrollo activo donde la arquitectura ya estaba consolidada.

Este enfoque diferenciado permite capturar mejor la realidad del desarrollo: una fase exploratoria inicial con pausas más largas pero productivas, seguida de una fase de implementación intensiva con sesiones más concentradas.

### Resultados

#### Fase 1: Desarrollo hasta v0 (1-20 diciembre 2025)

- **Commits**: 15
- **Tiempo efectivo**: 70.7 horas (2.9 días)
- **Promedio por commit**: 4.71 horas
- **Gaps limitados**: 5 gaps >16h (417.3h reales → 50h contadas)
  - 4 gaps muy grandes (>40h): 393.7h reales
  - 1 gap grande (16-40h): 23.6h reales
- **Características**: Fase de exploración y aprendizaje con desarrollo intermitente. Incluye configuración de entorno, investigación de tecnologías (React Native, Supabase) y diseño de arquitectura base.

#### Fase 2: Desarrollo desde v0 (20 diciembre 2025 - 29 enero 2026)

- **Commits**: 250
- **Tiempo efectivo**: 201.3 horas (8.4 días)
- **Promedio por commit**: 0.81 horas
- **Gaps excluidos**: 28 gaps >10h (754.4h excluidas completamente)
  - 8 gaps muy grandes (>40h): 426.0h
  - 20 gaps grandes (10-40h): 328.4h
- **Características**: Desarrollo concentrado post-MVP con arquitectura consolidada. Ritmo de trabajo intensivo con commits frecuentes y sesiones de desarrollo enfocadas.

#### Totales del Proyecto

- **Total de commits**: 265
- **Tiempo efectivo total**: **271.9 horas**
- **Equivalente**:
  - **11.3 días** de desarrollo efectivo
  - **~1.6 semanas**
  - **~0.4 meses**
- **Promedio por commit**: 1.03 horas

### Distribución del Esfuerzo

| Fase | Periodo | Tiempo | Commits | % Tiempo | % Commits |
|------|---------|--------|---------|----------|-----------|
| Hasta v0 | 1-20 dic | 70.7h (2.9d) | 15 | 26.0% | 5.7% |
| Desde v0 | 20 dic - 29 ene | 201.3h (8.4d) | 250 | 74.0% | 94.3% |
| **Total** | **1 dic - 29 ene** | **271.9h (11.3d)** | **265** | **100%** | **100%** |

### Detalles de Gaps Procesados

#### Fase 1: Gaps Limitados (>16h → 10h contadas)

Los 5 gaps más grandes de la fase inicial, ordenados por duración:

1. **142.2h** (5d 22h) → contadas 10h | Commits #5 → #6: Pausa extendida en fase inicial (2-7 dic)
2. **92.2h** (3d 20h) → contadas 10h | Commits #7 → #8: Desarrollo intermitente inicial (8-11 dic)
3. **84.9h** (3d 12h) → contadas 10h | Commits #13 → #14: Pausa entre Sprint 2 y desarrollo de profiles (12-16 dic)
4. **74.5h** (3d 2h) → contadas 10h | Commits #14 → #15: Pausa antes de Sprint 3 (16-19 dic)
5. **23.6h** (23h 38m) → contadas 10h | Commits #15 → #16: Preparación final para v0 (19-20 dic)

**Resumen Fase 1:**
- Horas reales de gaps: 417.3h
- Horas contadas: 50h (10h × 5 gaps)
- Horas descartadas: 367.3h

#### Fase 2: Gaps Excluidos (>10h → 0h contadas)

Top 10 gaps más grandes excluidos completamente en la fase de desarrollo activo:

1. **68.9h** (2d 20h) | Commits #207 → #208: Fin de semana largo (13-16 ene)
2. **66.9h** (2d 18h) | Commits #219 → #220: Fin de semana largo (19-22 ene)
3. **55.7h** (2d 7h) | Commits #186 → #187: Pausa entre sprints (9-12 ene)
4. **51.0h** (2d 2h) | Commits #213 → #214: Fin de semana (16-18 ene)
5. **50.8h** (2d 2h) | Commits #49 → #50: Navidad 2025 (24-27 dic)
6. **49.5h** (2d 1h) | Commits #169 → #170: Pausa entre sprints (6-8 ene)
7. **42.1h** (1d 18h) | Commits #16 → #17: Descanso post-v0 (20-21 dic)
8. **41.2h** (1d 17h) | Commits #111 → #112: Nochevieja/Año Nuevo (31 dic - 1 ene)
9. **23.3h** (23h 17m) | Commits #165 → #166: Descanso nocturno extendido (4-5 ene)
10. **22.5h** (22h 32m) | Commits #251 → #252: Descanso nocturno (27 ene)

... y 18 gaps más (10-22h cada uno)

**Resumen Fase 2:**
- Total de gaps excluidos: 28 gaps
- Horas reales de gaps: 754.4h
- Horas contadas: 0h (exclusión completa)
- Horas descartadas: 754.4h

### Patrones Observados

1. **Fase inicial exploratoria con mayor inversión por commit**: La Fase 1 mostró 4.71 horas por commit, reflejando:
   - Configuración inicial de entorno y herramientas
   - Curva de aprendizaje de React Native y Supabase
   - Diseño y validación de arquitectura base
   - Períodos de investigación y planificación entre commits
   - 5 gaps grandes que incluyen trabajo de reflexión y diseño

2. **Fase de desarrollo productivo y concentrado**: Desde v0, el promedio bajó a 0.81h por commit, indicando:
   - Arquitectura consolidada y patrones establecidos
   - Workflow optimizado con componentes reutilizables
   - Commits más frecuentes y atómicos
   - Sesiones de desarrollo más enfocadas
   - 28 gaps excluidos corresponden a descansos, fines de semana y festividades

3. **Distribución de esfuerzo**:
   - Fase 1 representa el 5.7% de los commits pero 26% del tiempo efectivo
   - Fase 2 representa el 94.3% de los commits con 74% del tiempo efectivo
   - Ratio de inversión: Fase 1 tuvo 5.8x más tiempo por commit que Fase 2

4. **Ritmo de desarrollo**: ~24 commits por día de trabajo efectivo en promedio (265 commits / 11.3 días efectivos)

### Consideraciones

- El **tiempo calendario** fue de **59 días** (1 diciembre 2025 - 29 enero 2026)
- El **tiempo efectivo** representa **19.1%** del tiempo calendario (11.3 / 59 días)
- Esta metodología dual reconoce las diferentes naturalezas del trabajo:
  - **Fase 1**: Incluye parcialmente el tiempo de investigación y diseño (gaps limitados a 10h)
  - **Fase 2**: Excluye pausas largas para enfocarse en desarrollo puro (gaps >10h excluidos)
- El tiempo total excluido/limitado fue de 1121.7h (46.7 días):
  - Fase 1: 367.3h descartadas de gaps de investigación
  - Fase 2: 754.4h excluidas (descansos nocturnos, fines de semana, festividades)
- La métrica resultante proporciona una estimación **conservadora pero realista** del tiempo de desarrollo efectivo
- No incluye:
  - Tiempo de planificación previo al primer commit
  - Reuniones y coordinación (proyecto individual)
  - Documentación externa al código
  - Tiempo de investigación no reflejado en commits

---

**Documento generado**: 30 enero 2026
**Fuente**: Análisis de 266 commits del repositorio HomiMatchApp
**Metodología**: Análisis cronológico y temático de mensajes de commit. Cálculo de tiempo efectivo con metodología dual: Fase 1 (gaps >16h limitados a 10h), Fase 2 (gaps >10h excluidos completamente).

### Distribución del Tiempo por Fases del TFG

Mapeando los sprints y commits del proyecto a las fases definidas en el documento del TFG:

#### Fase 1: Análisis y Diseño Inicial

- **Periodo**: Previo al primer commit
- **Tiempo efectivo**: No medible en el análisis de commits
- **Características**: Análisis de requisitos, estudio competitivo, diseño de arquitectura y selección de tecnologías
- **Nota**: Este trabajo preparatorio no está reflejado en el historial de commits

#### Fase 2: Configuración del Entorno (Sprint 0)

- **Commits**: #1-#6
- **Periodo**: 1-7 diciembre 2025
- **Tiempo efectivo**: ~28.3 horas (~1.2 días)
- **% del total**: 10.4%
- **Trabajo realizado**: Setup inicial, configuración de React Native, Supabase, estructura base del proyecto

#### Fase 3: Desarrollo de Funcionalidades Core (Sprints 1-6)

- **Commits**: #7-#31
- **Periodo**: 7-22 diciembre 2025
- **Tiempo efectivo**: ~54.5 horas (~2.3 días)
  - Hasta v0 (commits #7-#16): ~42.4h
  - Post v0 (commits #17-#31): ~12.1h
- **% del total**: 20.0%
- **Trabajo realizado**: 
  - Autenticación y navegación básica
  - Sistema de perfiles y fotos
  - Sistema de matching y habitaciones (v0)
  - Refinamiento de filtros de género
  - UI Redesign completo

#### Fase 4: Características Avanzadas Post-v0 (Sprints 7-23)

- **Commits**: #32-#155
- **Periodo**: 22 diciembre 2025 - 3 enero 2026
- **Tiempo efectivo**: ~99.8 horas (~4.2 días)
- **% del total**: 36.7%
- **Trabajo realizado**:
  - Gestión de gastos compartidos
  - Sistema de recuperación de contraseñas
  - Push notifications
  - Chats en tiempo real
  - Dark mode completo
  - Sistema de ciudades y zonas
  - Múltiples iteraciones de UI/UX
  - Filtros mejorados y Google Auth

#### Fase 5: Premium e Implementación Final (Sprints 24-31)

- **Commits**: #156-#266
- **Periodo**: 3-29 enero 2026
- **Tiempo efectivo**: ~89.4 horas (~3.7 días)
- **% del total**: 32.9%
- **Trabajo realizado**:
  - Testing integral (database, edge functions, servicios)
  - Sistema de onboarding
  - Grupos de gastos independientes
  - Lanzamiento escalonado por provincias
  - Integración con Stripe
  - UX final y componentes mejorados
  - Preparación para producción

#### Resumen de Distribución

| Fase TFG | Sprints | Commits | Tiempo | % Tiempo | Característica Principal |
|----------|---------|---------|--------|----------|-------------------------|
| Fase 1: Análisis | Pre-proyecto | - | No medible | - | Diseño y planificación |
| Fase 2: Setup | Sprint 0 | #1-#6 | 28.3h (1.2d) | 10.4% | Configuración base |
| Fase 3: Core | Sprints 1-6 | #7-#31 | 54.5h (2.3d) | 20.0% | Funcionalidades esenciales |
| Fase 4: Avanzadas | Sprints 7-23 | #32-#155 | 99.8h (4.2d) | 36.7% | Features premium iniciales |
| Fase 5: Final | Sprints 24-31 | #156-#266 | 89.4h (3.7d) | 32.9% | Testing, monetización, UX |
| **Total medible** | **31 sprints** | **266 commits** | **271.9h (11.3d)** | **100%** | **Proyecto completo** |

#### Observaciones por Fase

1. **Fase 2 (Setup)**: Alta inversión inicial en configuración (10.4% del tiempo con solo 2.3% de commits)
   - Ratio: 4.7h por commit
   - Trabajo de infraestructura y decisiones arquitectónicas fundamentales

2. **Fase 3 (Core)**: Desarrollo eficiente del MVP (20% del tiempo con 11.7% de commits)
   - Ratio: 2.2h por commit
   - Incluye el hito más importante (v0) y primeras iteraciones de UI

3. **Fase 4 (Avanzadas)**: Mayor inversión de tiempo (36.7% con 46.6% de commits)
   - Ratio: 0.8h por commit
   - Gran volumen de características nuevas y refinamientos
   - Periodo de mayor productividad en términos de commits/día

4. **Fase 5 (Final)**: Pulido y preparación para producción (32.9% con 41.7% de commits)
   - Ratio: 0.8h por commit
   - Testing integral, monetización y optimizaciones finales
   - Ritmo sostenido de desarrollo con enfoque en calidad

La distribución muestra un patrón típico de desarrollo de software: alta inversión inicial en setup, desarrollo intensivo del core, seguido de expansión de características y finalmente pulido y preparación para producción.
