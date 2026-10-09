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

test("owned tables preserve their UUID, customized results and the GM's folders", async () => {
  const updates = [];
  const existing = { ...data, id: "stable-id", folder: "old-folder", flags: { [moduleId]: { tableKey: "test-table" } }, update: async changes => updates.push(changes) };
  assert.equal(await ensureOwnedRollTable(data, { game: { tables: [existing] } }), "existing");
  assert.deepEqual(updates, []);
  assert.equal(existing.id, "stable-id");
});

test("exact legacy seeds are adopted without replacement", async () => {
  const updates = [];
  const existing = { ...data, update: async changes => updates.push(changes) };
  assert.equal(await ensureOwnedRollTable(data, { game: { tables: [existing] } }), "existing");
  assert.deepEqual(updates, [{ [`flags.${moduleId}.tableKey`]: "test-table" }]);
});

test("a unique moved legacy seed is adopted without undoing its folder organization", async () => {
  const updates = [];
  const existing = { ...data, id: "legacy-id", folder: "other-folder", update: async changes => updates.push(changes) };
  assert.equal(await ensureOwnedRollTable(data, { game: { tables: [existing] }, RollTable: { create: () => assert.fail("Duplicated legacy table") } }), "existing");
  assert.deepEqual(updates, [{ [`flags.${moduleId}.tableKey`]: "test-table" }]);
  assert.equal(existing.folder, "other-folder");
});

test("identical legacy copies do not create a third table and lookups prefer the adopted copy", async () => {
  const copies = ["two", "one"].map(id => ({ ...data, folder: "gm-folder", id, update: async changes => {
    assert.deepEqual(Object.keys(changes), [`flags.${moduleId}.tableKey`]);
    copies.find(table => table.id === id).flags = { [moduleId]: { tableKey: "test-table" } };
  } }));
  const context = { game: { tables: copies }, RollTable: { create: () => assert.fail("Third table created") } };
  await ensureOwnedRollTable(data, context);
  await ensureOwnedRollTable(data, context);
  assert.equal(copies.length, 2);
  assert.equal(copies.filter(table => table.flags?.[moduleId]).length, 1);
  copies.getName = () => copies[0];
  assert.equal(getModuleRollTable(data.name, { tables: copies }), copies[1]);
  assert.deepEqual(copies.map(table => table.folder), ["gm-folder", "gm-folder"]);
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
    // A later reseed must not rebuild the default hierarchy after every table
    // has been moved and those default folders removed by the GM.
    folders.length = 0;
    tables.forEach(table => { table.folder = "gm-organized"; });
    globalThis.Folder.create = () => assert.fail("Empty base or themed folder created");
    await callbacks[1]();
    assert.equal(folders.length, 0);
    assert.equal(tables.length, 21);

  } finally { Object.assign(globalThis, saved); }
});

test("thematic reseeding never creates empty folders after GM reorganization", async () => {
  const { ensureRoadmapRollTables, buildRoadmapRollTableDocuments } = await import("../scripts/roshar-roll-tables.js");
  const { tableKey } = await import("../scripts/table-seeding.js");
  const moved = { id: "moved", name: "GM renamed", type: "RollTable", folder: { id: "different-parent" } };
  const tables = buildRoadmapRollTableDocuments({ folderId: moved.id }).map(data => ({
    ...data, flags: { [moduleId]: { tableKey: tableKey(data.name) } },
    update: () => assert.fail("GM table reorganized"),
  }));
  const game = { users: { activeGM: { isSelf: true } }, tables, folders: [moved] };
  for (let retry = 0; retry < 3; retry++) {
    const report = await ensureRoadmapRollTables({ parentFolder: { id: "default-parent" }, game,
      Folder: { create: () => assert.fail("Empty default folder created") },
      RollTable: { create: () => assert.fail("Existing table recreated") } });
    assert.equal(report.created, 0);
    assert.equal(report.failed.length, 0);
  }
});

