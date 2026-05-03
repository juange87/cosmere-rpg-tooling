import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  COSMERE_HELPER_KEYS,
  buildCosmereChatCard,
  resolveCosmereActor,
} from "../scripts/cosmere-helpers.js";
import {
  COSMERE_SETTINGS,
  createSettingsRegistrationPlan,
  getChatRenderHookName,
  inspectD20Rolls,
} from "../scripts/settings-and-hooks.js";
import {
  GM_PANEL_ACTIONS,
  buildGmPanelChatCard,
} from "../scripts/gm-panel.js";
import {
  TRACK_TYPES,
  buildNonCombatChatCard,
  buildNonCombatTrack,
  recordTrackStep,
} from "../scripts/conversation-endeavor-manager.js";
import {
  RADIANT_ORDERS,
  buildOathAcceptedChatCard,
  buildOathAcceptedMoment,
  runOathAcceptedDeluxe,
} from "../scripts/oath-accepted-deluxe.js";
import {
  SURGES,
  buildSurgebindingChatCard,
  buildSurgebindingFx,
} from "../scripts/surgebinding-fx-pack.js";
import {
  ROADMAP_ROLL_TABLE_GROUPS,
  buildRoadmapRollTableDocuments,
} from "../scripts/roshar-roll-tables.js";
import {
  LOCATION_TYPES,
  buildLocationChatCard,
  buildLocationSeed,
} from "../scripts/location-generator.js";
import {
  QUICK_SCENE_TYPES,
  buildQuickSceneChatCard,
  buildQuickSceneSeed,
} from "../scripts/quick-scene-compendium.js";
import {
  SPHERE_DENOMINATIONS,
  applySphereTransactionPlan,
  buildSphereManagerDialogContent,
  planGroupSphereSpend,
  planInvestitureDrain,
  planSphereConversion,
  planSphereTransaction,
  summarizeSphereBalance,
} from "../scripts/sphere-manager.js";
import {
  NARRATIVE_STATES,
  RESOURCE_KEYS,
  applyNarrativeStatePlan,
  buildNarrativeStatePlan,
  buildResourceUpdatePlan,
} from "../scripts/resource-control.js";
import {
  createMacroValidationPlan,
  validateMacroSourceFile,
  validateMacroSourcePack,
} from "../scripts/macro-validator.js";

async function readMacro(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("shared helpers cover roadmap utility categories", () => {
  assert.deepEqual(COSMERE_HELPER_KEYS, [
    "actor",
    "resources",
    "spheres",
    "chat",
    "dependencies",
    "formatting",
  ]);

  const actor = resolveCosmereActor({
    controlledTokens: [{ actor: { name: "Kaladin" } }],
    userCharacter: { name: "Shallan" },
  });

  assert.equal(actor.name, "Kaladin");
  assert.equal(resolveCosmereActor({ userCharacter: { name: "Adolin" } }).name, "Adolin");

  const html = buildCosmereChatCard({
    eyebrow: "Test <script>",
    title: "A & B",
    sections: [{ label: "Nota", value: "\"quoted\"" }],
  });

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Test &lt;script&gt;/);
  assert.match(html, /A &amp; B/);
  assert.match(html, /&quot;quoted&quot;/);
});

test("settings and global hook helpers define configurable roll behavior", () => {
  assert.deepEqual(COSMERE_SETTINGS.map(setting => setting.key), [
    "automaticRollHooks",
    "natural20Effects",
    "natural1Effects",
    "rollRequestButtons",
    "rollHookNotifications",
    "rollHookChatCards",
    "rollHookSound",
    "rollHookAnimation",
    "soundVolume",
    "useAnimations",
    "publishChatDefault",
    "labelLanguage",
    "experimentalTools",
  ]);

  const plan = createSettingsRegistrationPlan();
  assert.equal(plan.moduleId, "cosmere-rpg-tooling");
  assert.equal(plan.settings.length, COSMERE_SETTINGS.length);
  assert.equal(plan.settings.find(setting => setting.key === "soundVolume").default, 0.8);

  const result = inspectD20Rolls({
    isRoll: true,
    rolls: [{ terms: [{ faces: 20, results: [{ result: 20 }, { result: 1 }] }] }],
  });

  assert.deepEqual(result, { hasNatural20: true, hasNatural1: true, d20Results: [20, 1] });
  assert.equal(getChatRenderHookName({ game: { release: { generation: 13 } } }), "renderChatMessageHTML");
  assert.equal(getChatRenderHookName({ game: { release: { generation: 12 } } }), "renderChatMessage");
});

