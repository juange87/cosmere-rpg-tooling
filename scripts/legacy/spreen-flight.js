// Spreen flight: implementation behind the public module API.
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
  const center = {
    x: (canvas.scene.width / 4) *3,
    y: (canvas.scene.height / 8) * 8
  };

  new Sequence()
      .effect()
          .file("jb2a.markers.light_orb.complete.blue")
          .atLocation(center)
      .play()
}
