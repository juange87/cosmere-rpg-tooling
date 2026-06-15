# Roadmap de futuras features

Fecha: 2026-06-16
Repositorio: `cosmere-rpg-tooling`
Versión de referencia: `2.0.0`

## Propósito

Este roadmap recoge posibles mejoras posteriores a la release `2.0.0`, partiendo del estado real del módulo en el código actual. La intención es evolucionar **CosmereRPG GM Tools** como un módulo de apoyo para Foundry VTT que reduzca fricción en mesa, refuerce el sabor de Roshar y mantenga una base técnica fácil de probar y publicar.

El roadmap no propone reemplazar funcionalidades propias del sistema oficial de Cosmere RPG. Las features futuras deberían complementar el sistema con macros, paneles, tablas, chat cards, audio, efectos visuales y automatizaciones ligeras.

## Estado actual resumido

El módulo ya incluye una base sólida:

- Compatibilidad declarada con Foundry VTT v12-v13 y sistema `cosmere-rpg`.
- Inicialización GM-only que crea carpetas y tablas de creación de personaje y nombres rosharianos.
- 11 tablas base de creación de personaje y nombres.
- Tablas temáticas de Roshar para viajes, highstorms, rumores, encuentros sociales, facciones, recompensas, spren, brightlords, caravanas y ruinas.
- 2 compendios de macros: jugador y GM.
- 21 macros de jugador para tiradas de habilidades, selector de habilidad, vista de tabla y hook de respuesta a solicitudes.
- 45 macros de GM para recursos, esferas, solicitudes de tirada, mensajes, efectos visuales, sonidos, escenas y utilidades.
- Scripts reutilizables para chat cards, resolución de actores, recursos, esferas, dependencias, validación y formato.
- Panel GM Cosmere para centralizar salud/foco, esferas, roll requests, mensajes privados, sonidos, Surgebinding FX y visibilidad de tokens.
- Herramientas narrativas: Plot Die, conversaciones y endeavors, generador First Step, generador de PNJ, generador de localizaciones y compendio de escenas rápidas.
- Highstorm Toolkit con cues de tormenta, audio y calendario con opción de Journal Entry.
- Palabras Aceptadas Deluxe con audio, aura, whisper previo, chat card y salida pública o privada.
- Surgebinding FX Pack para los diez Surges, con degradación narrativa si faltan dependencias visuales.
- Gestor avanzado de esferas: balances, conversión infused/dun, gasto grupal y drenaje por Investiture.
- Control rápido de recursos para salud, foco, Investiture y estados narrativos simples.
- Settings de mundo para hooks automáticos, efectos, volumen, animaciones, idioma y herramientas experimentales.
- Capa común de diálogos con DialogV2 en Foundry v13 y fallback a Dialog V1 en Foundry v12.
- Chequeo de dependencias opcionales y chequeo de macros instaladas/importadas al mundo.
- Validación de macros (`npm run validate`), tests Node (`npm test`) y compilación de packs (`npm run compile`).

## Principios para decidir próximas features

1. Priorizar herramientas que se usen durante la sesión, no solo contenido ornamental.
2. Mantener cada feature pequeña, reversible y con degradación clara si faltan módulos opcionales.
3. No duplicar lógica que pertenezca al sistema oficial salvo que la API sea estable y aporte una integración real.
4. Convertir patrones repetidos en helpers antes de crear macros grandes y difíciles de mantener.
5. Añadir tests Node para la lógica pura antes de depender de pruebas manuales en Foundry.
6. Evitar contenido protegido: las tablas deben ser originales, inspiradas en el tono de juego y no copias de material oficial.

## Fase 1 — Pulido post-2.0.0 y calidad de vida

Prioridad: alta. Son mejoras pequeñas que aprovechan lo ya construido.

### 1. Panel GM Cosmere 2.1

Mejorar el panel actual sin convertirlo en una aplicación compleja.

Ideas:

- Añadir accesos directos a Generador de PNJ, Localizaciones, Escenas Rápidas, Plot Die y Highstorm Toolkit.
- Mostrar un resumen rápido de tokens seleccionados: nombre, salud, foco, Investiture y esferas detectadas.
- Recordar la última acción usada en una setting de usuario.
- Separar acciones frecuentes y acciones de preparación para que el panel no crezca como una lista plana.

Valor: el panel ya es el centro natural del flujo GM; pequeñas mejoras pueden reducir aún más la barra de macros.

### 2. Presets de escena para herramientas narrativas

Unificar configuraciones frecuentes de Plot Die, conversaciones, endeavors, highstorms y escenas rápidas.

Ideas:

- Presets para persecución, infiltración, duelo social, negociación, investigación, viaje peligroso y preparación ante tormenta.
- Cada preset podría rellenar resistencia, dificultad sugerida, tipo de complicación y tono de chat card.
- Permitir salida solo GM o pública según el tipo de escena.

Valor: conecta herramientas ya existentes y ayuda al GM a arrancar escenas con menos decisiones manuales.

### 3. Mejoras visuales de chat cards

