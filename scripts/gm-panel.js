import { buildCosmereChatCard } from "./cosmere-helpers.js";
import { hasCosmereDialogSupport, openCosmereDialog } from "./foundry-dialogs.js";

export const GM_PANEL_ACTIONS = [
  { key: "resources", label: "Salud y foco", description: "Modificar recursos de tokens seleccionados." },
  { key: "spheres", label: "Esferas", description: "Balance, gasto, conversion y resumen de tesoreria." },
  { key: "requestRolls", label: "Solicitar tiradas", description: "Abrir la macro Request Roll existente." },
  { key: "privateMessage", label: "Mensajes privados", description: "Abrir la macro de mensajes del GM." },
  { key: "sounds", label: "Sonidos", description: "Lanzar Palabras Aceptadas Deluxe." },
  { key: "surgebinding", label: "Efectos visuales", description: "Abrir el selector de Surgebinding FX." },
  { key: "toggleTokens", label: "Mostrar u ocultar tokens", description: "Alternar visibilidad de tokens seleccionados." },
];

export function buildGmPanelChatCard() {
  return buildCosmereChatCard({
    eyebrow: "Herramientas de mesa",
    title: "Panel GM Cosmere",
    sections: GM_PANEL_ACTIONS.map(action => ({
      label: action.label,
      value: action.description,
    })),
    accent: "#6f2b91",
    background: "#fbf8fc",
  });
}

async function executeMacroByName(name, { game = globalThis.game, ui = globalThis.ui } = {}) {
  const macro = game?.macros?.getName?.(name) ?? game?.macros?.find?.(item => item.name === name);
  if (!macro?.execute) {
    ui?.notifications?.warn?.(`No se encontro la macro ${name}.`);
    return false;
  }
  await macro.execute();
  return true;
}

async function toggleSelectedTokens({ canvas = globalThis.canvas, ui = globalThis.ui } = {}) {
  const tokens = canvas?.tokens?.controlled ?? [];
  if (!tokens.length) {
    ui?.notifications?.warn?.("Selecciona uno o mas tokens para mostrar u ocultar.");
    return 0;
  }
  for (const token of tokens) {
    await token.document?.update?.({ hidden: !token.document.hidden });
  }
  ui?.notifications?.info?.(`Visibilidad actualizada en ${tokens.length} token(s).`);
  return tokens.length;
}

async function runPanelAction(actionKey, dependencies = {}) {
  if (actionKey === "resources") {
    const { openResourceControl } = await import("./resource-control.js");
    return openResourceControl(dependencies);
  }
  if (actionKey === "spheres") {
    const { openSphereManager } = await import("./sphere-manager.js");
    return openSphereManager(dependencies);
  }
  if (actionKey === "requestRolls") return executeMacroByName("Request Roll", dependencies);
  if (actionKey === "privateMessage") return executeMacroByName("Send message", dependencies);
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
    throw new Error("Foundry no esta disponible para abrir el Panel GM Cosmere.");
  }

  openCosmereDialog({
    title: "Panel GM Cosmere",
    content: buildPanelContent(),
    buttons: {
      close: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cerrar",
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
