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

function fakeTimers() {
  let now = 0, nextId = 0;
  const timers = new Map();
  return {
    setTimer: (callback, delay) => { const id = ++nextId; timers.set(id, { callback, time: now + delay }); return id; },
    clearTimer: id => timers.delete(id),
    get count() { return timers.size; },
    async advance(duration) {
      const until = now + duration;
      while (true) {
        const entry = [...timers].filter(([, timer]) => timer.time <= until).sort((a, b) => a[1].time - b[1].time)[0];
        if (!entry) break;
        const [id, timer] = entry; now = timer.time; timers.delete(id); await timer.callback();
        await new Promise(resolve => setImmediate(resolve));
      }
      now = until;
    },
  };
}

async function scheduledClient(dice3d) {
  const { createDiceHookScheduler } = await import("../scripts/settings-and-hooks.js");
  const client = context(true), timers = fakeTimers();
  const roll = { ...message, _dice3danimating: false };
  client.game.modules = new Map([["dice-so-nice", { active: true }]]);
  client.game.dice3d = dice3d;
  client.game.messages.set(roll.id, roll);
  const warnings = [];
  const scheduler = createDiceHookScheduler({ game: client.game, processedIds: client.processedIds, logger: { warn: (...args) => warnings.push(args) }, handle: (id, inspection) => handleDiceHook(id, client, inspection), ...timers });
  return { ...client, timers, scheduler, roll, warnings };
}

test("DSN results stay hidden during normal animations", async () => {
  const client = await scheduledClient({ isEnabled: () => true, waitFor3DAnimationByMessageID: async () => true });
  client.roll._dice3danimating = true;
  client.scheduler.created(client.roll);
  assert.equal(client.cards.length, 0);
  await client.timers.advance(100);
  assert.equal(client.cards.length, 0);
  assert.equal(client.sounds.length, 0);
  await client.timers.advance(10000);
  assert.equal(client.cards.length, 0);
  client.roll._dice3danimating = false;
  await client.scheduler.complete(client.roll.id);
  await client.timers.advance(30000);
  assert.equal(client.cards.length, 1);
  assert.equal(client.sounds.length, 1);
});

test("DSN skipped and disabled animations still publish, without late duplicates", async () => {
  for (const enabled of [true, false]) {
    const client = await scheduledClient({ isEnabled: () => enabled, waitFor3DAnimationByMessageID: async () => true });
    client.scheduler.created(client.roll);
    await client.timers.advance(100);
    assert.equal(client.cards.length, 1);
    await client.scheduler.complete(client.roll.id);
    assert.equal(client.cards.length, 1);
  }
});

test("skipped animations do not call the DSN waiter or wait thirty seconds", async () => {
  let waiterCalls = 0;
  const client = await scheduledClient({ isEnabled: () => true, waitFor3DAnimationByMessageID: () => { waiterCalls++; return new Promise(() => {}); } });
  client.scheduler.created(client.roll);
  await client.timers.advance(99);
  assert.equal(client.cards.length, 0);
  await client.timers.advance(1);
  assert.equal(client.cards.length, 1);
  assert.equal(waiterCalls, 0);
  assert.equal(client.timers.count, 0);
});

test("a stuck animation logs and publishes once at the polling limit", async () => {
  const client = await scheduledClient({ isEnabled: () => true });
  client.scheduler.created(client.roll);
  // Simulate DSN's listener running after ours in the same creation hook.
  client.roll._dice3danimating = true;
  await client.timers.advance(60000);
  assert.equal(client.timers.count, 0);
  assert.equal(client.cards.length, 1);
  assert.equal(client.warnings.length, 1);
  assert.equal(client.warnings[0][1].messageId, client.roll.id);
  client.roll._dice3danimating = false;
  await client.scheduler.complete(client.roll.id);
  assert.equal(client.cards.length, 1);
});

test("deletion cancels pending checks and late completions", async () => {
  const client = await scheduledClient({ isEnabled: () => true });
  client.roll._dice3danimating = true;
  client.scheduler.created(client.roll);
  assert.equal(client.timers.count, 1);
  client.scheduler.deleted(client.roll);
  assert.equal(client.timers.count, 0);
  client.roll._dice3danimating = false;
  await client.scheduler.complete(client.roll.id);
  await client.timers.advance(60000);
  assert.equal(client.cards.length, 0);
});

