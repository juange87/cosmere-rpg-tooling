import {
  buildCosmereChatCard,
  normalizeText,
  postCosmereChatCard,
} from "./cosmere-helpers.js";

export const LOCATION_TYPES = [
  { key: "warcamp", label: "Campamentos de guerra" },
  { key: "village", label: "Pueblos rosharianos" },
  { key: "caravan", label: "Caravanas" },
  { key: "lighteyesManor", label: "Mansiones lighteyes" },
  { key: "market", label: "Mercados" },
  { key: "ancientRuin", label: "Ruinas antiguas" },
  { key: "outpost", label: "Puestos de avanzada" },
  { key: "stormscar", label: "Zonas afectadas por highstorm" },
];

const LOCATION_PARTS = {
  look: [
    "crem-coated terraces around a narrow central path",
    "storm-bent stone buildings tied down with thick rope",
    "bright banners half-hidden by rain-dark cloth",
    "lanterns glowing through gemstone shutters",
    "chull tracks pressed deep into drying mud",
    "carved glyphs worn smooth by repeated storms",
  ],
  conflict: [
    "two local authorities claim command at the same time",
    "a missing shipment has made everyone suspicious",
    "a coming highstorm leaves too little time for caution",
    "a secret meeting is about to be exposed",
    "an old oath binds people who no longer trust each other",
    "a dangerous spren has become part of daily life",
  ],
  detail: [
    "a cracked spanreed writes one word every hour",
    "all maps of the place disagree on one room",
    "spheres dim whenever a certain name is spoken",
    "a wall has fresh handprints under ancient crem",
    "children know a safer route than the guards",
    "a quiet ardent watches outsiders too closely",
  ],
  opportunity: [
    "earn a local patron by solving the immediate dispute",
    "find shelter, supplies, or a guide before the storm hits",
    "recover a clue connected to a larger faction objective",
    "turn a rival's impatience into leverage",
    "gain a private audience with someone normally unreachable",
    "discover a hidden route into the next scene",
  ],
};

function hashSeed(seed, salt) {
  const text = `${seed}:${salt}`;
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pick(values, seed, salt) {
  return values[hashSeed(seed, salt) % values.length];
}

function resolveLocationType(typeKey) {
  return LOCATION_TYPES.find(type => type.key === typeKey) ?? LOCATION_TYPES[0];
}

export function buildLocationSeed({ typeKey = "village", seed = Date.now(), name = "" } = {}) {
  const type = resolveLocationType(typeKey);
  const seedText = String(seed ?? type.key);
  const title = normalizeText(name, `${type.label} ${hashSeed(seedText, "title") % 100}`);
  return {
    type,
    title,
    look: pick(LOCATION_PARTS.look, seedText, "look"),
    conflict: pick(LOCATION_PARTS.conflict, seedText, "conflict"),
    detail: pick(LOCATION_PARTS.detail, seedText, "detail"),
    opportunity: pick(LOCATION_PARTS.opportunity, seedText, "opportunity"),
    journalTitle: `Localizacion: ${title}`,
  };
}

export function buildLocationChatCard(locationInput) {
  const location = "type" in (locationInput ?? {})
    ? locationInput
    : buildLocationSeed(locationInput);
  return buildCosmereChatCard({
    eyebrow: "Generador de Localizaciones",
    title: location.title,
    subtitle: location.type.label,
    sections: [
      { label: "Aspecto", value: location.look },
      { label: "Tension", value: location.conflict },
      { label: "Detalle", value: location.detail },
      { label: "Oportunidad", value: location.opportunity },
    ],
    accent: "#7f6d5f",
    background: "#fbfaf7",
  });
}

export async function createLocationJournal({
  location,
  JournalEntry = globalThis.JournalEntry,
} = {}) {
  if (!JournalEntry) throw new Error("Foundry no esta disponible para crear Journal Entry.");
  const resolved = location ?? buildLocationSeed();
  return JournalEntry.create({
    name: resolved.journalTitle,
    pages: [{
      name: "Localizacion",
      type: "text",
      text: {
        format: 1,
        content: buildLocationChatCard(resolved),
      },
    }],
  });
}

export async function postLocationSeed({
  input = {},
  publishChat = true,
  createJournal = false,
  ChatMessage = globalThis.ChatMessage,
  JournalEntry = globalThis.JournalEntry,
} = {}) {
  const location = buildLocationSeed(input);
  if (publishChat) {
    await postCosmereChatCard({ content: buildLocationChatCard(location), ChatMessage });
  }
  if (createJournal) {
    await createLocationJournal({ location, JournalEntry });
  }
  return location;
}

function locationOptions() {
  return LOCATION_TYPES.map(type => `<option value="${type.key}">${type.label}</option>`).join("");
}

export function openLocationGenerator({
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  JournalEntry = globalThis.JournalEntry,
  ui = globalThis.ui,
} = {}) {
  if (!Dialog || !ChatMessage) throw new Error("Foundry no esta disponible para abrir el generador de localizaciones.");
  new Dialog({
    title: "Generador de Localizaciones",
    content: `
      <form>
        <div class="form-group"><label>Tipo</label><select name="typeKey">${locationOptions()}</select></div>
        <div class="form-group"><label>Nombre opcional</label><input name="name" type="text" /></div>
        <div class="form-group"><label>Semilla</label><input name="seed" type="text" placeholder="opcional" /></div>
        <label><input name="publishChat" type="checkbox" checked /> Publicar en chat</label>
        <label><input name="createJournal" type="checkbox" /> Crear Journal Entry</label>
      </form>
    `,
    buttons: {
      generate: {
        icon: '<i class="fas fa-map"></i>',
        label: "Generar",
        callback: async html => {
          try {
            await postLocationSeed({
              input: {
                typeKey: html.find("[name=typeKey]").val(),
                name: html.find("[name=name]").val(),
                seed: html.find("[name=seed]").val() || Date.now(),
              },
              publishChat: html.find("[name=publishChat]").is(":checked"),
              createJournal: html.find("[name=createJournal]").is(":checked"),
              ChatMessage,
              JournalEntry,
            });
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" },
    },
    default: "generate",
  }).render(true);
}
