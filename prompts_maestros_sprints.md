# Prompts Maestros por Sprint — HomiMatchApp
**Sprints 7 al 23** | Fase 2: Características Avanzadas (Post-v0)

> Contexto base: Tengo una app de React Native con TypeScript que se llama HomiMatchApp, sirve para encontrar piso o compañeros de habitación. El backend es Supabase (base de datos, auth, storage y realtime), las notificaciones push van con Firebase, y la navegación con React Navigation. Visualmente tiene un estilo glassmorphism con una paleta de colores y espaciados centralizados en tokens. Ya hay una versión funcional con login, registro, perfiles con fotos, swipe para hacer match, gestión de pisos, chat básico y filtros por género.

---

## Sprint 7 — Sistema de Gestión de Gastos

Quiero añadir a la app una sección para gestionar los gastos compartidos del piso. La idea es que los compañeros puedan apuntar quién pagó qué, cuánto, y que la app calcule sola quién le debe dinero a quién para que sea fácil saldar las cuentas.

Necesitaría básicamente dos pantallas: una donde se listen y creen los gastos del piso, y otra donde se vea el resumen de quién debe qué a quién y se pueda marcar como saldado. Cada gasto debería tener una descripción, el importe, quién lo pagó, y entre quién se reparte.

Para el cálculo de las deudas, busca algo eficiente, lo típico es que el que más debe le pague al que más se le debe primero, para minimizar el número de transferencias.

Necesitas crear las tablas correspondientes en Supabase y las edge functions para leer y crear gastos y liquidaciones. Todo accesible desde la pantalla de gestión del piso que ya existe.

Usa el mismo estilo visual que el resto de la app. Solo los miembros del piso deberían poder ver y tocar esto.

---

## Sprint 8 — Correcciones UI/UX

Hay varios problemas visuales en la app que quiero corregir antes de seguir añadiendo cosas.

El principal es que en el login y en las distintas fases del registro, cuando aparece el teclado los inputs quedan tapados y no se puede escribir bien. Hay que arreglarlo para que el contenido suba o haga scroll cuando el teclado está visible.

En la pantalla de detalle de perfil hay márgenes raros y los chips de intereses a veces se cortan. Las fotos tampoco tienen la proporción correcta.

En el swipe a veces hay un parpadeo raro al cambiar de card, hay que investigar qué lo causa y arreglarlo. También revisar que los gestos de swipe no interfieran con los botones de like/dislike.

En general, dale un repaso a todas las pantallas buscando textos cortados, elementos que se monten unos encima de otros, cosas que se salgan de la pantalla... e intenta usar medidas relativas en lugar de píxeles fijos donde sea posible.

---

## Sprint 9 — Refactorización v1: Separación de Estilos

El código tiene los estilos mezclados con la lógica en cada pantalla y empieza a ser difícil de mantener. Quiero separarlo.

La idea es mover los `StyleSheet.create` de cada pantalla a su propio archivo de estilos (algo como `LoginScreen.styles.ts`), y crear una carpeta `src/styles/` con eso ordenado. Además, unificar los colores, espaciados y tamaños de fuente en archivos de tokens para poder cambiarlos desde un sitio central.

Los estilos que se repiten en muchas pantallas (el contenedor base, el botón principal, los inputs...) sería ideal moverlos a un archivo común y reutilizarlos.

Importante: esto es una refactorización pura, no debe cambiar nada visualmente ni en la lógica. Solo reorganizar el código para que sea más mantenible.

---

## Sprint 10 — Recuperación de Contraseñas

Necesito añadir el flujo típico de "olvidé mi contraseña". Desde el login debería haber un enlace que lleve a una pantalla donde el usuario pone su email y le llegue un correo con un enlace para restablecer la contraseña.

Al tocar ese enlace desde el email, la app debería abrirse directamente en una pantalla donde pueda introducir la nueva contraseña (con confirmación). Habría que configurar el deep linking para que funcione tanto en Android como en iOS.

Supabase tiene funciones específicas para esto (`resetPasswordForEmail` y `updateUser`), así que debería ser bastante directo de implementar.