test("GM panel centralizes the expected GM tools", () => {
  assert.deepEqual(GM_PANEL_ACTIONS.map(action => action.key), [
    "resources",
    "spheres",
    "requestRolls",
    "privateMessage",
    "sounds",
    "surgebinding",
    "toggleTokens",
  ]);

  const html = buildGmPanelChatCard();
  assert.match(html, /Panel GM Cosmere/);
  assert.match(html, /Salud y foco/);
  assert.match(html, /Esferas/);
  assert.match(html, /Mostrar u ocultar tokens/);
});

test("conversation and endeavor manager tracks progress and narrative beats", () => {
  assert.deepEqual(TRACK_TYPES.map(type => type.key), ["conversation", "endeavor"]);

  const track = buildNonCombatTrack({
    type: "conversation",
    title: "Convencer al highmarshal",
    target: "Highmarshal Kalanor",
    resistance: 5,
    focus: 2,
  });
  const updated = recordTrackStep(track, {
    progress: 2,
    failure: true,
    opportunity: "Un escriba ofrece una pista.",
    complication: "El capitan exige pruebas.",
  });

  assert.equal(updated.progress, 2);
  assert.equal(updated.failures, 1);
  assert.equal(updated.beats.length, 1);

  const html = buildNonCombatChatCard(updated);
  assert.match(html, /Conversacion/);
  assert.match(html, /2 \/ 5/);
  assert.match(html, /Highmarshal Kalanor/);
  assert.match(html, /Un escriba ofrece una pista\./);

  const finished = recordTrackStep(updated, {
    finish: true,
    summary: "El highmarshal acepta mover tropas al amanecer.",
  });
  const finishedHtml = buildNonCombatChatCard(finished);
  assert.equal(finished.complete, true);
  assert.equal(finished.progress, finished.resistance);
  assert.match(finishedHtml, /Resumen final/);
  assert.match(finishedHtml, /mover tropas al amanecer/);
});

test("Palabras Aceptadas Deluxe builds a full oath moment", async () => {
  assert.equal(RADIANT_ORDERS.length, 10);
  assert.equal(RADIANT_ORDERS.find(order => order.key === "windrunner").label, "Windrunner");

  const moment = buildOathAcceptedMoment({
    actorName: "Kaladin",
    orderKey: "windrunner",
    idealText: "I will protect those who cannot protect themselves.",
    whisperTarget: "Bridge Four",
  });

  assert.equal(moment.order.label, "Windrunner");
  assert.equal(moment.actorName, "Kaladin");

  const html = buildOathAcceptedChatCard(moment);
  assert.match(html, /Palabras Aceptadas/);
  assert.match(html, /Windrunner/);
  assert.match(html, /I will protect those who cannot protect themselves\./);

  const played = [];
  const messages = [];
  await runOathAcceptedDeluxe({
    input: {
      ...moment,
      whisperUserId: "player-1",
      whisperMessage: "Respira antes de decir las palabras.",
    },
    playAnimation: false,
    AudioHelper: {
      play(sound, broadcast) {
        played.push({ sound, broadcast });
      },
    },
    ChatMessage: {
      getSpeaker() {
        return { alias: "GM" };
      },
      getWhisperRecipients(role) {
        assert.equal(role, "GM");
        return [{ id: "gm-1" }];
      },
      async create(message) {
        messages.push(message);
      },
    },
  });

  assert.equal(played.length, 2);
  assert.match(played[0].sound.src, /palabrasaceptadas\.mp3/);
  assert.match(played[1].sound.src, /thunder/);
  assert.equal(messages.length, 2);
  assert.deepEqual(messages[0].whisper, ["player-1"]);
  assert.match(messages[0].content, /Respira antes de decir las palabras/);
  assert.match(messages[1].content, /Palabras Aceptadas/);
});

test("surgebinding FX pack defines the ten surges", () => {
  assert.deepEqual(SURGES.map(surge => surge.key), [
    "adhesion",
    "gravitation",
    "division",
    "abrasion",
    "progression",
    "illumination",
    "transformation",
    "transportation",
    "cohesion",
    "tension",
  ]);

  const fx = buildSurgebindingFx({
    surgeKey: "gravitation",
    actorName: "Szeth",
    targetName: "Guard",
    note: "The target rises toward the ceiling.",
  });
  const html = buildSurgebindingChatCard(fx);

  assert.equal(fx.surge.label, "Gravitation");
  assert.match(html, /Surgebinding FX/);
  assert.match(html, /Szeth/);
  assert.match(html, /Guard/);
  assert.match(html, /The target rises toward the ceiling\./);
});