Crear una pequeña guía visual común para las tarjetas del módulo.

Ideas:

- Paleta por categoría: recursos, economía, tormentas, juramentos, escenas, riesgos y recompensas.
- Iconos o etiquetas consistentes para Opportunity, Complication, coste, secreto y resumen final.
- Footer con origen de la herramienta y recordatorio de si el contenido es público o solo GM.

Valor: el módulo ya genera muchas chat cards; una identidad visual común mejora legibilidad y sensación de producto.

### 4. Modo sesión segura

Crear una opción de mundo para limitar automatizaciones durante partida.

Ideas:

- Desactivar sonidos globales sin tocar cada macro.
- Forzar degradación a chat para efectos visuales si Sequencer/JB2A fallan.
- Evitar cambios de recursos o esferas si no hay token/actor inequívoco.
- Mostrar warnings preventivos antes de macros que actualizan documentos.

Valor: reduce sorpresas en mesa y da confianza al GM al usar macros nuevas.

## Fase 2 — Integración más profunda con Cosmere RPG

Prioridad: media-alta. Depende de estabilidad de la API del sistema oficial.

### 5. Integración con tiradas reales del sistema

Hoy varias herramientas registran o acompañan tiradas, pero no sustituyen el flujo oficial.

Ideas:

- Detectar resultados de tiradas del sistema y ofrecer botón de "Registrar Plot Die" desde la chat card.
- Enlazar Request Roll con el resultado posterior del jugador para completar automáticamente una tarjeta de escena.
- Guardar Opportunity/Complication como flags del mensaje o del actor cuando sea seguro.

Valor: convierte las herramientas narrativas en una capa conectada al flujo real de juego, no solo formularios paralelos.

### 6. Creación opcional de Actors desde generadores

Los generadores actuales crean semillas narrativas, no Actors.

Ideas:

- Botón opcional "Crear Actor" desde Generador de PNJ y First Step Character Generator.
- Plantillas mínimas por cultura o rol, sin inventar estadísticas si el sistema no expone una API estable.
- Guardar origen de generación en flags del módulo para auditoría y edición posterior.

Valor: reduce trabajo de preparación sin forzar al GM a aceptar un Actor automático.

### 7. Recursos y estados con mapeo configurable

El código actual usa rutas concretas para salud, foco e Investiture.

Ideas:

- Exponer en settings las rutas de recursos si el sistema cambia campos internos.
- Validar rutas al cargar el mundo y mostrar aviso si ya no existen.
- Permitir estados narrativos personalizados además de los cuatro incluidos.

Valor: hace más resistente el módulo frente a cambios del sistema oficial o mesas con configuración propia.

### 8. Macros de ayuda contextual desde Actor o Token

Añadir acciones rápidas que lean el actor seleccionado.

Ideas:

- "Resumen de personaje" con recursos, esferas, estados narrativos y últimos flags relevantes.
- "Preparar escena con este PNJ" desde un actor seleccionado.
- "Cobrar/gastar esferas" contextual sobre un actor o grupo seleccionado.

Valor: aprovecha helpers existentes de actor, recursos y esferas con una UX más directa.

## Fase 3 — Contenido de mesa y preparación de campaña

Prioridad: media. Debe mantenerse original y modular.

### 9. Biblioteca de encuentros rosharianos

Ampliar el enfoque de tablas temáticas hacia semillas de encuentro más completas.

Ideas:

- Encuentros de viaje con gancho, conflicto, coste, recompensa y complicación opcional.
- Encuentros sociales con objetivo de PNJ, presión externa y giro de escena.
- Encuentros de tormenta con riesgo físico, oportunidad narrativa y consecuencia persistente.

Valor: combina las tablas existentes con escenas listas para improvisar.

### 10. Generador de facciones y frentes

Crear herramientas de preparación para campañas largas.

Ideas:

- Generar facción, objetivo, recurso clave, rival, secreto y reloj de avance.
- Crear Journal Entry opcional con estructura editable.
- Relacionar rumores, brightlords, caravanas y ruinas con una facción.

Valor: da continuidad entre sesiones y aprovecha la orientación narrativa del módulo.

### 11. Calendario de highstorms persistente

El Highstorm Toolkit ya puede generar calendarios y Journal Entries.

Ideas:

- Guardar el calendario activo en flags del mundo.
- Botón para consultar la próxima tormenta desde el Panel GM.
- Marcar tormentas ya usadas y añadir notas de consecuencias.
- Exportar/importar semilla y configuración del calendario.

Valor: convierte una feature de una sola generación en una herramienta persistente de campaña.

### 12. Paquetes de sonidos configurables

El módulo ya incluye audio temático.

Ideas:

- Selector de paquete de sonido por tipo de escena: tormenta, juramento, fabrial, Shadesmar, combate.
- Volumen por categoría, no solo volumen global.
- Comprobación de assets faltantes durante `npm run validate`.

Valor: mejora atmósfera sin depender de que el GM recuerde nombres de archivos o macros concretas.

