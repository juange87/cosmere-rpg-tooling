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
  let selectedToken = canvas.tokens.controlled[0]; // First selected token
  let targets = Array.from(game.user.targets); // Array of targeted tokens

  for(let target of targets){
  /*new Sequence()
      .effect()
          .atLocation(selectedToken)
          .stretchTo(target)
          .file("jb2a.dagger.melee.02.white")
          .repeats(3, 200, 300)
          .randomizeMirrorY()
      .play();*/


  new Sequence()
      .effect()
          .file("jb2a.dagger.melee.02.white") //Replace the text between quotation marks.
          .atLocation(selectedToken)
          .stretchTo(target)
          .repeats(3, 200, 300)
          .randomizeMirrorY()

      .play();
  }
}
