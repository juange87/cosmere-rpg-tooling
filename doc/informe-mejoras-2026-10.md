# Informe de mejoras: robustez y nuevo contenido

Fecha: 2026-10-09
Base analizada: `master` @ `2260dc7` (v2.1.0)

Este informe complementa `doc/roadmap.md`, cuyo alcance (items 1-22) está cerrado. Tiene tres partes:

1. Estado actual.
2. Acciones de robustez: bugs, seguridad, release y mantenibilidad.
3. Contenido nuevo propuesto que no está en el roadmap ni duplica otros módulos de la comunidad.

---

## 1. Estado actual

### Arquitectura

- `module.json` carga un único esmodule, `scripts/init.js`:
  - en `init` registra los settings;
  - en `ready` activa los hooks de tiradas;
  - también en `ready`, solo para GM, siembra las carpetas y las 21 tablas (11 base y 10 temáticas).
- Cada herramienta vive en un script propio en `scripts/` (22 ficheros, unas 5.000 líneas) con inyección de dependencias, lo que facilita los tests.
- Las macros de compendio (66) cargan los scripts con `await import("/modules/cosmere-rpg-tooling/scripts/...")`. Algunas macros antiguas tienen toda la lógica inline.
- Los diálogos pasan por `foundry-dialogs.js`: DialogV2, con fallback a Dialog v1.

### Calidad

- `npm test` da 89/89 tests en verde (unos 640 ms).
- `lang/en.json` y `lang/es.json` tienen las mismas 548 claves. Las carencias de traducción están en textos hardcodeados (ver R-14).
- `npm run validate` sale con código 1 si no hay `node_modules`, porque falla al no encontrar `@foundryvtt/foundryvtt-cli`.
- `CLAUDE.md` y `AGENTS.md` están desactualizados: hablan de 21 y 19 macros, no mencionan los tests ni `lang/`, y dicen que no hay tests automáticos.

---

## 2. Robustez: acciones recomendadas

Severidad: **Alta** = puede romper o perder datos o es explotable; **Media** = comportamiento incorrecto o frágil; **Baja** = higiene.

### Alta

| ID | Problema | Dónde | Acción |
|----|----------|-------|--------|
| R-1 | **20 macros con `_id` inválido.** Foundry exige 16 caracteres alfanuméricos (`DocumentIdField`). Los IDs afectados son `ConversationEndeavor01`, `GMPanel01`, `SphereManager01`, `Surge*01`, etc. Lo más probable es que Foundry los trate como documentos inválidos en el compendio. Hay que confirmarlo en una instancia real. | `packs/_source/gm-macros/*.json`, `scripts/macro-validator.js:37-41` | Regenerar los IDs con 16 caracteres y actualizar su `_key`. Añadir al validador la regla `/^[A-Za-z0-9]{16}$/` con un test. Revisar que `macro-upgrade-checker` siga emparejando bien. |
| R-2 | **Se borran tablas del usuario.** `game.tables.getName(name)` encuentra cualquier tabla con ese nombre. Si no está en la carpeta del módulo, se ejecuta `delete()` y se recrea. Se pierden las tablas propias del GM, sus ediciones y las referencias por UUID. | `scripts/init.js:375-388`, `scripts/roshar-roll-tables.js:307-311` | Identificar las tablas por `flags["cosmere-rpg-tooling"].tableKey`. No borrar nunca; como mucho mover con `update({ folder })`. Guardar en un setting la versión de las tablas sembradas y re-sembrar solo cuando cambie. Añadir un setting para desactivar el sembrado. |
| R-3 | **Hooks de tirada duplicados.** `diceSoNiceRollComplete` se dispara en todos los clientes y cada uno crea su `ChatMessage` y reproduce el sonido con broadcast. Con 5 jugadores salen 5 tarjetas y 5 sonidos. | `scripts/settings-and-hooks.js:143-175, 215-217` | Que solo el GM activo cree mensajes y difunda el sonido (`game.users.activeGM?.isSelf`). Si Dice So Nice no está activo, usar `createChatMessage` como fallback. |
| R-4 | **XSS en macros legacy.** Nombres de actor o usuario e imágenes se interpolan en HTML de diálogos y chat sin escapar. Un jugador puede renombrar su actor a `<img src=x onerror=...>` y ejecutar código en el cliente del GM. | Distribute Spheres (`z8dLwcyv2CkyTvLS`), Remove Spheres (`PFVU35wn6SQ4hYxg`), Request Roll (`OHzWpcVmcfaHsk4z`), Send message (`wilsiRBC31LfydfP`), Roll Skill (los dos modos de vista) | Usar `escapeHtml` de `cosmere-helpers.js` o, mejor, migrar estas macros a scripts con tests (ver R-11). |
| R-5 | **Falta el fichero `LICENSE`**, aunque `module.json` lo declara y el workflow lo incluye en el zip. `package.json` dice `ISC`. | raíz, `module.json`, `package.json` | Elegir una licencia, añadir el fichero y unificarla en `package.json`. |
| R-6 | **La release no ejecuta tests ni validación.** | `.github/workflows/main.yml` | Ejecutar `npm test` y `npm run validate` antes del zip. Añadir un workflow de CI para PR y push. |