## Fase 4 — Mantenibilidad, tests y releases

Prioridad: alta si el módulo seguirá creciendo.

### 13. Índice automático de macros y documentación

La README ya lista muchas macros y el número puede desactualizarse.

Ideas:

- Script que lea `packs/_source` y genere un índice Markdown de macros por compendio.
- Incluir nombre, categoría, dependencias opcionales y script principal importado.
- Usar ese índice dentro de `docs/` y enlazarlo desde README.

Valor: reduce mantenimiento manual y evita discrepancias entre compendios y documentación.

### 14. Validación documental en CI

El repo ya tiene tests y validador de macros.

Ideas:

- Test que compruebe que cada macro documentada existe en `packs/_source`.
- Test que avise si README declara un conteo distinto al real.
- Test que garantice que cada script nuevo tiene al menos una prueba de lógica pura o una razón documentada.

Valor: mantiene la documentación alineada con el código actual.

### 15. Matriz de compatibilidad Foundry v12/v13

La capa de diálogos ya soporta DialogV2 con fallback.

Ideas:

- Documento de pruebas manuales por versión de Foundry.
- Lista de APIs v13 usadas y su fallback v12.
- Checklist de release antes de cambiar `compatibility.maximum`.

Valor: evita regresiones silenciosas en mesas que sigan usando v12.

### 16. Preparación para v2.1 y v3.0

Definir criterios de corte para releases.

Ideas:

- `v2.1`: pulido de panel, presets, docs automáticas y mejoras de chat cards.
- `v2.2`: calendario persistente, sonidos configurables y estados personalizados.
- `v3.0`: integración más profunda con tiradas/actors si la API del sistema oficial es estable.

Valor: evita que todas las ideas entren en una sola release grande y difícil de probar.

## Fase 5 — Ideas exploratorias

Prioridad: baja. Conviene prototipar antes de comprometer.

### 17. Modo campaña

Una aplicación o Journal central que agrupe calendario, facciones, escenas abiertas, PNJs creados y notas de highstorms.

Riesgo: puede crecer demasiado y competir con herramientas nativas de Foundry. Solo merece la pena si reutiliza piezas ya existentes y mantiene una UX ligera.

### 18. Import/export de configuración del módulo

Permitir mover settings, presets y calendarios entre mundos.

Riesgo: requiere cuidar compatibilidad de versiones y no exportar datos privados por accidente.

### 19. Asistente de sesión para GM

Flujo guiado antes de la partida:

- Chequear dependencias.
- Validar macros importadas obsoletas.
- Revisar próxima highstorm.
- Preparar 1 rumor, 1 PNJ, 1 localización y 1 complicación.

Riesgo: debe ser opcional y rápido; si parece una aplicación pesada, contradice el espíritu de macros ligeras.

## Priorización recomendada

### Must have próximo ciclo

1. Panel GM Cosmere 2.1.
2. Índice automático de macros y documentación en `docs/`.
3. Validación documental en CI.
4. Mejoras visuales de chat cards.
5. Modo sesión segura.

### Should have

1. Presets de escena para herramientas narrativas.
2. Calendario de highstorms persistente.
3. Recursos y estados con mapeo configurable.
4. Macros contextuales desde Actor o Token.
5. Paquetes de sonidos configurables.

### Could have

1. Biblioteca de encuentros rosharianos.
2. Generador de facciones y frentes.
3. Creación opcional de Actors desde generadores.
4. Integración directa con tiradas reales del sistema.
5. Import/export de configuración.

### Later / v3.0

1. Modo campaña.
2. Asistente de sesión para GM.
3. Integración profunda con Actor, mensajes y flags del sistema oficial cuando su API sea estable.

## Riesgos y dependencias

- Las dependencias opcionales (`JB2A_DnD5e`, Sequencer/Sequence, Sequencer.Crosshair y Dice So Nice) deben seguir tratándose como opcionales salvo que el módulo cambie explícitamente sus requisitos.
- Las APIs de Foundry v12 y v13 difieren; cualquier mejora de diálogo debe pasar por `scripts/foundry-dialogs.js`.
- Las macros importadas al mundo pueden quedarse obsoletas; cualquier cambio grande debería considerar el flujo de Chequeo de Macros Instaladas.
- Los cambios de recursos, esferas o Actors pueden tocar documentos persistentes del mundo; deben ser explícitos, reversibles cuando sea posible y fáciles de probar.
- El contenido de ambientación debe ser original y funcional para mesa, evitando copiar texto protegido de libros o material oficial.

## Próximo corte sugerido

La siguiente release pequeña podría ser `v2.1.0 - Mesa más rápida` con este alcance:

- Panel GM Cosmere 2.1 con accesos a herramientas narrativas.
- Presets básicos para escenas rápidas y Plot Die.
- Chat cards con estilo más consistente.
- Índice automático de macros bajo `docs/`.
- Tests de consistencia entre README, compendios y documentación.

Este corte aprovecha el código existente, no depende de nuevas APIs del sistema oficial y mejora directamente la experiencia del GM en sesión.
