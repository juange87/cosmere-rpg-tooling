import test from "node:test";
import assert from "node:assert/strict";
import { validateMacroSourceFile, validateAllMacroSources } from "../scripts/macro-validator.js";

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
