import { COSMERE_MODULE_ID } from "./cosmere-helpers.js";

export const API_TOOLS = {
  "openConversationEndeavorManager": "conversation-endeavor-manager.js",
  "runDependencyCheck": "dependency-checker.js",
  "openFirstStepCharacterGenerator": "first-step-character-generator.js",
  "openGmPanel": "gm-panel.js",
  "openHighstormToolkit": "highstorm-toolkit.js",
  "openLocationGenerator": "location-generator.js",
  "openMacroUpgradeChecker": "macro-upgrade-checker.js",
  "runMacroValidation": "macro-validator.js",
  "openPlotDieManager": "plot-die-manager.js",
  "openQuickSceneCompendium": "quick-scene-compendium.js",
  "openResourceControl": "resource-control.js",
  "openRosharNpcGenerator": "roshar-npc-generator.js",
  "openSphereManager": "sphere-manager.js",
  "playSurgebindingFx": "surgebinding-fx-pack.js",
  "openSurgebindingFxDialog": "surgebinding-fx-pack.js",
  "openOathAcceptedDeluxe": "oath-accepted-deluxe.js"
};

export const LEGACY_SCRIPTS = {
  "87gGNbW3oGPdYImJ": "./legacy/show-token.js",
  "8UNPEwp2pTovSVEy": "./legacy/increase-focus.js",
  "9MDhU9WMv0QKYH3D": "./legacy/critical-miss-animation.js",
  "A6ksZ4rFKvgMdzd0": "./legacy/strike-hammer.js",
  "D8DqP5B4iB75DPEG": "./legacy/weapon-throw-with-return.js",
  "J43Gdv2F7hL20Pjd": "./legacy/spreen-flight.js",
  "JftnYfOMuXevgcjV": "./legacy/hook-20-natural.js",
  "Llo5ZpODs3yEeKhS": "./legacy/increase-health.js",
  "N7CyEcZGTFRrGeKr": "./legacy/bomb-throw.js",
  "OHzWpcVmcfaHsk4z": "./legacy/request-roll.js",
  "PFVU35wn6SQ4hYxg": "./legacy/remove-spheres.js",
  "QSbK84EwO8jsXRt3": "./legacy/unarmed-strike.js",
  "ViwtbiTGShaoQNML": "./legacy/reduce-focus.js",
  "Xsza2APBB4GYmmIq": "./legacy/longspear-strike.js",
  "aPHfJqQlm7EKoGyN": "./legacy/reduce-health.js",
  "bEpngKnkXvyYyriw": "./legacy/teleport.js",
  "hIqhA14oO23gtyJJ": "./legacy/knife.js",
  "mSA2KpnWle0X6E6m": "./legacy/hook-critical-failure.js",
  "wilsiRBC31LfydfP": "./legacy/send-message.js",
  "z8dLwcyv2CkyTvLS": "./legacy/distribute-spheres.js",
  "0JHL311anJDxrCuP": "./legacy/stealth-roll.js",
  "14tGXTB3AbrChE0p": "./legacy/roll-skill.js",
  "1LvLzqT9BCpicpGB": "./legacy/thievery-roll.js",
  "3oQ5GQS3iPufWZu5": "./legacy/discipline-roll.js",
  "8QU2NZnal5dOq517": "./legacy/heavy-weapons-roll.js",
  "FZ6RCgwyRzkDsYZZ": "./legacy/medicine-roll.js",
  "GeuePkFbewNYqRLx": "./legacy/insight-roll.js",
  "HJVPY1eo2kDqGUls": "./legacy/leadership-roll.js",
  "QP3KTfiL0xYzLLUb": "./legacy/deduction-roll.js",
  "RGbWQtwAuUlBTEAL": "./legacy/crafting-roll.js",
  "RmR4jmmwPxIR0Iuj": "./legacy/persuasion-roll.js",
  "T35dfMdJXhACSP9I": "./legacy/light-weapons-roll.js",
  "TEXnuT51VJGlk6qt": "./legacy/intimidation-roll.js",
  "ZzCjji72GyEdut1s": "./legacy/lore-roll.js",
  "a4rV2ES0nRVjAt8Q": "./legacy/deception-roll.js",
  "cGaHOkf1dyHJlkJZ": "./legacy/survival-roll.js",
  "lAbDbVeHZZv61bHk": "./legacy/perception-roll.js",
  "tFQe5Ah1RjEYP1hd": "./legacy/roll-skill-table-view.js",
  "xFULRQmwpU1neOQf": "./legacy/hook.js",
  "zQYGgwTKxlg4vESj": "./legacy/athletics-roll.js",
  "zQx0OyP8wfMuooJN": "./legacy/agility-roll.js"
};

/** Public entry points use relative imports, including behind a routePrefix. */
export function createCosmereApi(dependencies = {}) {
  const api = { version: 1 };
  for (const [method, file] of Object.entries(API_TOOLS)) {
    api[method] = async (options = {}) => {
      const tool = await import(`./${file}`);
      return tool[method]({ ...dependencies, ...options });
    };
  }
  api.runLegacyMacro = async (key, options = {}) => {
    const file = LEGACY_SCRIPTS[key];
    if (!file) throw new Error(`Unknown Cosmere macro: ${key}`);
    const tool = await import(file);
    return tool.run({ ...dependencies, ...options });
  };
  return Object.freeze(api);
}

export function registerCosmereApi({ game = globalThis.game } = {}) {
  const module = game?.modules?.get?.(COSMERE_MODULE_ID);
  if (module) module.api = createCosmereApi();
  return module?.api;
}
