import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { getActiveJb2aModuleId, resolveJb2aAssetPath } from "../scripts/jb2a-assets.js";
import { checkCosmereDependencies } from "../scripts/dependency-checker.js";

function createGame(activeIds = [], inactiveIds = []) {
  return {
    modules: new Map([
      ...inactiveIds.map(id => [id, { id, active: false }]),
      ...activeIds.map(id => [id, { id, active: true }]),
    ]),
  };
}

for (const edition of ["JB2A_DnD5e", "jb2a_patreon"]) {
  test(`accepts ${edition} alone and ignores the installed inactive alternative`, () => {
    const other = edition === "JB2A_DnD5e" ? "jb2a_patreon" : "JB2A_DnD5e";
    const game = createGame([edition, "sequencer", "dice-so-nice"], [other]);
    const report = checkCosmereDependencies({
      game,
      globals: { Sequence() {}, Sequencer: { Crosshair: { show() {} } } },
    });
    assert.equal(report.ok, true);
    assert.equal(report.results[0].moduleId, edition);
    assert.match(report.results[0].detail, new RegExp(edition));
    assert.equal(resolveJb2aAssetPath("Library/effect.webm", game), `modules/${edition}/Library/effect.webm`);
  });
}

test("prefers Patreon when both are active and skips missing or inactive editions", () => {
  assert.equal(getActiveJb2aModuleId(createGame(["JB2A_DnD5e", "jb2a_patreon"])), "jb2a_patreon");
  for (const game of [undefined, {}, createGame(), createGame([], ["JB2A_DnD5e", "jb2a_patreon"])]) {
    assert.equal(resolveJb2aAssetPath("Library/effect.webm", game), null);
    const report = checkCosmereDependencies({ game, globals: {} });
    assert.equal(report.results[0].ok, false);
    assert.match(report.results[0].detail, /JB2A_DnD5e.*jb2a_patreon/);
  }
});

test("resolves array and object module collections used by dependency consumers", () => {
  assert.equal(getActiveJb2aModuleId({ modules: [{ id: "jb2a_patreon", enabled: true }] }), "jb2a_patreon");
  assert.equal(getActiveJb2aModuleId({ modules: { JB2A_DnD5e: { active: true } } }), "JB2A_DnD5e");
});

test("manifest permits activation without forcing either JB2A edition", async () => {
  const manifest = JSON.parse(await readFile("module.json", "utf8"));
  assert.equal((manifest.relationships?.requires ?? []).some(entry =>
    ["JB2A_DnD5e", "jb2a_patreon"].includes(entry.id)), false);
});

const directMacroIds = ["JftnYfOMuXevgcjV", "mSA2KpnWle0X6E6m", "9MDhU9WMv0QKYH3D", "Llo5ZpODs3yEeKhS", "aPHfJqQlm7EKoGyN"];
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

for (const edition of ["JB2A_DnD5e", "jb2a_patreon", null]) {
  test(`direct-path macros use ${edition ?? "no animation without JB2A"}`, async () => {
    for (const id of directMacroIds) {
      const macro = JSON.parse(await readFile(`packs/_source/gm-macros/${id}.json`, "utf8"));
      const files = [];
      const callbacks = [];
      const game = createGame(edition ? [edition] : []);
      class Die {
        faces = 20;
        results = [{ result: 1 }, { result: 20 }];
      }
      game.messages = { get: () => ({ isRoll: true, rolls: [{ terms: [new Die()] }] }) };
      const sequence = new Proxy({}, {
        get: (_, key) => (...args) => {
          if (key === "file") files.push(args[0]);
          return sequence;
        },
      });
      const canvas = {
        scene: { width: 100, height: 100 },
        tokens: { controlled: [{ actor: {
          system: { resources: { hea: { value: 5, max: { value: 10 } } } },
          update() {},
        } }] },
      };
      const command = macro.command.replace(/^const \{ resolveJb2aAssetPath \} = await import\([^\n]+\);\n/, "");
      await new AsyncFunction("game", "canvas", "Sequence", "ui", "Hooks", "Die", "resolveJb2aAssetPath", command)(
        game, canvas, function Sequence() { return sequence; },
        { notifications: { info() {}, warn() {} } },
        { on: (_, callback) => callbacks.push(callback) }, Die,
        path => resolveJb2aAssetPath(path, game),
      );
      for (const callback of callbacks) callback("roll-id");
      assert.equal(files.length, edition ? 1 : 0, macro.name);
      if (edition) assert.ok(files[0].startsWith(`modules/${edition}/Library/`), macro.name);
    }
  });
}

test("global roll hooks choose the active edition and keep chat without JB2A", async () => {
  for (const edition of ["JB2A_DnD5e", "jb2a_patreon", null]) {
    const { activateCosmereGlobalHooks } = await import(`../scripts/settings-and-hooks.js?jb2a=${edition}`);
    const callbacks = new Map();
    const files = [];
    const messages = [];
    const game = createGame(edition ? [edition] : []);
    game.messages = { get: () => ({ isRoll: true, rolls: [{ terms: [{ faces: 20, results: [{ result: 20 }, { result: 1 }] }] }] }) };
    const sequence = new Proxy({}, { get: (_, key) => (...args) => {
      if (key === "file") files.push(args[0]);
      return sequence;
    } });
    activateCosmereGlobalHooks({
      game,
      Hooks: { on: (name, callback) => callbacks.set(name, callback) },
      canvas: { scene: { width: 100, height: 100 } },
      Sequence: function Sequence() { return sequence; },
      ChatMessage: { create: async message => messages.push(message) },
    });
    callbacks.get("diceSoNiceRollComplete")("roll-id");
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(messages.length, 2);
    assert.equal(files.length, edition ? 2 : 0);
    for (const file of files) assert.ok(file.startsWith(`modules/${edition}/Library/`));
  }
});

test("macro sources contain no assets or icons tied to the free edition", async () => {
  for (const filename of await readdir("packs/_source/gm-macros")) {
    if (!filename.endsWith(".json")) continue;
    const source = await readFile(`packs/_source/gm-macros/${filename}`, "utf8");
    assert.doesNotMatch(source, /modules\/JB2A_DnD5e\//, filename);
  }
});
