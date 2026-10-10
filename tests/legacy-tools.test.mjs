import test from "node:test";
import assert from "node:assert/strict";
import { createCosmereApi } from "../scripts/module-api.js";
import { runLegacyResourceChange } from "../scripts/legacy-tools.js";

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

test("only actual health gains show healing and failed effects do not fail a committed update", async () => {
  for (const resourceKey of ["hea", "foc"]) {
    for (const delta of [-1, 1]) {
      const plays = [], warnings = [];
      const actor = { system: { resources: { [resourceKey]: { value: 5, max: 10 } } }, update: async change => { actor.system.resources[resourceKey].value = change[`system.resources.${resourceKey}.value`]; } };
      const chain = new Proxy({}, { get: (_, key) => key === "play" ? async () => { plays.push(true); throw Error("Missing media"); } : () => chain });
      const result = await runLegacyResourceChange({ resourceKey, delta, canvas: { tokens: { controlled: [{ actor }] } }, game: { modules: new Map([["sequencer", { active: true }], ["JB2A_DnD5e", { active: true }]]) }, Sequence: function () { return chain; }, ui: { notifications: { info() {}, warn: text => warnings.push(text) } } });
      assert.equal(result, 5 + delta);
      assert.equal(actor.system.resources[resourceKey].value, result);
      const shouldHeal = resourceKey === "hea" && delta === 1;
      assert.equal(plays.length, shouldHeal ? 1 : 0);
      assert.equal(warnings.length, shouldHeal ? 1 : 0);
    }
  }
});

test("resource updates finish while animation is pending and handle its later rejection", async () => {
  let rejectAnimation;
  const animation = new Promise((_, reject) => { rejectAnimation = reject; });
  const chain = new Proxy({}, { get: (_, key) => key === "play" ? () => animation : () => chain });
  const warnings = [];
  const actor = { system: { resources: { hea: { value: 5, max: 10 } } }, update: async data => { actor.system.resources.hea.value = data["system.resources.hea.value"]; } };
  const action = runLegacyResourceChange({ resourceKey: "hea", delta: 1, canvas: { tokens: { controlled: [{ actor }] } }, game: { modules: new Map([["sequencer", { active: true }], ["JB2A_DnD5e", { active: true }]]) }, Sequence: function () { return chain; }, ui: { notifications: { info() {}, warn: text => warnings.push(text) } } });
  const result = await Promise.race([action, new Promise(resolve => setImmediate(() => resolve("blocked")))]);
  assert.equal(result, 6);
  assert.equal(actor.system.resources.hea.value, 6);
  assert.equal(warnings.length, 0);
  rejectAnimation(new Error("Later playback failure"));
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(warnings.length, 1);
});
