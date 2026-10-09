// Critical Miss animation: implementation behind the public module API.
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
  const { resolveJb2aAssetPath } = await import("../jb2a-assets.js");

  const center = {
    x: canvas.scene.width / 2,
    y: canvas.scene.height / 2
  };

  const jb2aAssetPath = resolveJb2aAssetPath("Library/Generic/UI/CriticalMiss_03_Red_200x200.webm", game);
  if (!jb2aAssetPath || typeof Sequence !== "function") return;

  new Sequence()
      .effect()
          .file(jb2aAssetPath)
          .atLocation(center).scale(5)
      .play()
}
