Diagnóstico de la pantalla actual
Basado en la captura que compartiste (y el código), tu pantalla ya apunta en la dirección “vidrio” (blur, transparencias, chips flotantes), pero hoy se aleja de Liquid Glass en tres frentes estructurales:

Primero, hay demasiadas superficies “tipo vidrio” en la capa de contenido: usas ImageBackground + blur y overlays con gradientes dentro de cada “section” y dentro de cada detailCard, además de un header con apariencia semitransparente, y un tab bar también con blur. Este patrón termina siendo, en la práctica, “glass on glass” en cascada. Apple avisa explícitamente que apilar capas de vidrio vuelve la interfaz más confusa, y que Liquid Glass debería reservarse para la capa de navegación, no para cada tarjeta de contenido.

Segundo, el “glass” actual es principalmente blur decorativo (más parecido a “glassmorphism”) en lugar de un sistema de jerarquía + adaptividad: los fondos y overlays son bastante constantes (misma imagen de fondo, mismo gradiente), pero Liquid Glass se define por cambiar “en contexto” (sombras/tint/legibilidad) según lo que está pasando debajo y por cómo se desplaza el contenido.

Tercero, hay señales de “UI muy custom” en zonas donde Apple recomienda dejar que el sistema lidere: por ejemplo, Apple explica que en el nuevo diseño el fondo de barras es transparente por defecto y que customizar backgroundColor o apariencias puede interferir con el vidrio. En tu header custom, tú defines borde, background y separación manual. Eso hace difícil beneficiarte de los comportamientos nativos (agrupación de botones, edge effects al hacer scroll, etc.).

Adicionalmente, hay un coste técnico: múltiples ImageBackground con blurRadius (y gradientes superpuestos) por sección pueden ser caros y generar inconsistencias entre iOS/Android. En RN, Apple-style “material” suele resolverse con blur nativo (iOS) y degradación controlada (Android), no con “fondo fotográfico blurreado repetido” en cada bloque.

Propuesta de rediseño alineada con Liquid Glass
La propuesta se basa en re-separar capas: (A) una capa de contenido clara y estable, y (B) una capa de navegación/controles en Liquid Glass, usando “Clear” solo cuando el fondo es media-rich (tu hero de fotos), tal como Apple recomienda para las variantes.

Estructura visual sugerida
La pantalla se puede re-componer así, manteniendo tu información pero cambiando dónde vive cada efecto:

Capa de navegación (Liquid Glass “Regular”)

Navigation bar flotante (transparente + material) con:
Back a la izquierda.
Título que transiciona (large → inline) si haces scroll.
Acciones (editar/salir) agrupadas como “glass button group” (una pastilla que contiene varios iconos) en vez de dos círculos separados con estilos manuales. Esta agrupación es un patrón que Apple describe para toolbars/navigation en iOS 26 (agrupa items automáticamente en fondos compartidos).
Segmented control “Perfil / Piso” como control de navegación local, justo bajo la barra (o integrado como “accessory” bajo el título). Apple recomienda segmented controls para alternar vistas estrechamente relacionadas; encaja perfectamente con tu “Perfil/Piso”.
Capa de contenido (no-glass, estable, legible)

Hero (carrusel de fotos) edge-to-edge.
Debajo, el contenido como secciones tipo “inset grouped” (fondo systemGrouped + tarjetas/celdas secondarySystemGrouped). Aquí el glass no debería ser el protagonista: se busca claridad y escaneo rápido.
Capa de acciones contextuales (Liquid Glass “Regular” o “Clear” según fondo)

Si hay acciones “Reject/Like” (cuando no es tu perfil), conviértelas en una floating action bar única: una cápsula de vidrio con dos botones prominentes dentro.
Idealmente, cuando entras a ver un perfil ajeno desde “Explorar”, la pantalla debería presentarse sin tab bar (como una vista empujada/modo detalle), para que esa barra de acciones no compita con la tab bar. Esto es coherente con el enfoque de Apple de que las barras persistentes son navegación top-level, mientras que un detalle con acciones fuertes suele ser una jerarquía distinta (push/sheet).
Tratamiento “Liquid Glass”: dónde sí
Sí: barras, toolbars, tab bars, botones de navegación y elementos flotantes de control. Eso es exactamente el “navigation layer” que Apple describe como el sitio correcto para Liquid Glass.