test("roadmap roll table data creates ten thematic d20 tables", () => {
  assert.equal(ROADMAP_ROLL_TABLE_GROUPS[0].folderName, "Roshar GM Tables");
  assert.equal(ROADMAP_ROLL_TABLE_GROUPS[0].tables.length, 10);

  const documents = buildRoadmapRollTableDocuments({ folderId: "folder-1" });
  assert.equal(documents.length, 10);
  assert.deepEqual(documents.map(doc => doc.name), [
    "Travel Complications",
    "Highstorm Events",
    "Roshar Rumors",
    "Social Encounters",
    "Faction Objectives",
    "Rewards and Finds",
    "Curious Spren",
    "Brightlord Hooks",
    "Caravan Problems",
    "Ruin Discoveries",
  ]);
  assert.ok(documents.every(doc => doc.formula === "1d20"));
  assert.ok(documents.every(doc => doc.results.length === 20));
  assert.deepEqual(documents[0].results.at(-1).range, [20, 20]);
});

test("location generator creates chat-ready Roshar locations", () => {
  assert.deepEqual(LOCATION_TYPES.map(type => type.key), [
    "warcamp",
    "village",
    "caravan",
    "lighteyesManor",
    "market",
    "ancientRuin",
    "outpost",
    "stormscar",
  ]);

  const location = buildLocationSeed({ typeKey: "ancientRuin", seed: "urithiru" });
  const html = buildLocationChatCard(location);

  assert.equal(location.type.label, "Ruinas antiguas");
  assert.ok(location.journalTitle.startsWith("Localizacion: "));
  assert.match(html, /Generador de Localizaciones/);
  assert.match(html, /Ruinas antiguas/);
});

test("quick scene compendium produces reusable scene structures", () => {
  assert.deepEqual(QUICK_SCENE_TYPES.map(scene => scene.key), [
    "chase",
    "infiltration",
    "socialDuel",
    "discovery",
    "dangerousTravel",
    "negotiation",
    "stormPrep",
  ]);

  const scene = buildQuickSceneSeed({ typeKey: "stormPrep", seed: "narak" });
  const html = buildQuickSceneChatCard(scene);

  assert.equal(scene.type.label, "Preparacion antes de tormenta");
  assert.equal(scene.beats.length, 4);
  assert.match(html, /Compendio de Escenas Rapidas/);
  assert.match(html, /Preparacion antes de tormenta/);
});

test("sphere manager summarizes balances and detects strict spending deficits", () => {
  assert.ok(SPHERE_DENOMINATIONS.length >= 6);

  const actors = [
    {
      id: "actor-1",
      name: "Shallan",
      items: [
        {
          type: "loot",
          system: {
            isMoney: true,
            quantity: 2,
            price: { currency: "spheres", denomination: { primary: "mark" } },
          },
        },
      ],
    },
  ];

  const summary = summarizeSphereBalance(actors[0]);
  assert.equal(summary.rows[0].quantity, 2);
  assert.equal(summary.totalQuantity, 2);

  const plan = planSphereTransaction({
    actors,
    changes: { "spheres|mark": -3 },
    strict: true,
  });
  assert.equal(plan.ok, false);
  assert.equal(plan.results[0].deficit["spheres|mark"], 1);

  const conversion = planSphereConversion({
    actor: actors[0],
    fromKey: "spheres|mark",
    toKey: "dun|mark",
    quantity: 1,
  });
  assert.equal(conversion.ok, true);
  assert.equal(conversion.changes["spheres|mark"], -1);
  assert.equal(conversion.changes["dun|mark"], 1);

  const groupSpend = planGroupSphereSpend({
    actors: [
      actors[0],
      {
        id: "actor-2",
        name: "Kaladin",
        items: [{
          type: "loot",
          system: {
            isMoney: true,
            quantity: 1,
            price: { currency: "spheres", denomination: { primary: "mark" } },
          },
        }],
      },
    ],
    key: "spheres|mark",
    quantity: 3,
  });
  assert.equal(groupSpend.ok, true);
  assert.deepEqual(groupSpend.allocations.map(item => item.quantity), [2, 1]);

  const drain = planInvestitureDrain({ actors, amount: 2 });
  assert.equal(drain.ok, true);
  assert.deepEqual(drain.results[0].next["spheres|mark"], 0);

  const dialogHtml = buildSphereManagerDialogContent(actors);
  assert.match(dialogHtml, /Convertir esferas/);
  assert.match(dialogHtml, /Gasto de grupo/);
  assert.match(dialogHtml, /Drenar tras Investiture/);
});

