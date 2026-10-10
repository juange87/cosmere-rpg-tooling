import { localize, format } from "./localization.js";
import {
  buildCosmereChatCard,
  normalizeText,
  postCosmereChatCard,
} from "./cosmere-helpers.js";
import { hasCosmereDialogSupport, openCosmereDialog } from "./foundry-dialogs.js";

export const QUICK_SCENE_TYPES = [
  { key: "chase", get label() { return localize("Chase"); } },
  { key: "infiltration", get label() { return localize("Infiltration"); } },
  { key: "socialDuel", get label() { return localize("SocialDuel"); } },
  { key: "discovery", get label() { return localize("Discovery"); } },
  { key: "dangerousTravel", get label() { return localize("DangerousTravel"); } },
  { key: "negotiation", get label() { return localize("Negotiation"); } },
  { key: "stormPrep", get label() { return localize("StormPreparation"); } },
];

const BEATS = {
  get chase() { return [localize("EstablishTheStartingDistance"), localize("IntroduceATerrainObstacle"), localize("OfferAShortcutAtACost"), localize("EndWithCaptureEscapeOrATwist")]; },
  get infiltration() { return [localize("MarkTheEntryPoint"), localize("DefineAPatrolOrLock"), localize("RevealARoomWithUsefulInformation"), localize("TriggerAPartialAlarm")]; },
  get socialDuel() { return [localize("PresentThePublicStance"), localize("IntroduceASocialTest"), localize("AllowAConcessionAtACost"), localize("EndWithAFavorDebtOrHumiliation")]; },
  get discovery() { return [localize("ShowAnImpossibleDetail"), localize("ConnectTheClueToAFaction"), localize("AddARiskForTouchingOrReading"), localize("IntroduceANewQuestion")]; },
  get dangerousTravel() { return [localize("DefineTheWeatherAndUrgency"), localize("ConsumeResourcesOrTime"), localize("IntroduceASideEncounter"), localize("ArriveWithAVisibleConsequence")]; },
  get negotiation() { return [localize("DeclareWhatEachSideWants"), localize("PresentARedLine"), localize("OfferABargainingChip"), localize("EndWithAnAgreementThreatOrDebt")]; },
  get stormPrep() { return [localize("CountDownToImpact"), localize("ChooseShelterAndPriorities"), localize("IntroduceALastMinuteComplication"), localize("DetermineWhatRemainsExposedAfterTheStorm")]; },
};

function resolveSceneType(typeKey) {
  return QUICK_SCENE_TYPES.find(type => type.key === typeKey) ?? QUICK_SCENE_TYPES[0];
}

function hashSeed(seed) {
  return String(seed ?? "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function buildQuickSceneSeed({ typeKey = "chase", seed = Date.now(), title = "" } = {}) {
  const type = resolveSceneType(typeKey);
  const twistIndex = hashSeed(seed) % 4;
  return {
    type,
    title: normalizeText(title, type.label),
    beats: BEATS[type.key],
    twist: [
      localize("AnAllyArrivesWithIncompleteInformation"),
      localize("TheRealCostAppearsAfterAccepting"),
      localize("ASecondaryFactionObservesTheScene"),
      localize("TheObviousSolutionMakesTheNextProblemWorse"),
    ][twistIndex],
  };
}

export function buildQuickSceneChatCard(sceneInput) {
  const scene = "type" in (sceneInput ?? {})
    ? sceneInput
    : buildQuickSceneSeed(sceneInput);
  return buildCosmereChatCard({
    eyebrow: localize("QuickSceneCompendium"),
    title: scene.title,
    subtitle: scene.type.label,
    sections: [
      ...scene.beats.map((beat, index) => ({ label: format("BeatNumber", { number: index + 1 }), value: beat })),
      { label: localize("Twist"), value: scene.twist },
    ],
    accent: "#1e3a5f",
  });
}

export async function postQuickScene({
  input = {},
  ChatMessage = globalThis.ChatMessage,
} = {}) {
  const scene = buildQuickSceneSeed(input);
  await postCosmereChatCard({ content: buildQuickSceneChatCard(scene), ChatMessage });
  return scene;
}

function sceneOptions() {
  return QUICK_SCENE_TYPES.map(type => `<option value="${type.key}">${type.label}</option>`).join("");
}

export function openQuickSceneCompendium({
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  ui = globalThis.ui,
} = {}) {
  if (!hasCosmereDialogSupport({ Dialog }) || !ChatMessage) {
    throw new Error(localize("FoundryIsNotAvailableToOpenQuickScenes"));
  }
  openCosmereDialog({
    title: localize("QuickSceneCompendium"),
    content: `
      <form>
        <div class="form-group"><label>${localize("Scene")}</label><select name="typeKey">${sceneOptions()}</select></div>
        <div class="form-group"><label>${localize("OptionalTitle")}</label><input name="title" type="text" /></div>
        <div class="form-group"><label>${localize("Seed")}</label><input name="seed" type="text" /></div>
      </form>
    `,
    buttons: {
      publish: {
        icon: '<i class="fas fa-theater-masks"></i>',
        label: localize("Post"),
        callback: async html => {
          try {
            await postQuickScene({
              input: {
                typeKey: html.find("[name=typeKey]").val(),
                title: html.find("[name=title]").val(),
                seed: html.find("[name=seed]").val() || Date.now(),
              },
              ChatMessage,
            });
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      cancel: { icon: '<i class="fas fa-times"></i>', label: localize("Cancel") },
    },
    default: "publish",
  }, { Dialog });
}