test("a completion before creation does not leave a pending timer", async () => {
  const client = await scheduledClient({ isEnabled: () => true });
  await client.scheduler.complete(client.roll.id);
  client.scheduler.created(client.roll);
  assert.equal(client.timers.count, 0);
  assert.equal(client.cards.length, 1);
});

test("irrelevant, hidden and disabled rolls schedule no work", async () => {
  for (const mode of ["disabled", "no-d20", "ordinary-d20", "hidden", "natural-disabled"]) {
    const client = await scheduledClient({ isEnabled: () => true });
    if (mode === "disabled") client.game.settings.get = (_, key) => key === "automaticRollHooks" ? false : undefined;
    if (mode === "natural-disabled") client.game.settings.get = (_, key) => key === "natural20Effects" ? false : undefined;
    if (mode === "hidden") client.roll.isContentVisible = false;
    if (mode === "no-d20") client.roll.rolls = [{ terms: [{ faces: 6, results: [{ result: 6 }] }] }];
    if (mode === "ordinary-d20") client.roll.rolls = [{ terms: [{ faces: 20, results: [{ result: 10 }] }] }];
    client.scheduler.created(client.roll);
    await client.scheduler.complete(client.roll.id);
    assert.equal(client.timers.count, 0, mode);
    assert.equal(client.cards.length, 0, mode);
  }
});

test("registered DSN hooks defer five clients and preserve hidden-roll visibility without duplicates", async () => {
  const clients = [];
  for (let index = 0; index < 5; index++) {
    const { activateCosmereGlobalHooks: activate } = await import(`../scripts/settings-and-hooks.js?timing-client=${index}`);
    const client = context(index === 0), timers = fakeTimers(), hooks = new Map(), notifications = [];
    const roll = { ...message, blind: false, whisper: [], _dice3danimating: true, isContentVisible: index !== 4 };
    client.game.messages.set(roll.id, roll);
    client.game.modules = new Map([["dice-so-nice", { active: true }]]);
    client.game.dice3d = { isEnabled: () => true, waitFor3DAnimationByMessageID: async () => true };
    activate({ ...client, ...timers, Hooks: { on: (key, callback) => hooks.set(key, callback) }, ui: { notifications: { info: text => notifications.push(text) } } });
    hooks.get("createChatMessage")(roll);
    await timers.advance(100);
    assert.equal(client.cards.length + client.sounds.length + notifications.length, 0);
    roll._dice3danimating = false;
    await hooks.get("diceSoNiceRollComplete")(roll.id);
    await timers.advance(30000);
    assert.equal(client.sounds.length, index === 4 ? 0 : 1);
    assert.equal(notifications.length, index === 4 ? 0 : 1);
    clients.push(client);
  }
  assert.equal(clients.flatMap(client => client.cards).length, 1);
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

test("interactive pending throws time out with a diagnostic but never reveal", async () => {
  const client = await scheduledClient({ isEnabled: () => true, pendingThrows: { isPending: () => true } });
  client.roll._dice3danimating = true;
  client.scheduler.created(client.roll);
  await client.timers.advance(60000);
  assert.equal(client.cards.length, 0);
  assert.equal(client.warnings.length, 1);
  assert.equal(client.timers.count, 0);
  client.roll._dice3danimating = false;
  await client.scheduler.complete(client.roll.id);
  assert.equal(client.cards.length, 1);
});

test("polling inspects a roll only once and irrelevant deletions retain important history", async () => {
  const client = await scheduledClient({ isEnabled: () => true });
  let inspections = 0;
  const rolls = client.roll.rolls;
  Object.defineProperty(client.roll, "rolls", { get() { inspections++; return rolls; } });
  client.roll._dice3danimating = true;
  client.scheduler.created(client.roll);
  await client.timers.advance(60000);
  assert.equal(inspections, 1);
  for (let id = 0; id < 1500; id++) client.scheduler.deleted({ id: `unrelated-${id}` });
  assert.equal(client.processedIds.size, 1);
  client.roll._dice3danimating = false;
  await client.scheduler.complete(client.roll.id);
  assert.equal(client.cards.length, 1);
});
