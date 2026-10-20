# Pruebas del sitio institucional

No se instalan librerías ni se modifica la configuración del portal privado.

## Ejecutar

Requisitos: Node 24 y Chrome/Chromium o Microsoft Edge instalado. Se necesita generar `dist` antes de probar las páginas compiladas.

```sh
npm run build
node --test tests/*.test.mjs tests/browser/*.test.mjs
npm run check
```

### Regresiones sin navegador ni red

Con un `dist` ya generado, este comando ejecuta únicamente las pruebas Node de unidad/render y las regresiones puras del harness. No inicia Chrome/Edge, no abre un servidor HTTP y no navega a localhost:

```sh
node --test tests/*.test.mjs tests/browser/harness.test.mjs tests/browser/harness-lifecycle.test.mjs
```

Las pruebas del harness usan rutas sintéticas (sin leer el portal privado), procesos Node propios y compuertas deterministas para demorar o impedir la terminación. El comando general de arriba sí inicia un navegador: no debe ejecutarse si esa autorización no está vigente.

En Git Bash para Windows puede usarse `node.exe` en lugar de `node` si el shim devuelve un error de TTY.

La suite de navegador detecta las ubicaciones habituales de Chrome/Edge en Windows, Chrome/Chromium en Linux y Chrome en macOS. Si tu instalación está en otro lugar, indicá el ejecutable mediante `CHROME_BIN`.

```sh
CHROME_BIN='/ruta/al/chrome' node --test tests/browser/appointments.test.mjs
```

La ejecución de navegador crea un perfil temporal propio, sin abrir el perfil personal, y un servidor HTTP limitado a localhost con puerto efímero. `CEFEM_BROWSER_TMP_DIR` permite elegir dónde crear ese perfil; solamente se elimina el subdirectorio creado por la prueba. `CEFEM_BROWSER_DIST` permite probar otro build en vez de `dist`, sin editar los archivos de origen.

El harness limita stdout a 2.000.000 bytes y el proceso a 45 segundos por defecto (el fixture de cuatro páginas usa un límite explícito de 80 segundos). Ante exceso de salida, timeout, fallo de proceso o cancelación externa (`t.signal`), solicita SIGTERM y espera `close`; si no llega, escala a SIGKILL después de 1 segundo y espera hasta 2 segundos más. No resuelve ni rechaza una ejecución terminada antes de recibir `close`. Si vence ese último plazo sin confirmación, falla explícitamente con `terminationConfirmed=false`, conserva el perfil y muestra su ruta; no se afirma una limpieza exitosa. El servidor se cierra en el bloque de limpieza.

El allowlist normaliza la identidad de ruta antes de denegar y auditar `mis-estudios`/`api`, rechaza traversal, separadores codificados y barras inversas, y limita los archivos de assets al directorio resuelto `dist/_astro`, no a todo `dist`. Las regresiones de traversal no leen ningún archivo real.

Si falta el navegador, la suite falla explícitamente: no se omite silenciosamente. No requiere un servidor de desarrollo abierto ni usa el puerto de la vista previa.

## Migración de rutas públicas

`tests/public-routes.test.mjs` verifica los destinos españoles, sus canónicas, el sitemap, la paginación y el mapa exacto de alias con/sin barra final en `public/_redirects` y su copia en `dist`. Estas comprobaciones validan el build y las reglas declaradas: **no acreditan respuestas HTTP 301 reales de Cloudflare**. Esa comprobación requiere una preview del hosting autorizada por separado; un servidor estático local no interpreta automáticamente `_redirects` y las URLs antiguas pueden devolver 404 allí.

Las rutas heredadas conservan sus alias declarados para el hosting y las páginas técnicas del tema siguen existiendo. La portada pública de Mis estudios utiliza el marco institucional y conserva el enlace al portal externo; ese cambio visual no modifica el backend ni el visor autenticado. Los documentos legales, artículos e IDs de categorías mantienen sus rutas de contenido estables.

## Cobertura automatizada

- Campos obligatorios, mensajes de validación y foco en el primer error.
- Mensaje con Unicode y caracteres especiales, destino de recepción y conservación de campos.
- Invalidación del borrador al editar datos.
- Rechazo de una fecha pasada.
- Copia del mensaje y alternativa cuando falla el permiso del portapapeles.
- Rama real de `location.assign`, interceptada en el evento nativo de navegación.
- Prefill limitado a especialidades del catálogo.
- Campos deshabilitados, aviso en pantalla y contactos directos cuando el iframe no puede ejecutar JavaScript.
- Configuración única para los contactos de los nuevos componentes institucionales.

Los escenarios cargan el HTML y los scripts reales de `dist/turnos/`. Solo se simula la respuesta del portapapeles: la selección del texto y los mensajes de la interfaz se verifican en el navegador real. Para evitar envíos, la navegación se cancela antes de salir del iframe y el servidor de pruebas restringe los destinos de frames a su propio origen mediante CSP. El informe debe contener todos los escenarios; una ejecución vacía o incompleta falla.

Las rutas del fixture son internas al servidor efímero y no forman parte del sitio publicado. La suite de turnos no accede a Mis estudios. La suite del marco público puede abrir únicamente la portada estática `/mis-estudios/`, con permiso explícito del resolver; no inicia sesión, consulta backend/archivos/APIs privadas ni envía mensajes. Todos los datos cargados son ficticios.

## Pilotos de contacto y entrevistas

`tests/public-shell.test.mjs` comprueba la navegación común, el marco de los pilotos, las canónicas, los 14 IDs de video, los títulos contrastados y la corrección Alamo. `tests/browser/public-shell.test.mjs` agrega seis escenarios reales de Chromium: estructura/responsive, menú móvil, canales de contacto, ciclo del diálogo, archivo histórico y enlaces útiles sin JavaScript.

