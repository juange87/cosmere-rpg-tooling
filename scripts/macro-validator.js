#!/usr/bin/env node
import { localize } from "./localization.js";
const DEPENDENCY_PATTERNS = [
  { pattern: /new Sequence|Sequence\(/, label: "Sequence" },
  { pattern: /Sequencer\./, label: "Sequencer" },
  { pattern: /JB2A|jb2a\./i, label: "JB2A" },
  { pattern: /diceSoNice/i, label: "diceSoNice" },
  { pattern: /AudioHelper/, label: "AudioHelper" },
];

let nodeSpawnSync = null;
if (typeof process !== "undefined" && process.versions?.node) {
  try {
    nodeSpawnSync = (await import("node:child_process")).spawnSync;
  } catch {
    nodeSpawnSync = null;
  }
}

export function createMacroValidationPlan() {
  return {
    checks: [
      "_id",
      "_key",
      "duplicate names",
      "empty commands",
      "dependency references",
      "compile packs",
    ],
  };
}

export function validateMacroSourceFile(filePath, macro) {
  const errors = [];
  const warnings = [];

  if (macro?._id && !/^[A-Za-z0-9]{16}$/.test(macro._id)) {
    errors.push(`${filePath}: _id must contain exactly 16 alphanumeric characters.`);
  }
  if (!macro?._id) errors.push(`${filePath}${localize("MissingId")}`);
  if (!macro?._key) errors.push(`${filePath}${localize("MissingKey")}`);
  if (macro?._id && macro?._key && macro._key !== `!macros!${macro._id}`) {
    errors.push(`${filePath}${localize("KeyDoesNotMatchMacrosId")}`);
  }
  if (!macro?.name) errors.push(`${filePath}${localize("MissingName")}`);
  if (!macro?.type) errors.push(`${filePath}${localize("MissingType")}`);
  if (!String(macro?.command ?? "").trim()) errors.push(`${filePath}${localize("EmptyCommand")}`);

  for (const dependency of DEPENDENCY_PATTERNS) {
    if (dependency.pattern.test(String(macro?.command ?? "")) || dependency.pattern.test(String(macro?.img ?? ""))) {
      warnings.push({
        filePath,
        dependency: dependency.label,
        message: `${filePath}${localize("ReferenceTo")}${dependency.label}${localize("CheckAvailabilityBeforeRunning")}`,
      });
    }
  }

  return {
    filePath,
    ok: errors.length === 0,
    errors,
    warnings,
  };
}

export async function validateMacroSourcePack(packPath) {
  const { readdir, readFile } = await import("node:fs/promises");
  const { extname, join } = await import("node:path");
  const entries = (await readdir(packPath)).filter(file => extname(file) === ".json").sort();
  const errors = [];
  const warnings = [];
  const names = new Map();
  const ids = new Set();
  const reports = [];

  for (const entry of entries) {
    const filePath = join(packPath, entry);
    let macro;
    try {
      macro = JSON.parse(await readFile(filePath, "utf8"));
    } catch (error) {
      errors.push(`${filePath}${localize("InvalidJSON")}${error.message}).`);
      continue;
    }

    if (ids.has(macro._id)) errors.push(`${filePath}: duplicate _id ${macro._id}.`);
    ids.add(macro._id);
    const report = validateMacroSourceFile(filePath, macro);
    reports.push(report);
    errors.push(...report.errors);
    warnings.push(...report.warnings);

    if (macro?.name) {
      if (names.has(macro.name)) {
        errors.push(`${filePath}${localize("DuplicateName")}${macro.name}${localize("AlsoIn")}${names.get(macro.name)}.`);
      } else {
        names.set(macro.name, filePath);
      }
    }
  }

  return {
    packPath,
    ok: errors.length === 0,
    reports,
    errors,
    warnings,
  };
}

export function runCompileValidation({
  command = process.execPath,
  args = ["compile-packs.js"],
} = {}) {
  const spawnSync = globalThis.__cosmereSpawnSync ?? nodeSpawnSync;
  if (!spawnSync) {
    throw new Error(localize("CompilationValidationIsOnlyAvailableInNode"));
  }
  const result = spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  return {
    ok: result.status === 0,
    status: result.status,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
  };
}

export async function validateAllMacroSources({
  packPaths = ["packs/_source/player-macros", "packs/_source/gm-macros"],
  checkCompile = false,
} = {}) {
  const packReports = [];
  for (const packPath of packPaths) {
    packReports.push(await validateMacroSourcePack(packPath));
  }
  const compileReport = checkCompile ? runCompileValidation() : null;
  const compileErrors = compileReport && !compileReport.ok
    ? [`${localize("NpmRunCompileFailedWithCode")}${compileReport.status}: ${compileReport.stderr || compileReport.stdout}`]
    : [];
  return {
    ok: packReports.every(report => report.ok) && compileErrors.length === 0,
    packReports,
    compileReport,
    errors: [...packReports.flatMap(report => report.errors), ...compileErrors],
    warnings: packReports.flatMap(report => report.warnings),
  };
}

export function buildMacroValidationChatCard(report) {
  const sections = [
    { label: localize("Errors"), value: report.errors.length ? report.errors.join(" | ") : localize("NoErrors") },
    { label: localize("Warnings"), value: report.warnings.length ? `${report.warnings.length}${localize("ReferenceSToOptionalDependencies")}` : localize("NoWarnings") },
  ];
  return `<div>${sections.map(section => `<p><strong>${section.label}</strong>: ${section.value}</p>`).join("")}</div>`;
}

export async function runMacroValidation({
  ChatMessage = globalThis.ChatMessage,
  ui = globalThis.ui,
} = {}) {
  if (typeof process === "undefined" || !process.versions?.node) {
    const report = {
      ok: true,
      errors: [],
      warnings: [{ message: localize("RunNpmRunValidateInTheRepositoryToCheckSourceJSONFilesAndCompilePacks") }],
    };
    if (ChatMessage) {
      await ChatMessage.create({
        content: buildMacroValidationChatCard(report),
        speaker: ChatMessage.getSpeaker?.(),
      });
    }
    ui?.notifications?.info?.(localize("LocalValidationRunNpmRunValidateOutsideFoundry"));
    return report;
  }

  const report = await validateAllMacroSources({ checkCompile: true });
  if (ChatMessage) {
    await ChatMessage.create({
      content: buildMacroValidationChatCard(report),
      speaker: ChatMessage.getSpeaker?.(),
    });
  }
  if (report.ok) ui?.notifications?.info?.(localize("MacroValidationCompletedWithoutErrors"));
  else ui?.notifications?.error?.(localize("MacroValidationFoundErrors"));
  return report;
}

async function main() {
  const { spawnSync } = await import("node:child_process");
  globalThis.__cosmereSpawnSync = spawnSync;
  const report = await validateAllMacroSources({ checkCompile: true });
  for (const error of report.errors) console.error(error);
  for (const warning of report.warnings) console.warn(warning.message);
  if (!report.ok) process.exitCode = 1;
  else console.log("Macro validation passed.");
}

if (typeof process !== "undefined" && process.versions?.node) {
  const { fileURLToPath } = await import("node:url");
  if (process.argv[1] === fileURLToPath(import.meta.url)) {
    main();
  }
}
