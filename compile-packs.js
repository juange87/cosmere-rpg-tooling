#!/usr/bin/env node

/**
 * Compile JSON source files into Foundry VTT LevelDB compendium packs
 * This script creates .db files that Foundry can read directly
 */

const fs = require('fs');
const path = require('path');

const packs = [
  {
    name: 'player-macros',
    inputDir: 'packs/player-macros',
    outputFile: 'packs/player-macros.db'
  },
  {
    name: 'gm-macros',
    inputDir: 'packs/gm-macros',
    outputFile: 'packs/gm-macros.db'
  }
];

console.log('Compiling compendium packs to LevelDB format...\n');

for (const pack of packs) {
  console.log(`Processing: ${pack.name}`);

  // Read all JSON files from the source directory
  const files = fs.readdirSync(pack.inputDir).filter(f => f.endsWith('.json'));

  if (files.length === 0) {
    console.log(`  ⚠️  No JSON files found in ${pack.inputDir}`);
    continue;
  }

  // Collect all documents
  const documents = [];
  for (const file of files) {
    const filePath = path.join(pack.inputDir, file);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    documents.push(data);
  }

  // Write as NeDB format (one JSON per line)
  const dbContent = documents.map(doc => JSON.stringify(doc)).join('\n');
  fs.writeFileSync(pack.outputFile, dbContent, 'utf8');

  console.log(`  ✓ Created ${pack.outputFile} with ${documents.length} documents\n`);
}

console.log('Compilation complete!');
console.log('\n⚠️  Note: You may need to use Foundry\'s built-in pack compilation tools');
console.log('or the @foundryvtt/foundryvtt-cli package for proper LevelDB format.');
