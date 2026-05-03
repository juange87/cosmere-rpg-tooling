import {
  COSMERE_MODULE_ID,
  buildCosmereChatCard,
} from "./cosmere-helpers.js";

export const COSMERE_SETTINGS = [
  { key: "automaticRollHooks", type: Boolean, default: true, name: "Activar hooks automaticos" },
  { key: "natural20Effects", type: Boolean, default: true, name: "Efectos de natural 20" },
  { key: "natural1Effects", type: Boolean, default: true, name: "Efectos de natural 1" },
  { key: "rollRequestButtons", type: Boolean, default: true, name: "Botones de respuesta a solicitudes" },
  { key: "rollHookNotifications", type: Boolean, default: true, name: "Notificaciones de hooks" },
  { key: "rollHookChatCards", type: Boolean, default: true, name: "Chat cards de hooks" },
  { key: "rollHookSound", type: Boolean, default: false, name: "Sonido en hooks" },
  { key: "rollHookAnimation", type: Boolean, default: true, name: "Animacion en hooks" },
  { key: "soundVolume", type: Number, default: 0.8, name: "Volumen de sonidos" },
  { key: "useAnimations", type: Boolean, default: true, name: "Usar animaciones si hay dependencias" },
  { key: "publishChatDefault", type: Boolean, default: true, name: "Publicar resultados en chat por defecto" },
  {
    key: "labelLanguage",
    type: String,
    default: "es",
    name: "Idioma preferido de etiquetas",
    choices: { es: "Espanol", en: "English" },
  },
  { key: "experimentalTools", type: Boolean, default: false, name: "Habilitar herramientas experimentales" },
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
      config: true,
      type: setting.type,
      default: setting.default,
      name: setting.name,
      choices: setting.choices,
    })),
  };
}

export function registerCosmereSettings({ game = globalThis.game } = {}) {
  const plan = createSettingsRegistrationPlan();
  for (const setting of plan.settings) {
    game?.settings?.register?.(plan.moduleId, setting.key, {
      name: setting.name,
      scope: setting.scope,
      config: setting.config,
      type: setting.type,
      default: setting.default,
      choices: setting.choices,
    });
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
        if (Number.isFinite(Number(result?.result))) {
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

function playHookAnimation({ type, canvas = globalThis.canvas, Sequence = globalThis.Sequence } = {}) {
  if (typeof Sequence !== "function" || !canvas?.scene) return false;
  const center = { x: canvas.scene.width / 2, y: canvas.scene.height / 2 };
  const file = type === "natural20"
    ? "modules/JB2A_DnD5e/Library/1st_Level/Thunderwave/Thunderwave_01_Bright_Blue_Center_600x600.webm"
    : "modules/JB2A_DnD5e/Library/Generic/UI/CriticalMiss_03_Red_200x200.webm";
  new Sequence().effect().file(file).atLocation(center).scale(5).play();
  return true;
}

async function publishHookCard({ type, ChatMessage = globalThis.ChatMessage } = {}) {
  if (!ChatMessage) return;
  const natural20 = type === "natural20";
  await ChatMessage.create({
    content: buildCosmereChatCard({
      eyebrow: "Hook global Cosmere",
      title: natural20 ? "Natural 20" : "Fallo critico",
      sections: [{
        label: "Resultado",
        value: natural20
          ? "Una tirada con d20 mostro un 20 natural."
          : "Una tirada con d20 mostro un 1 natural.",
      }],
      accent: natural20 ? "#237a3b" : "#9f3a38",
    }),
    speaker: ChatMessage.getSpeaker?.(),
  });
}

async function handleDiceHook(messageId, context) {
  const { game, ui, ChatMessage, AudioHelper, canvas, Sequence } = context;
  if (!settingValue(game, "automaticRollHooks")) return;
  const message = game?.messages?.get?.(messageId);
  const rollInspection = inspectD20Rolls(message);

  for (const [key, enabledSetting, label] of [
    ["natural20", "natural20Effects", "Natural 20 detectado"],
    ["natural1", "natural1Effects", "Fallo critico detectado"],
  ]) {
    const found = key === "natural20" ? rollInspection.hasNatural20 : rollInspection.hasNatural1;
    if (!found || !settingValue(game, enabledSetting)) continue;

    if (settingValue(game, "rollHookNotifications")) {
      ui?.notifications?.info?.(label);
    }
    if (settingValue(game, "rollHookChatCards")) {
      await publishHookCard({ type: key, ChatMessage });
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
      playHookAnimation({ type: key, canvas, Sequence });
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
      ui?.notifications?.error?.("No se encontro el actor para la tirada.");
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

  Hooks.on?.("diceSoNiceRollComplete", messageId => {
    handleDiceHook(messageId, { game, ui, ChatMessage, AudioHelper, canvas, Sequence });
  });
  Hooks.on?.(getChatRenderHookName({ game }), (message, html) => {
    handleRollRequestButtons(message, html, { game, ui });
  });
  return true;
}
