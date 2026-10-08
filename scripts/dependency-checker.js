import { localize } from "./localization.js";
import { getActiveJb2aModuleId, JB2A_MODULE_IDS } from "./jb2a-assets.js";

export const COSMERE_DEPENDENCY_CHECKS = [
  {
    key: "jb2a",
    label: "JB2A",
    moduleIds: JB2A_MODULE_IDS,
    get requiredFor() { return localize("VisualAssetsAndPathsUsedByAnimationMacros"); },
  },
  {
    key: "sequence",
    label: "Sequence",
    moduleId: "sequencer",
    get requiredFor() { return localize("MacrosThatRunEffectsWithNewSequence"); },
  },
  {
    key: "sequencerCrosshair",
    label: "Sequencer.Crosshair",
    moduleId: "sequencer",
    get requiredFor() { return localize("MacrosThatRequestACanvasPositionSuchAsTeleport"); },
  },
  {
    key: "diceSoNice",
    label: "Dice So Nice",
    moduleId: "dice-so-nice",
    get requiredFor() { return localize("Natural20AndCriticalFailureHooksBasedOnDiceSoNiceRollComplete"); },
  },
];

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function getModule(game, moduleId) {
  const modules = game?.modules;
  if (!modules) return undefined;
  if (typeof modules.get === "function") return modules.get(moduleId);
  if (Array.isArray(modules)) return modules.find(module => module?.id === moduleId);
  return modules[moduleId];
}

function isModuleActive(game, moduleId) {
  const module = getModule(game, moduleId);
  return Boolean(module?.active ?? module?.enabled);
}

function hasSequence(globals) {
  return typeof globals?.Sequence === "function";
}

function hasSequencerCrosshair(globals) {
  return typeof globals?.Sequencer?.Crosshair?.show === "function";
}

function evaluateDependency(check, { game, globals }) {
  if (check.key === "jb2a") {
    const moduleId = getActiveJb2aModuleId(game);
    return {
      ...check,
      moduleId,
      ok: Boolean(moduleId),
      status: moduleId ? localize("Available") : localize("Unavailable"),
      detail: moduleId
        ? `${localize("TheModule")}${moduleId}${localize("IsActive")}`
        : localize("Jb2aUnavailable"),
    };
  }
  const moduleActive = isModuleActive(game, check.moduleId);

  if (check.key === "sequence") {
    const sequenceAvailable = hasSequence(globals);
    return {
      ...check,
      ok: moduleActive && sequenceAvailable,
      status: moduleActive && sequenceAvailable ? localize("Available") : localize("Unavailable"),
      detail: moduleActive && sequenceAvailable
        ? localize("SequencerIsActiveAndSequenceIsAvailable")
        : localize("SequenceIsUnavailableEnableTheSequencerModuleBeforeUsingAnimationMacros"),
    };
  }

  if (check.key === "sequencerCrosshair") {
    const crosshairAvailable = hasSequencerCrosshair(globals);
    return {
      ...check,
      ok: moduleActive && crosshairAvailable,
      status: moduleActive && crosshairAvailable ? localize("Available") : localize("Unavailable"),
      detail: moduleActive && crosshairAvailable
        ? localize("SequencerCrosshairIsAvailable")
        : localize("SequencerCrosshairIsUnavailableSomeMacrosCannotRequestAScenePosition"),
    };
  }

  const ok = moduleActive;
  return {
    ...check,
    ok,
    status: ok ? localize("Available") : localize("Unavailable"),
    detail: ok
      ? `${localize("TheModule")}${check.moduleId}${localize("IsActive")}`
      : `${check.label}${localize("IsNotActiveCheckManageModulesBeforeUsingRelatedMacros")}`,
  };
}

export function checkCosmereDependencies({
  game = globalThis.game,
  globals = globalThis,
} = {}) {
  const results = COSMERE_DEPENDENCY_CHECKS.map(check => evaluateDependency(check, { game, globals }));
  const missing = results.filter(result => !result.ok);

  return {
    ok: missing.length === 0,
    results,
    missing,
  };
}

function buildRows(results) {
  return results.map(result => {
    const color = result.ok ? "#237a3b" : "#9f3a38";
    return `
      <tr>
        <td style="padding:6px 8px;border-top:1px solid rgba(31,41,51,0.12);font-weight:700;">
          ${escapeHtml(result.label)}
        </td>
        <td style="padding:6px 8px;border-top:1px solid rgba(31,41,51,0.12);color:${color};font-weight:700;">
          ${escapeHtml(result.status)}
        </td>
        <td style="padding:6px 8px;border-top:1px solid rgba(31,41,51,0.12);">
          <div>${escapeHtml(result.requiredFor)}</div>
          <div style="font-size:11px;color:#6f7f95;margin-top:2px;">${escapeHtml(result.detail)}</div>
        </td>
      </tr>
    `;
  }).join("");
}

export function buildDependencyCheckChatCard(report) {
  const title = report?.ok ? localize("DependenciesReady") : localize("MissingDependencies");
  const results = Array.isArray(report?.results) ? report.results : [];

  return `
    <div style="border:1px solid #5b6f82;border-radius:6px;background:#f7fafc;padding:12px;color:#1f2933;">
      <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.06em;">${localize("DependencyCheck")}</div>
      <h2 style="margin:2px 0 8px;font-family:Modesto Condensed,serif;color:#1e3a5f;font-size:24px;">
        ${escapeHtml(title)}
      </h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr>
            <th style="padding:4px 8px;text-align:left;">${localize("Dependency")}</th>
            <th style="padding:4px 8px;text-align:left;">${localize("Status")}</th>
            <th style="padding:4px 8px;text-align:left;">${localize("Usage")}</th>
          </tr>
        </thead>
        <tbody>${buildRows(results)}</tbody>
      </table>
    </div>
  `;
}

export async function runDependencyCheck({
  game = globalThis.game,
  globals = globalThis,
  ChatMessage = globalThis.ChatMessage,
  ui = globalThis.ui,
} = {}) {
  if (!ChatMessage) {
    throw new Error(localize("FoundryIsNotAvailableToPostTheDependencyCheck"));
  }

  const report = checkCosmereDependencies({ game, globals });
  await ChatMessage.create({
    content: buildDependencyCheckChatCard(report),
    speaker: ChatMessage.getSpeaker?.(),
  });

  if (report.ok) {
    ui?.notifications?.info?.(localize("CosmereDependenciesAreAvailable"));
  } else {
    ui?.notifications?.warn?.(localize("SomeCosmereMacrosAreMissingOptionalDependencies"));
  }

  return report;
}
