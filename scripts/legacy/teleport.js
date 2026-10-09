import { requireToken, hasSequencer } from "../cosmere-helpers.js";
import { getActiveJb2aModuleId } from "../jb2a-assets.js";
import { localize as translate } from "../localization.js";
// Teleport: implementation behind the public module API.
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
  if (!requireToken({ canvas, ui, requireActor: false })) return false;
  if (!Sequencer?.Crosshair?.show) return false;

  let position = await Sequencer.Crosshair.show({
      size: 1,
      gridHighlight: false,
      label: {
          text: translate("TeleportTo"),
      }
  }, { show: async (crosshair) => {

      await new Sequence()
          .effect()
              .from(token)
              .attachTo(crosshair)
              .persist()
              .opacity(0.5)
          .play();

  }})

  if(!position){
      return;
  }

  await new Sequence()
      .effect()
          .from(token)
          .fadeIn(50)
          .duration(550)
          .fadeOut(250)
          .filter("Blur")
          .elevation(0)
      .effect()
          .file("jb2a.chain_lightning.secondary.blue")
          .atLocation(token)
          .stretchTo(position)
          .elevation(0)
      .wait(100)
      .animation()
          .on(token)
          .teleportTo(position)
          .snapToGrid()
          .waitUntilFinished()
      .effect()
          .file("jb2a.static_electricity.03.blue")
          .atLocation(token)
          .scaleToObject()
      .play();
}
