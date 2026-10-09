import { localize } from "./localization.js";
import {
  buildCosmereChatCard,
  normalizeText,
  postCosmereChatCard,
} from "./cosmere-helpers.js";
import { hasCosmereDialogSupport, openCosmereDialog } from "./foundry-dialogs.js";

export const SURGES = [
  { key: "adhesion", get label() { return localize("Adhesion"); }, file: "jb2a.impact.ground_crack.blue", get cue() { return localize("BindSurfacesOathsOrAttentionAtAKeyMoment"); } },
  { key: "gravitation", get label() { return localize("Gravitation"); }, file: "jb2a.energy_beam.normal.blue", get cue() { return localize("ChangeTheDirectionOfFallingOrMarkAVisualLashing"); } },
  { key: "division", get label() { return localize("Division"); }, file: "jb2a.explosion.03.orange", get cue() { return localize("ShowDisintegrationHeatOrADangerousFracture"); } },
  { key: "abrasion", get label() { return localize("Abrasion"); }, file: "jb2a.wind_stream.white", get cue() { return localize("MarkMovementThatIsFluidSlipperyOrImpossibleToCatch"); } },
  { key: "progression", get label() { return localize("Progression"); }, file: "jb2a.healing_generic.02.green", get cue() { return localize("RepresentGrowthHealingOrAcceleratedLife"); } },
  { key: "illumination", get label() { return localize("Illumination"); }, file: "jb2a.template_circle.symbol.normal.illusion.purple", get cue() { return localize("CreateLightImagesOrSensoryDistractions"); } },
  { key: "transformation", get label() { return localize("Transformation"); }, file: "jb2a.particles.outward.greenyellow.01.03", get cue() { return localize("SignalSoulcastingOrAChangeOfMatter"); } },
  { key: "transportation", get label() { return localize("Transportation"); }, file: "jb2a.misty_step.02.blue", get cue() { return localize("MarkATransitionJumpOrBrushWithShadesmar"); } },
  { key: "cohesion", get label() { return localize("Cohesion"); }, file: "jb2a.impact.ground_crack.orange", get cue() { return localize("ShapeStoneMudOrSolidSurfaces"); } },
  { key: "tension", get label() { return localize("Tension"); }, file: "jb2a.shield.01.outro.yellow", get cue() { return localize("HardenOrStiffenMaterialsWithInvestiture"); } },
];

function resolveSurge(surgeKey) {
  return SURGES.find(surge => surge.key === surgeKey) ?? SURGES[0];
}

export function buildSurgebindingFx({
  surgeKey = "adhesion",
  actorName = "",
  targetName = "",
  note = "",
} = {}) {
  const surge = resolveSurge(surgeKey);
  return {
    surge,
    actorName: normalizeText(actorName, "Surgebinder"),
    targetName: normalizeText(targetName, localize("Scene")),
    note: normalizeText(note, surge.cue),
  };
}

export function buildSurgebindingChatCard(input) {
  const fx = buildSurgebindingFx(input);
  return buildCosmereChatCard({
    eyebrow: localize("SurgebindingFX"),
    title: fx.surge.label,
    sections: [
      { label: localize("Source"), value: fx.actorName },
      { label: localize("Target"), value: fx.targetName },
      { label: localize("Description"), value: fx.note },
    ],
    accent: "#2f80ed",
    background: "#f5fbff",
  });
}

export async function playSurgebindingFx({
  input = {},
  publishChat = true,
  ChatMessage = globalThis.ChatMessage,
  Sequence = globalThis.Sequence,
  canvas = globalThis.canvas,
  ui = globalThis.ui,
} = {}) {
  const fx = buildSurgebindingFx(input);
  const source = canvas?.tokens?.controlled?.[0];
  const target = Array.from(globalThis.game?.user?.targets ?? [])[0] ?? source;

  if (typeof Sequence === "function" && source) {
    new Sequence()
      .effect()
      .file(fx.surge.file)
      .atLocation(source)
      .stretchTo?.(target)
      .play();
  } else {
    ui?.notifications?.warn?.(localize("SequencerIsUnavailableOnlyTheNarrativeCardWillBePosted"));
  }

  if (publishChat) {
    await postCosmereChatCard({
      content: buildSurgebindingChatCard(fx),
      ChatMessage,
    });
  }

  return fx;
}

function surgeOptions() {
  return SURGES.map(surge => `<option value="${surge.key}">${surge.label}</option>`).join("");
}

export function openSurgebindingFxDialog({
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  ui = globalThis.ui,
} = {}) {
  if (!hasCosmereDialogSupport({ Dialog }) || !ChatMessage) {
    throw new Error(localize("FoundryIsNotAvailableToOpenSurgebindingFXPack"));
  }

  openCosmereDialog({
    title: localize("SurgebindingFXPack"),
    content: `
      <form>
        <div class="form-group"><label>Surge</label><select name="surgeKey">${surgeOptions()}</select></div>
        <div class="form-group"><label>${localize("Actor")}</label><input name="actorName" type="text" /></div>
        <div class="form-group"><label>${localize("Target")}</label><input name="targetName" type="text" /></div>
        <div class="form-group"><label>${localize("Description")}</label><textarea name="note" rows="2"></textarea></div>
        <label><input name="publishChat" type="checkbox" checked /> ${localize("PostCard")}</label>
      </form>
    `,
    buttons: {
      play: {
        icon: '<i class="fas fa-bolt"></i>',
        label: localize("PlayEffect"),
        callback: async html => {
          try {
            await playSurgebindingFx({
              input: {
                surgeKey: html.find("[name=surgeKey]").val(),
                actorName: html.find("[name=actorName]").val(),
                targetName: html.find("[name=targetName]").val(),
                note: html.find("[name=note]").val(),
              },
              publishChat: html.find("[name=publishChat]").is(":checked"),
              ChatMessage,
              ui,
            });
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      cancel: { icon: '<i class="fas fa-times"></i>', label: localize("Cancel") },
    },
    default: "play",
  }, { Dialog });
}
