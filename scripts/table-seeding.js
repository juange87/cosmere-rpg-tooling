import { COSMERE_MODULE_ID } from "./cosmere-helpers.js";

// Bump only when the bundled table definitions change.
export const TABLE_SEED_VERSION = 1;
export const tableKey = name => String(name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function shouldSeedTables(game = globalThis.game) {
  return game?.settings?.get(COSMERE_MODULE_ID, "seedRollTables") !== false
    && game?.settings?.get(COSMERE_MODULE_ID, "tableSeedVersion") !== TABLE_SEED_VERSION;
}

function isUnmodifiedLegacyTable(table, data) {
  const results = Array.from(table.results?.contents ?? table.results ?? []);
  return !table.flags?.[COSMERE_MODULE_ID]?.tableKey
    && table.name === data.name && table.formula === data.formula
    && results.length === data.results.length
    && results.every((result, index) => {
      const expected = data.results[index];
      return result.text === expected.text && result.weight === expected.weight
        && JSON.stringify(result.range) === JSON.stringify(expected.range);
    });
}

export async function ensureOwnedRollTable(data, {
  game = globalThis.game, RollTable = globalThis.RollTable, resolveFolder,
} = {}) {
  const key = tableKey(data.name);
  let existing = game.tables.find(table => table.flags?.[COSMERE_MODULE_ID]?.tableKey === key);
  // Reuse an exact legacy copy without moving it. Prefer the intended folder
  // and then a stable ID when several copies exist; do not create another copy
  // or delete the GM's existing duplicates.
  if (!existing) {
    const candidates = game.tables.filter(table => isUnmodifiedLegacyTable(table, data));
    existing = candidates.find(table => (table.folder?.id ?? table.folder) === data.folder)
      ?? candidates.sort((a, b) => String(a.id ?? a._id ?? "").localeCompare(String(b.id ?? b._id ?? "")))[0];
    if (existing) await existing.update({ [`flags.${COSMERE_MODULE_ID}.tableKey`]: key });
  }
  if (existing) {
    // Ownership is not permission to undo the GM's folder organization.
    return "existing";
  }
  await RollTable.create({
    ...data,
    folder: resolveFolder ? await resolveFolder() : data.folder,
    flags: { ...data.flags, [COSMERE_MODULE_ID]: { ...data.flags?.[COSMERE_MODULE_ID], tableKey: key } },
  });
  return "created";
}

export function getModuleRollTable(name, game = globalThis.game) {
  const owned = game?.tables?.find?.(table => table.flags?.[COSMERE_MODULE_ID]?.tableKey === tableKey(name));
  if (owned) return owned;
  return typeof game?.tables?.getName === "function"
    ? game.tables.getName(name)
    : game?.tables?.find?.(table => table.name === name);
}

export async function seedRollTableDocuments(documents, context = {}) {
  const report = { created: 0, failed: [], total: documents.length };
  for (const data of documents) {
    try {
      const status = await ensureOwnedRollTable(data, context);
      if (status === "created") report.created++;
    } catch (error) {
      report.failed.push({ name: data.name, error });
    }
  }
  return report;
}
