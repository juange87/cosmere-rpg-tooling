// Hook: implementation behind the public module API.
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
  // Hook: escucha clicks en botones de solicitud de tirada
  Hooks.on("renderChatMessage", (message, html) => {
    html.find("button.roll-solicitud").click(ev => {
      const actorId = ev.currentTarget.dataset.actorId;
      const skill = ev.currentTarget.dataset.skill;

      const actor = game.actors.get(actorId);
      if (!actor) {
        ui.notifications.error(localize("CouldNotFindTheActorForTheRoll2"));
        return;
      }

      // Lanza la tirada desde la sesión del jugador
      actor.rollSkill(skill, { chatMessage: true });
    });
  });
}
