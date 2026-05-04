# Roadmap de funcionalidades para Cosmere RPG Tooling

Fecha: 2026-05-02

## Vision

Cosmere RPG Tooling deberia crecer como un modulo de apoyo para mesa, centrado en reducir friccion al GM y aumentar el sabor Cosmere durante la partida. La idea no es reemplazar al sistema oficial de Cosmere RPG en Foundry VTT, sino complementarlo con macros, paneles, tablas, sonidos, efectos visuales y automatizaciones ligeras.

El foco principal deberia ser:

- Agilizar acciones frecuentes de GM y jugadores.
- Convertir mecanicas narrativas del Cosmere RPG en herramientas visibles en mesa.
- Mejorar momentos dramaticos con chat cards, audio y animaciones.
- Mantener el modulo sencillo de instalar, mantener y evolucionar.

## Estado actual

El modulo ya incluye:

- Tablas de creacion de personaje y generadores de nombres.
- Macros de tiradas de habilidad para jugadores.
- Macro de solicitud de tiradas del GM.
- Gestion basica de salud y foco.
- Gestion de esferas Mark encendidas y apagadas.
- Macros de efectos visuales con JB2A.
- Sonidos para "Palabras Aceptadas".
- Hooks opcionales para natural 20 y fallo critico ejecutados desde macro.

Esto deja una base muy buena para evolucionar hacia herramientas mas integradas: menos macros sueltas, mas flujos guiados.

## Principios de producto

- Priorizar herramientas que se usen en partida, no solo contenido bonito.
- Mantener cada feature autocontenida y desactivable cuando sea posible.
- Evitar duplicar funcionalidad que ya pertenezca claramente al sistema oficial.
- Usar macros para funcionalidades pequenas y scripts del modulo para comportamiento global.
- Cuidar compatibilidad con Foundry VTT v12/v13 mientras el modulo lo declare.
- Detectar dependencias opcionales como Sequencer, Dice So Nice o JB2A antes de usarlas.

## Fase 1: Calidad de vida inmediata

### 1. Panel GM Cosmere

Estado: hecho en `codex/gm-panel`.

Crear una macro o aplicacion ligera que centralice herramientas del GM:

- Gestion de salud y foco.
- Distribuir y eliminar esferas.
- Solicitar tiradas.
- Enviar mensajes privados.
- Disparar sonidos.
- Lanzar efectos visuales frecuentes.
- Mostrar u ocultar tokens seleccionados.

Valor: reduce la dependencia de una barra de macros enorme y mejora mucho el ritmo de sesion.

### 2. Hooks globales configurables

Estado: hecho en `codex/settings-and-hooks`.

Mover los hooks de natural 20, fallo critico y solicitud de tiradas desde macros manuales a `scripts/init.js`.

Opciones recomendadas:

- Activar/desactivar efectos de natural 20.
- Activar/desactivar efectos de natural 1.
- Activar/desactivar botones de respuesta a solicitudes de tirada.
- Elegir si se muestran notificaciones, chat cards, sonido o animacion.

Valor: los jugadores no tendrian que acordarse de ejecutar macros de hook al entrar.

### 3. Chequeo de dependencias

Estado: hecho en `codex/dependency-checker`.

Se creo una macro oficial del compendio GM y un helper reutilizable para revisar dependencias opcionales:

- `Sequence` y `Sequencer.Crosshair` para animaciones avanzadas.
- JB2A para rutas de efectos.
- Dice So Nice para el hook `diceSoNiceRollComplete`.

Notas:

- La macro publica una tarjeta de chat con el estado de cada dependencia.
- Si falta algo, muestra una notificacion legible en vez de depender de errores de consola.
- La logica principal vive en `scripts/dependency-checker.js`.
- La macro fuente vive en `packs/_source/gm-macros/DependencyCheck01.json`.
- La feature esta cubierta por tests en `tests/dependency-checker.test.mjs`.

Valor entregado: menos errores durante partida y mejor experiencia de instalacion.

### 4. Helpers compartidos

Estado: hecho en `codex/cosmere-helpers`.

Extraer utilidades repetidas a scripts comunes:

- Obtener actor desde token seleccionado o personaje del usuario.
- Leer y actualizar recursos.
- Leer y actualizar esferas.
- Crear chat cards.
- Validar dependencias.
- Formatear nombres y cantidades.

Valor: macros mas pequenas, mas faciles de mantener y menos bugs duplicados.

## Fase 2: Herramientas Cosmere de alto impacto

### 5. Gestor de Plot Die

Estado: hecho en `codex/plot-die-manager`.

Se creo una macro oficial del compendio GM para registrar momentos de Plot Die:

- Registrar una tirada con Plot Die despues de resolverla.
- Mostrar exito/fallo cuando se indica dificultad.
- Registrar Opportunity y Complication.
- Publicar resultados narrativos en chat.
- Permitir al GM anadir texto de oportunidad/complicacion.
- Enviar la tarjeta solo al GM cuando el resultado sea privado.

