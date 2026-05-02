import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  PLOT_DIE_OUTCOMES,
  buildPlotDieChatCard,
  buildPlotDieResult,
  postPlotDieResult,
} from "../scripts/plot-die-manager.js";

test("defines plot die outcome options", () => {
  assert.deepEqual(
    PLOT_DIE_OUTCOMES.map(outcome => outcome.key),
    ["auto", "opportunity", "complication", "both", "none"],
  );
});

test("builds a successful plot die result with automatic opportunity", () => {
  const result = buildPlotDieResult({
    actorName: "Kaladin",
    skillLabel: "Leadership",
    rollTotal: 18,
    targetNumber: 15,
    plotDieValue: 6,
    outcomeMode: "auto",
    opportunityText: "The guard captain becomes an ally.",
  });

  assert.deepEqual(result, {
    actorName: "Kaladin",
    skillLabel: "Leadership",
    rollTotal: 18,
    targetNumber: 15,
    successState: "success",
    successLabel: "Exito",
    plotDieValue: 6,
    plotOutcome: "opportunity",
    plotOutcomeLabel: "Opportunity",
    opportunityText: "The guard captain becomes an ally.",
    complicationText: "",
    gmNote: "",
  });
});

test("builds a failed plot die result with automatic complication", () => {
  const result = buildPlotDieResult({
    actorName: "Shallan",
    skillLabel: "Deception",
    rollTotal: 9,
    targetNumber: 14,
    plotDieValue: 1,
    outcomeMode: "auto",
    complicationText: "Someone recognizes the lie later.",
  });

  assert.equal(result.successState, "failure");
  assert.equal(result.successLabel, "Fallo");
  assert.equal(result.plotOutcome, "complication");
  assert.equal(result.plotOutcomeLabel, "Complication");
});

test("allows manual opportunity and complication override", () => {
  const result = buildPlotDieResult({
    rollTotal: "",
    targetNumber: "",
    plotDieValue: 3,
    outcomeMode: "both",
  });

  assert.equal(result.successState, "unknown");
  assert.equal(result.successLabel, "Sin dificultad");
  assert.equal(result.plotOutcome, "both");
  assert.equal(result.plotOutcomeLabel, "Opportunity + Complication");
});

test("renders a plot die chat card", () => {
  const result = buildPlotDieResult({
    actorName: "Kaladin",
    skillLabel: "Leadership",
    rollTotal: 18,
    targetNumber: 15,
    plotDieValue: 6,
    outcomeMode: "auto",
    opportunityText: "The guard captain becomes an ally.",
    gmNote: "Use this after the duel.",
  });

  const html = buildPlotDieChatCard(result);

  assert.match(html, /Gestor de Plot Die/);
  assert.match(html, /Kaladin/);
  assert.match(html, /Leadership/);
  assert.match(html, /18 vs 15/);
  assert.match(html, /Exito/);
  assert.match(html, /Opportunity/);
  assert.match(html, /The guard captain becomes an ally\./);
  assert.match(html, /Use this after the duel\./);
});

test("escapes plot die chat card text", () => {
  const result = buildPlotDieResult({
    actorName: "Sadeas <Highprince>",
    skillLabel: "<script>alert('x')</script>",
    opportunityText: "A & B",
    complicationText: "\"quoted\"",
    outcomeMode: "both",
  });

  const html = buildPlotDieChatCard(result);

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /Sadeas &lt;Highprince&gt;/);
  assert.match(html, /&lt;script&gt;alert\(&#39;x&#39;\)&lt;\/script&gt;/);
  assert.match(html, /A &amp; B/);
  assert.match(html, /&quot;quoted&quot;/);
});

test("posts a plot die result and can whisper to GMs", async () => {
  const messages = [];
  const result = await postPlotDieResult({
    input: {
      actorName: "Kaladin",
      skillLabel: "Leadership",
      outcomeMode: "opportunity",
    },
    whisperOnly: true,
    ChatMessage: {
      getSpeaker() {
        return { alias: "Plot Die" };
      },
      getWhisperRecipients(role) {
        assert.equal(role, "GM");
        return [{ id: "gm-1" }, { id: "gm-2" }];
      },
      async create(message) {
        messages.push(message);
      },
    },
  });

  assert.equal(result.plotOutcome, "opportunity");
  assert.equal(messages.length, 1);
  assert.deepEqual(messages[0].whisper, ["gm-1", "gm-2"]);
  assert.match(messages[0].content, /Gestor de Plot Die/);
});

test("ships a GM macro that opens the plot die manager", async () => {
  const raw = await readFile("packs/_source/gm-macros/PlotDieManager01.json", "utf8");
  const macro = JSON.parse(raw);

  assert.equal(macro._id, "PlotDieManager01");
  assert.equal(macro._key, "!macros!PlotDieManager01");
  assert.equal(macro.name, "Gestor de Plot Die");
  assert.equal(macro.type, "script");
  assert.match(macro.command, /plot-die-manager\.js/);
  assert.match(macro.command, /openPlotDieManager/);
});
