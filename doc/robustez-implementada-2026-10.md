# Implementación de robustez R-1 a R-25

El informe `informe-mejoras-2026-10.md` conserva el diagnóstico original.
Esta rama implementa sus 25 acciones de robustez; no añade las propuestas C-1 a
C-20 ni cambia la compatibilidad declarada a Foundry v14.

- **R-1:** 20 IDs migrados a 16 caracteres alfanuméricos, `_key` coherentes,
  aliases de origen para las copias antiguas y validación de IDs duplicados.
- **R-2:** tablas con flags de propiedad, migración conservadora de semillas
  antiguas, movimientos sin borrado, sembrado versionado y desactivable.
- **R-3:** una tarjeta por tirada desde el GM activo, deduplicación y finalización de
  Dice So Nice, con respaldo para tiradas sin animación. R-24 completa la reproducción local de efectos por cliente.
- **R-4:** escape de nombres, imágenes y texto en las macros clásicas afectadas.
- **R-5:** archivo de licencia ISC, coherente con la licencia ya declarada.
- **R-6:** tests y validación en CI de push/PR y antes de publicar una release.
- **R-7:** conversiones de esferas por valor, con resto, sin conversión al mismo
  tipo y sin permitir convertir una cantidad que el actor no tiene.
- **R-8:** drenaje a dun de la misma denominación; cantidades enteras no negativas.
- **R-9:** actualizaciones por procedencia de compendio, preservando nombre/ID
  del mundo y continuando después de fallos individuales. Los nombres antiguos
  declarados identifican candidatos sin UUID que requieren confirmación del GM.
- **R-10:** Panel GM carga sus macros por ID desde el compendio.
- **R-11:** API pública registrada en init; las 66 macros son llamadas de una
  línea. Las copias antiguas requieren una actualización inicial.
- **R-12:** comprobaciones compartidas para tokens, recursos y dependencias;
  actualizaciones esperadas; hooks antiguos retirados con entradas compatibles.
- **R-13:** Request Roll usa author del GM y susurra a todos los propietarios.
- **R-14:** textos pendientes localizados, fragmentos de localizaciones traducidos
  y nombres de moneda estables en una definición compartida.
- **R-15:** los fallos de catálogos no abortan la carga; fallback a catálogo
  disponible, traducción de Foundry o clave.
- **R-16:** sembrado exclusivo del GM activo.
- **R-17:** relaciones del sistema y módulos opcionales; manifiesto limpiado.
- **R-18:** zip con rutas existentes y comprobación previa; Dependabot para npm.
- **R-19:** validación previa y compilación por staging, conservando los packs
  anteriores ante fallos de compilación.
- **R-20:** escape HTML y contabilidad/escritura de esferas compartidos; soporte
  para múltiples ítems de la misma moneda y rechazo de planes obsoletos.
- **R-21:** informes del validador escapados y selectores limitados al diálogo.
- **R-22:** informes de mantenimiento privados para todos los GMs; sin envío
  público cuando no hay destinatarios.
- **R-23:** retirados cinco sonidos sin uso (300.098 bytes de audio originales).
- **R-24:** preferencias de medios por cliente, preservación de antiguos valores
  del mundo y efectos automáticos de tirada reproducidos localmente una vez.
- **R-25:** AGENTS.md actualizado y CLAUDE.md enlazado a la guía compartida.

## Correcciones de la revisión posterior

Los diez hallazgos de la revisión se han contrastado y corregido:

1. Migración de ajustes mediante `getSetting`, con una prueba de almacenamiento
   indexado por ID de documento como el de Foundry.
2. Inventarios antiguos inválidos señalados en los diálogos sin impedir abrirlos;
   las escrituras estrictas rechazan la denominación afectada.
3. Fallos de sembrado aislados por tabla. Se procesan las demás y se reintentan
   las pendientes al recargar, sin duplicar las ya creadas.
4. Reutilización de tablas antiguas coincidentes sin cambiar su carpeta. Si hay
   varias idénticas, se identifica una de ellas sin crear otra ni borrar ninguna;
   las búsquedas prefieren la identificada por el módulo.
