import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  HIGHSTORM_CALENDAR_DEFAULTS,
  HIGHSTORM_CUES,
  HIGHSTORM_SOUND,
  buildHighstormCalendarChatCard,
  buildHighstormCalendarJournalContent,
  buildHighstormChatCard,
  createHighstormCalendarJournal,
  generateHighstormCalendar,
  runHighstormCalendar,
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

test("generates a predictable highstorm calendar without variance", () => {
  const calendar = generateHighstormCalendar({
    startDay: 3,
    startHour: 14,
    intervalDays: 5,
    varianceHours: 0,
    count: 4,
  });

  assert.deepEqual(HIGHSTORM_CALENDAR_DEFAULTS, {
    startDay: 1,
    startHour: 18,
    intervalDays: 5,
    varianceHours: 8,
    count: 6,
    seed: "stormfather",
  });
  assert.deepEqual(calendar.map(storm => ({
    number: storm.number,
    day: storm.day,
    hour: storm.hour,
    label: storm.label,
  })), [
    { number: 1, day: 3, hour: 14, label: "Dia 3, 14:00" },
    { number: 2, day: 8, hour: 14, label: "Dia 8, 14:00" },
    { number: 3, day: 13, hour: 14, label: "Dia 13, 14:00" },
    { number: 4, day: 18, hour: 14, label: "Dia 18, 14:00" },
  ]);
});

test("renders highstorm calendar chat and journal content", () => {
  const calendar = generateHighstormCalendar({
    startDay: 1,
    startHour: 6,
    intervalDays: 3,
    varianceHours: 0,
    count: 2,
  });
  const chat = buildHighstormCalendarChatCard({
    calendar,
    title: "Calendario de prueba",
    note: "Plan secreto.",
  });
  const journal = buildHighstormCalendarJournalContent({
    calendar,
    title: "Calendario de prueba",
    note: "Plan secreto.",
  });

  assert.match(chat, /Highstorm Calendar/);
  assert.match(chat, /Calendario de prueba/);
  assert.match(chat, /Dia 1, 06:00/);
  assert.match(chat, /Dia 4, 06:00/);
  assert.match(chat, /Plan secreto\./);
  assert.match(journal, /<h1>Calendario de prueba<\/h1>/);
  assert.match(journal, /<td>Dia 4, 06:00<\/td>/);
});

test("escapes highstorm calendar notes before rendering", () => {
  const html = buildHighstormCalendarChatCard({
    calendar: generateHighstormCalendar({ varianceHours: 0, count: 1 }),
    note: "<script>alert('calendar')</script>",
  });

  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /&lt;script&gt;alert\(&#39;calendar&#39;\)&lt;\/script&gt;/);
});

test("creates a journal entry for a highstorm calendar", async () => {
  const created = [];
  const journal = await createHighstormCalendarJournal({
    calendar: generateHighstormCalendar({ varianceHours: 0, count: 1 }),
    title: "Calendario de altas tormentas",
    JournalEntry: {
      async create(data) {
        created.push(data);
        return { id: "journal-id", ...data };
      },
    },
  });

  assert.equal(journal.id, "journal-id");
  assert.equal(created[0].name, "Calendario de altas tormentas");
  assert.equal(created[0].pages[0].name, "Calendario");
  assert.equal(created[0].pages[0].type, "text");
  assert.match(created[0].pages[0].text.content, /Dia 1, 18:00/);
});

test("runs calendar generation with chat and journal output", async () => {
  const messages = [];
  const journals = [];
  const result = await runHighstormCalendar({
    startDay: 2,
    startHour: 8,
    intervalDays: 4,
    varianceHours: 0,
    count: 2,
    title: "Calendario de campaña",
    publishChat: true,
    createJournal: true,
    ChatMessage: {
      getSpeaker() {
        return { alias: "GM" };
      },
      async create(data) {
        messages.push(data);
        return data;
      },
    },
    JournalEntry: {
      async create(data) {
        journals.push(data);
        return data;
      },
    },
  });

  assert.equal(result.calendar.length, 2);
  assert.equal(messages.length, 1);
  assert.equal(journals.length, 1);
  assert.match(messages[0].content, /Dia 6, 08:00/);
  assert.match(journals[0].pages[0].text.content, /Dia 6, 08:00/);
});

test("ships a GM macro that opens the highstorm toolkit", async () => {
  const raw = await readFile("packs/_source/gm-macros/HighstormTool01.json", "utf8");
  const macro = JSON.parse(raw);

  assert.equal(macro._id, "HighstormTool01");
  assert.equal(macro._key, "!macros!HighstormTool01");
  assert.equal(macro.name, "Highstorm Toolkit");
  assert.equal(macro.type, "script");
  assert.equal(macro.img, "icons/svg/lightning.svg");
  assert.match(macro.command, /highstorm-toolkit\.js/);
  assert.match(macro.command, /openHighstormToolkit/);
});
