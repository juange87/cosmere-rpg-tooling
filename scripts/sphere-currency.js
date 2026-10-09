import { localize } from "./localization.js";

// Stable document names: changing a user's display language must not change
// currency identity. Inventory matching always uses system metadata.
export const SPHERE_ITEM_NAMES = Object.freeze({
  "spheres|chip": "Chip infused", "spheres|mark": "Mark infused", "spheres|broam": "Broam infused",
  "dun|chip": "Chip dun", "dun|mark": "Mark dun", "dun|broam": "Broam dun",
});
export function sphereItemName(currency, denom) {
  return SPHERE_ITEM_NAMES[`${currency}|${denom}`];
}

export const SPHERE_DENOMINATIONS = [
  { key: "spheres|chip", currency: "spheres", denom: "chip", get label() { return localize("ChipInfused"); }, value: 1 },
  { key: "spheres|mark", currency: "spheres", denom: "mark", get label() { return localize("MarkInfused"); }, value: 5 },
  { key: "spheres|broam", currency: "spheres", denom: "broam", get label() { return localize("BroamInfused"); }, value: 20 },
  { key: "dun|chip", currency: "dun", denom: "chip", get label() { return localize("ChipDun"); }, value: 1 },
  { key: "dun|mark", currency: "dun", denom: "mark", get label() { return localize("MarkDun"); }, value: 5 },
  { key: "dun|broam", currency: "dun", denom: "broam", get label() { return localize("BroamDun"); }, value: 20 },
];

export function sphereDenominationLabel(key) {
  return SPHERE_DENOMINATIONS.find(denom => denom.key === key)?.label
    ?? localize(key === "investitureDrain" ? "DrainAfterInvestiture" : "Denomination");
}
