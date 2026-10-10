// Request Roll: implementation behind the public module API.
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

  const OWNER_PERMISSION_LEVEL = 3;

  // Habilidades mapeadas según tus imágenes
  const habilidades = {
    "agi": localize("Agility"),
    "ath": localize("Athletics"),
    "hwp": localize("HeavyWeapons"),
    "lwp": localize("LightWeapons"),
    "stl": localize("Stealth"),
    "thv": localize("Thievery"),
    "cra": localize("Crafting"),
    "ded": localize("Deduction"),
    "dis": localize("Discipline"),
    "inm": localize("Intimidation"),
    "lor": localize("Lore"),
    "med": localize("Medicine"),
    "dec": localize("Deception"),
    "ins": localize("Insight"),
    "lea": localize("Leadership"),
    "prc": localize("Perception"),
    "prs": localize("Persuasion"),
    "sur": localize("Survival")
  };

  // --- DEBUG OPCIONAL ---
  // Descomenta si quieres ver debug en el chat del GM
  /*
  function debug(msg) {
    ChatMessage.create({
      content: `<b>[DEBUG]</b> ${escapeHtml(msg)}`,
      whisper: [game.user.id]
    });
  }
  */

  // Paso 1: elegir actor
  let actoresConDueñoArr = game.actors.filter(a => a.hasPlayerOwner);
  if(actoresConDueñoArr.length === 0) {
    ui.notifications.warn(localize("ThereAreNoPlayerControlledCharactersInTheGame"));
    return;
  }

  let actoresOptions = actoresConDueñoArr.map(a => `<option value="${escapeHtml(a.id)}">${escapeHtml(a.name)}</option>`).join("");

  // Paso 2: mostrar diálogo inicial para seleccionar actor
  openCosmereDialog({
    title: localize("SelectCharacter"),
    content: `<p><b>${localize("SelectTheCharacter")}</b></p>
              <select id="actor">${actoresOptions}</select>`,
    buttons: {
      siguiente: {
        label: localize("Next"),
        callback: async html => {
          const actorId = html.find("#actor").val();
          const actor = game.actors.get(actorId);
          if (!actor) return ui.notifications.error(localize("ActorNotFound"));

          // Generar opciones SOLO con las habilidades listadas
          let habilidadesOptions = Object.entries(habilidades)
            .map(([key, nombre]) => `<option value="${key}">${nombre}</option>`)
            .join("");

          // Paso 3: mostrar diálogo de habilidades
          openCosmereDialog({
            title: `${localize("RequestRoll")}${escapeHtml(actor.name)}`,
            content: `<p><b>${localize("SelectTheSkill")}</b></p>
                      <select id="habilidad">${habilidadesOptions}</select>`,
            buttons: {
              enviar: {
                label: localize("SendRequest"),
                callback: async html2 => {
                  const habilidad = html2.find("#habilidad").val();

                  // Buscar jugador con permiso OWNER
                  const players = game.users.players.filter(u => actor.testUserPermission(u, OWNER_PERMISSION_LEVEL));
                  if (!players.length) return ui.notifications.error(localize("NoPlayerControlsThisCharacter"));

                  if (!(habilidad in habilidades)) return;

                // Mensaje privado con botón
                  const chatContent = `
                    <p><b>${escapeHtml(game.user.name)}</b> ${localize("RequestsARollOf")} <b>${escapeHtml(habilidades[habilidad])}</b> ${localize("For")} <b>${escapeHtml(actor.name)}</b>.</p>
                    <button class="roll-solicitud" data-actor-id="${escapeHtml(actor.id)}" data-skill="${escapeHtml(habilidad)}">🎲 ${localize("Roll3")}</button>
                  `;

                  await ChatMessage.create({
                    author: game.user.id,
                    whisper: players.map(player => player.id),
                    speaker: { alias: localize("RollRequest") },
                    content: chatContent
                  });

                  ui.notifications.info(`${localize("RequestSentTo")}${players.map(player => player.name).join(", ")}`);
                }
              }
            }
          }, { Dialog });
        }
      }
    }
  }, { Dialog });
}