Sí: overlays sobre contenido “media-rich” (tu hero con foto) usando la variante “Clear” solo si cumples condiciones de legibilidad (dimming + texto bold/alto contraste). Apple lo explica: “Clear” no tiene el mismo comportamiento adaptativo, por lo que necesita una capa de dimming para que iconos y texto sigan siendo legibles.

Tratamiento “Liquid Glass”: dónde no
No: aplicar “glass cards” a cada contenido (“Sobre”, “Intereses”, “Lo que busca”…). Esto es el equivalente de “hacer una table view de vidrio”, que Apple pone como ejemplo de lo que degrada jerarquía.

No: repetir backgrounds blurreando una misma imagen decorativa por sección. Si quieres “ambiente”, usa:

o bien el propio contenido (fotos del perfil/piso) extendido bajo la UI,
o un sistema de gradient/blur muy sutil a nivel raíz, no por tarjeta. Este enfoque se parece más a lo que Apple muestra cuando extiende artwork bajo elementos flotantes para reforzar inmersión sin ruido.
Detalles por componente
Hero / Carrusel

Quitar el “marco tarjeta” (border/shadow) alrededor del hero. Que sea contenido puro.
Mantener tu overlay con nombre, pero convertirlo en una pastilla Clear Glass (capsule/rounded rect) con:
dimming layer (negro 20–35% dependiendo de foto),
texto grande y bold,
chips mínimos (edad/ubicación/desde) con vibrancy leve. Esto encaja con “Clear sobre media-rich content + contenido bold/bright”.
Secciones (“Sobre”, “Intereses”, etc.)

Pasar de “tarjeta de vidrio con blur + gradient” a un patrón:
Título de sección simple (texto/posible icono SF-like, sin contenedor blur).
Contenido en “cells” limpias:
Sobre: un bloque de texto con padding generoso.
Intereses: chips con relleno suave (no glass) y border muy sutil.
Lo que busca: 2–3 filas tipo “settings row” con icono a la izquierda (en una cápsula con systemFill) y valor a la derecha. Este movimiento alinea con la recomendación de Apple de mantener el contenido en su propia capa (clara) y dejar el vidrio para navegación/controles.
Tab bar

Tu tab bar ya usa BlurView y es “glass-ish”. Si quieres alinearla aún más con iOS 26:
evitar tint excesivo,
mantener fondo monocromático si el contenido es muy rico,
considerar minimizar/ocultar en scroll en pantallas con contenido vertical largo (si tu navegación lo permite). Apple describe explícitamente tab bars flotantes y la posibilidad de minimizarse (en UIKit, tabBarMinimizeBehavior).
Especificación visual: tokens y reglas concretas
Aquí tienes una especificación que puedes traducir casi 1:1 a tu sistema de tokens, manteniendo tu identidad (morado) pero ajustándola al patrón Apple: tint selectivo, superficies sobrias, vidrio reservado. Apple explica que el tinting debe usarse para enfatizar acciones primarias y que tintar “todo” hace que nada destaque.

Superficies
Background de pantalla (content layer)

