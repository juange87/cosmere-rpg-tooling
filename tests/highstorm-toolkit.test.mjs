import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  HIGHSTORM_CUES,
  HIGHSTORM_SOUND,
  buildHighstormChatCard,
  runHighstormCue,
} from "../scripts/highstorm-toolkit.js";

test("defines the highstorm cues and bundled thunder sound", () => {
  assert.equal(HIGHSTORM_SOUND, "modules/cosmere-rpg-tooling/sounds/thunder.mp3");
  assert.deepEqual(Object.keys(HIGHSTORM_CUES), ["approach", "arrival", "eye", "passing"]);
  assert.equal(HIGHSTORM_CUES.arrival.title, "La tormenta alta golpea");
});

test("renders a highstorm chat card with optional countdown and note", () => {
  const html = buildHighstormChatCard({
    cueKey: "approach",
    minutes: 10,
    note: "Cubrid las gemas.",
  });

  assert.match(html, /Highstorm Toolkit/);
  assert.match(html, /La tormenta alta se acerca/);
  assert.match(html, /10 minutos/);
  assert.match(html, /Cubrid las gemas\./);
});

test("escapes custom highstorm notes before rendering", () => {
  const html = buildHighstormChatCard({
    cueKey: "passing",
    note: "<script>alert('storm')</script>",
  });

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(&#39;storm&#39;\)&lt;\/script&gt;/);
});

test("runs a highstorm cue by posting chat and playing thunder", async () => {
  const played = [];
  const messages = [];
  const result = await runHighstormCue({
    cueKey: "arrival",
    minutes: 0,
    note: "Las ventanas tiemblan.",
    AudioHelper: {
      play(sound, broadcast) {
        played.push({ sound, broadcast });
      },
    },
    ChatMessage: {
      getSpeaker() {
        return { alias: "GM" };
      },
      async create(data) {
        messages.push(data);
        return data;
      },
    },
  });

  assert.equal(result.cue.title, "La tormenta alta golpea");
  assert.equal(played.length, 1);
  assert.deepEqual(played[0], {
    sound: { src: HIGHSTORM_SOUND, volume: 1, loop: false },
    broadcast: true,
  });
  assert.equal(messages.length, 1);
  assert.match(messages[0].content, /Las ventanas tiemblan\./);
  assert.deepEqual(messages[0].speaker, { alias: "GM" });
});

test("can whisper to GMs and skip sound playback", async () => {
  const played = [];
  const messages = [];
  await runHighstormCue({
    cueKey: "eye",
    playSound: false,
    whisperOnly: true,
    AudioHelper: {
      play(sound, broadcast) {
        played.push({ sound, broadcast });
      },
    },
    ChatMessage: {
      getSpeaker() {
        return { alias: "GM" };
      },
      getWhisperRecipients(role) {
        assert.equal(role, "GM");
        return [{ id: "gm-user" }];
      },
      async create(data) {
        messages.push(data);
        return data;
      },
    },
  });

  assert.equal(played.length, 0);
  assert.deepEqual(messages[0].whisper, ["gm-user"]);
});

test("ships a GM macro that opens the highstorm toolkit", async () => {
  const raw = await readFile("packs/_source/gm-macros/HighstormTool01.json", "utf8");
  const macro = JSON.parse(raw);

  assert.equal(macro._id, "HighstormTool01");
  assert.equal(macro._key, "!macros!HighstormTool01");
  assert.equal(macro.name, "Highstorm Toolkit");
  assert.equal(macro.type, "script");
  assert.match(macro.command, /highstorm-toolkit\.js/);
  assert.match(macro.command, /openHighstormToolkit/);
});