test("missing themed tables reuse flagged renamed folders and create default folders lazily", async () => {
  const { ensureRoadmapRollTables, buildRoadmapRollTableDocuments } = await import("../scripts/roshar-roll-tables.js");
  const { tableKey } = await import("../scripts/table-seeding.js");
  for (const hasFolder of [true, false]) {
    const moved = { id: "moved", name: "GM renamed", type: "RollTable", folder: "different-parent", flags: { [moduleId]: { tableFolderKey: "roshar-gm-tables" } } };
    const tables = buildRoadmapRollTableDocuments({ folderId: moved.id }).slice(1).map(data => ({ ...data, flags: { [moduleId]: { tableKey: tableKey(data.name) } } }));
    const createdFolders = [], createdTables = [];
    const game = { users: { activeGM: { isSelf: true } }, tables, folders: hasFolder ? [moved] : [] };
    const report = await ensureRoadmapRollTables({ game, Folder: { create: async data => {
      createdFolders.push(data); return { ...data, id: "new-folder" };
    } }, RollTable: { create: async data => createdTables.push(data) } });
    assert.equal(report.created, 1);
    assert.equal(createdFolders.length, hasFolder ? 0 : 1);
    assert.equal(createdTables[0].folder, hasFolder ? "moved" : "new-folder");
    if (!hasFolder) assert.equal(createdFolders[0].flags[moduleId].tableFolderKey, "roshar-gm-tables");
  }
});

test("named legacy folders get a stable flag before rename and move", async () => {
  const { createRollTableFolderResolver } = await import("../scripts/table-seeding.js");
  const updates = [];
  const old = { id: "legacy", name: "Roshar GM Tables", type: "RollTable", folder: { id: "parent" },
    async update(changes) { updates.push(changes); this.flags = { [moduleId]: { tableFolderKey: "roshar-gm-tables" } }; } };
  const context = { game: { folders: [old] }, Folder: { create: () => assert.fail("Renamed folder duplicated") },
    key: "roshar-gm-tables", name: "Roshar GM Tables", parent: { id: "parent", folder: { id: "grandparent" } } };
  const resolver = await createRollTableFolderResolver(context);
  assert.equal(resolver.folder, old);
  assert.deepEqual(updates, [{ [`flags.${moduleId}.tableFolderKey`]: "roshar-gm-tables" }]);
  old.name = "GM renamed"; old.folder = { id: "other-parent" };
  const renamed = await createRollTableFolderResolver(context);
  assert.equal(await renamed.resolve(), "legacy");
  assert.equal(updates.length, 1);
});

test("missing base tables create only their required folder chain", async () => {
  const { createRollTableFolderResolver } = await import("../scripts/table-seeding.js");
  const folders = [], created = [];
  const context = { game: { folders, tables: [] }, Folder: { create: async data => {
    const document = { ...data, id: `folder-${folders.length}` }; folders.push(document); return document;
  } } };
  const parent = await createRollTableFolderResolver({ ...context, key: "root", name: "Root" });
  const character = await createRollTableFolderResolver({ ...context, key: "character", name: "Characters", parent });
  await createRollTableFolderResolver({ ...context, key: "names", name: "Names", parent });
  assert.equal(folders.length, 0);
  await ensureOwnedRollTable({ ...data, folder: character }, { ...context, RollTable: { create: async doc => created.push(doc) } });
  assert.deepEqual(folders.map(folder => folder.name), ["Root", "Characters"]);
  assert.equal(folders[1].folder, folders[0].id);
  assert.equal(created[0].folder, folders[1].id);
});

test("base folder flag failures warn, retain seed version and recover on retry", async () => {
  const saved = Object.fromEntries(["Hooks", "game", "Folder", "RollTable", "ui"].map(key => [key, globalThis[key]]));
  const callbacks = [], warnings = [], versions = [], tables = [];
  let rejected = true;
  const folders = [{ id: "root", type: "RollTable", name: "CosmereRPG: Character Creation",
    async update(changes) { if (rejected) { rejected = false; throw new Error("Folder write denied"); }
      this.flags = { [moduleId]: { tableFolderKey: "character-creation-root" } };
    } }];
  globalThis.Hooks = { once: (event, callback) => { if (event === "ready") callbacks.push(callback); } };
  globalThis.game = { users: { activeGM: { isSelf: true } }, tables, folders,
    settings: { get: () => undefined, set: async (...args) => versions.push(args) } };
  globalThis.ui = { notifications: { info() {}, warn: text => warnings.push(text) } };
  globalThis.Folder = { create: async data => {
    const doc = { ...data, id: `created-${folders.length}` }; folders.push(doc); return doc;
  } };
  globalThis.RollTable = { create: async data => tables.push(data) };
  try {
    await import("../scripts/init.js?base-folder-failure");
    await callbacks[1]();
    assert.equal(warnings.length, 1);
    assert.equal(versions.length, 0);
    assert.equal(tables.length, 0);
    await callbacks[1]();
    assert.equal(tables.length, 21);
    assert.equal(versions.length, 1);
  } finally { Object.assign(globalThis, saved); }
});
