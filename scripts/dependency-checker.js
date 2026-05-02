export const COSMERE_DEPENDENCY_CHECKS = [
  {
    key: "jb2a",
    label: "JB2A",
    moduleId: "JB2A_DnD5e",
    requiredFor: "Rutas y assets visuales de las macros de animacion.",
  },
  {
    key: "sequence",
    label: "Sequence",
    moduleId: "sequencer",
    requiredFor: "Macros que ejecutan efectos con new Sequence().",
  },
  {
    key: "sequencerCrosshair",
    label: "Sequencer.Crosshair",
    moduleId: "sequencer",
    requiredFor: "Macros que piden una posicion en el canvas, como Teleport.",
  },
  {
    key: "diceSoNice",
    label: "Dice So Nice",
    moduleId: "dice-so-nice",
    requiredFor: "Hooks de natural 20 y fallo critico basados en diceSoNiceRollComplete.",
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
  const moduleActive = isModuleActive(game, check.moduleId);

  if (check.key === "sequence") {
    const sequenceAvailable = hasSequence(globals);
    return {
      ...check,
      ok: moduleActive && sequenceAvailable,
      status: moduleActive && sequenceAvailable ? "Disponible" : "No disponible",
      detail: moduleActive && sequenceAvailable
        ? "Sequencer esta activo y Sequence esta disponible."
        : "Sequence no esta disponible. Activa el modulo Sequencer antes de usar macros de animacion.",
    };
  }

  if (check.key === "sequencerCrosshair") {
    const crosshairAvailable = hasSequencerCrosshair(globals);
    return {
      ...check,
      ok: moduleActive && crosshairAvailable,
      status: moduleActive && crosshairAvailable ? "Disponible" : "No disponible",
      detail: moduleActive && crosshairAvailable
        ? "Sequencer.Crosshair esta disponible."
        : "Sequencer.Crosshair no esta disponible. Algunas macros no podran pedir una posicion en escena.",
    };
  }

  const ok = moduleActive;
  return {
    ...check,
    ok,
    status: ok ? "Disponible" : "No disponible",
    detail: ok
      ? `El modulo ${check.moduleId} esta activo.`
      : `${check.label} no esta activo. Revisa Manage Modules antes de usar macros relacionadas.`,
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
  const title = report?.ok ? "Dependencias listas" : "Faltan dependencias";
  const results = Array.isArray(report?.results) ? report.results : [];

  return `
    <div style="border:1px solid #5b6f82;border-radius:6px;background:#f7fafc;padding:12px;color:#1f2933;">
      <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.06em;">Chequeo de Dependencias</div>
      <h2 style="margin:2px 0 8px;font-family:Modesto Condensed,serif;color:#1e3a5f;font-size:24px;">
        ${escapeHtml(title)}
      </h2>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr>
            <th style="padding:4px 8px;text-align:left;">Dependencia</th>
            <th style="padding:4px 8px;text-align:left;">Estado</th>
            <th style="padding:4px 8px;text-align:left;">Uso</th>
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
    throw new Error("Foundry no esta disponible para publicar el chequeo de dependencias.");
  }

  const report = checkCosmereDependencies({ game, globals });
  await ChatMessage.create({
    content: buildDependencyCheckChatCard(report),
    speaker: ChatMessage.getSpeaker?.(),
  });

  if (report.ok) {
    ui?.notifications?.info?.("Dependencias Cosmere disponibles.");
  } else {
    ui?.notifications?.warn?.("Faltan dependencias opcionales para algunas macros Cosmere.");
  }

  return report;
}