### Media

| ID | Problema | Dónde | Acción |
|----|----------|-------|--------|
| R-7 | **El conversor de esferas regala dinero.** Si `fromKey === toKey`, el objeto `changes` solo conserva `+n`. Además convierte 1:1 por cantidad sin mirar el valor, así que 1 broam se convierte en 1 chip. | `scripts/sphere-manager.js:117-128` | Rechazar origen igual a destino, convertir por valor con resto y añadir tests. |
| R-8 | **El drenaje de Investidura destruye esferas** en lugar de convertirlas en *dun*. Se aceptan cantidades no enteras y, en Distribute Spheres, también negativas. | `sphere-manager.js:175-215`, macro Distribute Spheres | Mover lo drenado a `dun\|<denominación>` y validar que las cantidades sean enteros ≥ 0. |
| R-9 | **El chequeo de macros instaladas empareja solo por nombre.** Una macro propia del GM llamada igual que una del compendio se sobrescribiría. Si falla una actualización, el resto queda a medias. | `scripts/macro-upgrade-checker.js:95-96, 192-201` | Emparejar por `_stats.compendiumSource` o `flags.core.sourceId`, y capturar el error de cada actualización por separado. |
| R-10 | **El Panel GM busca las macros solo en el mundo** con `game.macros.getName`. Falla si no se han importado o si se renombraron. | `scripts/gm-panel.js:28-36, 60-61` | Cargarlas del compendio con `pack.getDocument(id)` o, mejor, llamar directamente a funciones de `scripts/`. |
| R-11 | **Las macros dependen de rutas absolutas** `/modules/...` en sus `import()`. Fallan con `routePrefix` y acoplan las macros a los nombres de fichero. | todas las macros nuevas | Exponer una API pública en `init` (`game.modules.get("cosmere-rpg-tooling").api = { openSphereManager, ... }`) y que las macros sean una sola línea que la llame. |
| R-12 | **Macros legacy frágiles:** no comprueban `actor`, `token`, `Sequence` ni las rutas de `system.*`; tienen `update` sin `await`; las macros "Hook 20 Natural" y "Hook Critical FAilure" acumulan un `Hooks.on` en cada ejecución y usan el global `Die`, deprecado. | Increase/Reduce Focus, Strike *, Teleport, Throw, Spren flight, macros de hooks | Crear guardias comunes (`requireToken`, `hasSequencer`, `resolveJb2aAssetPath`). Retirar las macros de hooks: ya existe un setting que hace lo mismo. |
| R-13 | **Request Roll usa `user:`, deprecado en v12+** (ahora es `author`) y solo envía la petición al primer dueño del actor. | macro Request Roll | Usar `author` y enviar el susurro a todos los dueños. |
| R-14 | **Textos hardcodeados sin localizar.** Además, la misma moneda se crea con dos nombres distintos ("Mark (Dun)" frente a "Mark dun"), lo que duplica ítems en el inventario. | `init.js:416`, `resource-control.js:17`, `sphere-manager.js:12-17`, `plot-die-manager.js:6-8`, `conversation-endeavor-manager.js`, `location-generator.js:97`, `oath-accepted-deluxe.js`, `quick-scene-compendium.js:62` | Pasar todo por `localize` o `game.i18n.format`, y unificar los nombres de moneda en una constante compartida. |
| R-15 | **Si falla la descarga de un catálogo de idioma, no carga nada del módulo:** el top-level await en `localization.js` hace fallar el import de `init.js`. | `scripts/localization.js:16` | Envolver la carga en try/catch y caer a `game.i18n` o a la propia clave. |
| R-16 | **Si hay varios GMs conectados, todos siembran a la vez** y pueden duplicar carpetas y tablas. | `scripts/init.js:18-21` | Salir si no es el GM activo: `if (!game.users.activeGM?.isSelf) return;` |
| R-17 | **Al manifiesto le faltan las relaciones.** | `module.json` | Añadir `relationships.systems` (cosmere-rpg con su compatibilidad) y `relationships.recommends` (sequencer, JB2A, dice-so-nice). Quitar `manifestPlusVersion`. |