Notas:

- La primera version registra el resultado despues de una tirada; no reemplaza la tirada oficial del sistema Cosmere RPG.
- El modo automatico interpreta 6 como Opportunity y 1 como Complication, con opcion de override manual.
- La tarjeta permite resultado publico o whisper al GM.
- La logica principal vive en `scripts/plot-die-manager.js`.
- La macro fuente vive en `packs/_source/gm-macros/PlotDieManager01.json`.
- La feature esta cubierta por tests en `tests/plot-die-manager.test.mjs`.
- Los efectos visuales para natural 20 o natural 1 quedan como mejora futura, apoyados por el chequeo de dependencias.

Valor entregado: convierte una mecanica diferencial del Cosmere RPG en algo visible y memorable en Foundry.

### 6. Gestor de conversaciones y endeavors

Estado: hecho en `codex/conversation-endeavor-manager`.

Crear macros o un panel para escenas no-combate:

- Crear una conversacion con PNJ objetivo, resistencia o foco.
- Crear un endeavor con progreso requerido.
- Registrar avances, fallos, oportunidades y complicaciones.
- Publicar estado al chat.
- Permitir finalizar con resumen.

Notas de cierre:

- La macro incluye una accion especifica **Finalizar con resumen**.
- Al finalizar, el progreso se completa y la tarjeta muestra **Resumen final**.

Valor: refuerza una parte central del sistema que puede quedar menos automatizada que el combate.

### 7. First Step Character Generator

Estado: hecho en `codex/first-step-character-generator`.

Se convirtio el ejemplo del README en una macro oficial del compendio GM:

- Tirar objetivo, obstaculo y proposito Radiant.
- Opcionalmente tirar cultura y nombre.
- Publicar una tarjeta de personaje rapido en chat.
- Permitir whisper al GM o mensaje publico.

Notas:

- La macro genera una semilla narrativa en chat; no crea automaticamente un Actor de Foundry.
- La logica principal vive en `scripts/first-step-character-generator.js`.
- La macro fuente vive en `packs/_source/gm-macros/FStepCharGen0001.json`.
- La feature esta cubierta por tests en `tests/first-step-character-generator.test.mjs`.

Valor entregado: feature pequena, muy tematica y facil de usar desde el compendio GM.

### 8. Generador de PNJ Roshar

Estado: hecho en `codex/roshar-npc-generator`.

Se creo una macro oficial del compendio GM para improvisar PNJs:

- Nombre.
- Cultura.
- Actitud inicial.
- Problema inmediato.
- Secreto.
- Recurso que puede ofrecer.
- Rumor o gancho de escena.

Notas:

- La macro usa las tablas de nombres existentes para generar nombre y cultura.
- Los rasgos narrativos viven en `scripts/roshar-npc-generator.js`.
- La macro fuente vive en `packs/_source/gm-macros/RosharNPCGen0001.json`.
- La feature esta cubierta por tests en `tests/roshar-npc-generator.test.mjs`.
- La macro genera una semilla narrativa en chat; no crea automaticamente un Actor de Foundry.

Valor entregado: util en casi cualquier sesion y coherente con las tablas existentes.

## Fase 3: Atmosfera y momentos dramaticos

### 9. Highstorm Toolkit

Estado: hecho en `codex/highstorm-toolkit`.

Se creo una macro oficial del compendio GM para manejar momentos de tormenta alta:

- Iniciar cuenta atras de highstorm.
- Reproducir trueno o ambiente.
- Publicar avisos narrativos.
- Anadir una nota de GM a la tarjeta de chat.
- Enviar la tarjeta solo al GM cuando haga falta preparar informacion privada.
- Generar calendarios de proximas altas tormentas con dia, hora e intensidad.
- Publicar el calendario en chat y crear una Journal Entry persistente.

Notas:

- La primera version no cambia iluminacion ni estado de escena; evita modificar la escena activa de forma inesperada.
- El calendario usa una semilla configurable para poder repetir la misma secuencia.
- La macro permite elegir entre trueno puntual y ambiente highstorm en loop.
- La logica principal vive en `scripts/highstorm-toolkit.js`.
- La macro fuente vive en `packs/_source/gm-macros/HighstormTool01.json`.
- La feature esta cubierta por tests en `tests/highstorm-toolkit.test.mjs`.

Valor entregado: las tormentas son una firma de Roshar y el modulo ya incluye sonido de trueno.

### 10. Palabras Aceptadas Deluxe

Estado: hecho en `codex/oath-accepted-deluxe`.

Expandir la macro actual:

