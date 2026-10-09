import { requireToken, hasSequencer } from "../cosmere-helpers.js";
import { getActiveJb2aModuleId } from "../jb2a-assets.js";
import { localize as translate } from "../localization.js";
// Knife: implementation behind the public module API.
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
  if (!game?.user?.targets?.size) {
    ui?.notifications?.warn?.(translate("SelectAnimationTargets"));
    return false;
  }

  let selectedToken = canvas.tokens.controlled[0]; // First selected token
  let targets = Array.from(game.user.targets); // Array of targeted tokens

  for(let target of targets){
  /*await new Sequence()
      .effect()
          .atLocation(selectedToken)
          .stretchTo(target)
          .file("jb2a.dagger.melee.02.white")
          .repeats(3, 200, 300)
          .randomizeMirrorY()
      .play();*/


  await new Sequence()
      .effect()
          .file("jb2a.dagger.melee.02.white") //Replace the text between quotation marks.
          .atLocation(selectedToken)
          .stretchTo(target)
          .repeats(3, 200, 300)
          .randomizeMirrorY()

      .play();
  }
}
