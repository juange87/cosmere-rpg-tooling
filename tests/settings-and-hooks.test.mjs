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

test("discarded d20s do not trigger natural-roll effects", () => {
  assert.equal(inspectD20Rolls({ isRoll: true, rolls: [{ terms: [{ faces: 20, results: [{ result: 20, active: false }, { result: 1, discarded: true }, { result: 10 }] }] }] }).hasNatural20, false);
});
