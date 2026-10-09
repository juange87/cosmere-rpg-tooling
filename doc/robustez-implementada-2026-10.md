# Implementación de robustez R-1 a R-25

El informe `informe-mejoras-2026-10.md` conserva el diagnóstico original.
Esta rama implementa sus 25 acciones de robustez; no añade las propuestas C-1 a
C-20 ni cambia la compatibilidad declarada a Foundry v14.

- **R-1:** 20 IDs migrados a 16 caracteres alfanuméricos, `_key` coherentes,
  aliases de origen para las copias antiguas y validación de IDs duplicados.
- **R-2:** tablas con flags de propiedad, migración conservadora de semillas
  antiguas, movimientos sin borrado, sembrado versionado y desactivable.
- **R-3:** una tarjeta por tirada desde el GM activo, deduplicación y manejo por creación
  del mensaje, incluso si Dice So Nice no anima la tirada. R-24 completa la reproducción local de efectos por cliente.
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
4. Adopción de una coincidencia antigua exacta y única aunque esté en otra carpeta;
   las búsquedas prefieren tablas con el flag del módulo ante copias ambiguas.
5. Curación solo cuando aumenta la salud. Los errores de efectos opcionales no
   hacen fallar una actualización de recursos ya aplicada.
6. Tarjetas y efectos sin depender del evento de fin de animación de Dice So Nice,
   con deduplicación del evento tardío.
7. Candidatos sin UUID reconocidos por aliases `legacyNames`, con selección y
   confirmación separada antes de reemplazar código del mundo.
8. JSON `null`, arrays y valores primitivos producen errores por fichero sin
   abortar la validación de las demás macros.
9. Desbordamientos con nombre de actor, error explícito y contratos de resultado
   completos; sin claves de déficit inventadas.
10. Interfaz, CSS, vista previa y flujo de transacción compartidos para las macros
    clásicas de esferas. Ambas conservan sus comandos y ahora son wrappers.

## Validación

147 pruebas automatizadas aprobadas.

Regresiones con Node para propiedad de tablas, IDs y procedencia de macros,
seguridad HTML, conservación de dinero, drenaje, cantidades inválidas, fallos de
compilación, diálogos independientes, informes privados y preferencias de
clientes. Además: validación de fuentes, compilación LevelDB y comprobación del
zip de distribución.

No se ha ejecutado una instancia real de Foundry. Antes de publicar una release,
verificar allí importación de los 66 macros, actualización de copias existentes,
diálogos v1/v2, varios GMs, cinco clientes con y sin Dice So Nice, tiradas privadas,
inventarios y efectos de Sequencer/JB2A. No se ha publicado ninguna release.
