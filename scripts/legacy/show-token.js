// Show Token: implementation behind the public module API.
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
  token = canvas?.tokens?.controlled?.[0],
} = {}) {
  const { localize } = await import("../localization.js");
  // Obtén los tokens seleccionados
  let tokens = (canvas?.tokens?.controlled ?? []);
  // Verifica que haya tokens seleccionados
  if (tokens.length === 0) {
    ui.notifications.warn(localize("SelectOneOrMoreTokensToShowOrHide2"));
  } else {
    // Alterna el estado de oculto de cada token
    for (let token of tokens) {
      let isHidden = token.document.hidden;
      await token.document.update({hidden: !isHidden});
    }
  }
}
