export const HIGHSTORM_SOUND = "modules/cosmere-rpg-tooling/sounds/thunder.mp3";

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

function buildDialogContent() {
  const cueOptions = Object.entries(HIGHSTORM_CUES)
    .map(([key, cue]) => `<option value="${escapeHtml(key)}">${escapeHtml(cue.label)}</option>`)
    .join("");

  return `
    <form>
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
    </form>
  `;
}

export function openHighstormToolkit({
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  AudioHelper = globalThis.AudioHelper,
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
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancelar",
      },
    },
    default: "announce",
  }).render(true);
}
