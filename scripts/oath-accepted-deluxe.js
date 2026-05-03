import {
  COSMERE_MODULE_ID,
  buildCosmereChatCard,
  escapeHtml,
  gmWhisper,
  normalizeText,
} from "./cosmere-helpers.js";

export const RADIANT_ORDERS = [
  { key: "windrunner", label: "Windrunner", color: "#2f80ed", aura: "jb2a.magic_signs.circle.02.abjuration.loop.blue" },
  { key: "skybreaker", label: "Skybreaker", color: "#4f5b66", aura: "jb2a.magic_signs.circle.02.evocation.loop.blue" },
  { key: "dustbringer", label: "Dustbringer", color: "#b03a2e", aura: "jb2a.explosion.01.orange" },
  { key: "edgedancer", label: "Edgedancer", color: "#2e8b57", aura: "jb2a.magic_signs.circle.02.transmutation.loop.green" },
  { key: "truthwatcher", label: "Truthwatcher", color: "#2aa198", aura: "jb2a.magic_signs.circle.02.divination.loop.green" },
  { key: "lightweaver", label: "Lightweaver", color: "#c0398c", aura: "jb2a.magic_signs.circle.02.illusion.loop.purple" },
  { key: "elsecaller", label: "Elsecaller", color: "#5e3c99", aura: "jb2a.magic_signs.circle.02.conjuration.loop.purple" },
  { key: "willshaper", label: "Willshaper", color: "#d35400", aura: "jb2a.magic_signs.circle.02.transmutation.loop.orange" },
  { key: "stoneward", label: "Stoneward", color: "#7f6d5f", aura: "jb2a.magic_signs.circle.02.abjuration.loop.yellow" },
  { key: "bondsmith", label: "Bondsmith", color: "#b7950b", aura: "jb2a.magic_signs.circle.02.enchantment.loop.yellow" },
];

export const OATH_ACCEPTED_SOUNDS = {
  words: `modules/${COSMERE_MODULE_ID}/sounds/palabrasaceptadas.mp3`,
  thunder: `modules/${COSMERE_MODULE_ID}/sounds/thunder.mp3`,
  variant: `modules/${COSMERE_MODULE_ID}/sounds/oath-accepted-variant.wav`,
};

function resolveAudioHelper() {
  return globalThis.foundry?.audio?.AudioHelper ?? globalThis.AudioHelper;
}

function resolveOrder(orderKey) {
  return RADIANT_ORDERS.find(order => order.key === orderKey) ?? RADIANT_ORDERS[0];
}

export function buildOathAcceptedMoment({
  actorName = "",
  orderKey = "windrunner",
  idealText = "",
  whisperTarget = "",
  whisperUserId = "",
  whisperMessage = "",
  gmNote = "",
} = {}) {
  const order = resolveOrder(orderKey);
  return {
    actorName: normalizeText(actorName, "Radiant sin nombre"),
    order,
    idealText: normalizeText(idealText, "Las palabras han sido aceptadas."),
    whisperTarget: normalizeText(whisperTarget),
    whisperUserId: normalizeText(whisperUserId),
    whisperMessage: normalizeText(whisperMessage),
    gmNote: normalizeText(gmNote),
  };
}

export function buildOathAcceptedChatCard(momentInput) {
  const moment = buildOathAcceptedMoment(momentInput);
  const sections = [
    { label: "Actor", value: moment.actorName },
    { label: "Orden Radiant", value: moment.order.label },
    { label: "Ideal", value: moment.idealText },
  ];
  if (moment.whisperTarget) sections.push({ label: "Whisper previo", value: moment.whisperTarget });
  if (moment.gmNote) sections.push({ label: "Nota del GM", value: moment.gmNote });

  return buildCosmereChatCard({
    eyebrow: "Palabras Aceptadas Deluxe",
    title: "Palabras Aceptadas",
    sections,
    accent: moment.order.color,
    background: "#fffaf2",
  });
}

export function buildOathPreludeWhisperCard(momentInput) {
  const moment = buildOathAcceptedMoment(momentInput);
  return buildCosmereChatCard({
    eyebrow: "Palabras Aceptadas Deluxe",
    title: "Antes de las palabras",
    sections: [
      { label: "Actor", value: moment.actorName },
      { label: "Orden Radiant", value: moment.order.label },
      { label: "Whisper previo", value: moment.whisperMessage || "Preparate para el momento de jurar el Ideal." },
    ],
    accent: moment.order.color,
    background: "#fffaf2",
  });
}

