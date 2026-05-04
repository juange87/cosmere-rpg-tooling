import { hasCosmereDialogSupport, openCosmereDialog } from "./foundry-dialogs.js";

export const PLOT_DIE_OUTCOMES = [
  { key: "auto", label: "Automatico por valor" },
  { key: "opportunity", label: "Opportunity" },
  { key: "complication", label: "Complication" },
  { key: "both", label: "Opportunity + Complication" },
  { key: "none", label: "Sin efecto narrativo" },
];

const PLOT_OUTCOME_LABELS = {
  opportunity: "Opportunity",
  complication: "Complication",
  both: "Opportunity + Complication",
  none: "Sin efecto narrativo",
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function normalizeNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function normalizeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function resolveSuccessState(rollTotal, targetNumber) {
  if (rollTotal === null || targetNumber === null) {
    return { successState: "unknown", successLabel: "Sin dificultad" };
  }

  return rollTotal >= targetNumber
    ? { successState: "success", successLabel: "Exito" }
    : { successState: "failure", successLabel: "Fallo" };
}

function resolvePlotOutcome(plotDieValue, outcomeMode) {
  if (outcomeMode && outcomeMode !== "auto") {
    return outcomeMode in PLOT_OUTCOME_LABELS ? outcomeMode : "none";
  }

  if (plotDieValue === 6) return "opportunity";
  if (plotDieValue === 1) return "complication";
  return "none";
}

export function buildPlotDieResult({
  actorName = "",
  skillLabel = "",
  rollTotal = "",
  targetNumber = "",
  plotDieValue = "",
  outcomeMode = "auto",
  opportunityText = "",
  complicationText = "",
  gmNote = "",
} = {}) {
  const normalizedRollTotal = normalizeNumber(rollTotal);
  const normalizedTargetNumber = normalizeNumber(targetNumber);
  const normalizedPlotDie = normalizeNumber(plotDieValue);
  const plotOutcome = resolvePlotOutcome(normalizedPlotDie, outcomeMode);
  const success = resolveSuccessState(normalizedRollTotal, normalizedTargetNumber);

  return {
    actorName: normalizeText(actorName, "Sin actor"),
    skillLabel: normalizeText(skillLabel, "Tirada con Plot Die"),
    rollTotal: normalizedRollTotal,
    targetNumber: normalizedTargetNumber,
    ...success,
    plotDieValue: normalizedPlotDie,
    plotOutcome,
    plotOutcomeLabel: PLOT_OUTCOME_LABELS[plotOutcome],
    opportunityText: normalizeText(opportunityText),
    complicationText: normalizeText(complicationText),
    gmNote: normalizeText(gmNote),
  };
}

function buildOutcomeBlock(result) {
  const blocks = [];

  if (result.plotOutcome === "opportunity" || result.plotOutcome === "both") {
    blocks.push(`
      <div style="padding:7px 9px;border-left:3px solid #237a3b;background:rgba(35,122,59,0.08);">
        <div style="font-size:11px;text-transform:uppercase;color:#237a3b;letter-spacing:0.04em;">Opportunity</div>
        <div>${escapeHtml(result.opportunityText || "El GM puede introducir una ventaja, pista o apertura narrativa.")}</div>
      </div>
    `);
  }

  if (result.plotOutcome === "complication" || result.plotOutcome === "both") {
    blocks.push(`
      <div style="padding:7px 9px;border-left:3px solid #9f3a38;background:rgba(159,58,56,0.08);">
        <div style="font-size:11px;text-transform:uppercase;color:#9f3a38;letter-spacing:0.04em;">Complication</div>
        <div>${escapeHtml(result.complicationText || "El GM puede introducir un coste, peligro o consecuencia adicional.")}</div>
      </div>
    `);
  }

  if (!blocks.length) {
    blocks.push(`
      <div style="padding:7px 9px;border-left:3px solid #6f7f95;background:rgba(111,127,149,0.08);">
        <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Plot Die</div>
        <div>Sin Opportunity ni Complication registradas.</div>
      </div>
    `);
  }

  return blocks.join("");
}

export function buildPlotDieChatCard(result) {
  const rollText = result.rollTotal === null || result.targetNumber === null
    ? "Sin dificultad registrada"
    : `${result.rollTotal} vs ${result.targetNumber}`;
  const plotDieText = result.plotDieValue === null
    ? "No registrado"
    : String(result.plotDieValue);
  const noteBlock = result.gmNote
    ? `
      <div style="margin-top:8px;">
        <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Nota del GM</div>
        <div>${escapeHtml(result.gmNote)}</div>
      </div>`
    : "";

  return `
    <div style="border:1px solid #6f2b91;border-radius:6px;background:#fbf8fc;padding:12px;color:#1f2933;">
      <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.06em;">Gestor de Plot Die</div>
      <h2 style="margin:2px 0 8px;font-family:Modesto Condensed,serif;color:#6f2b91;font-size:24px;">
        ${escapeHtml(result.skillLabel)}
      </h2>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px;">
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Actor</div>
          <div>${escapeHtml(result.actorName)}</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Tirada</div>
          <div>${escapeHtml(rollText)} - ${escapeHtml(result.successLabel)}</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Plot Die</div>
          <div>${escapeHtml(plotDieText)} - ${escapeHtml(result.plotOutcomeLabel)}</div>
        </div>
      </div>
      <div style="display:grid;gap:8px;">
        ${buildOutcomeBlock(result)}
      </div>
      ${noteBlock}
    </div>
  `;
}

export async function postPlotDieResult({
  input = {},
  whisperOnly = false,
  ChatMessage = globalThis.ChatMessage,
} = {}) {
  if (!ChatMessage) {
    throw new Error("Foundry no esta disponible para publicar el resultado de Plot Die.");
  }

  const result = buildPlotDieResult(input);
  const whisper = whisperOnly
    ? ChatMessage.getWhisperRecipients("GM").map(user => user.id)
    : undefined;

  await ChatMessage.create({
    content: buildPlotDieChatCard(result),
    speaker: ChatMessage.getSpeaker?.(),
    whisper,
  });

  return result;
}

function buildOutcomeOptions() {
  return PLOT_DIE_OUTCOMES.map(outcome => (
    `<option value="${escapeHtml(outcome.key)}">${escapeHtml(outcome.label)}</option>`
  )).join("");
}

function buildDialogContent() {
  return `
    <form>
      <div class="form-group">
        <label for="cr-plot-actor">Actor o foco</label>
        <input id="cr-plot-actor" name="actorName" type="text" placeholder="Kaladin, patrulla, PNJ..." />
      </div>
      <div class="form-group">
        <label for="cr-plot-skill">Tirada</label>
        <input id="cr-plot-skill" name="skillLabel" type="text" placeholder="Leadership, Deception, ataque..." />
      </div>
      <div class="form-group">
        <label for="cr-plot-total">Total</label>
        <input id="cr-plot-total" name="rollTotal" type="number" />
      </div>
      <div class="form-group">
        <label for="cr-plot-dc">Dificultad</label>
        <input id="cr-plot-dc" name="targetNumber" type="number" />
      </div>
      <div class="form-group">
        <label for="cr-plot-die">Plot Die</label>
        <input id="cr-plot-die" name="plotDieValue" type="number" min="1" max="6" />
      </div>
      <div class="form-group">
        <label for="cr-plot-outcome">Resultado narrativo</label>
        <select id="cr-plot-outcome" name="outcomeMode">${buildOutcomeOptions()}</select>
      </div>
      <div class="form-group">
        <label for="cr-plot-opportunity">Opportunity</label>
        <textarea id="cr-plot-opportunity" name="opportunityText" rows="2"></textarea>
      </div>
      <div class="form-group">
        <label for="cr-plot-complication">Complication</label>
        <textarea id="cr-plot-complication" name="complicationText" rows="2"></textarea>
      </div>
      <div class="form-group">
        <label for="cr-plot-note">Nota del GM</label>
        <textarea id="cr-plot-note" name="gmNote" rows="2"></textarea>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="cr-plot-whisper" name="whisper">
          Enviar solo al GM
        </label>
      </div>
    </form>
  `;
}

export function openPlotDieManager({
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  ui = globalThis.ui,
} = {}) {
  if (!hasCosmereDialogSupport({ Dialog }) || !ChatMessage) {
    throw new Error("Foundry no esta disponible para abrir el gestor de Plot Die.");
  }

  openCosmereDialog({
    title: "Gestor de Plot Die",
    content: buildDialogContent(),
    buttons: {
      publish: {
        icon: '<i class="fas fa-dice-d6"></i>',
        label: "Publicar",
        callback: async html => {
          try {
            await postPlotDieResult({
              input: {
                actorName: html.find("#cr-plot-actor").val(),
                skillLabel: html.find("#cr-plot-skill").val(),
                rollTotal: html.find("#cr-plot-total").val(),
                targetNumber: html.find("#cr-plot-dc").val(),
                plotDieValue: html.find("#cr-plot-die").val(),
                outcomeMode: html.find("#cr-plot-outcome").val(),
                opportunityText: html.find("#cr-plot-opportunity").val(),
                complicationText: html.find("#cr-plot-complication").val(),
                gmNote: html.find("#cr-plot-note").val(),
              },
              whisperOnly: html.find("#cr-plot-whisper").is(":checked"),
              ChatMessage,
            });
            ui?.notifications?.info?.("Resultado de Plot Die publicado.");
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
    default: "publish",
  }, { Dialog });
}
