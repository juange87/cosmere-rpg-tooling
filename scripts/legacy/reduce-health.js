// Reduce Health: implementation behind the public module API.
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
} = {}) {
  const { resolveJb2aAssetPath } = await import("../jb2a-assets.js");
  const { localize } = await import("../localization.js");
  // Valor a modificar (+4 para sumar, -4 para restar)
  const delta = -1;

  // Verifica que hay un token seleccionado
  const token = canvas.tokens.controlled[0];
  if (!token) {
    ui.notifications.warn(localize("YouMustSelectAToken"));
    return;
  }

  const actor = token.actor;

  // Salud actual y máxima
  const currHP = actor.system.resources.hea.value;
  const maxHP = actor.system.resources.hea.max.value;

  // Calcula nueva salud
  const newHP = Math.min(Math.max(currHP + delta, 0), maxHP);

  // Actualiza el valor de salud
  actor.update({ "system.resources.hea.value": newHP });

  ui.notifications.info(`${localize("HealthUpdatedTo")}${newHP}.`);

  const jb2aAssetPath = resolveJb2aAssetPath("Library/Generic/Healing/HealingAbility_02_Regular_GreenOrange_Loop_600x600.webm", game);
  if (!jb2aAssetPath || typeof Sequence !== "function") return;

  new Sequence()
      .effect()
          .file(jb2aAssetPath)
          .atLocation(canvas.tokens.controlled[0])
          .scaleToObject(3)
          .belowTokens()
          .fadeIn(1500, {ease: "easeOutCubic", delay: 50})
          .fadeOut(1500)
          .rotateIn(90, 2500, {ease: "easeInOutCubic"})
          .rotateOut(350, 1500, {ease: "easeInCubic"})
          .scaleIn(2, 2500, {ease: "easeInOutCubic"})
          .scaleOut(0, 1500, {ease: "easeInCubic"})
      .play()
}
