// Bomb Throw: implementation behind the public module API.
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
  /*
  ####################################################
     This macro needs the Sequencer module to work.
     Also, you need to target at least one token and select the one who will throw the bomb.
  ####################################################
  */

  // Let's create a function with arguments. That means that we can call this function later and define each argument (here they're called dbThrow, dbFracture and dbExplosion);
  // If you look at the end of the macro, we're using each arg to call a specific Database path. (i.e: await grenade('dbPath01', 'dbPath02', 'dbPath03'))
  async function bombAnimation(dbThrow, dbFracture, dbExplosion, dbGroundImpact){
      let source = token; // this is the first selected token
      let targets = Array.from(game.user.targets); // This is an array that will contain all targeted tokens (we need at least one to know where to throw the potion or grenade)
          for(let target of targets){ // The for loop will iterate for each target, if more than one token is targeted. Otherwise it will run it only once
          new Sequence()
          .effect()
              .file(dbThrow)
              .atLocation(source)
              .stretchTo(target)
              .waitUntilFinished(-150)
          .effect()
              .file(dbFracture)
              .atLocation(target)
              .scaleToObject(1.2)
          .effect()
              .file(dbExplosion)
              .atLocation(target)
          .effect()
              .file(dbGroundImpact)
              .atLocation(target)
              .belowTokens()
              .scaleToObject(2)
              .scaleIn(0.1, 100, {ease: "easeOutExpo"})
              .duration(5000)
              .fadeOut(3250, {ease: "easeInSine"})
          .play();

          let delay = Sequencer.Helpers.random_int_between(600, 1000) // neat little helper from Sequencer giving us a whole number between two values
          await Sequencer.Helpers.wait(delay) // another helper that allows us to delay the time between each loop (when we have more than one target)

          }
      }
  await bombAnimation('jb2a.throwable.throw.bomb.01.black','jb2a.explosion.shrapnel.bomb.01.black','jb2a.explosion.08.orange','jb2a.impact.ground_crack.orange');
}
