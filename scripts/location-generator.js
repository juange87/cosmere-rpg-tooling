import { localize } from "./localization.js";
import {
  buildCosmereChatCard,
  normalizeText,
  postCosmereChatCard,
} from "./cosmere-helpers.js";
import { hasCosmereDialogSupport, openCosmereDialog } from "./foundry-dialogs.js";

export const LOCATION_TYPES = [
  { key: "warcamp", get label() { return localize("Warcamps"); } },
  { key: "village", get label() { return localize("RosharanVillages"); } },
  { key: "caravan", get label() { return localize("Caravans"); } },
  { key: "lighteyesManor", get label() { return localize("LighteyesManors"); } },
  { key: "market", get label() { return localize("Markets"); } },
  { key: "ancientRuin", get label() { return localize("AncientRuins"); } },
  { key: "outpost", get label() { return localize("Outposts"); } },
  { key: "stormscar", get label() { return localize("HighstormStruckAreas"); } },
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
    journalTitle: `${localize("Location")}${title}`,
  };
}

export function buildLocationChatCard(locationInput) {
  const location = "type" in (locationInput ?? {})
    ? locationInput
    : buildLocationSeed(locationInput);
  return buildCosmereChatCard({
    eyebrow: localize("LocationGenerator"),
    title: location.title,
    subtitle: location.type.label,
    sections: [
      { label: localize("Appearance"), value: location.look },
      { label: "Tension", value: location.conflict },
      { label: localize("Detail"), value: location.detail },
      { label: localize("Opportunity"), value: location.opportunity },
    ],
    accent: "#7f6d5f",
    background: "#fbfaf7",
  });
}

export async function createLocationJournal({
  location,
  JournalEntry = globalThis.JournalEntry,
} = {}) {
  if (!JournalEntry) throw new Error(localize("FoundryIsNotAvailableToCreateAJournalEntry"));
  const resolved = location ?? buildLocationSeed();
  return JournalEntry.create({
    name: resolved.journalTitle,
    pages: [{
      name: localize("Location2"),
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
  if (!hasCosmereDialogSupport({ Dialog }) || !ChatMessage) {
    throw new Error(localize("FoundryIsNotAvailableToOpenTheLocationGenerator"));
  }
  openCosmereDialog({
    title: localize("LocationGenerator"),
    content: `
      <form>
        <div class="form-group"><label>${localize("Type")}</label><select name="typeKey">${locationOptions()}</select></div>
        <div class="form-group"><label>${localize("OptionalName")}</label><input name="name" type="text" /></div>
        <div class="form-group"><label>${localize("Seed")}</label><input name="seed" type="text" placeholder="${localize("Optional")}" /></div>
        <label><input name="publishChat" type="checkbox" checked /> ${localize("PostToChat")}</label>
        <label><input name="createJournal" type="checkbox" /> ${localize("CreateJournalEntry")}</label>
      </form>
    `,
    buttons: {
      generate: {
        icon: '<i class="fas fa-map"></i>',
        label: localize("Generate"),
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
      cancel: { icon: '<i class="fas fa-times"></i>', label: localize("Cancel") },
    },
    default: "generate",
  }, { Dialog });
}
