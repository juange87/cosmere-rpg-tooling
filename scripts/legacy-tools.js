import { localize } from "./localization.js";
import { requireToken, hasSequencer, getProperty, clamp } from "./cosmere-helpers.js";
import { resolveJb2aAssetPath } from "./jb2a-assets.js";

export async function runLegacySkillRoll({ skillKey, canvas = globalThis.canvas, ui = globalThis.ui } = {}) {
  const token = requireToken({ canvas, ui });
  if (!token) return false;
  if (typeof token.actor?.rollSkill !== "function" || token.actor.isOwner === false) {
    ui?.notifications?.warn?.(localize("CouldNotFindTheActorForTheRoll"));
    return false;
  }
  return token.actor.rollSkill(skillKey);
}

export async function runLegacyResourceChange({
  resourceKey, delta, canvas = globalThis.canvas, game = globalThis.game,
  ui = globalThis.ui, Sequence = globalThis.Sequence,
} = {}) {
  const token = requireToken({ canvas, ui });
  if (!token) return false;
  const actor = token.actor;
  const path = `system.resources.${resourceKey}.value`;
  const current = getProperty(actor, path);
  const maxRaw = getProperty(actor, `system.resources.${resourceKey}.max`);
  const max = typeof maxRaw === "object" ? maxRaw?.value : maxRaw;
  if (!Number.isFinite(current) || !Number.isFinite(max) || max < 0 || !actor.update || actor.isOwner === false) {
    ui?.notifications?.warn?.(localize("UnsupportedActorResource"));
    return false;
  }
  const next = clamp(current + delta, 0, max);
  await actor.update({ [path]: next });
  ui?.notifications?.info?.(`${localize(resourceKey === "hea" ? "HealthUpdatedTo" : "FocusUpdatedTo")}${next}.`);
  // Optional visual effects must never prevent the resource update.
  if (resourceKey === "hea" && next > current && hasSequencer({ game, Sequence })) {
    const file = resolveJb2aAssetPath("Library/Generic/Healing/HealingAbility_02_Regular_GreenOrange_Loop_600x600.webm", game);
    if (file) {
      try {
        await new Sequence().effect().file(file).atLocation(token).scaleToObject(3).belowTokens().play();
      } catch {
        ui?.notifications?.warn?.(localize("ResourceUpdatedAnimationFailed"));
      }
    }
  }
  return next;
}
