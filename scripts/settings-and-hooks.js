import { localize } from "./localization.js";
import {
  COSMERE_MODULE_ID,
  isActiveGM,
  clientSoundVolume,
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

export const CLIENT_SETTING_KEYS = new Set(["rollHookSound", "rollHookAnimation", "soundVolume", "useAnimations"]);
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
      scope: CLIENT_SETTING_KEYS.has(setting.key) ? "client" : "world",
      config: setting.config ?? true,
      type: setting.type,
      default: setting.default,
      name: setting.name,
      choices: setting.choices,
      hint: setting.hint,
      requiresReload: setting.requiresReload,
      range: setting.key === "soundVolume" ? { min: 0, max: 1, step: 0.05 } : undefined,
    })),
  };
}

export function registerCosmereSettings({ game = globalThis.game } = {}) {
  const register = setting => {
    // Preserve the former world value as the initial client default. An
    // existing client value remains authoritative in Foundry's settings store.
    let defaultValue = setting.default;
    if (setting.scope === "client") {
      const stored = game?.settings?.storage?.get?.("world")?.getSetting?.(`${COSMERE_MODULE_ID}.${setting.key}`);
      if (stored) {
        try {
          const value = typeof stored.value === "string" ? JSON.parse(stored.value) : stored.value;
          if ((setting.type === Boolean && typeof value === "boolean") || (setting.type === Number && Number.isFinite(value))) defaultValue = value;
        } catch { /* Ignore malformed old settings. */ }
      }
    }
    game?.settings?.register?.(COSMERE_MODULE_ID, setting.key, {
      name: setting.name,
      scope: setting.scope,
      config: setting.config,
      type: setting.type,
      default: defaultValue,
      choices: setting.choices,
      hint: setting.hint,
      requiresReload: setting.requiresReload,
      range: setting.range,
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

function eligibleDiceInspection(message, game, inspection) {
  if (!message?.isRoll || !settingValue(game, "automaticRollHooks")
    || message.isContentVisible === false || (message.blind && !game?.user?.isGM && !isActiveGM(game))) return null;
  const result = inspection ?? inspectD20Rolls(message);
  return ((result.hasNatural20 && settingValue(game, "natural20Effects"))
    || (result.hasNatural1 && settingValue(game, "natural1Effects"))) ? result : null;
}

function rememberProcessedRoll(processedIds, messageId) {
  processedIds?.add(messageId);
  if (processedIds?.size > 1000) processedIds.delete(processedIds.values().next().value);
}

function playHookAnimation({ type, game = globalThis.game, canvas = globalThis.canvas, Sequence = globalThis.Sequence } = {}) {
  if (typeof Sequence !== "function" || !canvas?.scene) return false;
  const center = { x: canvas.scene.width / 2, y: canvas.scene.height / 2 };
  const file = resolveJb2aAssetPath(type === "natural20"
    ? "Library/1st_Level/Thunderwave/Thunderwave_01_Bright_Blue_Center_600x600.webm"
    : "Library/Generic/UI/CriticalMiss_03_Red_200x200.webm", game);
  if (!file) return false;
  new Sequence().effect().file(file).atLocation(center).scale(5).play({ local: true });
  return true;
}

async function publishHookCard({ type, message, ChatMessage = globalThis.ChatMessage } = {}) {
  if (!ChatMessage) return;
  const natural20 = type === "natural20";
  await ChatMessage.create({
    content: buildCosmereChatCard({
      eyebrow: localize("CosmereGlobalHook"),
      title: natural20 ? localize("Natural20") : localize("CriticalFailure"),
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

export async function handleDiceHook(messageId, context, inspection) {
  const { game, ui, ChatMessage, AudioHelper, canvas, Sequence } = context;
  if (context.processedIds?.has(messageId)) return;
  const message = game?.messages?.get?.(messageId);
  const rollInspection = eligibleDiceInspection(message, game, inspection);
  if (!rollInspection) return;
  rememberProcessedRoll(context.processedIds, messageId);

  for (const [key, enabledSetting, label] of [
    ["natural20", "natural20Effects", localize("Natural20Detected")],
    ["natural1", "natural1Effects", localize("CriticalFailureDetected")],
  ]) {
    const found = key === "natural20" ? rollInspection.hasNatural20 : rollInspection.hasNatural1;
    if (!found || !settingValue(game, enabledSetting)) continue;

    if (settingValue(game, "rollHookNotifications")) {
      ui?.notifications?.info?.(label);
    }
    if (isActiveGM(game) && settingValue(game, "rollHookChatCards")) {
      await publishHookCard({ type: key, message, ChatMessage });
    }
    if (settingValue(game, "rollHookSound")) {
      AudioHelper?.play?.({
        src: key === "natural20"
          ? `modules/${COSMERE_MODULE_ID}/sounds/oath-accepted-variant.wav`
          : `modules/${COSMERE_MODULE_ID}/sounds/thunder-variant-02.wav`,
        volume: clientSoundVolume(game),
        loop: false,
      }, false);
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
    if (!actor?.rollSkill || actor.isOwner === false) {
      ui?.notifications?.error?.(localize("CouldNotFindTheActorForTheRoll"));
      return;
    }
    Promise.resolve(actor.rollSkill(skill, { chatMessage: true })).catch(error => ui?.notifications?.error?.(error.message));
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

// DSN sets _dice3danimating synchronously in createChatMessage. Defer one
// check until all creation listeners have run, without its uncancellable waiter.
export function createDiceHookScheduler({ game, handle, processedIds = new Set(), logger = console, setTimer = setTimeout, clearTimer = clearTimeout }) {
  const pending = new Map();
  // Public DSN lifecycle hooks can precede our creation listener. Weak
  // references track only live interactive documents, without an internal API.
  const interactiveMessages = new WeakSet();
  const pendingOpened = messageId => {
    const message = game?.messages?.get?.(messageId);
    if (message) interactiveMessages.add(message);
  };
  const pendingClosed = messageId => {
    const message = game?.messages?.get?.(messageId);
    if (message) interactiveMessages.delete(message);
  };
  const interactivePending = message => interactiveMessages.has(message)
    || message?.flags?.["dice-so-nice"]?.interactiveThrow?.state === "pending";
  const cancel = messageId => {
    const entry = pending.get(messageId);
    if (entry) clearTimer(entry.timer);
    pending.delete(messageId);
  };
  const finish = (messageId, timedOut = false) => {
    const message = game?.messages?.get?.(messageId);
    if (processedIds.has(messageId) || !message) { cancel(messageId); return; }
    const inspection = eligibleDiceInspection(message, game, pending.get(messageId)?.inspection);
    if (!inspection) { cancel(messageId); return; }
    // Intermediate DSN completions wait; a timed-out renderer gets one fallback.
    if (message._dice3danimating && !timedOut) return;
    cancel(messageId);
    // The handler owns the shared history and claims the ID before awaiting.
    return handle(messageId, inspection);
  };
  const complete = messageId => finish(messageId);
  const deleted = message => {
    cancel(message.id);
    processedIds.delete(message.id);
    interactiveMessages.delete(message);
  };
  const created = message => {
    if (!message || processedIds.has(message.id) || pending.has(message.id)) return;
    const inspection = eligibleDiceInspection(message, game);
    if (!inspection) return;
    if (!game?.modules?.get?.("dice-so-nice")?.active || game?.dice3d?.isEnabled?.() === false) return complete(message.id);
    const entry = { checks: 0, inspection };
    pending.set(message.id, entry);
    const probe = () => {
      if (pending.get(message.id) !== entry) return;
      const current = game?.messages?.get?.(message.id);
      if (!eligibleDiceInspection(current, game, entry.inspection)) { cancel(message.id); return; }
      const interactive = interactivePending(current);
      if (!current._dice3danimating && !interactive) return complete(message.id);
      if (++entry.checks >= 30) {
        logger?.warn?.("Cosmere RPG Tooling | Dice So Nice animation wait timed out", { messageId: message.id });
        // Interactive throws can intentionally remain pending; never reveal them.
        if (interactive) { cancel(message.id); return; }
        return finish(message.id, true);
      }
      entry.timer = setTimer(probe, 1000);
    };
    entry.timer = setTimer(probe, 100);
  };
  return { created, complete, deleted, pendingOpened, pendingClosed };
}

export function activateCosmereGlobalHooks({
  Hooks = globalThis.Hooks,
  game = globalThis.game,
  ui = globalThis.ui,
  ChatMessage = globalThis.ChatMessage,
  AudioHelper = resolveAudioHelper(),
  canvas = globalThis.canvas,
  Sequence = globalThis.Sequence,
  setTimer = setTimeout,
  clearTimer = clearTimeout,
} = {}) {
  if (!Hooks || hooksActivated) return false;
  hooksActivated = true;

  const context = { game, ui, ChatMessage, AudioHelper, canvas, Sequence, processedIds: new Set() };
  const handle = (messageId, inspection) => handleDiceHook(messageId, context, inspection).catch(error => {
    console.error("Cosmere RPG Tooling | Roll hook failed", error);
  });
  const scheduler = createDiceHookScheduler({ game, handle, processedIds: context.processedIds, setTimer, clearTimer });
  Hooks.on?.("diceSoNiceRollComplete", scheduler.complete);
  Hooks.on?.("createChatMessage", scheduler.created);
  Hooks.on?.("deleteChatMessage", scheduler.deleted);
  Hooks.on?.("diceSoNicePendingThrowOpened", scheduler.pendingOpened);
  Hooks.on?.("diceSoNicePendingThrowClosed", scheduler.pendingClosed);
  Hooks.on?.(getChatRenderHookName({ game }), (message, html) => {
    handleRollRequestButtons(message, html, { game, ui });
  });
  return true;
}
