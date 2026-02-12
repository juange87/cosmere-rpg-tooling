# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Foundry VTT module** for Cosmere RPG that provides GM tools including roll tables for character creation, name generators, and macro compendiums for players and GMs. The module is written in vanilla JavaScript (ES modules) and uses Foundry VTT's API.

## Key Architecture

### Module Structure
- **module.json**: Foundry VTT module manifest with placeholder tokens (`#{VERSION}#`, `#{URL}#`, `#{MANIFEST}#`, `#{DOWNLOAD}#`) that are replaced during the GitHub Actions release workflow
- **scripts/init.js**: Main initialization script that runs on Foundry's `ready` hook (GM-only)
- **compile-packs.js**: ESM script that uses `@foundryvtt/foundryvtt-cli` to compile JSON source files into LevelDB compendium packs
- **sounds/**: Audio files bundled with the module for macros that play sound effects

### Core Functionality (scripts/init.js)

The module automatically creates a hierarchical folder structure for roll tables:
```
CosmereRPG: Character Creation (parent folder)
├── Character Creation (subfolder)
│   ├── Character Goals Table
│   ├── Character Obstacles Table
│   └── Radiant Purpose Table
└── Name Generators (subfolder)
    ├── Alethi Names
    ├── Azish Names
    ├── Herdazian Names
    ├── Reshi Names
    ├── Shin Names
    ├── Thaylen Names
    ├── Unkalaki Names
    └── Veden Names
```

**Important implementation details:**
- The module only runs initialization for GMs (`game.user.isGM`)
- Tables are created programmatically using `RollTable.create()` with the Foundry API
- The module handles reorganization: if tables exist in wrong folders, they are deleted and recreated
- All tables use `1d20` formula with 20 equally-weighted results
- Folders use specific colors: parent (`#9b59b6`), Character Creation (`#4a90e2`), Name Generators (`#e67e22`)

## Development Commands

### Compiling Compendium Packs

After modifying macro source files in `packs/_source/player-macros/` or `packs/_source/gm-macros/`, run:

```bash
npm run compile
```

This uses `@foundryvtt/foundryvtt-cli` to compile individual JSON files into LevelDB directories that Foundry v13 reads natively. Requires `npm install` first.

### Testing

No automated tests. Test the module by:
1. Compiling the compendium packs (if macros were modified)
2. Installing the module in a Foundry VTT development instance
3. Activating the module and verifying all features work

## Release Process

Releases are automated via GitHub Actions (`.github/workflows/main.yml`):

1. Create a GitHub release with a tag in format `v<major>.<minor>.<patch>` (e.g., `v1.0.0`)
2. The workflow automatically:
   - Extracts the version from the tag
   - Replaces placeholders in `module.json` with actual values
   - Installs npm dependencies and **compiles compendium packs** from JSON source to LevelDB format
   - Creates a `module.zip` archive containing: `module.json`, `README.md`, `LICENSE`, `scripts/`, `packs/player-macros/`, `packs/gm-macros/`, `sounds/`
   - Uploads the manifest and archive to the GitHub release

**Note**: The release includes only the compiled LevelDB directories, not the source JSON files in `packs/_source/`.

## Adding New Roll Tables

To add new tables, edit `scripts/init.js` and add an object to the `tables` array:

```javascript
{
  name: "Table Name",
  formula: "1d20",  // or "1d10", "1d100", etc.
  folder: characterCreationFolder.id,  // or nameGeneratorsFolder.id
  results: [
    { text: "Result 1", weight: 1, range: [1, 1] },
    { text: "Result 2", weight: 1, range: [2, 2] },
    // ... more results
  ]
}
```

**Important**: The `range` values must be sequential and match the die formula. For a `1d20`, ranges go from `[1,1]` to `[20,20]`.

## Compendium Packs

The module includes two compendium packs with macros:
- **CosmereRPG: Player Macros** (21 macros) - Skill roll macros for players
- **CosmereRPG: GM Macros** (19 macros) - Resource management, animation, and sound effect macros for GMs

### Compendium Structure

Compendium packs use a dual-format system:
1. **Source files** (for version control): Individual JSON files in `packs/_source/player-macros/` and `packs/_source/gm-macros/`
2. **Compiled files** (for Foundry, gitignored): LevelDB directories `packs/player-macros/` and `packs/gm-macros/`

### Adding or Editing Macros

To add or edit macros:

1. **Edit source files**: Modify the individual JSON files in `packs/_source/player-macros/` or `packs/_source/gm-macros/`
2. **Compile to LevelDB**: Run `npm run compile` to regenerate the pack directories
3. **Test in Foundry**: The module.json references the LevelDB directories which Foundry reads directly

### Macro File Structure

Each macro JSON file contains:
```javascript
{
  "_id": "unique_id",
  "_key": "!macros!unique_id",  // Required for Foundry v13 LevelDB
  "name": "Macro Name",
  "type": "script",           // or "chat"
  "author": "author_id",
  "img": "path/to/icon.svg",
  "scope": "global",          // or "actor"
  "command": "// JavaScript code here",
  "folder": null,             // or folder ID
  "sort": 0,
  "ownership": { "default": 0 },
  "flags": {}
}
```

**Important**: The `_key` field is **mandatory** — `@foundryvtt/foundryvtt-cli` silently skips documents without it. The format is `!macros!{_id}`.

### Compiling Packs

The `compile-packs.js` script uses `@foundryvtt/foundryvtt-cli` to compile source JSON into LevelDB:
- Reads all JSON files from `packs/_source/<pack-name>/`
- Outputs LevelDB directories to `packs/<pack-name>/`
- Cleans previous compiled output before each build

**Important**: Always run `npm run compile` after modifying macro source files.

## Language and Content Notes

- The README and code comments are primarily in **Spanish**
- Content is based on Brotherwise Games' Cosmere RPG character creation materials
- Name generators are specific to Roshar cultures from Brandon Sanderson's Stormlight Archive