### Baja

- **R-18:** el zip incluye rutas que no existen (`templates`, `styles/`, `language/`). Además, `dependabot.yml` no vigila `npm`.
- **R-19:** `compile-packs.js` borra la salida anterior antes de comprobar si la compilación funcionará. Conviene ejecutar el validador antes.
- **R-20:** hay lógica duplicada:
  - `escapeHtml` está repetido en `dependency-checker.js` y `first-step-character-generator.js`;
  - el cálculo de dinero está repetido entre `sphere-manager.js` y las dos macros de esferas de unos 15 KB.
- **R-21:** `macro-validator.js:153` no escapa las secciones del informe. Las macros de esferas usan `document.querySelectorAll`, que es global y choca si hay dos diálogos abiertos a la vez.
- **R-22:** los informes de mantenimiento (dependencias y macros instaladas) salen en el chat público. Deberían enviarse solo al GM.
- **R-23:** cinco sonidos no se usan en ningún sitio (`fabrial-hum`, `shadesmar-ambience`, `shardblade-summon`, `sphere-glow`, `thunder-variant-01`) y engordan el zip. Se pueden usar en el contenido nuevo (C-6) o eliminarlos.
- **R-24:** todos los settings tienen `scope: "world"`. El volumen, el sonido y las animaciones deberían ser `client`.
- **R-25:** hay que actualizar `CLAUDE.md` y `AGENTS.md` al estado real del proyecto (tests, `lang/`, número de macros).

### Orden sugerido (sprint de robustez, v2.1.1 / v2.2.0)

1. R-1 (IDs) y R-5 (LICENSE): son bloqueantes de publicación.
2. R-2 y R-16: sembrado de tablas no destructivo, ejecutado solo por el GM activo.
3. R-3: hooks de tirada ejecutados solo por el GM activo.
4. R-4: escapar HTML en las macros.
5. R-6: CI con tests y validación.
6. R-7 y R-8: correcciones de esferas.
7. R-11, R-10 y R-12: API pública y migración de las macros legacy a scripts con tests.
8. R-14, R-15 y R-17 a R-25: localización, manifiesto e higiene.

---

## 3. Contenido nuevo propuesto

### Contexto del ecosistema

