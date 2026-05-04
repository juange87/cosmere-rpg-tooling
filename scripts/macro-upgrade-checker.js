import {
  COSMERE_MODULE_ID,
  buildCosmereChatCard,
  escapeHtml,
} from "./cosmere-helpers.js";
import { hasCosmereDialogSupport, openCosmereDialog } from "./foundry-dialogs.js";

export const MACRO_UPGRADE_PACKS = [
  {
    id: `${COSMERE_MODULE_ID}.gm-macros`,
    label: "CosmereRPG: GM Macros",
  },
  {
    id: `${COSMERE_MODULE_ID}.player-macros`,
    label: "CosmereRPG: Player Macros",
  },
];

const COMPARISON_FIELDS = ["command", "type", "img", "scope"];

const STATUS_LABELS = {
  current: "Actualizada",
  outdated: "Obsoleta",
  missing: "No importada al mundo",
};

function collectionToArray(collection) {
  if (!collection) return [];
  if (Array.isArray(collection)) return collection;
  if (Array.isArray(collection.contents)) return collection.contents;
  if (typeof collection.values === "function") return Array.from(collection.values());
  if (typeof collection.filter === "function") return collection.filter(() => true);
  return Object.values(collection);
}

function normalizeCommand(value) {
  return String(value ?? "").replaceAll("\r\n", "\n");
}

function getDocumentData(document, defaults = {}) {
  const raw = typeof document?.toObject === "function" ? document.toObject() : document;
  return {
    document,
    id: raw?._id ?? raw?.id ?? document?.id ?? "",
    _id: raw?._id ?? raw?.id ?? document?.id ?? "",
    name: raw?.name ?? document?.name ?? "",
    command: normalizeCommand(raw?.command ?? document?.command),
    type: raw?.type ?? document?.type ?? "script",
    img: raw?.img ?? document?.img ?? "",
    scope: raw?.scope ?? document?.scope ?? "global",
    flags: raw?.flags ?? document?.flags ?? {},
    packId: raw?.packId ?? document?.packId ?? defaults.packId ?? "",
    packLabel: raw?.packLabel ?? document?.packLabel ?? defaults.packLabel ?? defaults.packId ?? "",
  };
}

function getChangedFields(source, worldMacro) {
  return COMPARISON_FIELDS.filter(field => source[field] !== worldMacro[field]);
}

function getMacroIdentity(macro) {
  return macro.id || macro._id || macro.name;
}

function buildEntryKey(source, worldMacro) {
  return [
    source.packId || "pack",
    source.id || source._id || source.name,
    worldMacro ? getMacroIdentity(worldMacro) : "missing",
  ].map(part => String(part).replaceAll("|", "_")).join("|");
}

export function buildMacroUpgradeReport({
  sourceMacros = [],
  worldMacros = [],
  warnings = [],
} = {}) {
  const sources = sourceMacros.map(macro => getDocumentData(macro));
  const world = worldMacros.map(macro => getDocumentData(macro));
  const worldByName = new Map();

  for (const macro of world) {
    if (!macro.name) continue;
    const existing = worldByName.get(macro.name) ?? [];
    existing.push(macro);
    worldByName.set(macro.name, existing);
  }

  const entries = [];
  for (const source of sources) {
    const matches = worldByName.get(source.name) ?? [];
    if (!matches.length) {
      entries.push({
        key: buildEntryKey(source),
        status: "missing",
        source,
        worldMacro: null,
        changedFields: [],
        canUpdate: false,
        duplicateWorldCopies: 0,
      });
      continue;
    }

    const duplicateWorldCopies = Math.max(0, matches.length - 1);
    for (const worldMacro of matches) {
      const changedFields = getChangedFields(source, worldMacro);
      const status = changedFields.length ? "outdated" : "current";
      entries.push({
        key: buildEntryKey(source, worldMacro),
        status,
        source,
        worldMacro,
        changedFields,
        canUpdate: status === "outdated",
        duplicateWorldCopies,
      });
    }
  }

  const duplicateSourceNames = new Set(
    sources
      .filter(source => (worldByName.get(source.name) ?? []).length > 1)
      .map(source => source.name),
  );
  const duplicates = Array.from(duplicateSourceNames)
    .reduce((total, name) => total + Math.max(0, (worldByName.get(name) ?? []).length - 1), 0);

  const counts = {
    sourceTotal: sources.length,
    worldMatches: entries.filter(entry => entry.worldMacro).length,
    current: entries.filter(entry => entry.status === "current").length,
    outdated: entries.filter(entry => entry.status === "outdated").length,
    missing: entries.filter(entry => entry.status === "missing").length,
    duplicates,
  };

  return {
    ok: counts.outdated === 0,
    counts,
    entries,
    warnings,
  };
}

function getPreviousSnapshot(worldMacro) {
  return {
    type: worldMacro.type,
    img: worldMacro.img,
    scope: worldMacro.scope,
    commandLength: worldMacro.command.length,
    commandPreview: worldMacro.command.slice(0, 240),
  };
}

