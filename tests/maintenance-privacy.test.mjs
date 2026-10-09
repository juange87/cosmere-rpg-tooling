import test from "node:test";
import assert from "node:assert/strict";
import { runDependencyCheck } from "../scripts/dependency-checker.js";
import { publishReport, buildMacroUpgradeReport } from "../scripts/macro-upgrade-checker.js";
import { runMacroValidation } from "../scripts/macro-validator.js";

test("every maintenance report is whispered to GMs", async () => {
  const messages = [];
  const ChatMessage = { create: async data => messages.push(data), getWhisperRecipients: role => {
    assert.equal(role, "GM");
    return [{ id: "gm1" }, { id: "gm2" }];
  } };
  await runDependencyCheck({ game: {}, ChatMessage });
  await publishReport(buildMacroUpgradeReport(), { ChatMessage });
  const previousProcess = globalThis.process;
  // Exercise the browser validation path without spawning a second compiler.
  globalThis.process = undefined;
  try { await runMacroValidation({ ChatMessage }); } finally { globalThis.process = previousProcess; }
  assert.equal(messages.length, 3);
  for (const message of messages) assert.deepEqual(message.whisper, ["gm1", "gm2"]);
});

test("a missing GM recipient cannot accidentally turn maintenance output public", async () => {
  const ChatMessage = { create: () => assert.fail("Private report became public"), getWhisperRecipients: () => [] };
  await runDependencyCheck({ game: {}, ChatMessage });
  assert.equal(await publishReport(buildMacroUpgradeReport(), { ChatMessage }), null);
});