function playRadiantAura({ moment, canvas = globalThis.canvas, Sequence = globalThis.Sequence } = {}) {
  if (typeof Sequence !== "function") return false;
  const token = canvas?.tokens?.controlled?.[0];
  const location = token ?? (canvas?.scene ? { x: canvas.scene.width / 2, y: canvas.scene.height / 2 } : null);
  if (!location) return false;
  new Sequence()
    .effect()
    .file(moment.order.aura)
    .atLocation(location)
    .scaleToObject?.(2.5)
    .fadeIn?.(500)
    .fadeOut?.(1200)
    .play();
  return true;
}

export async function runOathAcceptedDeluxe({
  input = {},
  playSound = true,
  playAnimation = true,
  whisperOnly = false,
  delayMs = 500,
  wait = ms => new Promise(resolve => setTimeout(resolve, ms)),
  AudioHelper = resolveAudioHelper(),
  ChatMessage = globalThis.ChatMessage,
  canvas = globalThis.canvas,
  Sequence = globalThis.Sequence,
} = {}) {
  if (!ChatMessage) {
    throw new Error("Foundry no esta disponible para publicar Palabras Aceptadas.");
  }

  const moment = buildOathAcceptedMoment(input);
  if (moment.whisperUserId) {
    await ChatMessage.create({
      content: buildOathPreludeWhisperCard(moment),
      speaker: ChatMessage.getSpeaker?.(),
      whisper: [moment.whisperUserId],
    });
  }
  if (playSound) {
    AudioHelper?.play?.({ src: OATH_ACCEPTED_SOUNDS.words, volume: 0.8, loop: false }, true);
    await wait(delayMs);
    AudioHelper?.play?.({ src: OATH_ACCEPTED_SOUNDS.thunder, volume: 1, loop: false }, true);
  }
  if (playAnimation) {
    playRadiantAura({ moment, canvas, Sequence });
  }

  await ChatMessage.create({
    content: buildOathAcceptedChatCard(moment),
    speaker: ChatMessage.getSpeaker?.(),
    whisper: whisperOnly ? gmWhisper(ChatMessage) : undefined,
  });

  return moment;
}

function orderOptions() {
  return RADIANT_ORDERS.map(order => `<option value="${order.key}">${order.label}</option>`).join("");
}

export function openOathAcceptedDeluxe({
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  AudioHelper = resolveAudioHelper(),
  game = globalThis.game,
  ui = globalThis.ui,
} = {}) {
  if (!Dialog || !ChatMessage) {
    throw new Error("Foundry no esta disponible para abrir Palabras Aceptadas Deluxe.");
  }

  const userOptions = [
    '<option value="">Sin whisper previo real</option>',
    ...Array.from(game?.users?.players ?? [])
      .map(user => `<option value="${escapeHtml(user.id)}">${escapeHtml(user.name)}</option>`),
  ].join("");

  new Dialog({
    title: "Palabras Aceptadas Deluxe",
    content: `
      <form>
        <div class="form-group"><label>Actor o token</label><input name="actorName" type="text" /></div>
        <div class="form-group"><label>Orden Radiant</label><select name="orderKey">${orderOptions()}</select></div>
        <div class="form-group"><label>Ideal</label><textarea name="idealText" rows="3"></textarea></div>
        <div class="form-group"><label>Etiqueta del whisper previo</label><input name="whisperTarget" type="text" /></div>
        <div class="form-group"><label>Jugador para whisper previo</label><select name="whisperUserId">${userOptions}</select></div>
        <div class="form-group"><label>Mensaje whisper previo</label><textarea name="whisperMessage" rows="2"></textarea></div>
        <div class="form-group"><label>Nota del GM</label><textarea name="gmNote" rows="2"></textarea></div>
        <label><input name="playSound" type="checkbox" checked /> Reproducir audio en dos fases</label>
        <label><input name="playAnimation" type="checkbox" checked /> Mostrar aura JB2A si esta disponible</label>
        <label><input name="whisperOnly" type="checkbox" /> Enviar tarjeta solo al GM</label>
      </form>
    `,
    buttons: {
      publish: {
        icon: '<i class="fas fa-volume-up"></i>',
        label: "Aceptar palabras",
        callback: async html => {
          try {
            await runOathAcceptedDeluxe({
              input: {
                actorName: html.find("[name=actorName]").val(),
                orderKey: html.find("[name=orderKey]").val(),
                idealText: html.find("[name=idealText]").val(),
                whisperTarget: html.find("[name=whisperTarget]").val(),
                whisperUserId: html.find("[name=whisperUserId]").val(),
                whisperMessage: html.find("[name=whisperMessage]").val(),
                gmNote: html.find("[name=gmNote]").val(),
              },
              playSound: html.find("[name=playSound]").is(":checked"),
              playAnimation: html.find("[name=playAnimation]").is(":checked"),
              whisperOnly: html.find("[name=whisperOnly]").is(":checked"),
              AudioHelper,
              ChatMessage,
            });
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" },
    },
    default: "publish",
  }).render(true);
}
