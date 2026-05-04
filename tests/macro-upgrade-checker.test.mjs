import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  applyMacroUpgradeSelection,
  buildMacroUpgradeChatCard,
  buildMacroUpgradeDialogContent,
  buildMacroUpgradeReport,
} from "../scripts/macro-upgrade-checker.js";

test("macro upgrade report detects current, outdated, missing, and duplicate world macros", () => {
  const sourceMacros = [
    {
      _id: "gm-panel",
      name: "Panel GM Cosmere",
      command: "import('/new-gm-panel.js')",
      type: "script",
      img: "icons/svg/dice-target.svg",
      scope: "global",
      packId: "cosmere-rpg-tooling.gm-macros",
      packLabel: "CosmereRPG: GM Macros",
    },
    {
      _id: "roll-skill",
      name: "Roll Skill",
      command: "rollSkill()",
      type: "script",
      img: "icons/svg/d20-black.svg",
      scope: "global",
      packId: "cosmere-rpg-tooling.player-macros",
      packLabel: "CosmereRPG: Player Macros",
    },
  ];
  const worldMacros = [
    {
      id: "world-current",
      name: "Roll Skill",
      command: "rollSkill()",
      type: "script",
      img: "icons/svg/d20-black.svg",
      scope: "global",
    },
    {
      id: "world-old",
      name: "Panel GM Cosmere",
      command: "import('/old-gm-panel.js')",
      type: "script",
      img: "icons/svg/dice-target.svg",
      scope: "global",
    },
    {
      id: "world-duplicate",
      name: "Panel GM Cosmere",
      command: "import('/new-gm-panel.js')",
      type: "script",
      img: "icons/svg/dice-target.svg",
      scope: "global",
    },
  ];

  const report = buildMacroUpgradeReport({ sourceMacros, worldMacros });

  assert.equal(report.ok, false);
  assert.equal(report.counts.sourceTotal, 2);
  assert.equal(report.counts.current, 2);
  assert.equal(report.counts.outdated, 1);
  assert.equal(report.counts.missing, 0);
  assert.equal(report.counts.duplicates, 1);

  const outdated = report.entries.find(entry => entry.status === "outdated");
  assert.equal(outdated.source.name, "Panel GM Cosmere");
  assert.equal(outdated.worldMacro.id, "world-old");
  assert.deepEqual(outdated.changedFields, ["command"]);
  assert.equal(outdated.canUpdate, true);
});

test("macro upgrade report treats non-imported compendium macros as safe missing entries", () => {
  const report = buildMacroUpgradeReport({
    sourceMacros: [{
      _id: "dependency",
      name: "Chequeo de Dependencias",
      command: "runDependencyCheck()",
      type: "script",
      packId: "cosmere-rpg-tooling.gm-macros",
    }],
    worldMacros: [],
  });

  assert.equal(report.ok, true);
  assert.equal(report.counts.missing, 1);
  assert.equal(report.entries[0].status, "missing");
  assert.equal(report.entries[0].canUpdate, false);
});

test("macro upgrade selection updates only explicitly selected outdated world macros", async () => {
  const updates = [];
  const staleMacro = {
    id: "world-old",
    name: "Panel GM Cosmere",
    command: "oldCommand()",
    type: "script",
    img: "icons/svg/dice-target.svg",
    scope: "global",
    async update(data) {
      updates.push(data);
      Object.assign(this, data);
    },
  };
  const currentMacro = {
    id: "world-current",
    name: "Roll Skill",
    command: "rollSkill()",
    type: "script",
    img: "icons/svg/d20-black.svg",
    scope: "global",
    async update(data) {
      throw new Error(`current macro should not be updated: ${JSON.stringify(data)}`);
    },
  };
  const report = buildMacroUpgradeReport({
    sourceMacros: [
      {
        _id: "gm-panel",
        name: "Panel GM Cosmere",
        command: "newCommand()",
        type: "script",
        img: "icons/svg/dice-target.svg",
        scope: "global",
        packId: "cosmere-rpg-tooling.gm-macros",
      },
      {
        _id: "roll-skill",
        name: "Roll Skill",
        command: "rollSkill()",
        type: "script",
        img: "icons/svg/d20-black.svg",
        scope: "global",
        packId: "cosmere-rpg-tooling.player-macros",
      },
    ],
    worldMacros: [staleMacro, currentMacro],
  });

  const result = await applyMacroUpgradeSelection({
    report,
    selectedEntryKeys: [report.entries.find(entry => entry.worldMacro?.id === "world-old").key],
    now: new Date("2026-05-04T10:00:00.000Z"),
  });

  assert.equal(result.updated.length, 1);
  assert.equal(result.skipped.length, 0);
  assert.equal(staleMacro.command, "newCommand()");
  assert.equal(updates[0].flags["cosmere-rpg-tooling"].lastMacroUpgrade.sourceId, "gm-panel");
  assert.equal(updates[0].flags["cosmere-rpg-tooling"].lastMacroUpgrade.previous.commandPreview, "oldCommand()");
});

test("macro upgrade HTML escapes names and leaves update checkboxes unchecked", () => {
  const report = buildMacroUpgradeReport({
    sourceMacros: [{
      _id: "unsafe",
      name: "Macro <unsafe>",
      command: "newCommand()",
      type: "script",
      packLabel: "GM <Pack>",
    }],
    worldMacros: [{
      id: "world-unsafe",
      name: "Macro <unsafe>",
      command: "oldCommand()",
      type: "script",
    }],
  });

  const dialogHtml = buildMacroUpgradeDialogContent(report);
  const chatHtml = buildMacroUpgradeChatCard(report);

  assert.match(dialogHtml, /Macro &lt;unsafe&gt;/);
  assert.match(dialogHtml, /GM &lt;Pack&gt;/);
  assert.match(dialogHtml, /type="checkbox"/);
  assert.doesNotMatch(dialogHtml, /checked/);
  assert.match(chatHtml, /Macros Cosmere instaladas/);
  assert.match(chatHtml, /Obsoletas: 1/);
});

test("ships the GM macro for checking imported world macro copies", async () => {
  const macro = JSON.parse(await readFile("packs/_source/gm-macros/MacroUpgradeCheck01.json", "utf8"));

  assert.equal(macro._id, "MacroUpgradeCheck01");
  assert.equal(macro._key, "!macros!MacroUpgradeCheck01");
  assert.equal(macro.name, "Chequeo de Macros Instaladas");
  assert.equal(macro.type, "script");
  assert.match(macro.command, /macro-upgrade-checker\.js/);
});