5. Curación solo cuando aumenta la salud, sin esperar al efecto. Los fallos
   síncronos y rechazos tardíos no invalidan la actualización ya aplicada.
6. Tarjetas y efectos esperan al fin de Dice So Nice. Un respaldo retrasado cubre
   las animaciones omitidas y no revela resultados mientras sigan animando.
7. Candidatos sin UUID reconocidos por aliases `legacyNames`, con selección y
   confirmación separada antes de reemplazar código del mundo.
8. JSON `null`, arrays y valores primitivos producen errores por fichero sin
   abortar la validación de las demás macros.
9. Desbordamientos con nombre de actor, error explícito y contratos de resultado
   completos; sin claves de déficit inventadas.
10. Interfaz, CSS, vista previa y flujo de transacción compartidos para las macros
    clásicas de esferas. Ambas conservan sus comandos y ahora son wrappers.

## Segunda revisión: regresiones y casos adicionales

- Temporización de DSN verificada con reloj simulado, animación activa, waiter que
  resuelve antes de tiempo, evento ausente y cinco clientes con visibilidad distinta.
- Planificación que marca inventarios inválidos antes de aplicar; gasto de grupo
  que excluye esos saldos y puede completarse con actores sanos.
- Duplicados antiguos reutilizados sin crear una tercera copia; carpetas del GM
  conservadas tanto en tablas antiguas como en las identificadas por flags.
- Errores de overflow/invalid propagados hasta el plan agregado y hasta el error
  mostrado al aplicar drenaje o gasto de grupo.
- Actualizaciones de recursos que terminan con una animación aún pendiente,
  capturando su rechazo posterior.
- Colores, fondos, tamaño del encabezado y márgenes de tarjetas clásicas restaurados.
- Productos y sumas del resumen limitados a enteros seguros; una lectura de
  inventario por actor, búsquedas de tablas sin fallback redundante y mapa de
  aliases precalculado con confirmación booleana explícita.

## Tercera revisión: respaldo de DSN, exclusiones y carpetas

1. Tiradas sin animación comprobadas después de 100 ms, sin depender de que
   termine un waiter. Las animadas esperan a que desaparezca la marca de DSN.
2. Eliminado el uso de `waitFor3DAnimationByMessageID`, evitando sus listeners
   internos no cancelables. Un evento completado antes del de creación no
   deja un nuevo temporizador; el historial de completados está limitado.
3. Sondeo limitado a 30 comprobaciones; borrar un mensaje cancela su pendiente.
   Un estado de animación atascado no revela el resultado ni sondea indefinidamente.
   El listener global admite una finalización posterior al límite.
4. Ajustes, visibilidad y resultado natural comprobados antes de programar trabajo.
5. Fondos insuficientes con nombres y motivos de los actores excluidos.
6. Gasto y drenaje excluyen actores con denominaciones afectadas inválidas,
   conservan sus inventarios y permiten aplicar los de actores sanos. Si todos
   están excluidos, el drenaje falla con explicación. Los desbordamientos al
   calcular nuevos saldos siguen propagándose como errores.
7. Carpetas temáticas identificadas por flag y creadas solo cuando una tabla
   faltante las necesita; no se acumulan vacías tras reorganizar las tablas.
8. Retirados estado `moved`, contadores de reorganización, notificaciones y claves
   de idioma que ya no podían ejecutarse.
9. Ambos diálogos muestran los dos avisos cuando coinciden overflow e inventario
   inválido, mediante un helper compartido.
10. La comprobación inicial de fondos de una conversión reutiliza su inspección
    del inventario de origen.

La revisión de DSN se contrastó con su código fuente oficial:
[Dice3D.js](https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/raw/master/module/Dice3D.js),
[main.js](https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/raw/master/module/main.js) y
[ThrowPipeline.js](https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/raw/master/module/throw/ThrowPipeline.js).
En la versión consultada, el waiter resuelve inmediatamente cuando el mensaje
no está animando; cuando lo está, registra listeners hasta recibir su evento.
La nueva implementación evita ese waiter y deja terminar los listeners de
creación antes de consultar la marca. Esto no sustituye una prueba en la versión
instalada de Foundry/DSN.

