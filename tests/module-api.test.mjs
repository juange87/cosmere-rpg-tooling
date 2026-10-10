import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { API_TOOLS, LEGACY_SCRIPTS, createCosmereApi, registerCosmereApi } from "../scripts/module-api.js";

test("the public API registers on the module and exposes every tool", () => {
  const module = {};
  const api = registerCosmereApi({ game: { modules: new Map([["cosmere-rpg-tooling", module]]) } });
  assert.equal(module.api, api);
  assert.equal(api.version, 1);
  assert.ok(Object.isFrozen(api));
  assert.ok(Object.keys(API_TOOLS).every(key => typeof api[key] === "function"));
});

test("all compendium macros use the public API without URL paths", async () => {
  for (const pack of ["gm-macros", "player-macros"]) {
    for (const file of await readdir(`packs/_source/${pack}`)) {
      const macro = JSON.parse(await readFile(`packs/_source/${pack}/${file}`, "utf8"));
      assert.match(macro.command, /game.modules.get\("cosmere-rpg-tooling"\).api\./);
      assert.doesNotMatch(macro.command, /import\(|\/modules\//);
      assert.equal(macro.command.split("\n").length, 1);
    }
  }
  for (const file of Object.values(LEGACY_SCRIPTS)) {
    const script = await import(new URL(`../scripts/${file}`, import.meta.url));
    assert.equal(typeof script.run, "function");
  }
});

test("legacy API rejects unknown keys without importing arbitrary paths", async () => {
  await assert.rejects(createCosmereApi().runLegacyMacro("../init.js"), /Unknown Cosmere macro/);
});
