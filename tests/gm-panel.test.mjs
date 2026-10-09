import test from "node:test";
import assert from "node:assert/strict";
import { runPanelAction } from "../scripts/gm-panel.js";

test("GM panel opens request/message tools from compendia without world macros", async () => {
  const requested = [], executed = [];
  const game = {
    macros: { getName() { assert.fail("World macro lookup must not be used"); } },
    packs: new Map([["cosmere-rpg-tooling.gm-macros", { getDocument: async id => {
      requested.push(id);
      return { execute: async () => executed.push(id) };
    } }]]),
  };
  await runPanelAction("requestRolls", { game });
  await runPanelAction("privateMessage", { game });
  assert.deepEqual(requested, ["OHzWpcVmcfaHsk4z", "wilsiRBC31LfydfP"]);
  assert.deepEqual(executed, requested);
});
