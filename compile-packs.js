#!/usr/bin/env node

/**
 * Compile JSON source files into Foundry VTT LevelDB compendium packs
 * Uses @foundryvtt/foundryvtt-cli for proper LevelDB format (v11+)
 *
 * Source files: packs/_source/<pack-name>/*.json
 * Output:      packs/<pack-name>/ (LevelDB directory)
 */

import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { existsSync, readdirSync, rmSync } from "fs";
import { resolve } from "path";

const packs = [
  { name: "player-macros" },
  { name: "gm-macros" }
];

console.log("Compiling compendium packs to LevelDB format...\n");

for (const pack of packs) {
  const src = resolve("packs/_source", pack.name);
  const out = resolve("packs", pack.name);

  if (!existsSync(src)) {
    console.log(`  ⚠️  Source directory not found: ${src}`);
    continue;
  }

  const fileCount = readdirSync(src).filter(f => f.endsWith(".json")).length;

  // Clean previous compiled output
  if (existsSync(out)) {
    rmSync(out, { recursive: true });
  }

  console.log(`Processing: ${pack.name} (${fileCount} documents)`);
  await compilePack(src, out);
  console.log(`  ✓ Compiled packs/${pack.name}/\n`);
}

console.log("Compilation complete!");