## Cuarta revisión: avisos, recuperación y carpetas base

1. Las operaciones aplicadas muestran una notificación con actores excluidos o
   denominaciones omitidas, independientemente de publicar en el chat.
2. Al agotar el sondeo de DSN se registra el ID del mensaje y se recupera el efecto
   una sola vez. Se conserva el filtro de ajustes y visibilidad. Las tiradas
   interactivas pendientes no se revelan. Una animación normal de más de unos
   30 segundos puede recibir este respaldo antes de terminar; ese es el límite
   elegido para evitar perder efectos por un renderizador atascado.
3. Notificaciones v13 con texto sin preescapar y `clean: true`, según su
   [API oficial](https://foundryvtt.com/api/v13/interfaces/foundry.NotificationOptions.html).
   v12 mantiene escape manual. Pruebas de contrato con apóstrofos y HTML;
   la representación visual en Foundry sigue pendiente.
4. Carpetas base y temáticas con un resolver compartido. Solo se crea la cadena
   necesaria para una tabla faltante; resembrar después de mover todas las
   tablas y borrar sus carpetas por defecto no reconstruye carpetas vacías.
5. Un broam corrupto se omite sin excluir a un actor que puede drenar marcas
   válidas; también se omiten destinos dun inválidos. Si los saldos sanos no
   cubren la petición, se conserva el inventario completo de ese actor y se avisa.
6. Drenaje sin actores como operación vacía correcta, sin tarjeta ni avisos.
7. Las carpetas antiguas encontradas por nombre reciben `tableFolderKey` al
   resolverlas, conservando su organización tras renombrarlas o moverlas.

También se comparte el historial de tiradas procesadas, se guarda su inspección
para no recorrer los dados en cada sondeo, se evita llenar el historial con IDs
borrados y se reutiliza directamente el resultado de exclusión del gasto.

## Quinta revisión: seis observaciones restantes

1. Preparación de carpetas base dentro de `try/catch`: un fallo al escribir un
   flag se registra y avisa al GM, conservando el sembrado pendiente para
   reintentar al recargar. Prueba de fallo inicial y recuperación posterior.
2. Avisos de denominaciones omitidas y déficits en tarjetas con etiquetas
   traducidas; las claves internas se conservan solo en los datos del plan.
3. Retirada la llamada a `pendingThrows.isPending`. Se detectan las tiradas
   interactivas mediante sus eventos públicos de apertura/cierre y el estado
   pendiente del mensaje. Se prueban ambos caminos sin API interna de DSN,
   incluyendo una marca de animación ausente y una finalización posterior.
   Eventos contrastados con la [documentación oficial de DSN](https://riccisi.gitlab.io/foundryvtt-dice-so-nice/api/interactive-throws/),
   y estado del mensaje con su [código fuente](https://gitlab.com/riccisi/foundryvtt-dice-so-nice/-/raw/master/module/main.js).
4. El drenaje vacío avisa con `NoPlayerCharactersFound`, conserva el resultado
   correcto sin cambios y no publica una tarjeta vacía.
5. Solo el handler registra el ID de tirada procesada, antes de sus esperas.
   Una prueba de callbacks concurrentes comprueba una única marca y tarjeta.
6. Retiradas la comprobación imposible de mensajes borrados en `created` y su
   colección. Borrar cancela el temporizador y la finalización posterior comprueba
   que el documento ya no existe en la colección de mensajes de Foundry.

## Validación

176 pruebas automatizadas aprobadas.

Regresiones con Node para propiedad de tablas, IDs y procedencia de macros,
seguridad HTML, conservación de dinero, drenaje, cantidades inválidas, fallos de
compilación, diálogos independientes, informes privados y preferencias de
clientes. Además: validación de fuentes, compilación LevelDB y comprobación del
zip de distribución.

No se ha ejecutado una instancia real de Foundry. Antes de publicar una release,
verificar allí importación de los 66 macros, actualización de copias existentes,
diálogos v1/v2, varios GMs, cinco clientes con y sin Dice So Nice, tiradas privadas,
inventarios y efectos de Sequencer/JB2A. No se ha publicado ninguna release.