Añade las dos pantallas nuevas al navegador de autenticación, fuera del flujo de usuario autenticado.

---

## Sprint 11 — Mejoras UI de Detalles

Las pantallas de detalle de perfiles y pisos están un poco sosas comparadas con el resto de la app. Quiero rediseñarlas para que tengan el mismo estilo glassmorphism.

Para el detalle de perfil: las fotos deberían ir en un carrusel, la info básica (nombre, edad, ciudad) flotando encima de las fotos, y el resto de la información organizada en secciones con tarjetas: intereses, lo que busca, si tiene piso o no... Los botones de like/dislike que se queden abajo visibles sin tapar nada.

Para el detalle del piso: también carrusel de fotos, la información del piso clara (precio, habitaciones, servicios), los compañeros actuales con sus fotos, las reglas del piso, y un botón para contactar o pedir unirse según el estado.

Si mientras tocas esto ves colores o espaciados que no están en los tokens, los añades.

No toques la lógica ni las llamadas a los servicios, solo la parte visual.

---

## Sprint 12 — Sistema de Invitaciones

Quiero que un propietario pueda generar un código para invitar a alguien a su piso, y que ese alguien pueda introducirlo durante el registro para quedar asociado directamente al piso sin tener que pasar por el swipe normal.

En el registro, después de la fase de género, añade un paso que pregunte si tienes un código de invitación. Si no tienes, sigues normal. Si tienes, lo introduces y te unes al piso.

El propietario debería poder generar el código desde la pantalla de gestión del piso, verlo, copiarlo y compartirlo fácilmente.

El backend necesita generar y validar estos códigos (que sean únicos, que no estén expirados, que queden habitaciones disponibles). Cuando alguien se une por código, créale automáticamente los matches con los compañeros que ya están en el piso, porque ya se conocen.

---

## Sprint 13 — Push Notifications

Quiero notificaciones push para los eventos principales de la app. El setup es con Firebase Cloud Messaging, que creo que ya está configurado a medias.

Los casos que me interesan son: mensaje nuevo en el chat, cuando tienes un nuevo match, cuando alguien añade un gasto en el piso, cuando alguien salda una deuda, y cuando te asignan una habitación.

Al tocar la notificación debería llevarte directamente a la pantalla relevante (el chat, la pantalla de matches, los gastos...).

Hay que pedir permiso al usuario cuando abre la app, guardar el token del dispositivo vinculado a su cuenta, y eliminarlo cuando hace logout. Si el usuario ya está dentro del chat del que llega la notificación, no le muestres la notificación de ese chat.

Las edge functions que disparan las notificaciones van en Supabase, llamadas desde triggers o desde otras funciones.

---

## Sprint 14 — Chats en Tiempo Real

El chat funciona pero no es en tiempo real, hay que recargar para ver mensajes nuevos. Quiero arreglarlo con Supabase Realtime.

Cuando llega un mensaje nuevo, debería aparecer solo sin recargar nada. Si estás al final del scroll que baje automático, si no, muestra algún indicador de que hay mensajes nuevos. Al desmontar la pantalla cancela la suscripción.

En la lista de chats (MatchesScreen), que se ordene por el último mensaje y que se actualice solo también. Pon algún indicador de mensajes no leídos.

Aprovecha para rediseñar un poco el chat con el estilo glassmorphism: burbujas diferenciadas para tus mensajes y los del otro, timestamps agrupados por día, y que el input de texto no quede tapado por el teclado.

De paso actualiza también la UI de EditProfileScreen, CreateFlatScreen, y las pantallas de gastos para que sigan el mismo lenguaje visual.

---

## Sprint 15 — UI Fix Global

Hay bastantes problemillas de UX acumulados que quiero limpiar de una vez.

El principal: en todas las pantallas con formularios, cuando aparece el teclado los inputs quedan tapados. Hay que hacer que haga scroll automático para mantener el campo activo visible. Afecta al registro completo, EditProfileScreen, CreateFlatScreen, ForgotPasswordScreen y ResetPasswordScreen.

Revisa el registro en pantallas pequeñas (320pt de ancho) para que todo quepa bien.