- Elegir actor o token.
- Elegir Orden Radiant.
- Escribir o seleccionar Ideal.
- Reproducir audio en dos fases.
- Mostrar aura o efecto JB2A.
- Publicar chat card dramatica.
- Permitir whisper previo al jugador.

Notas de cierre:

- El whisper previo se envia como mensaje real al jugador seleccionado antes de publicar la tarjeta final.
- La tarjeta final puede seguir siendo publica o solo para GM.

Valor: convierte uno de los momentos mas importantes de campana en una escena especial.

### 11. Surgebinding FX Pack

Estado: hecho en `codex/surgebinding-fx-pack`.

Crear macros visuales por surge:

- Adhesion.
- Gravitation.
- Division.
- Abrasion.
- Progression.
- Illumination.
- Transformation.
- Transportation.
- Cohesion.
- Tension.

Primera version puede ser puramente visual y narrativa, sin automatizacion mecanica profunda.

Valor: mucho sabor Cosmere con bajo riesgo si se mantiene como capa visual.

### 12. Pack de sonidos

Estado: hecho en `codex/sound-pack`.

Ampliar la carpeta `sounds/` con efectos tematicos:

- Highstorm loop.
- Thunder variants.
- Shardblade summon.
- Sphere glow.
- Fabrial hum.
- Shadesmar ambience.
- Oath accepted variants.

Valor: mejora identidad del modulo y acompana bien las macros de escena.

## Fase 4: Contenido y preparacion de partida

### 13. Nuevas roll tables

Estado: hecho en `codex/roshar-roll-tables`.

Ampliar el sistema de tablas con carpetas nuevas:

- Complicaciones de viaje.
- Eventos de highstorm.
- Rumores de Roshar.
- Encuentros sociales.
- Objetivos de facciones.
- Recompensas y hallazgos.
- Spren curiosos.
- Ganchos de brightlords.
- Problemas de caravanas.
- Descubrimientos de ruinas.

Valor: complementa la funcionalidad actual sin tocar demasiada logica.

### 14. Generador de localizaciones

Estado: hecho en `codex/location-generator`.

Macro o tablas para crear rapidamente:

- Campamentos de guerra.
- Pueblos rosharianos.
- Caravanas.
- Mansiones lighteyes.
- Mercados.
- Ruinas antiguas.
- Puestos de avanzada.
- Zonas afectadas por highstorm.

Salida ideal:

- Chat card para improvisar.
- Opcion de crear Journal Entry.

### 15. Compendio de escenas rapidas

Estado: hecho en `codex/quick-scene-compendium`.

Crear macros o journals para escenas recurrentes:

- Persecucion.
- Infiltracion.
- Duelo social.
- Descubrimiento.
- Viaje peligroso.
- Negociacion.
- Preparacion antes de tormenta.

Valor: ayuda al GM a arrancar estructuras de escena sin preparar todo desde cero.

## Fase 5: Economia, inventario y recursos

### 16. Gestor de esferas avanzado

Estado: hecho en `codex/sphere-manager`.

Evolucionar las macros actuales:

- Mostrar balance total por actor.
- Convertir entre esferas encendidas y apagadas.
- Gastar por grupo.
- Drenar esferas tras uso de Investiture.
- Detectar fondos insuficientes antes de confirmar.
- Publicar resumen de tesoreria al chat.

Notas de cierre:

- El panel avanzado expone acciones para resumen, conversion infused/dun, gasto grupal y drenaje por Investiture.
- Las operaciones bloquean la aplicacion cuando hay deficit y publican una tarjeta de resultado cuando se solicita.

Valor: aprovecha una linea ya iniciada en el repo y la convierte en herramienta completa.

### 17. Control rapido de recursos

Estado: hecho en `codex/resource-control`.

Macro o panel para modificar recursos en bloque:

- Salud.
- Foco.
- Investiture si el sistema la expone de forma estable.
- Estados narrativos simples.

Opciones:

- Incrementos de +/-1.
- Campo libre.
- Aplicar a todos los tokens seleccionados.
- Publicar resumen opcional.

Notas de cierre:

- La macro aplica salud, foco e Investiture sobre tokens seleccionados o personaje del usuario.
- Tambien permite aplicar o retirar estados narrativos simples: con ventaja, expuesto, agotado e inspirado.

## Fase 6: Mantenibilidad y release

### 18. Settings del modulo

Estado: hecho en `codex/settings-and-hooks`.

Registrar ajustes de mundo:

- Activar hooks automaticos.
- Volumen de sonidos.
- Usar animaciones si hay dependencias.
- Publicar resultados en chat por defecto.
- Idioma preferido de etiquetas.
- Habilitar herramientas experimentales.

### 19. Validacion de macros

Estado: hecho en `codex/macro-validator`.

Crear script de validacion para `packs/_source`:

- Verificar `_id` y `_key`.
- Verificar que `_key` coincide con `!macros!{_id}`.
- Detectar nombres duplicados.
- Detectar comandos vacios.
- Detectar referencias a dependencias externas.
- Comprobar que `npm run compile` genera packs sin errores.

