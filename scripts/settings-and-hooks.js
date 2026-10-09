import { localize } from "./localization.js";
import {
  COSMERE_MODULE_ID,
  buildCosmereChatCard,
} from "./cosmere-helpers.js";
import { resolveJb2aAssetPath } from "./jb2a-assets.js";

export const COSMERE_SETTINGS = [
  { key: "seedRollTables", type: Boolean, default: true, requiresReload: true, get name() { return localize("SeedRollTables"); }, get hint() { return localize("SeedRollTablesHint"); } },
  { key: "tableSeedVersion", type: Number, default: 0, config: false, name: "Table seed version" },
  { key: "automaticRollHooks", type: Boolean, default: true, get name() { return localize("EnableAutomaticHooks"); } },
  { key: "natural20Effects", type: Boolean, default: true, get name() { return localize("Natural20Effects"); } },
  { key: "natural1Effects", type: Boolean, default: true, get name() { return localize("Natural1Effects"); } },
  { key: "rollRequestButtons", type: Boolean, default: true, get name() { return localize("RollRequestResponseButtons"); } },
  { key: "rollHookNotifications", type: Boolean, default: true, get name() { return localize("HookNotifications"); } },
  { key: "rollHookChatCards", type: Boolean, default: true, get name() { return localize("HookChatCards"); } },
  { key: "rollHookSound", type: Boolean, default: false, get name() { return localize("HookSounds"); } },
  { key: "rollHookAnimation", type: Boolean, default: true, get name() { return localize("HookAnimations"); } },
  { key: "soundVolume", type: Number, default: 0.8, get name() { return localize("SoundVolume"); } },
  { key: "useAnimations", type: Boolean, default: true, get name() { return localize("UseAnimationsWhenDependenciesAreAvailable"); } },
  { key: "publishChatDefault", type: Boolean, default: true, get name() { return localize("PostResultsToChatByDefault"); } },
  {
    key: "labelLanguage",
    type: String,
    default: "auto",
    get name() { return localize("ModuleLanguage"); },
    get hint() { return localize("ModuleLanguageHint"); },
    requiresReload: true,
    choices: { get auto() { return localize("FollowFoundryLanguage"); }, es: "Español", en: "English" },
  },
  { key: "experimentalTools", type: Boolean, default: false, get name() { return localize("EnableExperimentalTools"); } },
];

let hooksActivated = false;

function resolveAudioHelper() {
  return globalThis.foundry?.audio?.AudioHelper ?? globalThis.AudioHelper;
}

function settingValue(game, key) {
  const setting = COSMERE_SETTINGS.find(item => item.key === key);
  try {
    return game?.settings?.get?.(COSMERE_MODULE_ID, key) ?? setting?.default;
  } catch {
    return setting?.default;
  }
}

export function createSettingsRegistrationPlan() {
  return {
    moduleId: COSMERE_MODULE_ID,
    settings: COSMERE_SETTINGS.map(setting => ({
      key: setting.key,
      scope: "world",
      config: setting.config ?? true,
      type: setting.type,
      default: setting.default,
      name: setting.name,
      choices: setting.choices,
      hint: setting.hint,
      requiresReload: setting.requiresReload,
    })),
  };
}

export function registerCosmereSettings({ game = globalThis.game } = {}) {
  const register = setting => {
    game?.settings?.register?.(COSMERE_MODULE_ID, setting.key, {
      name: setting.name,
      scope: setting.scope,
      config: setting.config,
      type: setting.type,
      default: setting.default,
      choices: setting.choices,
      hint: setting.hint,
      requiresReload: setting.requiresReload,
    });
  };
  // Register the preference first so settings.get can read a saved override
  // while the remaining settings' labels are being resolved.
  const language = createSettingsRegistrationPlan().settings.find(setting => setting.key === "labelLanguage");
  language.name = "Module language / Idioma del módulo";
  register(language);
  const plan = createSettingsRegistrationPlan();
  for (const setting of plan.settings) {
    if (setting.key !== "labelLanguage") register(setting);
  }
  return plan;
}

export function inspectD20Rolls(message) {
  const d20Results = [];
  if (!message?.isRoll) {
    return { hasNatural20: false, hasNatural1: false, d20Results };
  }

  for (const roll of message.rolls ?? []) {
    for (const term of roll.terms ?? []) {
      if (term?.faces !== 20) continue;
      for (const result of term.results ?? []) {
        if (result?.active !== false && !result?.discarded && Number.isFinite(Number(result?.result))) {
          d20Results.push(Number(result.result));
        }
      }
    }
  }

  return {
    hasNatural20: d20Results.includes(20),
    hasNatural1: d20Results.includes(1),
    d20Results,
  };
}

function playHookAnimation({ type, game = globalThis.game, canvas = globalThis.canvas, Sequence = globalThis.Sequence } = {}) {
  if (typeof Sequence !== "function" || !canvas?.scene) return false;
  const center = { x: canvas.scene.width / 2, y: canvas.scene.height / 2 };
  const file = resolveJb2aAssetPath(type === "natural20"
    ? "Library/1st_Level/Thunderwave/Thunderwave_01_Bright_Blue_Center_600x600.webm"
    : "Library/Generic/UI/CriticalMiss_03_Red_200x200.webm", game);
  if (!file) return false;
  new Sequence().effect().file(file).atLocation(center).scale(5).play();
  return true;
}