En SwipeScreen, cambia los tamaños y posiciones hardcodeados en píxeles por valores relativos (porcentajes o Dimensions), para que las cards se vean bien en cualquier tamaño de pantalla.

La TabBar inferior en iPhones con home indicator a veces queda cortada, hay que añadir el padding inferior correspondiente con SafeAreaInsets.

Si el porcentaje de compatibilidad puede dar valores por debajo de 0 o por encima de 100, ponle un clamp.

---

## Sprint 16 — Swipe Porcentual

Quiero que en las cards del swipe aparezca un porcentaje de compatibilidad entre el usuario y el candidato. Algo así como una puntuación de 0 a 100 calculada en base a criterios como: si buscan en la misma ciudad, si los rangos de precio se solapan, cuántos intereses tienen en común, si sus estilos de vida encajan, si uno tiene piso y el otro busca...

Muéstralo de forma visual en la card, puede ser un badge con colorcillo (verde si es alta, amarillo si es media, rojo si es baja) o una barra de progreso, lo que veas más limpio.

El algoritmo de recomendaciones del backend debería ordenar los candidatos por compatibilidad para que los mejores aparezcan primero.

Verifica también que cuando dos usuarios se dan like mutuamente el match se crea correctamente y aparece en la pantalla de matches.

---

## Sprint 17 — Hotfixes

Después del sprint anterior hay algo roto que hay que arreglar urgente. Los commits a2ec3d6 y 964a01a introdujeron algún bug, revísalos.

Los síntomas que puede tener son: el porcentaje de compatibilidad no se muestra bien o no se calcula, las cards del swipe no cargan o se quedan en carga infinita, los matches no se crean bien, o hay algún problema de navegación después de hacer swipe.

Comprueba también que lo que funcionaba antes sigue funcionando: el registro completo, el chat en tiempo real, las notificaciones y la gestión de gastos.

Cambios mínimos y enfocados, nada de features nuevas.

---

## Sprint 18 — Filtros Mejorados y Google Auth

La pantalla de filtros se quedó bastante básica, quiero mejorarla. Añade los filtros que falten: rango de precio, número de habitaciones, tipo de usuario, ciudad, zona, rango de edad, género... Usa sliders para los rangos numéricos, chips para las opciones múltiples. Añade un botón para resetear todo y un contador de cuántos filtros tienes activos. Que los filtros persistan entre sesiones guardándolos en AsyncStorage.

Algunos filtros más avanzados estarán reservados para usuarios premium (bloqueados con un candado y opción de upgrade). Crea un contexto para gestionar si el usuario es premium o no, leyendo el campo `is_premium` de su perfil en Supabase.

El login con Google está a medias: si es la primera vez que alguien se registra con Google, que pase por el flujo normal de registro para completar su perfil. Si ya tiene cuenta, que entre directamente. Arregla lo que haga falta.

También hay un bug con el navegador principal que a veces se reinicia o salta al cambiar de tab, arréglalo.

---

## Sprint 19 — Realtime y Estilos de Vida

Quiero extender el tiempo real a más sitios. En la pantalla de gastos que se actualice automáticamente cuando alguien añade uno. En las liquidaciones igual. En la lista de matches que también aparezcan los nuevos matches sin recargar. En el detalle del piso que se actualice si alguien entra o sale. En la gestión del piso si hay cambios en habitaciones o asignaciones.

En todos los casos gestiona bien los canales de Supabase (nombres únicos por pantalla y recurso) y cancela las suscripciones cuando se desmonta el componente.

Aparte, quiero añadir un campo de estilos de vida en los perfiles: cosas como "madrugador", "noctámbulo", "no fumador", "deportista", "tiene mascota"... El usuario puede elegir varios (máximo 5 o así) con chips en su perfil, y se muestran en el detalle de otros perfiles. Incorpóralos también al cálculo de compatibilidad.

Por último, prepara el ThemeContext para que soporte dos temas (claro y oscuro) de cara al sprint siguiente, aunque no hace falta implementarlo todavía.

---

## Sprint 20 — Dark Mode

Quiero implementar el modo oscuro completo en toda la app.

