import {
  buildCosmereChatCard,
  normalizeText,
  postCosmereChatCard,
} from "./cosmere-helpers.js";
import { hasCosmereDialogSupport, openCosmereDialog } from "./foundry-dialogs.js";

export const QUICK_SCENE_TYPES = [
  { key: "chase", label: "Persecucion" },
  { key: "infiltration", label: "Infiltracion" },
  { key: "socialDuel", label: "Duelo social" },
  { key: "discovery", label: "Descubrimiento" },
  { key: "dangerousTravel", label: "Viaje peligroso" },
  { key: "negotiation", label: "Negociacion" },
  { key: "stormPrep", label: "Preparacion antes de tormenta" },
];

const BEATS = {
  chase: ["Establece la distancia inicial.", "Introduce un obstaculo de terreno.", "Ofrece un atajo con coste.", "Cierra con captura, escape o giro."],
  infiltration: ["Marca el punto de entrada.", "Define una patrulla o cerradura.", "Revela una sala con informacion util.", "Haz sonar una alarma parcial."],
  socialDuel: ["Presenta la postura publica.", "Introduce una prueba social.", "Permite una concesion con coste.", "Cierra con favor, deuda o humillacion."],
  discovery: ["Muestra un detalle imposible.", "Conecta la pista con una faccion.", "Anade un riesgo por tocar o leer.", "Entrega una pregunta nueva."],
  dangerousTravel: ["Define clima y urgencia.", "Consume recurso o tiempo.", "Introduce un encuentro lateral.", "Llega con una consecuencia visible."],
  negotiation: ["Declara lo que cada parte quiere.", "Presenta una linea roja.", "Ofrece una moneda de cambio.", "Cierra con acuerdo, amenaza o deuda."],
  stormPrep: ["Cuenta atras hasta el impacto.", "Escoge refugio y prioridades.", "Introduce una complicacion de ultima hora.", "Resuelve que queda expuesto tras la tormenta."],
};

function resolveSceneType(typeKey) {
  return QUICK_SCENE_TYPES.find(type => type.key === typeKey) ?? QUICK_SCENE_TYPES[0];
}

function hashSeed(seed) {
  return String(seed ?? "").split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
}

export function buildQuickSceneSeed({ typeKey = "chase", seed = Date.now(), title = "" } = {}) {
  const type = resolveSceneType(typeKey);
  const twistIndex = hashSeed(seed) % 4;
  return {
    type,
    title: normalizeText(title, type.label),
    beats: BEATS[type.key],
    twist: [
      "Un aliado llega con informacion incompleta.",
      "El coste real aparece despues de aceptar.",
      "Una faccion secundaria observa la escena.",
      "La solucion obvia empeora el siguiente problema.",
    ][twistIndex],
  };
}

export function buildQuickSceneChatCard(sceneInput) {
  const scene = "type" in (sceneInput ?? {})
    ? sceneInput
    : buildQuickSceneSeed(sceneInput);
  return buildCosmereChatCard({
    eyebrow: "Compendio de Escenas Rapidas",
    title: scene.title,
    subtitle: scene.type.label,
    sections: [
      ...scene.beats.map((beat, index) => ({ label: `Beat ${index + 1}`, value: beat })),
      { label: "Giro", value: scene.twist },
    ],
    accent: "#1e3a5f",
  });
}

export async function postQuickScene({
  input = {},
  ChatMessage = globalThis.ChatMessage,
} = {}) {
  const scene = buildQuickSceneSeed(input);
  await postCosmereChatCard({ content: buildQuickSceneChatCard(scene), ChatMessage });
  return scene;
}

function sceneOptions() {
  return QUICK_SCENE_TYPES.map(type => `<option value="${type.key}">${type.label}</option>`).join("");
}

export function openQuickSceneCompendium({
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  ui = globalThis.ui,
} = {}) {
  if (!hasCosmereDialogSupport({ Dialog }) || !ChatMessage) {
    throw new Error("Foundry no esta disponible para abrir escenas rapidas.");
  }
  openCosmereDialog({
    title: "Compendio de Escenas Rapidas",
    content: `
      <form>
        <div class="form-group"><label>Escena</label><select name="typeKey">${sceneOptions()}</select></div>
        <div class="form-group"><label>Titulo opcional</label><input name="title" type="text" /></div>
        <div class="form-group"><label>Semilla</label><input name="seed" type="text" /></div>
      </form>
    `,
    buttons: {
      publish: {
        icon: '<i class="fas fa-theater-masks"></i>',
        label: "Publicar",
        callback: async html => {
          try {
            await postQuickScene({
              input: {
                typeKey: html.find("[name=typeKey]").val(),
                title: html.find("[name=title]").val(),
                seed: html.find("[name=seed]").val() || Date.now(),
              },
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
  }, { Dialog });
}
