import test from "node:test";
import assert from "node:assert/strict";
import { handleDiceHook, activateCosmereGlobalHooks, inspectD20Rolls } from "../scripts/settings-and-hooks.js";

const message = { id: "roll-1", isRoll: true, whisper: ["gm"], blind: true, rolls: [{ terms: [{ faces: 20, results: [{ result: 20 }] }] }] };
function context(isSelf) {
  const cards = [], sounds = [];
  return {
    game: { users: { activeGM: { isSelf } }, messages: new Map([[message.id, message]]), settings: { get: (_, key) => key === "rollHookSound" ? true : undefined } },
    ChatMessage: { create: async card => cards.push(card) },
    AudioHelper: { play: (...args) => sounds.push(args) },
    processedIds: new Set(), cards, sounds,
  };
}

test("only the active GM publishes a single result, preserving private roll visibility", async () => {
  const clients = [context(true), context(false), context(false), context(false), context(false)];
  for (const client of clients) {
    await handleDiceHook(message.id, client);
    await handleDiceHook(message.id, client);
  }
  assert.equal(clients.flatMap(client => client.cards).length, 1);
  assert.equal(clients.flatMap(client => client.sounds).length, 1);
  assert.deepEqual(clients[0].cards[0].whisper, ["gm"]);
  assert.equal(clients[0].cards[0].blind, true);
});

test("without Dice So Nice createChatMessage handles rolls", async () => {
  const hooks = new Map();
  const client = context(true);
  activateCosmereGlobalHooks({ ...client, Hooks: { on: (name, callback) => hooks.set(name, callback) } });
  await hooks.get("createChatMessage")(message);
  await hooks.get("diceSoNiceRollComplete")(message.id);
  assert.equal(client.cards.length, 1);
});

test("active Dice So Nice does not require an animation completion to publish a card", async () => {
  const { activateCosmereGlobalHooks: activate } = await import("../scripts/settings-and-hooks.js?dsn-skips-animation");
  const hooks = new Map();
  const client = context(true);
  client.game.modules = new Map([["dice-so-nice", { active: true }]]);
  activate({ ...client, Hooks: { on: (name, callback) => hooks.set(name, callback) } });
  await hooks.get("createChatMessage")(message);
  assert.equal(client.cards.length, 1);
  assert.equal(client.sounds.length, 1);
  // An optional delayed completion also must not replay the result.
  await hooks.get("diceSoNiceRollComplete")(message.id);
  assert.equal(client.cards.length, 1);
  assert.equal(client.sounds.length, 1);
});

test("discarded d20s do not trigger natural-roll effects", () => {
  assert.equal(inspectD20Rolls({ isRoll: true, rolls: [{ terms: [{ faces: 20, results: [{ result: 20, active: false }, { result: 1, discarded: true }, { result: 10 }] }] }] }).hasNatural20, false);
});

test("public roll effects play once locally with each client's sound preference", async () => {
  const clients = [context(true), context(false), context(false), context(false), context(false)];
  for (const [index, client] of clients.entries()) {
    client.game.messages = new Map([[message.id, { ...message, blind: false, whisper: [] }]]);
    client.game.settings.get = (_, key) => key === "rollHookSound" ? index !== 2 : key === "soundVolume" ? (index + 1) / 5 : undefined;
    await handleDiceHook(message.id, client);
    await handleDiceHook(message.id, client);
    assert.equal(client.sounds.length, index === 2 ? 0 : 1);
    if (client.sounds.length) {
      assert.equal(client.sounds[0][0].volume, (index + 1) / 5);
      assert.equal(client.sounds[0][1], false);
    }
  }
  assert.equal(clients.flatMap(client => client.cards).length, 1);
});

test("client preferences retain old world defaults while shared behavior stays world-scoped", async () => {
  const { registerCosmereSettings, createSettingsRegistrationPlan } = await import("../scripts/settings-and-hooks.js");
  const plan = createSettingsRegistrationPlan();
  for (const key of ["rollHookSound", "rollHookAnimation", "soundVolume", "useAnimations"]) assert.equal(plan.settings.find(setting => setting.key === key).scope, "client");
  assert.equal(plan.settings.find(setting => setting.key === "automaticRollHooks").scope, "world");
  const registered = new Map();
  // Foundry stores Setting documents by ID, not setting key.
  const world = new Map([["volume-id", { key: "cosmere-rpg-tooling.soundVolume", value: "0.3" }], ["animation-id", { key: "cosmere-rpg-tooling.useAnimations", value: "false" }]]);
  world.getSetting = key => [...world.values()].find(setting => setting.key === key);
  registerCosmereSettings({ game: { settings: { storage: new Map([["world", world]]), register: (_, key, data) => registered.set(key, data) } } });
  assert.equal(registered.get("soundVolume").default, 0.3);
  assert.equal(registered.get("useAnimations").default, false);
});

test("hook animations are local and honor disabled animation preferences", async () => {
  const plays = [];
  const chain = new Proxy({}, { get: (_, key) => key === "then" ? undefined : (...args) => {
    if (key === "play") plays.push(args[0]);
    return chain;
  } });
  const client = context(true);
  client.game.modules = new Map([["JB2A_DnD5e", { active: true }]]);
  client.canvas = { scene: { width: 100, height: 100 } };
  client.Sequence = function Sequence() { return chain; };
  await handleDiceHook(message.id, client);
  assert.deepEqual(plays, [{ local: true }]);
  client.processedIds.clear();
  client.game.settings.get = (_, key) => key === "useAnimations" ? false : undefined;
  await handleDiceHook(message.id, client);
  assert.equal(plays.length, 1);
});