El control responsive recorre home, turnos, contacto, entrevistas, especialidades, acceso público a estudios y muestras de los cuatro tipos de página del blog: listado, paginación, artículo y categoría, en 320, 390, 768, 1024, 1101, 1440 y 1920 px. Se exige el conjunto exacto de pares página/viewport, no solo su cantidad. Las rutas de muestra y los dos fixtures están habilitados explícitamente; el resto del build permanece fuera del allowlist. `allowStudyLanding: true` habilita solo la portada estática exacta; el permiso no alcanza sus descendientes, archivos ni APIs, y no elude traversal. El diálogo se prueba mediante la solicitud `cancel`, cierre por botón, foco, inercia del fondo, cambio de video y eliminación del iframe. Esto no equivale a haber probado teclas físicas dentro de un reproductor externo.

La CSP del fixture bloquea miniaturas y frames externos deliberadamente. **No acredita reproducción, audio ni disponibilidad de todos los embeds en YouTube**; las imágenes pueden verse vacías en sus capturas. Los enlaces de salida se conservan y la prueba evita navegaciones externas. La cronología heredada está preservada, pero sus fechas y asociaciones requieren revisión editorial antes de publicar; no son fechas verificadas de publicación de YouTube.

Para una captura del fixture se pueden usar `CEFEM_SHELL_CAPTURE` (`contacto`, `entrevistas`, `home`, `turnos`, `especialidades`, `estudios`, `blog`, `articulo` o `categoria`), `CEFEM_SHELL_WIDTH` (320–1920) y `CEFEM_SHELL_SCREENSHOT` (ruta PNG). Se genera con un perfil de prueba propio, no con el navegador personal. El destino del portal externo se comprueba como enlace: no se prueba ni modifica su backend desde esta suite.

Estas pruebas no acreditan entrega de mensajes, comportamiento de la app nativa de WhatsApp, permisos reales del portapapeles del sistema, compatibilidad con Safari/Firefox ni una certificación completa de accesibilidad.

## Fichas médicas, legales y plantilla editorial

La suite responsive ahora exige 31 páginas públicas exactas en los siete anchos mencionados. Incluye las diez fichas clínicas existentes, las nuevas páginas de Urología, Clínica Médica y Depilación Definitiva, el índice legal y ambos documentos, artículos Markdown/MDX adicionales y Octubre Rosa. No amplía permisos a rutas privadas ni usa comodines.

`clinical-pages.test.mjs` protege títulos/SEO, textos no vinculados a videos, listas, arrays, FAQs y destinos originales mediante fingerprints portables. Las FAQ son `details` nativos y su JSON-LD coincide con las respuestas publicadas. Se omitieron fechas y temas de VideoObject heredados no verificados; esto no valida clínicamente el material original. Las asociaciones antiguas de algunos videos del blog todavía requieren revisión editorial.

`legal-pages.test.mjs` comprueba el marco en español y la fecha original de los documentos; no representa una revisión jurídica. `additional-services.test.mjs` comprueba los nuevos destinos y la preselección de especialidades permitidas, sin inventar profesionales, prestaciones ni disponibilidad.

`article-seo.test.mjs` exige BlogPosting y BreadcrumbList consistentes con el contenido visible, fecha de publicación original, OpenGraph de artículo y ausencia de autor/revisor/fecha de modificación no proporcionados. El TOC usa IDs reales del render de Astro. Se conserva el cuerpo Markdown/MDX. `sharp`, dependencia ya instalada por Astro, contrasta las dimensiones declaradas con el archivo de imagen generado para evitar proporciones falsas.

El fixture agrega comprobaciones reales de lectura acotada a 780 px, alineación de cabecera, imágenes limitadas a 360 px de alto en escritorio y 220 px en móvil, apertura de FAQ, presentación legal y activación del mismo iframe de YouTube desde una ficha y un artículo MDX. La CSP sigue bloqueando la reproducción externa: se comprueba la creación del iframe, no audio, reproducción o indexación en Google.

Las capturas admiten también `CEFEM_SHELL_CAPTURE=prostata`, `nutricion`, `privacidad` u `octubre`. El diseño y el marcado técnico no prueban mejoras de posiciones; la autoridad/autorización médica y cualquier actualización editorial requieren datos reales del centro antes de publicarse.

## Octubre Rosa

El artículo `/blog/octubre-rosa/` es contenido estático permanente. El lazo del encabezado y los accesos promocionales son opcionales: se entregan ocultos y JavaScript los habilita únicamente entre el 1 de octubre y el 1 de noviembre de 2026, con límites expresados en horario argentino. Sin JavaScript no aparece decoración temporal desactualizada; el artículo, sus fuentes y el listado normal siguen disponibles. El controlador actualiza el estado al vencer el plazo, al recuperar la página y al volver a una pestaña visible; no usa cookies, almacenamiento ni red.

Las pruebas cubren ambos extremos de la ventana, un año posterior, fechas inválidas y cambios de fecha en Chromium real. Comprueban la desaparición del lazo y las promociones sin ocultar el artículo, el foco del enlace, un área de 44×44 px y la separación efectiva entre el texto de la marca y el SVG en cada ancho. El texto informativo cita a OMS y Salud de la Nación, pero no representa un aval médico ni anuncia servicios de mamografía.

Los fingerprints históricos del blog se ampliaron únicamente para la nota nueva y la corrección de Doppler previamente autorizada por el usuario. Las demás firmas siguen intactas; las regresiones editoriales específicas mantienen las fechas originales y comprueban que no reaparezcan atribuciones o videos no verificados.
