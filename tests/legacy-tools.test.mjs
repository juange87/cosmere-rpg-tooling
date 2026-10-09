import test from "node:test";
import assert from "node:assert/strict";
import { createCosmereApi } from "../scripts/module-api.js";

test("legacy resource macros await updates and support numeric or object maxima without animations", async () => {
  for (const max of [10, { value: 10 }]) {
    const events = [];
    const actor = { system: { resources: { foc: { value: 5, max } } }, update: async change => { await Promise.resolve(); events.push(change); } };
    const api = createCosmereApi({ canvas: { tokens: { controlled: [{ actor }] } }, ui: { notifications: { info: () => events.push("notice") } } });
    assert.equal(await api.runLegacyMacro("8UNPEwp2pTovSVEy"), 6);
    assert.deepEqual(events, [{ "system.resources.foc.value": 6 }, "notice"]);
  }
});

test("legacy macros stop safely when selection, actor data or animation dependencies are missing", async () => {
  const notices = [];
  const ui = { notifications: { warn: message => notices.push(message), error: message => notices.push(message) } };
  for (const key of ["8UNPEwp2pTovSVEy", "bEpngKnkXvyYyriw", "N7CyEcZGTFRrGeKr", "D8DqP5B4iB75DPEG", "J43Gdv2F7hL20Pjd", "A6ksZ4rFKvgMdzd0", "3oQ5GQS3iPufWZu5"]) {
    await createCosmereApi({ canvas: undefined, ui }).runLegacyMacro(key);
  }
  await createCosmereApi({ canvas: { tokens: { controlled: [{ actor: {} }] } }, ui }).runLegacyMacro("8UNPEwp2pTovSVEy");
  assert.equal(notices.length, 8);
});

test("retired hook macros register no listeners even when executed repeatedly", async () => {
  const api = createCosmereApi({ Hooks: { on: () => assert.fail("Duplicated listener") }, ui: { notifications: { info() {} } } });
  for (const key of ["JftnYfOMuXevgcjV", "mSA2KpnWle0X6E6m", "xFULRQmwpU1neOQf"]) {
    await api.runLegacyMacro(key);
    await api.runLegacyMacro(key);
  }
});