- El sistema `cosmere-rpg` (the-metalworks) 3.x exige Foundry 13.346 o superior y está migrando a v14. Hoy el módulo declara `maximum: 13`.
- Ya existe Mistborn Handbook en Foundry y el Starter Set de Mistborn está previsto para octubre de 2026. El módulo no tiene nada de Mistborn.
- Módulos de la comunidad que **no conviene duplicar**:
  - Cosmere Useful Macros: conversión de esferas a *dun* y formas de la Shardblade.
  - Cosmere Character Generators.
  - Cosmere Automated Actions: Breathe Stormlight y Enhance.
  - Argon Combat HUD Cosmere.
  - Los packs premium Stormlight Handbook y World Guide: luz de esfera para tokens, tablas de fabriales y eventos de POI.

### Propiedad intelectual y licencias

- **Política de contenido fan de Brotherwise:** el módulo no puede venderse, no puede usar su diseño gráfico oficial y debe etiquetarse como fan content. Hay que revisar el texto vigente antes de publicar.
- **Tablas del sistema:** `src/packs/rules` y `src/packs/tables` no están bajo MIT. Solo se pueden referenciar por UUID, nunca copiar.
- **Texto original:** todo el contenido nuevo debe ser propio; no se deben parafrasear ejemplos de los manuales.
- **Política anti-IA:** the-metalworks rechaza PRs con contenido generado por IA. Es relevante si se quiere contribuir algo upstream.

### Prioridad alta

