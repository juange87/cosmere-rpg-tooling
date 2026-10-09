import test from "node:test";
import assert from "node:assert/strict";
import { ensureOwnedRollTable, shouldSeedTables, TABLE_SEED_VERSION } from "../scripts/table-seeding.js";
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

test("table seeding honors opt-out and completed version", () => {
  const game = values => ({ settings: { get: (_, key) => values[key] } });
  assert.equal(shouldSeedTables(game({ seedRollTables: false })), false);
  assert.equal(shouldSeedTables(game({ tableSeedVersion: TABLE_SEED_VERSION })), false);
  assert.equal(shouldSeedTables(game({ tableSeedVersion: 0 })), true);
});
