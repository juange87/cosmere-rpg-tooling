import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  FIRST_STEP_TABLES,
  buildFirstStepChatCard,
  drawFirstStepCharacter,
} from "../scripts/first-step-character-generator.js";

test("defines the required first step roll tables", () => {
  assert.deepEqual(FIRST_STEP_TABLES, {
    goal: "Character Goals Table",
    obstacle: "Character Obstacles Table",
    purpose: "Radiant Purpose Table",
  });
});

test("draws goal, obstacle, purpose, and optional culture name", async () => {
  const calls = [];
  const game = {
    tables: {
      getName(name) {
        calls.push(name);
        const resultByName = {
          "Character Goals Table": "Protect a secret",
          "Character Obstacles Table": "I fear failure.",
          "Radiant Purpose Table": "Protect those in need [Windrunner]",
          "Alethi Names": "Kalilen",
        };

        return {
          async draw(options) {
            assert.equal(options.displayChat, false);
            return { results: [{ text: resultByName[name] }] };
          },
        };
      },
    },
  };

  const character = await drawFirstStepCharacter({ game, cultureTable: "Alethi Names" });

  assert.deepEqual(calls, [
    "Character Goals Table",
    "Character Obstacles Table",
    "Radiant Purpose Table",
    "Alethi Names",
  ]);
  assert.deepEqual(character, {
    goal: "Protect a secret",
    obstacle: "I fear failure.",
    purpose: "Protect those in need [Windrunner]",
    cultureTable: "Alethi Names",
    name: "Kalilen",
  });
});

test("renders a chat card with generated character details", () => {
  const html = buildFirstStepChatCard({
    goal: "Protect a secret",
    obstacle: "I fear failure.",
    purpose: "Protect those in need [Windrunner]",
    cultureTable: "Alethi Names",
    name: "Kalilen",
  });

  assert.match(html, /First Step Character/);
  assert.match(html, /Kalilen/);
  assert.match(html, /Alethi Names/);
  assert.match(html, /Protect a secret/);
  assert.match(html, /I fear failure\./);
  assert.match(html, /Protect those in need \[Windrunner\]/);
});

test("escapes generated text before rendering the chat card", () => {
  const html = buildFirstStepChatCard({
    goal: "<script>alert('x')</script>",
    obstacle: "A & B",
    purpose: "\"quoted\"",
    cultureTable: "Shin Names",
    name: "Szeth <Truthless>",
  });

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
  assert.match(html, /A &amp; B/);
  assert.match(html, /&quot;quoted&quot;/);
  assert.match(html, /Szeth &lt;Truthless&gt;/);
});

test("ships a GM macro that opens the first step generator", async () => {
  const raw = await readFile("packs/_source/gm-macros/FStepCharGen0001.json", "utf8");
  const macro = JSON.parse(raw);

  assert.equal(macro._id, "FStepCharGen0001");
  assert.equal(macro._key, "!macros!FStepCharGen0001");
  assert.equal(macro.name, "First Step Character Generator");
  assert.equal(macro.type, "script");
  assert.match(macro.command, /first-step-character-generator\.js/);
  assert.match(macro.command, /openFirstStepCharacterGenerator/);
});
