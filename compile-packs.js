#!/usr/bin/env node
/** Validate all sources, compile into staging, then replace packs with rollback. */
import { access, mkdir, mkdtemp, rename, rm } from "node:fs/promises";
import { resolve, join } from "node:path";
import { fileURLToPath } from "node:url";
import { validateAllMacroSources } from "./scripts/macro-validator.js";

async function exists(path) {
  try { await access(path); return true; } catch { return false; }
}

export async function compilePacks({
  root = process.cwd(), packNames = ["player-macros", "gm-macros"], compiler,
} = {}) {
  const packPaths = packNames.map(name => resolve(root, "packs/_source", name));
  const report = await validateAllMacroSources({ packPaths, checkCompile: false });
  if (!report.ok) throw new Error(`Macro validation failed:\n${report.errors.join("\n")}`);
  // Load the compiler before changing any existing output.
  compiler ??= (await import("@foundryvtt/foundryvtt-cli")).compilePack;
  const outputRoot = resolve(root, "packs");
  await mkdir(outputRoot, { recursive: true });
  const staging = await mkdtemp(join(outputRoot, ".compile-"));
  const promoted = [];
  try {
    for (const [index, name] of packNames.entries()) {
      await compiler(packPaths[index], join(staging, name));
    }
    for (const name of packNames) {
      const out = join(outputRoot, name);
      const backup = join(staging, `${name}.backup`);
      const hadPrevious = await exists(out);
      if (hadPrevious) await rename(out, backup);
      promoted.push({ out, backup, hadPrevious });
      await rename(join(staging, name), out);
    }
  } catch (error) {
    for (const { out, backup, hadPrevious } of promoted.reverse()) {
      await rm(out, { recursive: true, force: true });
      if (hadPrevious) await rename(backup, out);
    }
    throw error;
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
  return { packs: packNames, report };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    const { packs } = await compilePacks();
    console.log(`Compilation complete: ${packs.join(", ")}.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