iOS: systemGroupedBackground / systemBackground (según prefieras “Settings feel” vs “Feed feel”).
Android: un gris muy claro estable (tu #EEF1F6 puede ser el fallback), pero sin superponer fotos decorativas por sección. El uso de colores del sistema ayuda a adaptarse a apariencias y accesibilidad; Apple recomienda apoyarse en colores del sistema que se adaptan automáticamente.
Cards / cells (content layer)

Fondo: secondarySystemGroupedBackground (iOS) o blanco 92–96% (Android).
Borde: 1px con alpha muy bajo (≈ 8–12%) o directamente sin borde y separadores internos.
Sombra: mínima o nula (Apple tiende a que la “elevación” la comunique el material, no sombras fuertes constantes). El propio Liquid Glass usa sombras adaptativas cuando hace falta separación; replicar sombras grandes en todo el contenido compite con eso.
Vidrio (navigation layer)
Glass “Regular” (para header/segment/tab bar/action bar)

Blur: BlurView nativo iOS (tipo “light” / “system material”). En RN no siempre puedes elegir el “material style” exacto como en SwiftUI, pero el patrón es blur + tint + sombra sutil que se adapta.
Tinte: blanco 12–18% (light mode) o negro 18–24% (dark mode).
Stroke: 1px blanco 18–26% (light) o blanco 10–16% (dark), solo si necesitas definir borde en fondos complejos.
Glass “Clear” (solo sobre el hero)

Blur menor (o incluso sin blur fuerte) + dimming layer localizada.
Texto bold/blanco con vibrancy si procede, pero siempre priorizando legibilidad. Apple recalca que Clear necesita dimming para no perder contraste.
Tipografía y jerarquía
Apple indica que el nuevo diseño refinó tipografía para fortalecer claridad, con momentos donde es más bold y alineada a la izquierda para mejorar legibilidad. En tu pantalla eso se traduce en: nombre muy protagonista, títulos de sección consistentes, y valores clave (presupuesto/zona) en estilo “headline”.

Guía práctica de implementación en React Native
Material y vibrancy
Para emular Liquid Glass en RN hoy, tu base realista es BlurView y (en iOS) VibrancyView. La librería @react-native-community/blur documenta explícitamente:

soporte de VibrancyView solo en iOS,
y el fallback cuando el usuario activa “Reduce Transparency” (usar reducedTransparencyFallbackColor).
Si estás en Expo, expo-blur también está orientado a blur en barras, tab bars y modales, y advierte que en Android el blur es experimental (y requiere activar un método experimental). Esto es importante para que tu “Liquid Glass” no se rompa en Android: necesitas degradación visual controlada.

Implicación directa para tu rediseño: en Android, trata el “glass” como “translucent surface” (tinte + borde + sombra suave) y considera blur solo si es estable y con buen rendimiento.

Navegación: aprovechar el sistema cuando sea posible
Apple explica que en iOS 26:

navigation bars/toolbars son transparentes por defecto,
y recomiendan eliminar personalizaciones de background porque interfieren con el vidrio,
además de agrupación automática de botones y edge effects en scroll.
En RN, esto sugiere dos caminos:

Camino A (más Apple-native): migrar esta pantalla a un stack nativo (@react-navigation/native-stack) y usar header transparente/blur del propio navigator, minimizando tu header custom.

Camino B (incremental sin re-arquitectura): mantener tu header pero:

reemplazar backgroundColor semitransparente por un BlurView full-bleed,
eliminar bordes fuertes,
y crear un “edge effect” simple: al scroll, aumenta ligeramente blur/tint (imitando la lógica de separación que Apple describe cuando el contenido se mueve por debajo).
Refactor recomendado de tu código
Tu código actual repite ImageBackground(blurRadius=12) + LinearGradient en casi todas las secciones. Para alinearlo con “avoid glass on glass” y con la idea de separar capa de contenido vs capa de controles, el refactor de alto impacto sería:

Crear un componente GlassBar (header y action bar) basado en BlurView + overlay/tint.
Eliminar ImageBackground por sección; sostener el contenido sobre fondos sólidos.
Mantener solo:
BlurView en header,
BlurView en tab bar (ya lo tienes),
BlurView en la floating action bar (si aplica),
y un overlay específico “Clear” sobre el hero (solo ahí).
Ese “recorte” está directamente alineado con la recomendación de Apple de reservar el vidrio a la capa de navegación y evitar apilamiento.

Checklist de validación
Para comprobar que el rediseño se siente “Liquid Glass” y no “glassmorphism genérico”, valida estos puntos:

La interfaz debe mantenerse visualmente quieta en reposo y “cobrar vida” al interactuar (touch feedback, transiciones suaves), como describe Apple.

El vidrio debe adaptarse al fondo: si detrás hay foto/texto con alto contraste, necesitas más separación (tint/shadow) en barras; si detrás hay fondo uniforme, baja la presencia del material. Apple lo detalla en su explicación de adaptividad de sombras/tint y scroll edge effects.

El diseño debe respetar accesibilidad: comprobar “Reduce Transparency” (fallback), “Increase Contrast” y “Reduce Motion”. Liquid Glass incorpora estos modificadores de forma automática en el sistema; en RN debes, como mínimo, contemplar fallback de blur y reducir efectos elásticos si el usuario lo requiere.
