// Roll Skill: implementation behind the public module API.
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

  // MAPEO de habilidades según tus imágenes
  const habilidades = {
    "agi": localize("Agility"),
    "ath": localize("Athletics"),
    "hwp": localize("HeavyWeapons"),
    "lwp": localize("LightWeapons"),
    "stl": localize("Stealth"),
    "thv": localize("Thievery2"),
    "cra": localize("Crafting2"),
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

  // Buscar el primer token controlado o actor del jugador
  let actor = null;
  if ((canvas?.tokens?.controlled ?? []).length > 0)
    actor = (canvas?.tokens?.controlled ?? [])[0].actor;
  else
    actor = game.user.character;

  if (!actor || typeof actor.rollSkill !== "function" || actor.isOwner === false) {
    ui.notifications.error(localize("YouHaveNoActiveCharacterOrSelectedToken"));
    return;
  }

  // Preparar el desplegable de habilidades
  let habilidadesOptions = Object.entries(habilidades)
    .map(([key, nombre]) => `<option value="${key}">${nombre}</option>`)
    .join("");

  // Diálogo para lanzar la tirada
  openCosmereDialog({
    title: `${localize("SkillRoll")}${escapeHtml(actor.name)})`,
    content: `<p><b>${localize("SelectTheSkillToRoll")}</b></p>
              <select id="habilidad">${habilidadesOptions}</select>`,
    buttons: {
      lanzar: {
        icon: '<i class="fas fa-dice"></i>',
        label: localize("Roll"),
        callback: async html => {
          const skill = html.find("#habilidad").val();
          if (!skill) return;

          // Lanza la tirada con el nombre correcto
          await actor.rollSkill(skill, { chatMessage: true });
        }
      }
    }
  }, { Dialog });
}