### 20. Documentacion de contribucion

Estado: hecho en `codex/readme-contribution-docs`.

Anadir guias cortas:

- Como crear una macro nueva.
- Como probar macros en Foundry.
- Como anadir sonidos.
- Como anadir tablas.
- Como preparar una release.

Valor: reduce coste de mantenimiento y facilita futuras contribuciones.

### 21. Migracion de dialogos a DialogV2

Estado: hecho en `codex/dialog-v2-migration`.

Se migro la apertura de dialogos del modulo desde la API de Dialog V1 hacia `foundry.applications.api.DialogV2`:

- Los scripts del modulo usan `scripts/foundry-dialogs.js` como capa comun.
- En Foundry v13, la capa comun instancia DialogV2 y traduce botones, ancho, render callbacks y callbacks de formulario.
- En Foundry v12, la misma capa mantiene fallback a Dialog V1 mientras el modulo declare compatibilidad v12.
- Los macros legacy del compendio que abrian Dialog V1 directamente ahora importan la capa comun.
- Los tests detectan si vuelve a aparecer `new Dialog(...)` en scripts o fuentes de macros y verifican que los comandos embebidos siguen parseando.

Valor: elimina warnings de deprecacion en Foundry v13 sin cortar compatibilidad con mesas que sigan usando v12.

### 22. Chequeo de macros instaladas

Estado: hecho en `codex/dialog-v2-migration`.

Se anadio una macro oficial del compendio GM para proteger mundos que ya tienen copias importadas de macros del modulo:

- Escanea las macros del mundo por nombre y las compara contra los compendios **CosmereRPG: GM Macros** y **CosmereRPG: Player Macros**.
- Detecta copias actualizadas, copias obsoletas, macros no importadas al mundo y duplicados con el mismo nombre.
- Compara `command`, `type`, `img` y `scope`, evitando tocar propiedades propias del mundo como carpeta, ownership o posicion en la barra.
- No modifica nada durante el escaneo.
- Actualiza solo las copias obsoletas que el GM marca explicitamente en el dialogo.
- Registra en flags del modulo una pequena auditoria de la ultima actualizacion aplicada.

Notas:

- La logica principal vive en `scripts/macro-upgrade-checker.js`.
- La macro fuente vive en `packs/_source/gm-macros/MacroUpgradeCheck01.json`.
- La feature esta cubierta por tests en `tests/macro-upgrade-checker.test.mjs`.

Valor: evita que mundos antiguos sigan ejecutando versiones obsoletas de macros importadas sin sobrescribir cambios del GM de forma automatica.

## Priorizacion recomendada

### Must have

1. Panel GM Cosmere. Hecho.
2. Hooks globales configurables. Hecho.
3. Chequeo de dependencias. Hecho.
4. Gestor de Plot Die. Hecho.
5. First Step Character Generator. Hecho.

### Should have

1. Highstorm Toolkit. Hecho.
2. Palabras Aceptadas Deluxe. Hecho.
3. Gestor de conversaciones y endeavors. Hecho.
4. Generador de PNJ Roshar. Hecho.
5. Gestor de esferas avanzado. Hecho.

### Could have

1. Surgebinding FX Pack. Hecho.
2. Pack de sonidos ampliado. Hecho.
3. Generador de localizaciones. Hecho.
4. Compendio de escenas rapidas. Hecho.
5. Nuevas roll tables tematicas. Hecho.

## Riesgos y consideraciones

- Las macros actuales mezclan logica, estilos HTML y llamadas a Foundry. Antes de crecer mucho, conviene extraer helpers.
- Algunas macros dependen de modulos no declarados explicitamente. Hay que decidir si seran dependencias requeridas, recomendadas o simplemente opcionales.
- Foundry v12 y v13 pueden diferir en APIs de aplicaciones y dialogos. Si se crea un panel, conviene probar ambas versiones declaradas.
- El contenido de Cosmere debe evitar copiar texto protegido de libros o material oficial no permitido. Mejor crear tablas originales inspiradas en tono y uso de mesa.
- El modulo deberia seguir funcionando aunque no existan JB2A, Sequencer o Dice So Nice, degradando a chat/notificacion cuando falten.

## Primer hito sugerido

El primer hito podria ser `v1.3.0 - GM Flow`.

Alcance recomendado:

- Crear helpers compartidos.
- Mover hooks de tiradas a inicializacion configurable.
- Anadir chequeo de dependencias.
- Crear Panel GM Cosmere basico.
- Incorporar First Step Character Generator como macro oficial. Hecho.
- Actualizar README.

Este hito consolidaria la base actual sin abrir demasiados frentes y dejaria el modulo preparado para features mas narrativas en versiones posteriores.
