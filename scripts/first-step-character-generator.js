export const FIRST_STEP_TABLES = {
  goal: "Character Goals Table",
  obstacle: "Character Obstacles Table",
  purpose: "Radiant Purpose Table",
};

export const NAME_GENERATOR_TABLES = [
  "Alethi Names",
  "Azish Names",
  "Herdazian Names",
  "Reshi Names",
  "Shin Names",
  "Thaylen Names",
  "Unkalaki Names",
  "Veden Names",
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function drawTableText(game, tableName) {
  const table = game?.tables?.getName?.(tableName);
  if (!table) {
    throw new Error(`No se encontro la tabla "${tableName}".`);
  }

  const draw = await table.draw({ displayChat: false });
  const result = draw?.results?.[0];
  const text = result?.text ?? result?.description ?? "";

  if (!text) {
    throw new Error(`La tabla "${tableName}" no devolvio ningun resultado.`);
  }

  return String(text);
}

export async function drawFirstStepCharacter({ game = globalThis.game, cultureTable = "" } = {}) {
  const character = {
    goal: await drawTableText(game, FIRST_STEP_TABLES.goal),
    obstacle: await drawTableText(game, FIRST_STEP_TABLES.obstacle),
    purpose: await drawTableText(game, FIRST_STEP_TABLES.purpose),
  };

  if (cultureTable) {
    character.cultureTable = cultureTable;
    character.name = await drawTableText(game, cultureTable);
  }

  return character;
}

export function buildFirstStepChatCard(character) {
  const nameBlock = character.name
    ? `
      <div style="margin-bottom:8px;">
        <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Nombre</div>
        <div style="font-size:20px;font-family:Modesto Condensed,serif;color:#1e3a5f;">${escapeHtml(character.name)}</div>
        <div style="font-size:11px;color:#6f7f95;">${escapeHtml(character.cultureTable)}</div>
      </div>`
    : "";

  return `
    <div style="border:1px solid #9b59b6;border-radius:6px;background:#fdfaf3;padding:12px;color:#1f2933;">
      <h2 style="margin:0 0 10px;font-family:Modesto Condensed,serif;color:#6f2b91;font-size:24px;">
        First Step Character
      </h2>
      ${nameBlock}
      <div style="display:grid;gap:8px;">
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Goal</div>
          <div>${escapeHtml(character.goal)}</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Obstacle</div>
          <div>${escapeHtml(character.obstacle)}</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Radiant Purpose</div>
          <div>${escapeHtml(character.purpose)}</div>
        </div>
      </div>
    </div>
  `;
}

function buildDialogContent() {
  const cultureOptions = [
    '<option value="">Sin nombre</option>',
    ...NAME_GENERATOR_TABLES.map(tableName => `<option value="${escapeHtml(tableName)}">${escapeHtml(tableName)}</option>`),
  ].join("");

  return `
    <form>
      <div class="form-group">
        <label for="cr-first-step-culture">Cultura / nombre</label>
        <select id="cr-first-step-culture" name="cultureTable">${cultureOptions}</select>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="cr-first-step-whisper" name="whisper">
          Enviar solo al GM
        </label>
      </div>
    </form>
  `;
}

export function openFirstStepCharacterGenerator({
  game = globalThis.game,
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  ui = globalThis.ui,
} = {}) {
  if (!Dialog || !ChatMessage) {
    throw new Error("Foundry no esta disponible para abrir el generador.");
  }

  new Dialog({
    title: "First Step Character Generator",
    content: buildDialogContent(),
    buttons: {
      generate: {
        icon: '<i class="fas fa-dice-d20"></i>',
        label: "Generar",
        callback: async html => {
          try {
            const cultureTable = html.find("#cr-first-step-culture").val();
            const whisperOnly = html.find("#cr-first-step-whisper").is(":checked");
            const character = await drawFirstStepCharacter({ game, cultureTable });
            const whisper = whisperOnly
              ? ChatMessage.getWhisperRecipients("GM").map(user => user.id)
              : undefined;

            await ChatMessage.create({
              content: buildFirstStepChatCard(character),
              speaker: ChatMessage.getSpeaker(),
              whisper,
            });

            ui?.notifications?.info?.("Personaje First Step generado.");
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
    default: "generate",
  }).render(true);
}
