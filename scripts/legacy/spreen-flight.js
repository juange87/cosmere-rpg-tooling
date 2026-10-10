import { requireToken, hasSequencer } from "../cosmere-helpers.js";
import { getActiveJb2aModuleId } from "../jb2a-assets.js";
import { localize as translate } from "../localization.js";
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
  if (!canvas?.scene || !hasSequencer({ game, Sequence }) || !getActiveJb2aModuleId(game)) {
    ui?.notifications?.warn?.(translate("AnimationDependenciesUnavailable"));
    return false;
  }

  const center = {
    x: (canvas.scene.width / 4) *3,
    y: (canvas.scene.height / 8) * 8
  };

  await new Sequence()
      .effect()
          .file("jb2a.markers.light_orb.complete.blue")
          .atLocation(center)
      .play()
}
