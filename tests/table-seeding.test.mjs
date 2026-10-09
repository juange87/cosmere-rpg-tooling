import test from "node:test";
import assert from "node:assert/strict";
import { ensureOwnedRollTable, shouldSeedTables, TABLE_SEED_VERSION, getModuleRollTable } from "../scripts/table-seeding.js";
const moduleId = "cosmere-rpg-tooling";
const data = { name: "Test Table", folder: "module-folder", formula: "1d20", results: [{ text: "Result", weight: 1, range: [1, 1] }] };

test("same-name user tables and edited legacy tables are never changed", async () => {
  const created = [];
  for (const folder of ["user-folder", "module-folder"]) {
    const userTable = { ...data, folder, results: [{ ...data.results[0], text: "GM edits" }], async update() { assert.fail("User table modified"); }, async delete() { assert.fail("User table deleted"); } };
    assert.equal(await ensureOwnedRollTable(data, { game: { tables: [userTable] }, RollTable: { create: async doc => created.push(doc) } }), "created");
  }
  assert.equal(created[0].flags[moduleId].tableKey, "test-table");
});

test("owned tables are moved preserving their UUID and customized results", async () => {
  const updates = [];
  const existing = { ...data, id: "stable-id", folder: "old-folder", flags: { [moduleId]: { tableKey: "test-table" } }, update: async changes => updates.push(changes) };
  assert.equal(await ensureOwnedRollTable(data, { game: { tables: [existing] } }), "moved");
  assert.deepEqual(updates, [{ folder: "module-folder" }]);
  assert.equal(existing.id, "stable-id");
});

test("exact legacy seeds are adopted without replacement", async () => {
  const updates = [];
  const existing = { ...data, update: async changes => updates.push(changes) };
  assert.equal(await ensureOwnedRollTable(data, { game: { tables: [existing] } }), "existing");
  assert.deepEqual(updates, [{ [`flags.${moduleId}.tableKey`]: "test-table" }]);
});

test("a unique moved legacy seed is adopted and moved without duplicating it", async () => {
  const updates = [];
  const existing = { ...data, id: "legacy-id", folder: "other-folder", update: async changes => updates.push(changes) };
  assert.equal(await ensureOwnedRollTable(data, { game: { tables: [existing] }, RollTable: { create: () => assert.fail("Duplicated legacy table") } }), "moved");
  assert.deepEqual(updates, [{ [`flags.${moduleId}.tableKey`]: "test-table" }, { folder: "module-folder" }]);
});

test("ambiguous legacy copies stay untouched and lookups prefer the owned table", async () => {
  const copies = ["one", "two"].map(id => ({ ...data, id, update: () => assert.fail("Ambiguous table modified") }));
  await ensureOwnedRollTable(data, { game: { tables: copies }, RollTable: { create: async table => copies.push(table) } });
  assert.equal(copies.length, 3);
  copies.getName = () => copies[0];
  assert.equal(getModuleRollTable(data.name, { tables: copies }), copies[2]);
});

test("table seeding honors opt-out and completed version", () => {
  const game = values => ({ settings: { get: (_, key) => values[key] } });
  assert.equal(shouldSeedTables(game({ seedRollTables: false })), false);
  assert.equal(shouldSeedTables(game({ tableSeedVersion: TABLE_SEED_VERSION })), false);
  assert.equal(shouldSeedTables(game({ tableSeedVersion: 0 })), true);
});

test("only Foundry's active GM may seed thematic folders and tables", async () => {
  const { ensureRoadmapRollTables } = await import("../scripts/roshar-roll-tables.js");
  const { isActiveGM } = await import("../scripts/cosmere-helpers.js");
  const clients = [true, false, false, false, false].map(isSelf => ({ users: { activeGM: { isSelf } } }));
  assert.equal(clients.filter(isActiveGM).length, 1);
  for (const game of [...clients.slice(1), {}]) {
    const result = await ensureRoadmapRollTables({ game, Folder: { create: () => assert.fail("Inactive GM created a folder") }, RollTable: { create: () => assert.fail("Inactive GM created a table") } });
    assert.equal(result.skipped, true);
  }
});

test("a failed base table does not stop later or thematic tables, and only failures are retried", async () => {
  const callbacks = [], tables = [], folders = [], warnings = [], versions = [];
  const saved = Object.fromEntries(["Hooks", "game", "Folder", "RollTable", "ui"].map(key => [key, globalThis[key]]));
  let failOnce = true;
  const createdNames = [];
  globalThis.Hooks = { once: (event, callback) => { if (event === "ready") callbacks.push(callback); } };
  globalThis.game = { users: { activeGM: { isSelf: true } }, tables, folders, settings: { get: () => undefined, set: async (_, key, value) => versions.push([key, value]) } };
  globalThis.Folder = { create: async data => {
    const folder = { ...data, id: String(folders.length), folder: data.folder ? { id: data.folder } : null };
    folders.push(folder); return folder;
  } };
  globalThis.RollTable = { create: async data => {
    if (failOnce) { failOnce = false; throw new Error("First table rejected"); }
    tables.push({ ...data }); createdNames.push(data.name);
  } };
  globalThis.ui = { notifications: { info() {}, warn: text => warnings.push(text) } };
  try {
    await import("../scripts/init.js?seed-failure-regression");
    await callbacks[1]();
    assert.equal(tables.length, 20);
    assert.equal(createdNames.includes("Ruin Discoveries"), true);
    assert.equal(versions.length, 0);
    assert.equal(warnings.length, 1);
    await callbacks[1]();
    assert.equal(tables.length, 21);
    assert.equal(createdNames.length, 21);
    assert.deepEqual(versions, [["tableSeedVersion", TABLE_SEED_VERSION]]);
  } finally { Object.assign(globalThis, saved); }
});