test("sphere manager applies safe transactions to Foundry money items", async () => {
  const updates = [];
  const created = [];
  const deleted = [];
  const actor = {
    id: "actor-1",
    name: "Shallan",
    items: [
      {
        type: "loot",
        system: {
          isMoney: true,
          quantity: 2,
          price: { currency: "spheres", denomination: { primary: "mark" } },
        },
        async update(change) {
          updates.push(change);
          this.system.quantity = change["system.quantity"];
        },
        async delete() {
          deleted.push(this);
        },
      },
    ],
    async createEmbeddedDocuments(type, docs) {
      created.push({ type, docs });
    },
  };
  const plan = planSphereConversion({
    actor,
    fromKey: "spheres|mark",
    toKey: "dun|mark",
    quantity: 1,
  });

  await applySphereTransactionPlan({ actors: [actor], plan, publishChat: false });

  assert.deepEqual(updates, [{ "system.quantity": 1 }]);
  assert.equal(created[0].type, "Item");
  assert.equal(created[0].docs[0].name, "Mark dun");
  assert.equal(created[0].docs[0].system.quantity, 1);
  assert.deepEqual(deleted, []);
});

test("resource control plans bulk health and focus updates", () => {
  assert.deepEqual(RESOURCE_KEYS.map(resource => resource.key), ["health", "focus", "investiture"]);

  const plan = buildResourceUpdatePlan({
    actors: [
      {
        id: "actor-1",
        name: "Adolin",
        system: { resources: { hea: { value: 4, max: { value: 5 } } } },
      },
    ],
    resourceKey: "health",
    delta: 3,
  });

  assert.deepEqual(plan.results[0], {
    actorId: "actor-1",
    actorName: "Adolin",
    path: "system.resources.hea.value",
    current: 4,
    next: 5,
    delta: 1,
  });

  assert.deepEqual(NARRATIVE_STATES.map(state => state.key), [
    "advantaged",
    "exposed",
    "exhausted",
    "inspired",
  ]);
});

test("resource control applies narrative states in bulk", async () => {
  const flags = [];
  const actor = {
    id: "actor-1",
    name: "Kaladin",
    async setFlag(moduleId, key, value) {
      flags.push({ action: "set", moduleId, key, value });
    },
    async unsetFlag(moduleId, key) {
      flags.push({ action: "unset", moduleId, key });
    },
  };
  const addPlan = buildNarrativeStatePlan({
    actors: [actor],
    stateKey: "inspired",
    mode: "add",
    note: "Stormlight surges.",
  });

  await applyNarrativeStatePlan({ plan: addPlan, actors: [actor], publishChat: false });
  await applyNarrativeStatePlan({
    plan: buildNarrativeStatePlan({ actors: [actor], stateKey: "inspired", mode: "remove" }),
    actors: [actor],
    publishChat: false,
  });

  assert.equal(addPlan.state.label, "Inspirado");
  assert.deepEqual(flags[0], {
    action: "set",
    moduleId: "cosmere-rpg-tooling",
    key: "narrativeStates.inspired",
    value: { label: "Inspirado", note: "Stormlight surges." },
  });
  assert.deepEqual(flags[1], {
    action: "unset",
    moduleId: "cosmere-rpg-tooling",
    key: "narrativeStates.inspired",
  });
});

test("macro validation finds valid metadata and dependency references", async () => {
  const macro = await readMacro("packs/_source/gm-macros/HighstormTool01.json");
  const report = validateMacroSourceFile("packs/_source/gm-macros/HighstormTool01.json", macro);

  assert.equal(report.ok, true);
  assert.deepEqual(report.errors, []);

  const packReport = await validateMacroSourcePack("packs/_source/gm-macros");
  assert.equal(packReport.errors.length, 0);
  assert.ok(packReport.warnings.some(warning => /AudioHelper|Sequence|JB2A|diceSoNice/.test(warning.message)));

  const plan = createMacroValidationPlan();
  assert.deepEqual(plan.checks, [
    "_id",
    "_key",
    "duplicate names",
    "empty commands",
    "dependency references",
    "compile packs",
  ]);
});

