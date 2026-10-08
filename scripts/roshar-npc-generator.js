import { localize } from "./localization.js";
import { hasCosmereDialogSupport, openCosmereDialog } from "./foundry-dialogs.js";

export const ROSHAR_NPC_CULTURE_TABLES = [
  "Alethi Names",
  "Azish Names",
  "Herdazian Names",
  "Reshi Names",
  "Shin Names",
  "Thaylen Names",
  "Unkalaki Names",
  "Veden Names",
];

export const ROSHAR_NPC_TRAITS = {
  get attitude() { return [
    localize("WantsToHelpButDoesNotWantToSeemTooAvailable"),
    localize("SpeaksWithImpeccableCourtesyWhileWeighingEveryWord"),
    localize("IsIrritatedByARecentEventAndLooksForSomeoneToBlame"),
    localize("ActsCheerfulToHideTheirFear"),
    localize("WantsToNegotiateBeforeRevealingAnyInformation"),
    localize("TreatsTheGroupAsANecessaryNuisance"),
    localize("AdmiresOutsidersAndAsksTooManyQuestions"),
    localize("SeemsDistractedAsThoughListeningToSomethingNobodyElseCanHear"),
    localize("ObeysOrdersDespiteBelievingTheyAreUnjust"),
    localize("IsInAHurryAndOnlyCooperatesForAnImmediateBenefit"),
  ]; },
  get problem() { return [
    localize("MustDeliverAMessageBeforeTheGuardChanges"),
    localize("HasLostAValuableSphereAndCannotAdmitIt"),
    localize("ARelativeDisappearedAfterTheLastHighstorm"),
    localize("MustHideAWoundBeforeAnyoneAsksQuestions"),
    localize("TheirPatronDemandsAnImpossibleResultBeforeNightfall"),
    localize("SomeoneIsUsingTheirNameToMakeFraudulentDeals"),
    localize("NeedsAnEscortThroughAStormSweptArea"),
    localize("ASprenInsistsOnFollowingThemAndDrawsTooMuchAttention"),
    localize("HasADebtDueToday"),
    localize("OverheardSomethingTheyShouldNotHaveDuringAPrivateConversation"),
  ]; },
  get secret() { return [
    localize("SecretlyServesARivalHouse"),
    localize("KnowsASideEntranceToAGuardedPlace"),
    localize("HasSeenAnUnregisteredShardblade"),
    localize("KeepsASpanreedTheyShouldNotHave"),
    localize("PretendsToHaveAHigherSocialStandingThanTheyDo"),
    localize("IsProtectingSomeoneWhoWasFalselyAccused"),
    localize("KnowsARecentStormLeftSomethingStrangeInTheCrem"),
    localize("OwesMoneyToADangerousMerchant"),
    localize("MadeADealWithASprenTheyDoNotFullyUnderstand"),
    localize("RecognizesOneOfTheCharactersFromAnotherLife"),
  ]; },
  get resource() { return [
    localize("CanArrangeABriefAudienceWithSomeoneImportant"),
    localize("KnowsASafeRouteOutOfTheDistrict"),
    localize("HasAccessToAStorehouseWithClothingRopesAndLamps"),
    localize("CanLendASpanreedForOneScene"),
    localize("KnowsWhichGuardAcceptsSmallBribes"),
    localize("HasAnIncompleteButUsefulMapOfTheArea"),
    localize("CanIntroduceTheGroupAsLowPriorityGuests"),
    localize("KnowsAnArtifabrianWhoCanAnswerADifficultQuestion"),
    localize("CanIdentifyInsigniaUniformsOrHouseColors"),
    localize("HasEnoughSpheresToGetABriefNegotiationStarted"),
  ]; },
  get hook() { return [
    localize("HasSeenASprenBehaveInAnUnfamiliarWay"),
    localize("AHighstormRevealedADoorWhereThereWasOnceASmoothWall"),
    localize("AMinorBrightlordIsDiscreetlyLookingForPeopleWhoAskNoQuestions"),
    localize("ACaravanArrivedWithAllItsWagonsIntactAndNoDrivers"),
    localize("SomeonePaysForTheNamesOfPeopleWhoDreamOfImpossibleLights"),
    localize("AnArdentDisappearedAfterCopyingAnAncientText"),
    localize("AnOrdinaryFabrialBeganWorkingInReverse"),
    localize("NewMarksOnTheStoneOnlyAppearAfterRain"),
    localize("AWitnessSwearsTheySawADeadPersonWalkingBeforeDawn"),
    localize("AMinorDisputeBetweenHousesIsAboutToTurnViolent"),
  ]; },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pickRandom(items, random) {
  const index = Math.min(Math.floor(random() * items.length), items.length - 1);
  return items[index];
}

function getCultureName(cultureTable) {
  return String(cultureTable ?? "").replace(/\s+Names$/, "");
}

async function drawTableText(game, tableName) {
  const table = game?.tables?.getName?.(tableName);
  if (!table) {
    throw new Error(`${localize("CouldNotFindTheTable")}${tableName}".`);
  }

  const draw = await table.draw({ displayChat: false });
  const result = draw?.results?.[0];
  const text = result?.name ?? result?.description ?? result?.text ?? "";

  if (!text) {
    throw new Error(`${localize("TheTable")}${tableName}${localize("DidNotReturnAResult")}`);
  }

  return String(text);
}

export async function generateRosharNpc({
  game = globalThis.game,
  cultureTable = "",
  random = Math.random,
} = {}) {
  const selectedCultureTable = cultureTable || pickRandom(ROSHAR_NPC_CULTURE_TABLES, random);

  return {
    name: await drawTableText(game, selectedCultureTable),
    cultureTable: selectedCultureTable,
    culture: getCultureName(selectedCultureTable),
    attitude: pickRandom(ROSHAR_NPC_TRAITS.attitude, random),
    problem: pickRandom(ROSHAR_NPC_TRAITS.problem, random),
    secret: pickRandom(ROSHAR_NPC_TRAITS.secret, random),
    resource: pickRandom(ROSHAR_NPC_TRAITS.resource, random),
    hook: pickRandom(ROSHAR_NPC_TRAITS.hook, random),
  };
}

export function buildRosharNpcChatCard(npc) {
  return `
    <div style="border:1px solid #8b5a2b;border-radius:6px;background:#fcfaf6;padding:12px;color:#1f2933;">
      <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.06em;">${localize("NPCGenerator")}</div>
      <h2 style="margin:2px 0 8px;font-family:Modesto Condensed,serif;color:#6d3f16;font-size:24px;">
        ${localize("RosharNPC")}
      </h2>
      <div style="margin-bottom:8px;">
        <div style="font-size:20px;font-family:Modesto Condensed,serif;color:#1e3a5f;">${escapeHtml(npc.name)}</div>
        <div style="font-size:11px;color:#6f7f95;">${escapeHtml(npc.culture)} - ${escapeHtml(npc.cultureTable)}</div>
      </div>
      <div style="display:grid;gap:8px;">
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">${localize("Attitude")}</div>
          <div>${escapeHtml(npc.attitude)}</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">${localize("ImmediateProblem")}</div>
          <div>${escapeHtml(npc.problem)}</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">${localize("SecretOrTwist")}</div>
          <div>${escapeHtml(npc.secret)}</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">${localize("Resource")}</div>
          <div>${escapeHtml(npc.resource)}</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">${localize("RumorOrHook")}</div>
          <div>${escapeHtml(npc.hook)}</div>
        </div>
      </div>
    </div>
  `;
}

function buildDialogContent() {
  const cultureOptions = [
    `<option value="">${localize("Random")}</option>`,
    ...ROSHAR_NPC_CULTURE_TABLES.map(tableName => `<option value="${escapeHtml(tableName)}">${escapeHtml(tableName)}</option>`),
  ].join("");

  return `
    <form>
      <div class="form-group">
        <label for="cr-roshar-npc-culture">${localize("CultureName")}</label>
        <select id="cr-roshar-npc-culture" name="cultureTable">${cultureOptions}</select>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="cr-roshar-npc-whisper" name="whisper" checked>
          ${localize("SendOnlyToGM")}
        </label>
      </div>
    </form>
  `;
}

export function openRosharNpcGenerator({
  game = globalThis.game,
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  ui = globalThis.ui,
} = {}) {
  if (!hasCosmereDialogSupport({ Dialog }) || !ChatMessage) {
    throw new Error(localize("FoundryIsNotAvailableToOpenTheNPCGenerator"));
  }

  openCosmereDialog({
    title: localize("RosharNPCGenerator"),
    content: buildDialogContent(),
    buttons: {
      generate: {
        icon: '<i class="fas fa-user-plus"></i>',
        label: localize("Generate"),
        callback: async html => {
          try {
            const cultureTable = html.find("#cr-roshar-npc-culture").val();
            const whisperOnly = html.find("#cr-roshar-npc-whisper").is(":checked");
            const npc = await generateRosharNpc({ game, cultureTable });
            const whisper = whisperOnly
              ? ChatMessage.getWhisperRecipients("GM").map(user => user.id)
              : undefined;

            await ChatMessage.create({
              content: buildRosharNpcChatCard(npc),
              speaker: ChatMessage.getSpeaker(),
              whisper,
            });

            ui?.notifications?.info?.(localize("RosharNPCGenerated"));
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
    default: "generate",
  }, { Dialog });
}
