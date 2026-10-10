import { localize } from "./localization.js";
import { hasCosmereDialogSupport, openCosmereDialog } from "./foundry-dialogs.js";

export const PLOT_DIE_OUTCOMES = [
  { key: "auto", get label() { return localize("AutomaticByValue"); } },
  { key: "opportunity", get label() { return localize("Opportunity"); } },
  { key: "complication", get label() { return localize("Complication"); } },
  { key: "both", get label() { return localize("OpportunityAndComplication"); } },
  { key: "none", get label() { return localize("NoNarrativeEffect"); } },
];

const PLOT_OUTCOME_LABELS = {
  get opportunity() { return localize("Opportunity"); },
  get complication() { return localize("Complication"); },
  get both() { return localize("OpportunityAndComplication"); },
  get none() { return localize("NoNarrativeEffect"); },
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
    return { successState: "unknown", successLabel: localize("NoDifficulty") };
  }

  return rollTotal >= targetNumber
    ? { successState: "success", successLabel: localize("Success") }
    : { successState: "failure", successLabel: localize("Failure") };
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
    actorName: normalizeText(actorName, localize("NoActor")),
    skillLabel: normalizeText(skillLabel, localize("RollWithPlotDie")),
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
        <div>${escapeHtml(result.opportunityText || localize("TheGMCanIntroduceAnAdvantageClueOrNarrativeOpening"))}</div>
      </div>
    `);
  }

  if (result.plotOutcome === "complication" || result.plotOutcome === "both") {
    blocks.push(`
      <div style="padding:7px 9px;border-left:3px solid #9f3a38;background:rgba(159,58,56,0.08);">
        <div style="font-size:11px;text-transform:uppercase;color:#9f3a38;letter-spacing:0.04em;">Complication</div>
        <div>${escapeHtml(result.complicationText || localize("TheGMCanIntroduceAnAdditionalCostDangerOrConsequence"))}</div>
      </div>
    `);
  }

  if (!blocks.length) {
    blocks.push(`
      <div style="padding:7px 9px;border-left:3px solid #6f7f95;background:rgba(111,127,149,0.08);">
        <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Plot Die</div>
        <div>${localize("NoOpportunityOrComplicationRecorded")}</div>
      </div>
    `);
  }

  return blocks.join("");
}

export function buildPlotDieChatCard(result) {
  const rollText = result.rollTotal === null || result.targetNumber === null
    ? localize("NoDifficultyRecorded")
    : `${result.rollTotal} vs ${result.targetNumber}`;
  const plotDieText = result.plotDieValue === null
    ? localize("NotRecorded")
    : String(result.plotDieValue);
  const noteBlock = result.gmNote
    ? `
      <div style="margin-top:8px;">
        <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">${localize("GMNote")}</div>
        <div>${escapeHtml(result.gmNote)}</div>
      </div>`
    : "";

  return `
    <div style="border:1px solid #6f2b91;border-radius:6px;background:#fbf8fc;padding:12px;color:#1f2933;">
      <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.06em;">${localize("PlotDieManager")}</div>
      <h2 style="margin:2px 0 8px;font-family:Modesto Condensed,serif;color:#6f2b91;font-size:24px;">
        ${escapeHtml(result.skillLabel)}
      </h2>
      <div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-bottom:10px;">
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Actor</div>
          <div>${escapeHtml(result.actorName)}</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">${localize("Roll2")}</div>
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
    throw new Error(localize("FoundryIsNotAvailableToPostThePlotDieResult"));
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
        <label for="cr-plot-actor">${localize("ActorOrFocus")}</label>
        <input id="cr-plot-actor" name="actorName" type="text" placeholder="${localize("KaladinPatrolNPC")}" />
      </div>
      <div class="form-group">
        <label for="cr-plot-skill">${localize("Roll2")}</label>
        <input id="cr-plot-skill" name="skillLabel" type="text" placeholder="${localize("LeadershipDeceptionAttack")}" />
      </div>
      <div class="form-group">
        <label for="cr-plot-total">Total</label>
        <input id="cr-plot-total" name="rollTotal" type="number" />
      </div>
      <div class="form-group">
        <label for="cr-plot-dc">${localize("Difficulty")}</label>
        <input id="cr-plot-dc" name="targetNumber" type="number" />
      </div>
      <div class="form-group">
        <label for="cr-plot-die">Plot Die</label>
        <input id="cr-plot-die" name="plotDieValue" type="number" min="1" max="6" />
      </div>
      <div class="form-group">
        <label for="cr-plot-outcome">${localize("NarrativeResult")}</label>
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
        <label for="cr-plot-note">${localize("GMNote")}</label>
        <textarea id="cr-plot-note" name="gmNote" rows="2"></textarea>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="cr-plot-whisper" name="whisper">
          ${localize("SendOnlyToGM")}
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
    throw new Error(localize("FoundryIsNotAvailableToOpenThePlotDieManager"));
  }

  openCosmereDialog({
    title: localize("PlotDieManager"),
    content: buildDialogContent(),
    buttons: {
      publish: {
        icon: '<i class="fas fa-dice-d6"></i>',
        label: localize("Post"),
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
            ui?.notifications?.info?.(localize("PlotDieResultPosted"));
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: localize("Cancel"),
      },
    },
    default: "publish",
  }, { Dialog });
}
