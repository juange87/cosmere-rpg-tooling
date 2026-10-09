// Persuasion Roll: implementation behind the public module API.
export async function run({
  game = globalThis.game,
  canvas = globalThis.canvas,
  ui = globalThis.ui,
  ChatMessage = globalThis.ChatMessage,
  Dialog = globalThis.Dialog,
  Hooks = globalThis.Hooks,
  Sequence = globalThis.Sequence,
  Sequencer = globalThis.Sequencer,
  AudioHelper = globalThis.foundry?.audio?.AudioHelper ?? globalThis.AudioHelper,
} = {}) {
  const { localize } = await import("../localization.js");
  // Macro para hacer una tirada de habilidad en Foundry VTT
  // Cambia "ste" por la abreviatura de la habilidad que quieras (sigilo = "ste", acrobacias = "acr", etc.)

  // Primero, obtiene el token seleccionado
  let token = canvas.tokens.controlled[0];
  if (!token) {
    return ui.notifications.warn(localize("PleaseSelectATokenBeforeUsingThisMacro"));
  }

  // Haz la tirada de la habilidad deseada (ejemplo con sigilo)
  token.actor.rollSkill("prs");
}