Necesito un ThemeContext que gestione dos temas: claro y oscuro. Que guarde la preferencia en AsyncStorage y que al arrancar cargue la que tenía o detecte la preferencia del sistema. Expone el tema actual, un booleano isDark, y una función para cambiar.

Hay que recorrer todas las pantallas y cambiar los colores hardcodeados por referencias al tema actual. Los archivos de estilos tendrán que convertirse en funciones que reciben el tema como parámetro.

Empieza por las pantallas más importantes: SwipeScreen, el chat, la lista de matches, el detalle de perfil y piso, y el login/registro.

El cambio entre modos que no cause un flash blanco. Añade el toggle en algún sitio accesible del perfil o ajustes.

---

## Sprint 21 — Premium Features

Quiero implementar las primeras limitaciones de la cuenta free.

Los usuarios free tienen un límite de swipes diarios (unos 20 o así). Cuando lleguen al límite que aparezca un mensaje explicándolo con opción de upgrade. Los filtros avanzados también van a estar bloqueados para free, muéstralos con un candadito y al intentar usarlos muestra un modal de upgrade con los beneficios.

El contexto de premium que se creó en el sprint 18 hay que completarlo: que lea el campo `is_premium` de Supabase al hacer login, y que exponga funciones para saber si puedes usar una feature concreta.

Crea un componente badge para las features premium, y el modal de upgrade con los beneficios y un botón de "Obtener Premium" (puede llevar a una pantalla placeholder por ahora).

De paso, antes de enviar el email de verificación en el registro, valida que el email tenga un formato correcto y que el dominio exista (check de DNS básico).

---

## Sprint 22 — UI Dark Mode Refinamiento

El modo oscuro tiene bastantes cosas que no se ven bien, hay que hacer una pasada de correcciones.

El componente FormSection (el que agrupa los campos en los formularios de edición) no se adapta al tema, los fondos y colores están hardcodeados.

En general, revisa todas las pantallas en modo oscuro buscando: textos que no se ven por el fondo, inputs con fondo incorrecto, iconos que no cambian de color, bordes que no respetan el tema, modales con fondo blanco en oscuro...

Hay un bug: los usuarios que tienen piso (owners) no pueden ver otros owners en sus recomendaciones. Arréglalo en la edge function de recomendaciones.

Añade también un toggle en el perfil para que el usuario pueda "pausar" su visibilidad en el swipe. Si lo desactiva no aparece en las recomendaciones de nadie. Cuando esté inactivo muéstrale algún banner avisándole.

Limpia console.logs de debug y código comentado que ya no sirva.

---

## Sprint 23 — Ciudades y Zonas

Quiero que la app tenga ciudades y barrios/zonas reales de España en lugar de texto libre.

Necesito poblar la base de datos con ciudades españolas y sus barrios. Puedes usar datos de OpenStreetMap o alguna fuente pública similar. Crea los scripts de Python necesarios para extraer, limpiar y generar los SQLs de inserción. Foco en las ciudades grandes: Madrid, Barcelona, Valencia, Sevilla, Zaragoza, Málaga, Bilbao...

Las tablas serían algo como `cities` (con nombre, provincia, comunidad, coordenadas...) y `areas` (barrios/distritos de cada ciudad).

Una edge function que permita buscar ciudades por nombre y obtener los barrios de una ciudad concreta.

En los perfiles, sustituye el campo de texto libre de ciudad por un selector con búsqueda, y dependiendo de la ciudad que elijan un selector de zona. Lo mismo para la creación y edición de pisos.

En los filtros de búsqueda añade también filtros por ciudad y zona. Las ciudades cercanas a la preferida del usuario que no se excluyan del todo, sino que tengan menos peso.

Añade la opción de borrar cuenta permanentemente en los ajustes del perfil, con confirmación. Que elimine todo lo del usuario de Supabase.

Por último, crea un componente wrapper para gestionar el comportamiento del teclado de forma consistente en todas las pantallas con formularios, que sustituya las soluciones individuales de sprints anteriores.

---

*Fin de los prompts maestros — Sprints 7 al 23*

*Proyecto: HomiMatchApp | TFG — Pepe Ortiz Roldán | Enero 2026*
