#!/usr/bin/env node
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

  if (!macro?._id) errors.push(`${filePath}: falta _id.`);
  if (!macro?._key) errors.push(`${filePath}: falta _key.`);
  if (macro?._id && macro?._key && macro._key !== `!macros!${macro._id}`) {
    errors.push(`${filePath}: _key no coincide con !macros!{_id}.`);
  }
  if (!macro?.name) errors.push(`${filePath}: falta name.`);
  if (!macro?.type) errors.push(`${filePath}: falta type.`);
  if (!String(macro?.command ?? "").trim()) errors.push(`${filePath}: command vacio.`);

  for (const dependency of DEPENDENCY_PATTERNS) {
    if (dependency.pattern.test(String(macro?.command ?? "")) || dependency.pattern.test(String(macro?.img ?? ""))) {
      warnings.push({
        filePath,
        dependency: dependency.label,
        message: `${filePath}: referencia a ${dependency.label}; revisar disponibilidad antes de ejecutar.`,
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
  const reports = [];

  for (const entry of entries) {
    const filePath = join(packPath, entry);
    let macro;
    try {
      macro = JSON.parse(await readFile(filePath, "utf8"));
    } catch (error) {
      errors.push(`${filePath}: JSON invalido (${error.message}).`);
      continue;
    }

    const report = validateMacroSourceFile(filePath, macro);
    reports.push(report);
    errors.push(...report.errors);
    warnings.push(...report.warnings);

    if (macro?.name) {
      if (names.has(macro.name)) {
        errors.push(`${filePath}: nombre duplicado "${macro.name}" tambien en ${names.get(macro.name)}.`);
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
    throw new Error("La validacion de compilacion solo esta disponible en Node.");
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
    ? [`npm run compile fallo con codigo ${compileReport.status}: ${compileReport.stderr || compileReport.stdout}`]
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
    { label: "Errores", value: report.errors.length ? report.errors.join(" | ") : "Sin errores" },
    { label: "Advertencias", value: report.warnings.length ? `${report.warnings.length} referencia(s) a dependencias opcionales` : "Sin advertencias" },
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
      warnings: [{ message: "Ejecuta npm run validate en el repositorio para revisar los JSON fuente y compilar packs." }],
    };
    if (ChatMessage) {
      await ChatMessage.create({
        content: buildMacroValidationChatCard(report),
        speaker: ChatMessage.getSpeaker?.(),
      });
    }
    ui?.notifications?.info?.("Validacion local: ejecuta npm run validate fuera de Foundry.");
    return report;
  }

  const report = await validateAllMacroSources({ checkCompile: true });
  if (ChatMessage) {
    await ChatMessage.create({
      content: buildMacroValidationChatCard(report),
      speaker: ChatMessage.getSpeaker?.(),
    });
  }
  if (report.ok) ui?.notifications?.info?.("Validacion de macros completada sin errores.");
  else ui?.notifications?.error?.("La validacion de macros encontro errores.");
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
