import { requireToken, hasSequencer } from "../cosmere-helpers.js";
import { getActiveJb2aModuleId } from "../jb2a-assets.js";
import { localize as translate } from "../localization.js";
// Weapon Throw with Return: implementation behind the public module API.
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

  /*
  #########################################################################################
     This macro needs the Sequencer module to work.
     Also, you need to target at least one token and select the token throwing the weapon
  #########################################################################################
  */
  //You can find the documentation for Sequencer on Github : https://github.com/fantasycalendar/FoundryVTT-Sequencer/wiki

  let targets = Array.from(game.user.targets);

  for(let target of targets){
      await new Sequence()
          .effect()
      //First it will play the throw sequence of the Dagger01 animation.
              .file("jb2a.dagger.throw.01.white")
              .atLocation(token)
              .stretchTo(target)
              //OPTIONAL
              //You can adjust the value below to play the return part before or after the throwing animation ends.
              //The current value should make the transition seamless or barely noticeable.
              //A negative value will play the return part before the throwing animation ends. And a positive value will add a pause between the throw and the return animation.
              .waitUntilFinished(-700) //In milliseconds
          .effect()
      //Then it will transition to the return animation of the Dagger01.
              .file("jb2a.dagger.return.01.white")
              .atLocation(token)
              .stretchTo(target)
      .play()
  }
}