| ID | Propuesta | Valor | Esfuerzo | Notas |
|----|-----------|-------|----------|-------|
| C-1 | **Compatibilidad con Foundry v14** y revisión del mínimo v12: subir `maximum`, probar DialogV2 y los hooks, valorar dejar v12. | Sin esto, el módulo deja de cargar cuando las mesas actualicen. | M | La API de ActiveEffect y los updates con `-=` cambian (issues del sistema #970-974). Hacer R-1 a R-6 antes. |
| C-2 | **Asistente de heridas:** después de la tarjeta de herida, tirar o elegir el efecto y aplicarlo al actor, con selector de tabla (por defecto, de Shardblade o personalizadas). | Hueco pedido por la comunidad (#446, #350). | M | Usar las tablas oficiales solo por UUID. |
| C-3 | **Asistente de turnos rápidos y lentos:** panel de quién eligió rápido o lento y quién ya actuó, aviso de la fase de PNJ y hook propio de inicio y fin de turno. | El tracker de Foundry encaja mal con este combate (#641, #671). | M/L | Hacerlo como capa opcional; puede solaparse con Argon. |
| C-4 | **Pack Scadrial: generadores de nombres** (Era 1: nobles, skaa, terris; Era 2: Elendel, Roughs) en una carpeta nueva. | Prepara el módulo para Mistborn con poco coste; reutiliza la infraestructura de tablas. | S | Hacerlo **después de R-2**. Nombres originales, no canónicos. |
| C-5 | **Rastreador de reservas de metal y viales (Allomancy):** panel por actor con metales disponibles, quemados y avivados, consumo de viales y aviso de reserva vacía. | Equivalente al gestor de esferas para Mistborn. | M | Contador genérico y configurable, sin reproducir reglas de pago. |
| C-6 | **Toggle de Shadesmar:** emparejar escenas física y cognitiva, mover los tokens seleccionados, cambiar el ambiente y publicar una tarjeta. | Petición abierta desde v0.1 (#130); usa el sonido `shadesmar-ambience.wav`, que hoy no se usa. | M | Amplía el item #12 del roadmap. |

### Prioridad media

| ID | Propuesta | Valor | Esfuerzo | Notas |
|----|-----------|-------|----------|-------|
| C-7 | **Plot Die físico:** introducir la cara obtenida con un dado real y aplicarla a la última tirada. | Petición abierta (#562, #136). | S | Amplía el item #5 del roadmap. |
| C-8 | **Ventaja retroactiva** desde la tarjeta de tirada en el chat. | Responde a #291; evita repetir la tirada. | M | Frágil ante cambios en el formato de las tiradas del sistema. |
| C-9 | **Banco de Oportunidades y Complicaciones** por contexto (combate, social, exploración, tormenta), con botón desde la tarjeta del Plot Die. | Agiliza la improvisación del GM. | S | Texto original. |
| C-10 | **Calendario rosharano** para Seasons & Stars o Simple Calendar, conectado al Highstorm Toolkit (aviso el día de tormenta). | Convierte el calendario de tormentas en algo vivo. | M | Amplía el item #9 del roadmap. |
| C-11 | **Rastreador de objetivos, conexiones y recompensas** del grupo, con botón "cumplir objetivo". | Evita que la progresión narrativa se pierda entre sesiones (#679). | M | Depende del data model del sistema. |
| C-12 | **Generadores de PNJ y localizaciones por era** (Roshar, Scadrial Era 1, Era 2). | Reutiliza el motor existente. | M | Amplía los items #8 y #14 del roadmap. |
| C-13 | **Kit de golpe (heist) y noches de bruma:** endeavor por fases con reloj de alerta. | Tipo de escena central de la Era 1. | M | Amplía el item #15 del roadmap. |
| C-14 | **Ayuda de Investidura:** panel del grupo, alerta al llegar a 0 y "recargar en alta tormenta". | El sistema no tiene un valor derivado ni triggers para esto (#931, #672). | S/M | Solo mostrar y avisar; no automatizar talentos. |
| C-15 | **Mostrar a los jugadores** la carta de un PNJ o la imagen de una localización, sin los secretos, desde el Panel GM. | Patrón muy usado en otros módulos; aprovecha los generadores existentes. | S | Usar arte propio. |

### Prioridad baja

- **C-16:** adaptador de Token Action HUD para cosmere-rpg (L). Probablemente encaja mejor como módulo aparte.
- **C-17:** viajes por Shadesmar y Roshar como endeavor por etapas, usando las tablas de viaje existentes (M). Amplía el item #13 del roadmap.
- **C-18:** Allomancy FX Pack mediante Sequencer o JB2A, que se desactiva limpiamente si faltan las dependencias (S/M).
- **C-19:** registro automático de sesión: un journal con las tarjetas del módulo, para hacer recaps (S/M).
- **C-20:** biblioteca de contraargumentos de PNJ que restan foco con un clic (S). Amplía el item #6 del roadmap.

---

## 4. Propuesta de hoja de ruta

| Versión | Contenido |
|---------|-----------|
| **v2.2.0 (robustez)** | R-1 a R-17 y actualización de la documentación. Sin features nuevas. |
| **v2.3.0 (v14 + calidad de vida)** | C-1, C-7, C-9, C-14 y C-15. |
| **v3.0.0 (Mistborn)** | C-4, C-5, C-12, C-13 y C-18. Requiere R-2 (sembrado no destructivo y versionado de tablas) y R-11 (API pública). |
| **Después** | C-2, C-3, C-6, C-8, C-10, C-11, C-16, C-17, C-19 y C-20. |

## Fuentes

- Sistema: https://github.com/the-metalworks/cosmere-rpg (issues #130, #291, #350, #446, #562, #641, #671, #672, #679, #750, #931, #970-974)
- https://foundryvtt.com/packages/cosmere-rpg
- https://foundryvtt.com/packages/cosmere-rpg-mistborn-handbook
- https://foundryvtt.com/packages/cosmere-rpg-stormlight-handbook
- https://foundryvtt.com/packages/cosmere-rpg-stormlight-worldguide
- https://foundryvtt.com/packages/cosmere-useful-macros
- https://foundryvtt.com/packages/cosmere-character-generators
- https://foundryvtt.com/packages/cosmere-automated-actions
- https://foundryvtt.com/packages/enhancedcombathud-cosmere-rpg
- https://foundryvtt.com/packages/seasons-and-stars
- https://www.foundryvtt-hub.com/package/token-action-hud-core/
- https://dungeonmister.com/cosmere-rpg/mistborn-setting/

> Aviso: las referencias a issues y paquetes externos salen de una investigación web del 2026-10-09 y conviene revisarlas antes de planificar. Los hallazgos de robustez se han comprobado leyendo el código. R-1 (IDs inválidos) no se ha probado en una instancia de Foundry.