test("ships official GM macros for all roadmap tools", async () => {
  const expected = new Map([
    ["GMPanel01.json", ["GMPanel01", "Panel GM Cosmere", "gm-panel.js"]],
    ["ConversationEndeavor01.json", ["ConversationEndeavor01", "Gestor de Conversaciones y Endeavors", "conversation-endeavor-manager.js"]],
    ["LocationGenerator01.json", ["LocationGenerator01", "Generador de Localizaciones", "location-generator.js"]],
    ["QuickSceneCompendium01.json", ["QuickSceneCompendium01", "Compendio de Escenas Rapidas", "quick-scene-compendium.js"]],
    ["SphereManager01.json", ["SphereManager01", "Gestor de Esferas Avanzado", "sphere-manager.js"]],
    ["ResourceControl01.json", ["ResourceControl01", "Control Rapido de Recursos", "resource-control.js"]],
    ["MacroValidation01.json", ["MacroValidation01", "Validacion de Macros", "macro-validator.js"]],
    ["SurgebindingFx01.json", ["SurgebindingFx01", "Surgebinding FX Pack", "surgebinding-fx-pack.js"]],
  ]);

  for (const [fileName, [id, name, script]] of expected) {
    const macro = await readMacro(`packs/_source/gm-macros/${fileName}`);
    assert.equal(macro._id, id);
    assert.equal(macro._key, `!macros!${id}`);
    assert.equal(macro.name, name);
    assert.equal(macro.type, "script");
    assert.match(macro.command, new RegExp(script.replace(".", "\\.")));
  }

  const oathMacro = await readMacro("packs/_source/gm-macros/qgASaIKoALpVA7FZ.json");
  assert.equal(oathMacro.name, "Palabras Aceptadas Deluxe");
  assert.match(oathMacro.command, /oath-accepted-deluxe\.js/);
});

test("ships individual Surgebinding macros for every Surge", async () => {
  const expected = [
    ["SurgeAdhesion01.json", "SurgeAdhesion01", "Surgebinding FX: Adhesion", "adhesion"],
    ["SurgeGravitation01.json", "SurgeGravitation01", "Surgebinding FX: Gravitation", "gravitation"],
    ["SurgeDivision01.json", "SurgeDivision01", "Surgebinding FX: Division", "division"],
    ["SurgeAbrasion01.json", "SurgeAbrasion01", "Surgebinding FX: Abrasion", "abrasion"],
    ["SurgeProgression01.json", "SurgeProgression01", "Surgebinding FX: Progression", "progression"],
    ["SurgeIllumination01.json", "SurgeIllumination01", "Surgebinding FX: Illumination", "illumination"],
    ["SurgeTransformation01.json", "SurgeTransformation01", "Surgebinding FX: Transformation", "transformation"],
    ["SurgeTransportation01.json", "SurgeTransportation01", "Surgebinding FX: Transportation", "transportation"],
    ["SurgeCohesion01.json", "SurgeCohesion01", "Surgebinding FX: Cohesion", "cohesion"],
    ["SurgeTension01.json", "SurgeTension01", "Surgebinding FX: Tension", "tension"],
  ];

  for (const [fileName, id, name, surgeKey] of expected) {
    const macro = await readMacro(`packs/_source/gm-macros/${fileName}`);
    assert.equal(macro._id, id);
    assert.equal(macro._key, `!macros!${id}`);
    assert.equal(macro.name, name);
    assert.match(macro.command, /surgebinding-fx-pack\.js/);
    assert.match(macro.command, new RegExp(`surgeKey: "${surgeKey}"`));
  }
});

test("init, package, docs, and sounds expose completed roadmap features", async () => {
  const [init, pkgRaw, roadmap, readme] = await Promise.all([
    readFile("scripts/init.js", "utf8"),
    readFile("package.json", "utf8"),
    readFile("doc/roadmap.md", "utf8"),
    readFile("README.md", "utf8"),
  ]);
  const pkg = JSON.parse(pkgRaw);

  assert.match(init, /registerCosmereSettings/);
  assert.match(init, /activateCosmereGlobalHooks/);
  assert.match(init, /ensureRoadmapRollTables/);
  assert.equal(pkg.scripts.test, "node --test tests/*.test.mjs");
  assert.equal(pkg.scripts.validate, "node scripts/macro-validator.js");
  assert.equal((roadmap.match(/Estado: hecho/g) ?? []).length, 20);
  assert.match(readme, /Panel GM Cosmere/);
  assert.match(readme, /Palabras Aceptadas Deluxe/);
  assert.match(readme, /Validacion de Macros/);

  const requiredSounds = [
    "sounds/highstorm-loop.wav",
    "sounds/thunder-variant-01.wav",
    "sounds/thunder-variant-02.wav",
    "sounds/shardblade-summon.wav",
    "sounds/sphere-glow.wav",
    "sounds/fabrial-hum.wav",
    "sounds/shadesmar-ambience.wav",
    "sounds/oath-accepted-variant.wav",
  ];
  for (const soundPath of requiredSounds) {
    const data = await readFile(soundPath);
    assert.ok(data.length > 44, `${soundPath} should contain a WAV payload`);
    assert.equal(data.subarray(0, 4).toString("ascii"), "RIFF");
    assert.equal(data.subarray(8, 12).toString("ascii"), "WAVE");
  }
});
