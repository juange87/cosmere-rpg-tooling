import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  ROSHAR_NPC_CULTURE_TABLES,
  buildRosharNpcChatCard,
  generateRosharNpc,
} from "../scripts/roshar-npc-generator.js";

test("defines the available Roshar name tables", () => {
  assert.deepEqual(ROSHAR_NPC_CULTURE_TABLES, [
    "Alethi Names",
    "Azish Names",
    "Herdazian Names",
    "Reshi Names",
    "Shin Names",
    "Thaylen Names",
    "Unkalaki Names",
    "Veden Names",
  ]);
});

test("generates a Roshar NPC from a selected culture table", async () => {
  const calls = [];
  const game = {
    tables: {
      getName(name) {
        calls.push(name);
        return {
          async draw(options) {
            assert.equal(options.displayChat, false);
            return { results: [{ text: "Navaniar" }] };
          },
        };
      },
    },
  };

  const npc = await generateRosharNpc({
    game,
    cultureTable: "Alethi Names",
    random: () => 0,
  });

  assert.deepEqual(calls, ["Alethi Names"]);
  assert.deepEqual(npc, {
    name: "Navaniar",
    cultureTable: "Alethi Names",
    culture: "Alethi",
    attitude: "Desea ayudar, pero no quiere parecer demasiado disponible.",
    problem: "Debe entregar un mensaje antes de que cambie la guardia.",
    secret: "Sirve en secreto a una casa rival.",
    resource: "Puede conseguir una audiencia breve con alguien importante.",
    hook: "Ha visto un spren comportarse de una forma que no encaja con lo conocido.",
  });
});

test("chooses a culture table when none is provided", async () => {
  const calls = [];
  const game = {
    tables: {
      getName(name) {
        calls.push(name);
        return {
          async draw() {
            return { results: [{ text: "Tvlakv" }] };
          },
        };
      },
    },
  };

  const randomValues = [0.99, 0, 0, 0, 0, 0];
  const npc = await generateRosharNpc({
    game,
    random: () => randomValues.shift() ?? 0,
  });

  assert.equal(npc.cultureTable, "Veden Names");
  assert.equal(npc.culture, "Veden");
  assert.deepEqual(calls, ["Veden Names"]);
});

test("renders a chat card with generated NPC details", () => {
  const html = buildRosharNpcChatCard({
    name: "Navaniar",
    culture: "Alethi",
    cultureTable: "Alethi Names",
    attitude: "Desea ayudar.",
    problem: "Tiene prisa.",
    secret: "Oculta un spanreed.",
    resource: "Conoce una ruta segura.",
    hook: "Un spren le sigue.",
  });

  assert.match(html, /PNJ de Roshar/);
  assert.match(html, /Navaniar/);
  assert.match(html, /Alethi/);
  assert.match(html, /Desea ayudar\./);
  assert.match(html, /Tiene prisa\./);
  assert.match(html, /Oculta un spanreed\./);
  assert.match(html, /Conoce una ruta segura\./);
  assert.match(html, /Un spren le sigue\./);
});

test("escapes generated NPC text before rendering the chat card", () => {
  const html = buildRosharNpcChatCard({
    name: "Ialai <Sadeas>",
    culture: "Alethi",
    cultureTable: "Alethi Names",
    attitude: "<script>alert('x')</script>",
    problem: "A & B",
    secret: "\"quoted\"",
    resource: "safe",
    hook: "safe",
  });

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Ialai &lt;Sadeas&gt;/);
  assert.match(html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
  assert.match(html, /A &amp; B/);
  assert.match(html, /&quot;quoted&quot;/);
});

test("ships a GM macro that opens the Roshar NPC generator", async () => {
  const raw = await readFile("packs/_source/gm-macros/RosharNPCGen0001.json", "utf8");
  const macro = JSON.parse(raw);

  assert.equal(macro._id, "RosharNPCGen0001");
  assert.equal(macro._key, "!macros!RosharNPCGen0001");
  assert.equal(macro.name, "Generador de PNJ Roshar");
  assert.equal(macro.type, "script");
  assert.match(macro.command, /roshar-npc-generator\.js/);
  assert.match(macro.command, /openRosharNpcGenerator/);
});
