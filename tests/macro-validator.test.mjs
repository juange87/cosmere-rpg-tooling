import test from "node:test";
import assert from "node:assert/strict";
import { validateMacroSourceFile, validateAllMacroSources } from "../scripts/macro-validator.js";
import { mkdtemp, mkdir, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { compilePacks } from "../compile-packs.js";

test("macro IDs follow Foundry's DocumentIdField contract", () => {
  for (const id of ["GMPanel01", "12345678901234567", "123456789012345!", ""]) {
    const report = validateMacroSourceFile("macro.json", {
      _id: id, _key: `!macros!${id}`, name: "Test", type: "script", command: "return;",
    });
    assert.equal(report.ok, false, id);
  }
});

test("all shipped macros have valid, unique IDs and matching LevelDB keys", async () => {
  const report = await validateAllMacroSources();
  assert.deepEqual(report.errors, []);
  const ids = report.packReports.flatMap(pack => pack.reports.map(item => item.filePath));
  assert.equal(ids.length, 66);
});

test("validation reports escape error HTML before it reaches the chat", async () => {
  const { buildMacroValidationChatCard } = await import("../scripts/macro-validator.js");
  const html = buildMacroValidationChatCard({ errors: ['<img src=x onerror="evil()">'], warnings: [] });
  assert.match(html, /&lt;img/);
  assert.doesNotMatch(html, /<img/);
});

test("null and non-object JSON produce per-file errors without aborting validation", async () => {
  const root = await mkdtemp(join(tmpdir(), "cosmere-invalid-json-"));
  const packPath = join(root, "packs/_source/test");
  await mkdir(packPath, { recursive: true });
  try {
    for (const [index, value] of [null, [], "text", 1].entries()) await writeFile(join(packPath, `${index}.json`), JSON.stringify(value));
    await writeFile(join(packPath, "valid.json"), JSON.stringify({ _id: "1234567890abcdef", _key: "!macros!1234567890abcdef", name: "Valid", type: "script", command: "return;" }));
    const report = await validateAllMacroSources({ packPaths: [packPath] });
    assert.equal(report.errors.length, 4);
    assert.equal(report.packReports[0].reports.length, 5);
    assert.equal(report.packReports[0].reports.at(-1).ok, true);
    for (const [index, error] of report.errors.entries()) assert.match(error, new RegExp(`${index}\\.json`));
    await assert.rejects(compilePacks({ root, packNames: ["test"], compiler: () => assert.fail("Invalid sources compiled") }), /Macro validation failed/);
  } finally { await rm(root, { recursive: true, force: true }); }
});
