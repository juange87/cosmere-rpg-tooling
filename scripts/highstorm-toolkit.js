export const HIGHSTORM_SOUND = "modules/cosmere-rpg-tooling/sounds/thunder.mp3";

export const HIGHSTORM_CALENDAR_DEFAULTS = {
  startDay: 1,
  startHour: 18,
  intervalDays: 5,
  varianceHours: 8,
  count: 6,
  seed: "stormfather",
};

export const HIGHSTORM_CUES = {
  approach: {
    label: "Se acerca",
    title: "La tormenta alta se acerca",
    body: "El viento cambia de direccion y el horizonte empieza a oscurecerse.",
  },
  arrival: {
    label: "Golpea",
    title: "La tormenta alta golpea",
    body: "La lluvia cae como una muralla y cada trueno hace vibrar la piedra.",
  },
  eye: {
    label: "Ojo de la tormenta",
    title: "El ojo de la tormenta",
    body: "Por un momento imposible, el mundo se queda suspendido y casi en silencio.",
  },
  passing: {
    label: "Se aleja",
    title: "La tormenta alta se aleja",
    body: "La furia se rompe en lluvia dispersa y el aire queda cargado de luz.",
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getCue(cueKey) {
  return HIGHSTORM_CUES[cueKey] ?? HIGHSTORM_CUES.approach;
}

function normalizeMinutes(minutes) {
  const numeric = Number.parseInt(minutes, 10);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : 0;
}

function normalizeInteger(value, fallback, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const numeric = Number.parseInt(value, 10);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(Math.max(numeric, min), max);
}

function seedToState(seed) {
  let state = 2166136261;
  for (const char of String(seed ?? HIGHSTORM_CALENDAR_DEFAULTS.seed)) {
    state ^= char.charCodeAt(0);
    state = Math.imul(state, 16777619);
  }
  return state >>> 0;
}

function createSeededRandom(seed) {
  let state = seedToState(seed);
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

function formatStormLabel(totalHours) {
  const day = Math.floor(totalHours / 24) + 1;
  const hour = ((totalHours % 24) + 24) % 24;
  return {
    day,
    hour,
    label: `Dia ${day}, ${String(hour).padStart(2, "0")}:00`,
  };
}

export function generateHighstormCalendar(options = {}) {
  const startDay = normalizeInteger(options.startDay, HIGHSTORM_CALENDAR_DEFAULTS.startDay, { min: 1 });
  const startHour = normalizeInteger(options.startHour, HIGHSTORM_CALENDAR_DEFAULTS.startHour, { min: 0, max: 23 });
  const intervalDays = normalizeInteger(options.intervalDays, HIGHSTORM_CALENDAR_DEFAULTS.intervalDays, { min: 1 });
  const varianceHours = normalizeInteger(options.varianceHours, HIGHSTORM_CALENDAR_DEFAULTS.varianceHours, { min: 0, max: 48 });
  const count = normalizeInteger(options.count, HIGHSTORM_CALENDAR_DEFAULTS.count, { min: 1, max: 30 });
  const random = createSeededRandom(options.seed ?? HIGHSTORM_CALENDAR_DEFAULTS.seed);
  const intensities = ["suave", "moderada", "intensa", "devastadora"];
  const startTotalHours = ((startDay - 1) * 24) + startHour;

  return Array.from({ length: count }, (_, index) => {
    const jitter = varianceHours && index > 0
      ? Math.round(((random() * 2) - 1) * varianceHours)
      : 0;
    const totalHours = startTotalHours + (index * intervalDays * 24) + jitter;
    const formatted = formatStormLabel(totalHours);
    const intensity = intensities[Math.min(Math.floor(random() * intensities.length), intensities.length - 1)];

    return {
      number: index + 1,
      totalHours,
      day: formatted.day,
      hour: formatted.hour,
      label: formatted.label,
      intensity,
    };
  });
}

export function buildHighstormChatCard({ cueKey = "approach", minutes = 0, note = "" } = {}) {
  const cue = getCue(cueKey);
  const countdown = normalizeMinutes(minutes);
  const countdownBlock = countdown
    ? `
      <div style="margin-top:8px;padding:7px 9px;border-left:3px solid #4a90e2;background:rgba(74,144,226,0.08);">
        <strong>${countdown} minutos</strong> hasta el siguiente cambio de la tormenta.
      </div>`
    : "";
  const noteBlock = note
    ? `
      <div style="margin-top:8px;">
        <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Nota del GM</div>
        <div>${escapeHtml(note)}</div>
      </div>`
    : "";

  return `
    <div style="border:1px solid #4a90e2;border-radius:6px;background:#f5f9fc;padding:12px;color:#1f2933;">
      <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.06em;">Highstorm Toolkit</div>
      <h2 style="margin:2px 0 8px;font-family:Modesto Condensed,serif;color:#1e3a5f;font-size:24px;">
        ${escapeHtml(cue.title)}
      </h2>
      <div>${escapeHtml(cue.body)}</div>
      ${countdownBlock}
      ${noteBlock}
    </div>
  `;
}

function buildCalendarRows(calendar) {
  return calendar.map(storm => `
    <tr>
      <td style="padding:4px 6px;text-align:right;">${storm.number}</td>
      <td style="padding:4px 6px;">${escapeHtml(storm.label)}</td>
      <td style="padding:4px 6px;">${escapeHtml(storm.intensity)}</td>
    </tr>
  `).join("");
}

export function buildHighstormCalendarChatCard({
  calendar,
  title = "Calendario de altas tormentas",
  note = "",
} = {}) {
  const schedule = Array.isArray(calendar) && calendar.length ? calendar : generateHighstormCalendar();
  const noteBlock = note
    ? `
      <div style="margin-top:8px;">
        <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Nota del GM</div>
        <div>${escapeHtml(note)}</div>
      </div>`
    : "";

  return `
    <div style="border:1px solid #4a90e2;border-radius:6px;background:#f5f9fc;padding:12px;color:#1f2933;">
      <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.06em;">Highstorm Calendar</div>
      <h2 style="margin:2px 0 8px;font-family:Modesto Condensed,serif;color:#1e3a5f;font-size:24px;">
        ${escapeHtml(title)}
      </h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr>
            <th style="padding:4px 6px;text-align:right;">#</th>
            <th style="padding:4px 6px;text-align:left;">Llegada</th>
            <th style="padding:4px 6px;text-align:left;">Intensidad</th>
          </tr>
        </thead>
        <tbody>${buildCalendarRows(schedule)}</tbody>
      </table>
      ${noteBlock}
    </div>
  `;
}

export function buildHighstormCalendarJournalContent({
  calendar,
  title = "Calendario de altas tormentas",
  note = "",
} = {}) {
  const schedule = Array.isArray(calendar) && calendar.length ? calendar : generateHighstormCalendar();
  const noteBlock = note ? `<p><strong>Nota del GM:</strong> ${escapeHtml(note)}</p>` : "";

  return `
    <h1>${escapeHtml(title)}</h1>
    <p>Calendario generado por Highstorm Toolkit.</p>
    ${noteBlock}
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Llegada</th>
          <th>Intensidad</th>
        </tr>
      </thead>
      <tbody>
        ${schedule.map(storm => `
          <tr>
            <td>${storm.number}</td>
            <td>${escapeHtml(storm.label)}</td>
            <td>${escapeHtml(storm.intensity)}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  `;
}

export async function runHighstormCue({
  cueKey = "approach",
  minutes = 0,
  note = "",
  playSound = true,
  whisperOnly = false,
  AudioHelper = globalThis.AudioHelper,
  ChatMessage = globalThis.ChatMessage,
  ui = globalThis.ui,
} = {}) {
  if (!ChatMessage) {
    throw new Error("Foundry no esta disponible para publicar la tormenta.");
  }

  const cue = getCue(cueKey);

  if (playSound && AudioHelper?.play) {
    AudioHelper.play({ src: HIGHSTORM_SOUND, volume: 1, loop: false }, true);
  }

  const whisper = whisperOnly
    ? ChatMessage.getWhisperRecipients("GM").map(user => user.id)
    : undefined;

  const message = await ChatMessage.create({
    content: buildHighstormChatCard({ cueKey, minutes, note }),
    speaker: ChatMessage.getSpeaker(),
    whisper,
  });

  ui?.notifications?.info?.(cue.title);

  return { cue, message };
}

export async function createHighstormCalendarJournal({
  calendar,
  title = "Calendario de altas tormentas",
  note = "",
  JournalEntry = globalThis.JournalEntry,
} = {}) {
  if (!JournalEntry) {
    throw new Error("Foundry no esta disponible para crear el Journal.");
  }

  return JournalEntry.create({
    name: title,
    pages: [{
      name: "Calendario",
      type: "text",
      text: {
        format: 1,
        content: buildHighstormCalendarJournalContent({ calendar, title, note }),
      },
    }],
  });
}

export async function runHighstormCalendar({
  startDay = HIGHSTORM_CALENDAR_DEFAULTS.startDay,
  startHour = HIGHSTORM_CALENDAR_DEFAULTS.startHour,
  intervalDays = HIGHSTORM_CALENDAR_DEFAULTS.intervalDays,
  varianceHours = HIGHSTORM_CALENDAR_DEFAULTS.varianceHours,
  count = HIGHSTORM_CALENDAR_DEFAULTS.count,
  seed = HIGHSTORM_CALENDAR_DEFAULTS.seed,
  title = "Calendario de altas tormentas",
  note = "",
  publishChat = true,
  createJournal = false,
  whisperOnly = false,
  ChatMessage = globalThis.ChatMessage,
  JournalEntry = globalThis.JournalEntry,
  ui = globalThis.ui,
} = {}) {
  const calendar = generateHighstormCalendar({ startDay, startHour, intervalDays, varianceHours, count, seed });
  let message = null;
  let journal = null;

  if (publishChat) {
    if (!ChatMessage) {
      throw new Error("Foundry no esta disponible para publicar el calendario.");
    }
    const whisper = whisperOnly
      ? ChatMessage.getWhisperRecipients("GM").map(user => user.id)
      : undefined;
    message = await ChatMessage.create({
      content: buildHighstormCalendarChatCard({ calendar, title, note }),
      speaker: ChatMessage.getSpeaker(),
      whisper,
    });
  }

  if (createJournal) {
    journal = await createHighstormCalendarJournal({ calendar, title, note, JournalEntry });
  }

  ui?.notifications?.info?.("Calendario de altas tormentas generado.");

  return { calendar, message, journal };
}

function buildDialogContent() {
  const cueOptions = Object.entries(HIGHSTORM_CUES)
    .map(([key, cue]) => `<option value="${escapeHtml(key)}">${escapeHtml(cue.label)}</option>`)
    .join("");

  return `
    <form>
      <h3>Momento de tormenta</h3>
      <div class="form-group">
        <label for="cr-highstorm-cue">Momento</label>
        <select id="cr-highstorm-cue" name="cueKey">${cueOptions}</select>
      </div>
      <div class="form-group">
        <label for="cr-highstorm-minutes">Cuenta atras</label>
        <input id="cr-highstorm-minutes" name="minutes" type="number" value="10" min="0" step="1">
        <p class="notes">Minutos hasta el siguiente cambio. Usa 0 para ocultarlo.</p>
      </div>
      <div class="form-group">
        <label for="cr-highstorm-note">Nota del GM</label>
        <textarea id="cr-highstorm-note" name="note" rows="3" style="resize:vertical;"></textarea>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="cr-highstorm-sound" name="playSound" checked>
          Reproducir trueno
        </label>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="cr-highstorm-whisper" name="whisper">
          Enviar solo al GM
        </label>
      </div>
      <hr>
      <h3>Calendario de altas tormentas</h3>
      <div class="form-group">
        <label for="cr-highstorm-calendar-title">Titulo</label>
        <input id="cr-highstorm-calendar-title" name="calendarTitle" type="text" value="Calendario de altas tormentas">
      </div>
      <div class="form-group">
        <label for="cr-highstorm-start-day">Dia inicial</label>
        <input id="cr-highstorm-start-day" name="startDay" type="number" value="${HIGHSTORM_CALENDAR_DEFAULTS.startDay}" min="1" step="1">
      </div>
      <div class="form-group">
        <label for="cr-highstorm-start-hour">Hora inicial</label>
        <input id="cr-highstorm-start-hour" name="startHour" type="number" value="${HIGHSTORM_CALENDAR_DEFAULTS.startHour}" min="0" max="23" step="1">
      </div>
      <div class="form-group">
        <label for="cr-highstorm-interval-days">Intervalo medio en dias</label>
        <input id="cr-highstorm-interval-days" name="intervalDays" type="number" value="${HIGHSTORM_CALENDAR_DEFAULTS.intervalDays}" min="1" step="1">
      </div>
      <div class="form-group">
        <label for="cr-highstorm-variance-hours">Variacion maxima en horas</label>
        <input id="cr-highstorm-variance-hours" name="varianceHours" type="number" value="${HIGHSTORM_CALENDAR_DEFAULTS.varianceHours}" min="0" max="48" step="1">
      </div>
      <div class="form-group">
        <label for="cr-highstorm-calendar-count">Numero de tormentas</label>
        <input id="cr-highstorm-calendar-count" name="count" type="number" value="${HIGHSTORM_CALENDAR_DEFAULTS.count}" min="1" max="30" step="1">
      </div>
      <div class="form-group">
        <label for="cr-highstorm-calendar-seed">Semilla</label>
        <input id="cr-highstorm-calendar-seed" name="seed" type="text" value="${HIGHSTORM_CALENDAR_DEFAULTS.seed}">
        <p class="notes">Usa la misma semilla para repetir el mismo calendario.</p>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="cr-highstorm-calendar-chat" name="publishChat" checked>
          Publicar calendario en chat
        </label>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="cr-highstorm-calendar-journal" name="createJournal" checked>
          Crear Journal Entry
        </label>
      </div>
    </form>
  `;
}

export function openHighstormToolkit({
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  AudioHelper = globalThis.AudioHelper,
  JournalEntry = globalThis.JournalEntry,
  ui = globalThis.ui,
} = {}) {
  if (!Dialog || !ChatMessage) {
    throw new Error("Foundry no esta disponible para abrir Highstorm Toolkit.");
  }

  new Dialog({
    title: "Highstorm Toolkit",
    content: buildDialogContent(),
    buttons: {
      announce: {
        icon: '<i class="fas fa-bolt"></i>',
        label: "Anunciar",
        callback: async html => {
          try {
            await runHighstormCue({
              cueKey: html.find("#cr-highstorm-cue").val(),
              minutes: html.find("#cr-highstorm-minutes").val(),
              note: html.find("#cr-highstorm-note").val(),
              playSound: html.find("#cr-highstorm-sound").is(":checked"),
              whisperOnly: html.find("#cr-highstorm-whisper").is(":checked"),
              AudioHelper,
              ChatMessage,
              ui,
            });
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      calendar: {
        icon: '<i class="fas fa-calendar"></i>',
        label: "Generar calendario",
        callback: async html => {
          try {
            await runHighstormCalendar({
              startDay: html.find("#cr-highstorm-start-day").val(),
              startHour: html.find("#cr-highstorm-start-hour").val(),
              intervalDays: html.find("#cr-highstorm-interval-days").val(),
              varianceHours: html.find("#cr-highstorm-variance-hours").val(),
              count: html.find("#cr-highstorm-calendar-count").val(),
              seed: html.find("#cr-highstorm-calendar-seed").val(),
              title: html.find("#cr-highstorm-calendar-title").val(),
              note: html.find("#cr-highstorm-note").val(),
              publishChat: html.find("#cr-highstorm-calendar-chat").is(":checked"),
              createJournal: html.find("#cr-highstorm-calendar-journal").is(":checked"),
              whisperOnly: html.find("#cr-highstorm-whisper").is(":checked"),
              ChatMessage,
              JournalEntry,
              ui,
            });
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancelar",
      },
    },
    default: "announce",
  }).render(true);
}
