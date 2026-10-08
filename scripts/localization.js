const MODULE_ID = "cosmere-rpg-tooling";

// Load both catalogs before dependent modules execute. This also allows the
// module language to differ from Foundry's language without changing game.i18n.
async function loadCatalog(language) {
  const url = new URL(`../lang/${language}.json`, import.meta.url);
  if (url.protocol === "file:") {
    const { readFile } = await import("node:fs/promises");
    return JSON.parse(await readFile(url, "utf8")).COSMERE_TOOLS;
  }
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Could not load Cosmere ${language} translations (${response.status}).`);
  return (await response.json()).COSMERE_TOOLS;
}

const [english, spanish] = await Promise.all([loadCatalog("en"), loadCatalog("es")]);
const catalogs = { en: english, es: spanish };

export function getCosmereLanguage(game = globalThis.game) {
  let preference;
  try {
    preference = game?.settings?.get?.(MODULE_ID, "labelLanguage");
  } catch {
    // Settings may not have been registered yet during module initialization.
  }
  if (preference === "en" || preference === "es") return preference;
  return String(game?.i18n?.lang ?? "en").toLowerCase().split(/[-_]/)[0] === "es" ? "es" : "en";
}

/** Translate module-owned text only; never pass player names or notes here. */
export function localize(key, { game = globalThis.game } = {}) {
  const language = getCosmereLanguage(game);
  const fullKey = `COSMERE_TOOLS.${key}`;
  // Allow Foundry translation modules to override text when languages agree.
  if (game?.i18n?.lang === language && game.i18n.localize) {
    const translated = game.i18n.localize(fullKey);
    if (typeof translated === "string" && translated !== fullKey) return translated;
  }
  return catalogs[language][key] ?? english[key] ?? key;
}
