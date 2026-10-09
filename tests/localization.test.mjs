import { createCosmereApi } from "../scripts/module-api.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { getCosmereLanguage, localize } from "../scripts/localization.js";
import { registerCosmereSettings } from "../scripts/settings-and-hooks.js";
import { buildPlotDieResult, buildPlotDieChatCard } from "../scripts/plot-die-manager.js";
import { buildHighstormChatCard, HIGHSTORM_CUES } from "../scripts/highstorm-toolkit.js";
import { buildMacroUpgradeReport, buildMacroUpdateData } from "../scripts/macro-upgrade-checker.js";
import { generateRosharNpc } from "../scripts/roshar-npc-generator.js";

const root = new URL("../", import.meta.url);
const readJson = async path => JSON.parse(await readFile(new URL(path, root), "utf8"));
const english = (await readJson("lang/en.json")).COSMERE_TOOLS;
const spanish = (await readJson("lang/es.json")).COSMERE_TOOLS;
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function useLanguage(t, lang, preference = "auto") {
  const previous = globalThis.game;
  globalThis.game = { i18n: { lang }, settings: { get: () => preference } };
  t.after(() => { globalThis.game = previous; });
  return globalThis.game;
}

async function macros() {
  const result = [];
  for (const pack of ["gm-macros", "player-macros"]) {
    for (const file of await readdir(new URL(`packs/_source/${pack}/`, root))) {
      result.push(await readJson(`packs/_source/${pack}/${file}`));
    }
  }
  return result;
}

function executable(command) {
  return command.replaceAll('/modules/cosmere-rpg-tooling/scripts/', new URL("scripts/", root).href);
}

test("language follows Foundry, honors saved overrides, and falls back to English", () => {
  for (const [lang, preference, expected] of [
    ["en", "auto", "en"], ["es", "auto", "es"], ["es-ES", "auto", "es"],
    ["en", "es", "es"], ["es", "en", "en"], ["fr", "auto", "en"],
  ]) {
    const game = { i18n: { lang }, settings: { get: () => preference } };
    assert.equal(getCosmereLanguage(game), expected);
    assert.equal(localize("Cancel", { game }), expected === "es" ? "Cancelar" : "Cancel");
  }
  assert.equal(getCosmereLanguage({ settings: { get() { throw Error("Not registered"); } } }), "en");
  assert.equal(localize("UnknownKey", { game: {} }), "UnknownKey");
});

test("Foundry translations can override a catalog without changing its active language", () => {
  const game = { i18n: { lang: "en", localize: key => key === "COSMERE_TOOLS.Cancel" ? "Dismiss" : key } };
  assert.equal(localize("Cancel", { game }), "Dismiss");
  assert.equal(localize("Generate", { game }), "Generate");
  assert.equal(game.i18n.lang, "en");
});