async function publishHookCard({ type, message, ChatMessage = globalThis.ChatMessage } = {}) {
  if (!ChatMessage) return;
  const natural20 = type === "natural20";
  await ChatMessage.create({
    content: buildCosmereChatCard({
      eyebrow: localize("CosmereGlobalHook"),
      title: natural20 ? "Natural 20" : localize("CriticalFailure"),
      sections: [{
        label: localize("Result"),
        value: natural20
          ? localize("AD20RollShowedANatural20")
          : localize("AD20RollShowedANatural1"),
      }],
      accent: natural20 ? "#237a3b" : "#9f3a38",
    }),
    speaker: message?.speaker ?? ChatMessage.getSpeaker?.(),
    whisper: message?.whisper,
    blind: message?.blind,
  });
}

export async function handleDiceHook(messageId, context) {
  const { game, ui, ChatMessage, AudioHelper, canvas, Sequence } = context;
  if (!settingValue(game, "automaticRollHooks")) return;
  if (!game?.users?.activeGM?.isSelf) return;
  if (context.processedIds?.has(messageId)) return;
  const message = game?.messages?.get?.(messageId);
  const rollInspection = inspectD20Rolls(message);
  if (!rollInspection.hasNatural20 && !rollInspection.hasNatural1) return;
  context.processedIds?.add(messageId);
  // Keep deduplication bounded during long sessions.
  if (context.processedIds?.size > 1000) context.processedIds.delete(context.processedIds.values().next().value);

  for (const [key, enabledSetting, label] of [
    ["natural20", "natural20Effects", localize("Natural20Detected")],
    ["natural1", "natural1Effects", localize("CriticalFailureDetected")],
  ]) {
    const found = key === "natural20" ? rollInspection.hasNatural20 : rollInspection.hasNatural1;
    if (!found || !settingValue(game, enabledSetting)) continue;

    if (settingValue(game, "rollHookNotifications")) {
      ui?.notifications?.info?.(label);
    }
    if (settingValue(game, "rollHookChatCards")) {
      await publishHookCard({ type: key, message, ChatMessage });
    }
    if (settingValue(game, "rollHookSound")) {
      AudioHelper?.play?.({
        src: key === "natural20"
          ? `modules/${COSMERE_MODULE_ID}/sounds/oath-accepted-variant.wav`
          : `modules/${COSMERE_MODULE_ID}/sounds/thunder-variant-02.wav`,
        volume: settingValue(game, "soundVolume"),
        loop: false,
      }, true);
    }
    if (settingValue(game, "rollHookAnimation") && settingValue(game, "useAnimations")) {
      playHookAnimation({ type: key, game, canvas, Sequence });
    }
  }
}

function handleRollRequestButtons(message, html, { game, ui }) {
  if (!settingValue(game, "automaticRollHooks") || !settingValue(game, "rollRequestButtons")) return;
  const onClick = event => {
    const actorId = event.currentTarget.dataset.actorId;
    const skill = event.currentTarget.dataset.skill;
    const actor = game?.actors?.get?.(actorId);
    if (!actor?.rollSkill) {
      ui?.notifications?.error?.(localize("CouldNotFindTheActorForTheRoll"));
      return;
    }
    actor.rollSkill(skill, { chatMessage: true });
  };
  if (typeof html?.querySelectorAll === "function") {
    html.querySelectorAll("button.roll-solicitud").forEach(button => {
      button.addEventListener("click", onClick);
    });
    return;
  }
  html.find?.("button.roll-solicitud")?.click?.(onClick);
}

export function getChatRenderHookName({ game = globalThis.game } = {}) {
  const generation = Number(game?.release?.generation ?? String(game?.version ?? "").split(".")[0] ?? 0);
  return generation >= 13 ? "renderChatMessageHTML" : "renderChatMessage";
}

export function activateCosmereGlobalHooks({
  Hooks = globalThis.Hooks,
  game = globalThis.game,
  ui = globalThis.ui,
  ChatMessage = globalThis.ChatMessage,
  AudioHelper = resolveAudioHelper(),
  canvas = globalThis.canvas,
  Sequence = globalThis.Sequence,
} = {}) {
  if (!Hooks || hooksActivated) return false;
  hooksActivated = true;

  const context = { game, ui, ChatMessage, AudioHelper, canvas, Sequence, processedIds: new Set() };
  const handle = messageId => handleDiceHook(messageId, context).catch(error => {
    console.error("Cosmere RPG Tooling | Roll hook failed", error);
  });
  Hooks.on?.("diceSoNiceRollComplete", handle);
  Hooks.on?.("createChatMessage", message => {
    if (!game?.modules?.get?.("dice-so-nice")?.active) return handle(message.id);
  });
  Hooks.on?.(getChatRenderHookName({ game }), (message, html) => {
    handleRollRequestButtons(message, html, { game, ui });
  });
  return true;
}
