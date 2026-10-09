// Hook 20 Natural: implementation behind the public module API.
export async function run({
  game = globalThis.game,
  canvas = globalThis.canvas,
  ui = globalThis.ui,
  ChatMessage = globalThis.ChatMessage,
  Dialog = globalThis.Dialog,
  Hooks = globalThis.Hooks,
  Die = globalThis.foundry?.dice?.terms?.Die ?? globalThis.Die,
  Sequence = globalThis.Sequence,
  Sequencer = globalThis.Sequencer,
  AudioHelper = globalThis.foundry?.audio?.AudioHelper ?? globalThis.AudioHelper,
  token = canvas?.tokens?.controlled?.[0],
} = {}) {
  const { resolveJb2aAssetPath } = await import("../jb2a-assets.js");
  const { localize } = await import("../localization.js");
  Hooks.on("diceSoNiceRollComplete", (messageId) => {
    const msg = game.messages.get(messageId);
    if (!msg?.isRoll) return;

    // Analiza todos los rolls del mensaje
    for (const roll of msg.rolls) {
      // Filtra solo dados (terms) de tipo Die
      for (const term of roll.terms) {
        if (term instanceof Die && term.faces === 20) { // Solo d20
          for (const result of term.results) {
            if (result.result === 20) {
              // Aquí va tu reacción: animación, efecto, etc
              ui.notifications.info(localize("WowANatural20"));

  const center = {
    x: canvas.scene.width / 2,
    y: canvas.scene.height / 2
  };

  const jb2aAssetPath = resolveJb2aAssetPath("Library/1st_Level/Thunderwave/Thunderwave_01_Bright_Blue_Center_600x600.webm", game);
  if (!jb2aAssetPath || typeof Sequence !== "function") return;

  new Sequence()
      .effect()
          .file(jb2aAssetPath)
          .atLocation(center).scale(5)
      .play()
              return; // Sale al detectar el primero
            }
          }
        }
      }
    }
  });
}