test("catalogs cover every localization call and are included in the manifest and release", async () => {
  assert.deepEqual(Object.keys(english).sort(), Object.keys(spanish).sort());
  for (const catalog of [english, spanish]) {
    assert.ok(Object.values(catalog).every(value => typeof value === "string" && value.trim()));
  }
  const sourceTexts = (await macros()).map(macro => macro.command);
  for (const file of await readdir(new URL("scripts/", root), { recursive: true })) {
    if (file.endsWith(".js")) sourceTexts.push(await readFile(new URL(`scripts/${file}`, root), "utf8"));
  }
  for (const source of sourceTexts) {
    for (const [, key] of source.matchAll(/localize\("([^"]+)"/g)) assert.ok(key in english, `Missing ${key}`);
  }
  const manifest = await readJson("module.json");
  assert.deepEqual(manifest.languages.map(item => item.path).sort(), ["lang/en.json", "lang/es.json"]);
  assert.match(await readFile(new URL(".github/workflows/main.yml", root), "utf8"), /lang\//);
});

test("settings register in English with automatic language and a reload requirement", t => {
  const game = useLanguage(t, "en");
  const settings = new Map();
  game.settings.register = (moduleId, key, data) => settings.set(key, data);
  registerCosmereSettings({ game });
  assert.equal(settings.get("automaticRollHooks").name, "Enable automatic hooks");
  assert.equal(settings.get("labelLanguage").default, "auto");
  assert.equal(settings.get("labelLanguage").requiresReload, true);
  assert.deepEqual(Object.keys(settings.get("labelLanguage").choices).sort(), ["auto", "en", "es"]);
  assert.match(settings.get("labelLanguage").hint, /Reload/);
});

test("module-level labels resolve lazily after language changes", t => {
  const game = useLanguage(t, "en");
  assert.equal(HIGHSTORM_CUES.approach.title, "The highstorm approaches");
  game.i18n.lang = "es";
  assert.equal(HIGHSTORM_CUES.approach.title, "La tormenta alta se acerca");
});

test("saved language overrides are available before other setting names are registered", t => {
  const game = useLanguage(t, "es", "en");
  const registered = new Map();
  game.settings.get = (moduleId, key) => {
    if (!registered.has(key)) throw Error("Not registered");
    return key === "labelLanguage" ? "en" : registered.get(key).default;
  };
  game.settings.register = (moduleId, key, setting) => registered.set(key, setting);
  registerCosmereSettings({ game });
  assert.equal(registered.get("automaticRollHooks").name, "Enable automatic hooks");
});

test("English chat cards keep player text unchanged and escaped", t => {
  useLanguage(t, "en");
  const result = buildPlotDieResult({ actorName: "Salud", skillLabel: "Nota", gmNote: "<script>Cancelar</script>", rollTotal: 20, targetNumber: 10 });
  assert.equal(result.successLabel, "Success");
  const html = buildPlotDieChatCard(result);
  assert.match(html, /Plot Die Manager/);
  assert.match(html, /GM note/);
  assert.match(html, /Salud/);
  assert.match(html, /&lt;script&gt;Cancelar&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(buildHighstormChatCard({ minutes: 3 }), /3 minutes/);
});

test("generated NPC traits are English while table IDs and returned names stay unchanged", async t => {
  useLanguage(t, "en");
  const requested = [];
  const npc = await generateRosharNpc({
    cultureTable: "Alethi Names", random: () => 0,
    game: { tables: { getName(name) { requested.push(name); return { draw: async () => ({ results: [{ text: "Nota" }] }) }; } } },
  });
  assert.deepEqual(requested, ["Alethi Names"]);
  assert.equal(npc.name, "Nota");
  assert.equal(npc.attitude, "Wants to help, but does not want to seem too available.");
});

test("shared tools render English dialogs in both Foundry dialog APIs", async t => {
  const game = useLanguage(t, "en");
  game.user = { character: { id: "actor", name: "Kaladin" }, isGM: true };
  game.actors = [];
  const cases = [
    ["first-step-character-generator", "openFirstStepCharacterGenerator", "First Step Character Generator", "Culture / name"],
    ["roshar-npc-generator", "openRosharNpcGenerator", "Roshar NPC Generator", "Send only to GM"],
    ["plot-die-manager", "openPlotDieManager", "Plot Die Manager", "Difficulty"],
    ["highstorm-toolkit", "openHighstormToolkit", "Highstorm Toolkit", "Storm phase"],
    ["gm-panel", "openGmPanel", "Cosmere GM Panel", "Health and focus"],
    ["conversation-endeavor-manager", "openConversationEndeavorManager", "Conversation and Endeavor Manager", "Required progress"],
    ["resource-control", "openResourceControl", "Quick Resource Control", "Numeric resources"],
    ["sphere-manager", "openSphereManager", "Advanced Sphere Manager", "Convert spheres"],
    ["location-generator", "openLocationGenerator", "Location Generator", "Optional name"],
    ["quick-scene-compendium", "openQuickSceneCompendium", "Quick Scene Compendium", "Optional title"],
    ["oath-accepted-deluxe", "openOathAcceptedDeluxe", "Words Accepted Deluxe", "Radiant order"],
    ["surgebinding-fx-pack", "openSurgebindingFxDialog", "Surgebinding FX Pack", "Description"],
  ];
  const previousFoundry = globalThis.foundry;
  t.after(() => { globalThis.foundry = previousFoundry; });
  for (const v2 of [false, true]) {
    let options;
    class Dialog { constructor(data) { options = data; } render() { return this; } addEventListener() {} }
    globalThis.foundry = v2 ? { applications: { api: { DialogV2: Dialog } } } : undefined;
    for (const [file, name, title, label] of cases) {
      const module = await import(`../scripts/${file}.js`);
      await module[name]({ Dialog, ChatMessage: {}, game });
      assert.equal(v2 ? options.window.title : options.title, title, file);
      assert.ok(options.content.includes(label), `${file}: missing ${label}`);
      assert.doesNotMatch(options.content, /COSMERE_TOOLS\.|\$\{localize/);
    }
  }
});

test("all macro commands remain valid JavaScript and retain their document keys", async () => {
  for (const macro of await macros()) {
    assert.equal(macro._key, `!macros!${macro._id}`);
    assert.doesNotThrow(() => new AsyncFunction(macro.command), macro.name);
  }
});

test("Roll Skill translates its dialog and preserves the system skill key", async t => {
  const game = useLanguage(t, "en");
  const rolls = [];
  const actor = { name: "Nota", rollSkill: (...args) => rolls.push(args) };
  game.user = { character: actor };
  let options;
  class Dialog { constructor(data) { options = data; } render() {} }
  const previousDialog = globalThis.Dialog;
  globalThis.Dialog = Dialog;
  t.after(() => { globalThis.Dialog = previousDialog; });
  const macro = await readJson("packs/_source/player-macros/14tGXTB3AbrChE0p.json");
  game.modules = new Map([["cosmere-rpg-tooling", { api: createCosmereApi({ game, canvas: { tokens: { controlled: [] } }, Dialog }) }]]);
  await new AsyncFunction("game", "canvas", "ui", executable(macro.command))(game, { tokens: { controlled: [] } }, {});
  assert.equal(options.title, "Skill roll (Nota)");
  assert.match(options.content, /value="agi">Agility/);
  assert.match(options.content, /value="inm">Intimidation/);
  await options.buttons.lanzar.callback({ find: () => ({ val: () => "agi" }) });
  assert.deepEqual(rolls, [["agi", { chatMessage: true }]]);
});

test("macro upgrades recognize old Spanish names without renaming or duplicating world copies", async () => {
  const source = await readJson("packs/_source/gm-macros/GMPanel01.json");
  source.packId = "cosmere-rpg-tooling.gm-macros";
  const origin = `Compendium.${source.packId}.Macro.${source._id}`;
  const report = buildMacroUpgradeReport({ sourceMacros: [source], worldMacros: [
    { _id: "old", flags: { core: { sourceId: origin } }, name: "Panel GM Cosmere", command: "old code", type: "script" },
    { _id: "new", _stats: { compendiumSource: origin }, name: source.name, command: "old code", type: "script" },
  ] });
  assert.equal(report.counts.missing, 0);
  assert.equal(report.counts.outdated, 2);
  assert.equal(report.counts.duplicates, 1);
  const update = buildMacroUpdateData(report.entries[0]);
  assert.equal(update.command, source.command);
  assert.equal("name" in update, false);
  assert.equal("_id" in update, false);
});

test("remaining narrative labels and location fragments follow the chosen language", async t => {
  const game = useLanguage(t, "es");
  const { SPHERE_DENOMINATIONS, sphereItemName } = await import("../scripts/sphere-currency.js");
  const { PLOT_DIE_OUTCOMES } = await import("../scripts/plot-die-manager.js");
  const { buildLocationSeed } = await import("../scripts/location-generator.js");
  assert.equal(PLOT_DIE_OUTCOMES.find(item => item.key === "opportunity").label, "Oportunidad");
  assert.equal(SPHERE_DENOMINATIONS[0].label, "Chip infundido");
  const spanishLocation = buildLocationSeed({ seed: "same" });
  game.i18n.lang = "en";
  assert.equal(PLOT_DIE_OUTCOMES.find(item => item.key === "opportunity").label, "Opportunity");
  assert.equal(SPHERE_DENOMINATIONS[0].label, "Chip infused");
  assert.notEqual(buildLocationSeed({ seed: "same" }).look, spanishLocation.look);
  assert.equal(sphereItemName("dun", "mark"), "Mark dun");
  game.i18n.lang = "es";
  assert.equal(sphereItemName("dun", "mark"), "Mark dun");
});

test("failed catalogs do not prevent module startup or surviving translations", async () => {
  const { loadCosmereCatalogs } = await import("../scripts/localization.js");
  const warnings = [];
  const catalogs = await loadCosmereCatalogs(async language => {
    if (language === "es") throw Error("HTTP 503");
    return { Cancel: "Cancel" };
  }, { warn: message => warnings.push(message) });
  assert.equal(warnings.length, 1);
  assert.equal(localize("Cancel", { game: { i18n: { lang: "es" } }, catalogs }), "Cancel");
  const empty = await loadCosmereCatalogs(async () => { throw Error("offline"); }, { warn() {} });
  assert.equal(localize("Cancel", { game: { i18n: { lang: "en", localize: () => "Dismiss" } }, catalogs: empty }), "Dismiss");
  assert.equal(localize("Cancel", { game: {}, catalogs: empty }), "Cancel");
  assert.equal(localize("Cancel", { game: { i18n: { lang: "en", localize: () => { throw Error("broken plugin"); } } }, catalogs: empty }), "Cancel");
});
