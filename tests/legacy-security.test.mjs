import { createCosmereApi } from "../scripts/module-api.js";
import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
const attack = '<img src=x onerror="globalThis.hacked=true">';

async function executeMacro(file, { game, canvas = {}, messages = [] } = {}) {
  const macro = JSON.parse(await readFile(`packs/_source/${file}.json`, "utf8"));
  const command = macro.command.replaceAll('/modules/cosmere-rpg-tooling/scripts/', new URL('../scripts/', import.meta.url).href);
  const dialogs = [];
  class Dialog { constructor(options) { dialogs.push(options); } render() { return this; } }
  game.modules = new Map([["cosmere-rpg-tooling", { api: createCosmereApi({ game, canvas, Dialog, ChatMessage: { create: async data => messages.push(data) }, ui: { notifications: { info() {}, warn() {}, error() {} } } }) }]]);
  const previousDialog = globalThis.Dialog;
  globalThis.Dialog = Dialog;
  try { await new AsyncFunction("game", "canvas", "ui", "ChatMessage", "Dialog", command)(
    game, canvas, { notifications: { info() {}, warn() {}, error() {} } }, { create: async data => messages.push(data) }, Dialog,
  ); } finally { globalThis.Dialog = previousDialog; }
  return { dialogs, messages };
}

test("sphere dialogs escape actor names and image attributes", async () => {
  for (const id of ["z8dLwcyv2CkyTvLS", "PFVU35wn6SQ4hYxg"]) {
    const actor = { id: "actor", name: attack, img: 'x" onerror="evil()', type: "character", hasPlayerOwner: true, items: [] };
    const { dialogs } = await executeMacro(`gm-macros/${id}`, { game: { actors: [actor] } });
    assert.doesNotMatch(dialogs[0].content, /<img src=x onerror=/);
    assert.match(dialogs[0].content, /&lt;img/);
    assert.match(dialogs[0].content, /src="x&quot; onerror=&quot;evil\(\)"/);
  }
});

test("private messages treat player names and message bodies as text", async () => {
  const player = { id: "player", name: attack };
  const { dialogs, messages } = await executeMacro("gm-macros/wilsiRBC31LfydfP", { game: { users: { players: [player], get: () => player }, user: { id: "gm", name: "GM" } } });
  assert.doesNotMatch(dialogs[0].content, /<img src=x onerror=/);
  await dialogs[0].buttons.enviar.callback({ find: selector => ({ val: () => selector === "#usuario" ? "player" : attack }) });
  assert.match(messages[0].content, /&lt;img/);
  assert.doesNotMatch(messages[0].content, /<img/);
});

test("Request Roll attributes requests to the GM and whispers to every actor owner", async () => {
  const players = [{ id: "owner1", name: "One" }, { id: "other", name: "Other" }, { id: "owner2", name: "Two" }];
  const actor = { id: "actor", name: attack, hasPlayerOwner: true, testUserPermission: user => user.id !== "other" };
  const actors = [actor];
  actors.get = () => actor;
  const { dialogs, messages } = await executeMacro("gm-macros/OHzWpcVmcfaHsk4z", { game: { actors, users: { players }, user: { id: "gm", name: attack } } });
  await dialogs[0].buttons.siguiente.callback({ find: () => ({ val: () => "actor" }) });
  await dialogs[1].buttons.enviar.callback({ find: () => ({ val: () => "agi" }) });
  assert.deepEqual(messages[0].whisper, ["owner1", "owner2"]);
  assert.equal(messages[0].author, "gm");
  assert.equal("user" in messages[0], false);
  assert.match(messages[0].content, /data-skill="agi"/);
  assert.doesNotMatch(messages[0].content, /<img src=x onerror=/);
});

test("classic distribution/removal use the shared inventory model and reject fractional grants", async () => {
  const item = { type: "loot", system: { isMoney: true, quantity: 2, price: { currency: "spheres", denomination: { primary: "mark" } } }, update: async change => { item.system.quantity = change["system.quantity"]; } };
  const actor = { id: "actor", name: "Actor", type: "character", hasPlayerOwner: true, items: [item] };
  const game = { actors: [actor] };
  const html = quantity => ({ find: selector => selector === ".actor-check:checked" ? [{ dataset: { id: "actor" } }] : {
    val: () => selector === "#inp-spheres-mark" ? quantity : 0,
    is: () => false,
  } });
  const grant = await executeMacro("gm-macros/z8dLwcyv2CkyTvLS", { game });
  await grant.dialogs[0].buttons.ok.callback(html(3));
  assert.equal(item.system.quantity, 5);
  await assert.rejects(grant.dialogs[0].buttons.ok.callback(html(1.5)));
  assert.equal(item.system.quantity, 5);
  const spend = await executeMacro("gm-macros/PFVU35wn6SQ4hYxg", { game });
  await spend.dialogs[0].buttons.ok.callback(html(2));
  assert.equal(item.system.quantity, 3);
});

test("two sphere dialogs keep previews and select-all actions scoped to their own roots", async () => {
  function root(name, amount) {
    const box = { innerHTML: "" }, listeners = {};
    const check = { checked: true, dataset: { id: name }, closest: () => ({ querySelector: () => ({ textContent: name }) }), addEventListener() {} };
    const toggle = { addEventListener: (type, callback) => { listeners[type] = callback; } };
    return { box, check, listeners,
      querySelectorAll: selector => selector === ".actor-check:checked" ? (check.checked ? [check] : []) : selector === ".actor-check" ? [check] : [],
      querySelector: selector => selector === "#cr-preview" ? box : selector === ".cr-toggle-all" ? toggle : selector === "#opt-dividir" ? { checked: false } : { value: selector === "#inp-spheres-mark" ? amount : 0 },
    };
  }
  const { createDialogHtmlAdapter } = await import("../scripts/foundry-dialogs.js");
  for (const id of ["z8dLwcyv2CkyTvLS", "PFVU35wn6SQ4hYxg"]) {
    const actor = { id: "actor", name: "Actor", type: "character", hasPlayerOwner: true, items: [] };
    const { dialogs } = await executeMacro(`gm-macros/${id}`, { game: { actors: [actor] } });
    const one = root("One", 2), two = root("Two", 3);
    dialogs[0].render(createDialogHtmlAdapter(one));
    dialogs[0].render(createDialogHtmlAdapter(two));
    assert.match(one.box.innerHTML, /One/);
    assert.match(two.box.innerHTML, /Two/);
    one.listeners.click({ preventDefault() {} });
    assert.equal(one.check.checked, false);
    assert.equal(two.check.checked, true);
  }
});
