import {
  buildCosmereChatCard,
  normalizeText,
  postCosmereChatCard,
} from "./cosmere-helpers.js";

export const SURGES = [
  { key: "adhesion", label: "Adhesion", file: "jb2a.impact.ground_crack.blue", cue: "Une superficies, juramentos o atencion en un instante clave." },
  { key: "gravitation", label: "Gravitation", file: "jb2a.energy_beam.normal.blue", cue: "Cambia la direccion de la caida o marca un lash visual." },
  { key: "division", label: "Division", file: "jb2a.explosion.03.orange", cue: "Muestra desintegracion, calor o fractura peligrosa." },
  { key: "abrasion", label: "Abrasion", file: "jb2a.wind_stream.white", cue: "Marca movimiento fluido, resbaladizo o imposible de agarrar." },
  { key: "progression", label: "Progression", file: "jb2a.healing_generic.02.green", cue: "Representa crecimiento, curacion o vida acelerada." },
  { key: "illumination", label: "Illumination", file: "jb2a.template_circle.symbol.normal.illusion.purple", cue: "Crea luz, imagen o distraccion sensorial." },
  { key: "transformation", label: "Transformation", file: "jb2a.particles.outward.greenyellow.01.03", cue: "Senala soulcasting o cambio de materia." },
  { key: "transportation", label: "Transportation", file: "jb2a.misty_step.02.blue", cue: "Marca transicion, salto o roce con Shadesmar." },
  { key: "cohesion", label: "Cohesion", file: "jb2a.impact.ground_crack.orange", cue: "Moldea piedra, barro o superficies solidas." },
  { key: "tension", label: "Tension", file: "jb2a.shield.01.outro.yellow", cue: "Endurece o rigidiza materiales bajo Investiture." },
];

function resolveSurge(surgeKey) {
  return SURGES.find(surge => surge.key === surgeKey) ?? SURGES[0];
}

export function buildSurgebindingFx({
  surgeKey = "adhesion",
  actorName = "",
  targetName = "",
  note = "",
} = {}) {
  const surge = resolveSurge(surgeKey);
  return {
    surge,
    actorName: normalizeText(actorName, "Surgebinder"),
    targetName: normalizeText(targetName, "Escena"),
    note: normalizeText(note, surge.cue),
  };
}

export function buildSurgebindingChatCard(input) {
  const fx = buildSurgebindingFx(input);
  return buildCosmereChatCard({
    eyebrow: "Surgebinding FX",
    title: fx.surge.label,
    sections: [
      { label: "Origen", value: fx.actorName },
      { label: "Objetivo", value: fx.targetName },
      { label: "Descripcion", value: fx.note },
    ],
    accent: "#2f80ed",
    background: "#f5fbff",
  });
}

export async function playSurgebindingFx({
  input = {},
  publishChat = true,
  ChatMessage = globalThis.ChatMessage,
  Sequence = globalThis.Sequence,
  canvas = globalThis.canvas,
  ui = globalThis.ui,
} = {}) {
  const fx = buildSurgebindingFx(input);
  const source = canvas?.tokens?.controlled?.[0];
  const target = Array.from(globalThis.game?.user?.targets ?? [])[0] ?? source;

  if (typeof Sequence === "function" && source) {
    new Sequence()
      .effect()
      .file(fx.surge.file)
      .atLocation(source)
      .stretchTo?.(target)
      .play();
  } else {
    ui?.notifications?.warn?.("Sequencer no esta disponible; se publicara solo la tarjeta narrativa.");
  }

  if (publishChat) {
    await postCosmereChatCard({
      content: buildSurgebindingChatCard(fx),
      ChatMessage,
    });
  }

  return fx;
}

function surgeOptions() {
  return SURGES.map(surge => `<option value="${surge.key}">${surge.label}</option>`).join("");
}

export function openSurgebindingFxDialog({
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  ui = globalThis.ui,
} = {}) {
  if (!Dialog || !ChatMessage) {
    throw new Error("Foundry no esta disponible para abrir Surgebinding FX Pack.");
  }

  new Dialog({
    title: "Surgebinding FX Pack",
    content: `
      <form>
        <div class="form-group"><label>Surge</label><select name="surgeKey">${surgeOptions()}</select></div>
        <div class="form-group"><label>Actor</label><input name="actorName" type="text" /></div>
        <div class="form-group"><label>Objetivo</label><input name="targetName" type="text" /></div>
        <div class="form-group"><label>Descripcion</label><textarea name="note" rows="2"></textarea></div>
        <label><input name="publishChat" type="checkbox" checked /> Publicar tarjeta</label>
      </form>
    `,
    buttons: {
      play: {
        icon: '<i class="fas fa-bolt"></i>',
        label: "Lanzar efecto",
        callback: async html => {
          try {
            await playSurgebindingFx({
              input: {
                surgeKey: html.find("[name=surgeKey]").val(),
                actorName: html.find("[name=actorName]").val(),
                targetName: html.find("[name=targetName]").val(),
                note: html.find("[name=note]").val(),
              },
              publishChat: html.find("[name=publishChat]").is(":checked"),
              ChatMessage,
              ui,
            });
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" },
    },
    default: "play",
  }).render(true);
}
