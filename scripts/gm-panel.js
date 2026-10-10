import { localize } from "./localization.js";
import { COSMERE_MODULE_ID, buildCosmereChatCard } from "./cosmere-helpers.js";
import { hasCosmereDialogSupport, openCosmereDialog } from "./foundry-dialogs.js";

export const GM_PANEL_ACTIONS = [
  { key: "resources", get label() { return localize("HealthAndFocus"); }, get description() { return localize("ModifyResourcesForSelectedTokens"); } },
  { key: "spheres", get label() { return localize("Spheres"); }, get description() { return localize("BalanceSpendingConversionAndTreasurySummary"); } },
  { key: "requestRolls", get label() { return localize("RequestRolls"); }, get description() { return localize("OpenTheExistingRequestRollMacro"); } },
  { key: "privateMessage", get label() { return localize("PrivateMessages"); }, get description() { return localize("OpenTheGMMessagingMacro"); } },
  { key: "sounds", get label() { return localize("Sounds"); }, get description() { return localize("RunWordsAcceptedDeluxe"); } },
  { key: "surgebinding", get label() { return localize("VisualEffects"); }, get description() { return localize("OpenTheSurgebindingFXSelector"); } },
  { key: "toggleTokens", get label() { return localize("ShowOrHideTokens"); }, get description() { return localize("ToggleVisibilityOfSelectedTokens"); } },
];

export function buildGmPanelChatCard() {
  return buildCosmereChatCard({
    eyebrow: localize("TableTools"),
    title: localize("CosmereGMPanel"),
    sections: GM_PANEL_ACTIONS.map(action => ({
      label: action.label,
      value: action.description,
    })),
    accent: "#6f2b91",
    background: "#fbf8fc",
  });
}

async function executeCompendiumMacro(id, { game = globalThis.game, ui = globalThis.ui } = {}) {
  const pack = game?.packs?.get?.(`${COSMERE_MODULE_ID}.gm-macros`);
  const macro = await pack?.getDocument?.(id);
  if (!macro?.execute) {
    ui?.notifications?.warn?.(`${localize("CouldNotFindTheMacro")}${id}.`);
    return false;
  }
  await macro.execute();
  return true;
}

async function toggleSelectedTokens({ canvas = globalThis.canvas, ui = globalThis.ui } = {}) {
  const tokens = canvas?.tokens?.controlled ?? [];
  if (!tokens.length) {
    ui?.notifications?.warn?.(localize("SelectOneOrMoreTokensToShowOrHide"));
    return 0;
  }
  for (const token of tokens) {
    await token.document?.update?.({ hidden: !token.document.hidden });
  }
  ui?.notifications?.info?.(`${localize("VisibilityUpdatedFor")}${tokens.length} token(s).`);
  return tokens.length;
}

export async function runPanelAction(actionKey, dependencies = {}) {
  if (actionKey === "resources") {
    const { openResourceControl } = await import("./resource-control.js");
    return openResourceControl(dependencies);
  }
  if (actionKey === "spheres") {
    const { openSphereManager } = await import("./sphere-manager.js");
    return openSphereManager(dependencies);
  }
  if (actionKey === "requestRolls") return executeCompendiumMacro("OHzWpcVmcfaHsk4z", dependencies);
  if (actionKey === "privateMessage") return executeCompendiumMacro("wilsiRBC31LfydfP", dependencies);
  if (actionKey === "sounds") {
    const { openOathAcceptedDeluxe } = await import("./oath-accepted-deluxe.js");
    return openOathAcceptedDeluxe(dependencies);
  }
  if (actionKey === "surgebinding") {
    const { openSurgebindingFxDialog } = await import("./surgebinding-fx-pack.js");
    return openSurgebindingFxDialog(dependencies);
  }
  if (actionKey === "toggleTokens") return toggleSelectedTokens(dependencies);
  return false;
}

function buildPanelContent() {
  return `
    <div style="display:grid;gap:8px;">
      ${GM_PANEL_ACTIONS.map(action => `
        <button type="button" data-action="${action.key}" style="text-align:left;padding:8px 10px;">
          <strong>${action.label}</strong><br>
          <span style="font-size:12px;color:#4a5568;">${action.description}</span>
        </button>
      `).join("")}
    </div>
  `;
}

export function openGmPanel({
  Dialog = globalThis.Dialog,
  ui = globalThis.ui,
  ...dependencies
} = {}) {
  if (!hasCosmereDialogSupport({ Dialog })) {
    throw new Error(localize("FoundryIsNotAvailableToOpenTheCosmereGMPanel"));
  }

  openCosmereDialog({
    title: localize("CosmereGMPanel"),
    content: buildPanelContent(),
    buttons: {
      close: {
        icon: '<i class="fas fa-times"></i>',
        label: localize("Close"),
      },
    },
    render: html => {
      html.find?.("button[data-action]")?.click?.(async event => {
        try {
          await runPanelAction(event.currentTarget.dataset.action, { ui, ...dependencies });
        } catch (error) {
          ui?.notifications?.error?.(error.message);
        }
      });
    },
    width: 520,
  }, { Dialog });
}