export function buildMacroUpdateData(entry, { now = new Date() } = {}) {
  const source = entry.source;
  const worldMacro = entry.worldMacro;
  const flags = {
    ...(worldMacro.flags ?? {}),
    [COSMERE_MODULE_ID]: {
      ...(worldMacro.flags?.[COSMERE_MODULE_ID] ?? {}),
      lastMacroUpgrade: {
        at: now.toISOString(),
        sourcePack: source.packId,
        sourceId: source.id || source._id,
        changedFields: entry.changedFields,
        previous: getPreviousSnapshot(worldMacro),
      },
    },
  };

  return {
    command: source.command,
    type: source.type,
    img: source.img,
    scope: source.scope,
    flags,
  };
}

export async function applyMacroUpgradeSelection({
  report,
  selectedEntryKeys = [],
  now = new Date(),
} = {}) {
  const selected = new Set(selectedEntryKeys);
  const updated = [];
  const skipped = [];

  for (const entry of report?.entries ?? []) {
    if (!selected.has(entry.key)) continue;
    if (entry.status !== "outdated" || !entry.worldMacro?.document?.update) {
      skipped.push(entry);
      continue;
    }

    await entry.worldMacro.document.update(buildMacroUpdateData(entry, { now }));
    updated.push(entry);
  }

  return { updated, skipped };
}

function buildStatusSummary(counts) {
  return [
    `Actualizadas: ${counts.current}`,
    `Obsoletas: ${counts.outdated}`,
    `No importadas: ${counts.missing}`,
    `Duplicadas: ${counts.duplicates}`,
  ].join(" | ");
}

function buildDialogRows(entries) {
  return entries.map(entry => {
    const canSelect = entry.status === "outdated" && entry.canUpdate;
    const changed = entry.changedFields.length ? entry.changedFields.join(", ") : "-";
    const worldId = entry.worldMacro?.id ? `#${entry.worldMacro.id}` : "-";
    const selector = canSelect
      ? `<input type="checkbox" name="macro-upgrade" value="${escapeHtml(entry.key)}" aria-label="Actualizar ${escapeHtml(entry.source.name)}">`
      : "";

    return `
      <tr>
        <td style="padding:6px 8px;border-top:1px solid rgba(31,41,51,0.12);text-align:center;">${selector}</td>
        <td style="padding:6px 8px;border-top:1px solid rgba(31,41,51,0.12);font-weight:700;">${escapeHtml(entry.source.name)}</td>
        <td style="padding:6px 8px;border-top:1px solid rgba(31,41,51,0.12);">${escapeHtml(entry.source.packLabel)}</td>
        <td style="padding:6px 8px;border-top:1px solid rgba(31,41,51,0.12);">${escapeHtml(STATUS_LABELS[entry.status] ?? entry.status)}</td>
        <td style="padding:6px 8px;border-top:1px solid rgba(31,41,51,0.12);">${escapeHtml(changed)}</td>
        <td style="padding:6px 8px;border-top:1px solid rgba(31,41,51,0.12);font-size:11px;color:#6f7f95;">${escapeHtml(worldId)}</td>
      </tr>
    `;
  }).join("");
}

export function buildMacroUpgradeDialogContent(report) {
  const counts = report?.counts ?? {
    current: 0,
    outdated: 0,
    missing: 0,
    duplicates: 0,
  };
  const entries = report?.entries ?? [];
  const warnings = report?.warnings?.length
    ? `<p style="margin:0;color:#9f3a38;">${escapeHtml(report.warnings.join(" | "))}</p>`
    : "";

  return `
    <form class="cosmere-macro-upgrade" style="display:grid;gap:10px;">
      <p style="margin:0;color:#334155;">
        Revisa copias importadas al mundo. Las macros no importadas se pueden ejecutar desde el compendio y no necesitan cambios.
      </p>
      <p style="margin:0;color:#334155;">
        No se modifica nada automaticamente: marca solo las copias obsoletas que quieras reemplazar con la version del compendio.
      </p>
      <div style="padding:8px 10px;background:#f7fafc;border:1px solid rgba(31,41,51,0.16);border-radius:6px;font-weight:700;">
        ${escapeHtml(buildStatusSummary(counts))}
      </div>
      ${warnings}
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr>
            <th style="padding:4px 8px;text-align:center;">Actualizar</th>
            <th style="padding:4px 8px;text-align:left;">Macro</th>
            <th style="padding:4px 8px;text-align:left;">Compendio</th>
            <th style="padding:4px 8px;text-align:left;">Estado</th>
            <th style="padding:4px 8px;text-align:left;">Diferencias</th>
            <th style="padding:4px 8px;text-align:left;">Copia</th>
          </tr>
        </thead>
        <tbody>${buildDialogRows(entries)}</tbody>
      </table>
    </form>
  `;
}

