// Send message: implementation behind the public module API.
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
  const { escapeHtml, normalizeNumber } = await import("../cosmere-helpers.js");
  const { localize } = await import("../localization.js");
  const { openCosmereDialog } = await import("../foundry-dialogs.js");

  // Macro: Selección de usuario y envío de mensaje privado
  // Dev: pensado para usarlo como GM

  // Lista de usuarios jugadores (puedes incluir también el GM si quieres, quitando el .players)
  let usuarios = game.users.players.map(u => `<option value="${escapeHtml(u.id)}">${escapeHtml(u.name)}</option>`).join("");

  // Diálogo para elegir usuario y escribir mensaje
  let content = `
  <p><b>${localize("SelectTheUser")}</b></p>
  <select id="usuario">${usuarios}</select>
  <p><b>${localize("Message")}</b></p>
  <textarea id="mensaje" rows="4" style="width:100%;resize:none;"></textarea>
  `;

  openCosmereDialog({
    title: localize("SendPrivateMessage"),
    content: content,
    buttons: {
      enviar: {
        icon: '<i class="fas fa-paper-plane"></i>',
        label: localize("Send"),
        callback: async html => {
          const userId = html.find("#usuario").val();
          const mensaje = html.find("#mensaje").val().trim();
          const jugador = game.users.get(userId);

          if (!jugador) {
            ui.notifications.error(localize("UserNotFound"));
            return;
          }

          if (!mensaje) {
            ui.notifications.warn(localize("YouCannotSendAnEmptyMessage"));
            return;
          }

          // Crear mensaje privado (whisper) solo para ese jugador
          await ChatMessage.create({
            user: game.user.id, // el usuario que lo envía (tú)
            whisper: [jugador.id],
            speaker: { alias: game.user.name },
            content: escapeHtml(mensaje)
          });

          ui.notifications.info(`${localize("PrivateMessageSentTo")}${jugador.name}`);
        }
      },
      cancelar: {
        icon: '<i class="fas fa-times"></i>',
        label: localize("Cancel")
      }
    },
    default: "enviar"
  }, { Dialog });
}
