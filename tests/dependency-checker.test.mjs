import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  COSMERE_DEPENDENCY_CHECKS,
  buildDependencyCheckChatCard,
  checkCosmereDependencies,
  runDependencyCheck,
} from "../scripts/dependency-checker.js";

function createGame(activeModules = []) {
  return {
    modules: {
      get(id) {
        return activeModules.includes(id) ? { id, active: true } : undefined;
      },
    },
  };
}

test("defines the dependency checks for animation and dice hooks", () => {
  assert.deepEqual(
    COSMERE_DEPENDENCY_CHECKS.map(check => check.key),
    ["jb2a", "sequence", "sequencerCrosshair", "diceSoNice"],
  );
});

test("detects available modules and globals", () => {
  const report = checkCosmereDependencies({
    game: createGame(["JB2A_DnD5e", "sequencer", "dice-so-nice"]),
    globals: {
      Sequence: function Sequence() {},
      Sequencer: { Crosshair: { show() {} } },
    },
  });

  assert.equal(report.ok, true);
  assert.equal(report.missing.length, 0);
  assert.deepEqual(report.results.map(result => result.ok), [true, true, true, true]);
});

test("reports missing dependencies with readable details", () => {
  const report = checkCosmereDependencies({
    game: createGame(["JB2A_DnD5e"]),
    globals: {},
  });

  assert.equal(report.ok, false);
  assert.deepEqual(report.missing.map(result => result.key), [
    "sequence",
    "sequencerCrosshair",
    "diceSoNice",
  ]);
  assert.match(report.results[1].detail, /Sequence no esta disponible/);
  assert.match(report.results[2].detail, /Sequencer\.Crosshair no esta disponible/);
  assert.match(report.results[3].detail, /Dice So Nice no esta activo/);
});

test("renders a dependency report chat card", () => {
  const report = checkCosmereDependencies({
    game: createGame(["JB2A_DnD5e"]),
    globals: {},
  });

  const html = buildDependencyCheckChatCard(report);

  assert.match(html, /Chequeo de Dependencias/);
  assert.match(html, /JB2A/);
  assert.match(html, /Sequencer/);
  assert.match(html, /Dice So Nice/);
  assert.match(html, /Disponible/);
  assert.match(html, /No disponible/);
});

test("escapes dependency text before rendering", () => {
  const html = buildDependencyCheckChatCard({
    ok: false,
    results: [
      {
        label: "<script>alert('x')</script>",
        ok: false,
        status: "No disponible",
        detail: "A & B",
        requiredFor: "\"quoted\"",
      },
    ],
    missing: [],
  });

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
  assert.match(html, /A &amp; B/);
  assert.match(html, /&quot;quoted&quot;/);
});

test("posts the dependency report and warns when something is missing", async () => {
  const messages = [];
  const warnings = [];
  const report = await runDependencyCheck({
    game: createGame(["JB2A_DnD5e"]),
    globals: {},
    ChatMessage: {
      getSpeaker() {
        return { alias: "GM" };
      },
      async create(message) {
        messages.push(message);
      },
    },
    ui: {
      notifications: {
        warn(message) {
          warnings.push(message);
        },
      },
    },
  });

  assert.equal(report.ok, false);
  assert.equal(messages.length, 1);
  assert.match(messages[0].content, /Chequeo de Dependencias/);
  assert.deepEqual(warnings, ["Faltan dependencias opcionales para algunas macros Cosmere."]);
});

test("ships a GM macro that opens the dependency checker", async () => {
  const raw = await readFile("packs/_source/gm-macros/DependencyCheck01.json", "utf8");
  const macro = JSON.parse(raw);

  assert.equal(macro._id, "DependencyCheck01");
  assert.equal(macro._key, "!macros!DependencyCheck01");
  assert.equal(macro.name, "Chequeo de Dependencias");
  assert.equal(macro.type, "script");
  assert.match(macro.command, /dependency-checker\.js/);
  assert.match(macro.command, /runDependencyCheck/);
});