export function buildMacroUpgradeChatCard(report) {
  const counts = report?.counts ?? {
    current: 0,
    outdated: 0,
    missing: 0,
    duplicates: 0,
  };
  const outdatedNames = (report?.entries ?? [])
    .filter(entry => entry.status === "outdated")
    .map(entry => `${entry.source.name} (${entry.changedFields.join(", ")})`);

  return buildCosmereChatCard({
    eyebrow: "Mantenimiento",
    title: "Macros Cosmere instaladas",
    subtitle: buildStatusSummary(counts),
    sections: [
      {
        label: "Resultado",
        value: counts.outdated
          ? `Revisa antes de sesion: ${outdatedNames.join(" | ")}`
          : "No hay copias importadas obsoletas.",
      },
      {
        label: "Seguridad",
        value: "El chequeo no cambia macros por si solo. Solo reemplaza copias del mundo cuando el GM las selecciona.",
      },
    ],
    accent: "#80531b",
    background: "#fffaf0",
  });
}

async function getCompendiumDocuments(pack) {
  if (!pack) return [];
  if (typeof pack.getDocuments === "function") return pack.getDocuments();
  if (typeof pack.getIndex === "function") {
    await pack.getIndex();
  }
  return collectionToArray(pack.index);
}

function getPack(game, packId) {
  const packs = game?.packs;
  if (!packs) return null;
  return packs.get?.(packId)
    ?? collectionToArray(packs).find(pack => (
      pack?.collection === packId
      || pack?.metadata?.id === packId
      || `${pack?.metadata?.packageName}.${pack?.metadata?.name}` === packId
    ))
    ?? null;
}

export async function collectCompendiumMacros({
  game = globalThis.game,
  packDefinitions = MACRO_UPGRADE_PACKS,
} = {}) {
  const macros = [];
  const warnings = [];

  for (const packDefinition of packDefinitions) {
    const pack = getPack(game, packDefinition.id);
    if (!pack) {
      warnings.push(`No se encontro el compendio ${packDefinition.label}.`);
      continue;
    }

    const documents = await getCompendiumDocuments(pack);
    for (const document of documents) {
      macros.push(getDocumentData(document, {
        packId: packDefinition.id,
        packLabel: packDefinition.label,
      }));
    }
  }

  return { macros, warnings };
}

export async function scanInstalledCosmereMacros({
  game = globalThis.game,
  packDefinitions = MACRO_UPGRADE_PACKS,
} = {}) {
  const { macros, warnings } = await collectCompendiumMacros({ game, packDefinitions });
  return buildMacroUpgradeReport({
    sourceMacros: macros,
    worldMacros: collectionToArray(game?.macros),
    warnings,
  });
}

function selectedKeysFromDialog(html) {
  return Array.from(html.find?.("input[name='macro-upgrade']:checked") ?? [])
    .map(input => input.value)
    .filter(Boolean);
}

async function publishReport(report, { ChatMessage = globalThis.ChatMessage } = {}) {
  if (!ChatMessage) return null;
  return ChatMessage.create({
    content: buildMacroUpgradeChatCard(report),
    speaker: ChatMessage.getSpeaker?.(),
  });
}

export async function openMacroUpgradeChecker({
  game = globalThis.game,
  Dialog = globalThis.Dialog,
  DialogV2,
  foundry = globalThis.foundry,
  ui = globalThis.ui,
  ChatMessage = globalThis.ChatMessage,
} = {}) {
  if (!game?.user?.isGM) {
    ui?.notifications?.warn?.("Solo el GM puede revisar y actualizar macros del mundo.");
    return null;
  }

  if (!hasCosmereDialogSupport({ Dialog, DialogV2, foundry })) {
    throw new Error("Foundry no esta disponible para abrir el chequeo de macros instaladas.");
  }

  const report = await scanInstalledCosmereMacros({ game });
  return openCosmereDialog({
    title: "Chequeo de Macros Instaladas",
    content: buildMacroUpgradeDialogContent(report),
    buttons: {
      publish: {
        icon: '<i class="fas fa-message"></i>',
        label: "Publicar informe",
        callback: async () => publishReport(report, { ChatMessage }),
      },
      update: {
        icon: '<i class="fas fa-arrow-up-from-bracket"></i>',
        label: "Actualizar seleccionadas",
        callback: async html => {
          const selectedEntryKeys = selectedKeysFromDialog(html);
          if (!selectedEntryKeys.length) {
            ui?.notifications?.warn?.("No hay macros obsoletas seleccionadas.");
            return false;
          }
          const result = await applyMacroUpgradeSelection({ report, selectedEntryKeys });
          ui?.notifications?.info?.(`Macros actualizadas: ${result.updated.length}.`);
          await publishReport(await scanInstalledCosmereMacros({ game }), { ChatMessage });
          return true;
        },
      },
      close: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cerrar",
      },
    },
    default: "close",
    width: 760,
  }, { Dialog, DialogV2, foundry });
}
