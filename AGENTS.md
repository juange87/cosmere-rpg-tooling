<!-- CODEGRAPH_START -->
## CodeGraph

In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

- **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
- **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
<!-- CODEGRAPH_END -->

# AGENTS.md

## Project

Foundry VTT module `cosmere-rpg-tooling`: GM tools for Cosmere RPG, character
creation, Roshar generators, resources, spheres, conversations, visual effects
and macro maintenance. Vanilla JavaScript ES modules; Foundry v12–v13 is the
manifest's declared range. Foundry v14 support is separate work.

## Architecture

- `module.json`: manifest with release placeholders `#{VERSION}#`, `#{URL}#`,
  `#{MANIFEST}#`, `#{DOWNLOAD}#`; relationships restrict the system to
  `cosmere-rpg` and recommend optional Sequencer, JB2A and Dice So Nice modules.
- `scripts/init.js`: registers settings and the public API on `init`; activates
  roll hooks and seeds tables on `ready`.
- `scripts/module-api.js`: public `game.modules.get("cosmere-rpg-tooling").api`.
  Macro JSON commands are one-line API calls. Relative imports work behind
  Foundry's `routePrefix`. Existing pre-API world macros need one upgrade.
- `scripts/legacy/`: implementations of classic macros, with injected Foundry
  dependencies. Three retired hook macros remain as compatibility notices and
  register no listeners.
- `scripts/cosmere-helpers.js`: common HTML escaping, actor/token resolution,
  resource access, client preferences and private GM reports.
- `scripts/sphere-currency.js`, `scripts/sphere-transactions.js`: shared currency
  definitions, validation, accounting and inventory writes for all sphere tools.
- `scripts/foundry-dialogs.js`: DialogV2 adapter with Dialog v1 fallback. Use the
  supplied dialog root; do not query the global document for dialog controls.
- `scripts/localization.js`, `lang/en.json`, `lang/es.json`: module-local language
  override, lazy labels and independent catalog fallbacks. Use `localize` or
  `format` for module-owned UI text; never translate player names or notes.
- `tests/*.test.mjs`: Node test runner with injected Foundry doubles.
- `compile-packs.js`: validates JSON sources, compiles all packs into staging,
  then replaces previous output with rollback on failure.
- `sounds/`: only audio used by the current tools. Software license: ISC in
  `LICENSE` and `package.json`.

## Roll tables

21 d20 tables: 11 base tables in `scripts/init.js` and 10 thematic tables in
`scripts/roshar-roll-tables.js`. The hierarchy beneath
`CosmereRPG: Character Creation` contains `Character Creation`,
`Name Generators` and `Roshar GM Tables`.

- Only `game.users.activeGM?.isSelf` may seed, preventing multiple GM clients
  from creating duplicate folders/tables.
- `seedRollTables` allows the GM to disable seeding. `tableSeedVersion` records
  completion; bump `TABLE_SEED_VERSION` in `scripts/table-seeding.js` when bundled
  table definitions change.
- Owned tables have `flags["cosmere-rpg-tooling"].tableKey`. Identify ownership
  by this key, never by name alone. Move owned tables with `update({ folder })`;
  never delete and recreate them, or overwrite their customized results.
- Legacy seeds are adopted only through a unique exact match of name, formula
  and results, even if moved to another folder. Customized or ambiguous copies
  stay untouched. Table tools prefer the module ownership flag over names.
- Default results have weight 1 and sequential ranges `[1,1]` to `[20,20]`.
  Keep stable table names/keys because other tools use them for lookup.

## Macros and compendia

66 macro documents: **21 player macros and 45 GM macros**.

- Tracked JSON: `packs/_source/player-macros/` and `packs/_source/gm-macros/`.
- Generated, gitignored LevelDB: `packs/player-macros/`, `packs/gm-macros/`.
- Every `_id` must match `/^[A-Za-z0-9]{16}$/`; `_key` must be
  `!macros!{_id}`. Keep valid IDs stable and record migrated IDs in
  `flags["cosmere-rpg-tooling"].legacyIds`.
- Prefer `_stats.compendiumSource` or `flags.core.sourceId` for upgrades.
  Explicit `legacyNames` aliases may identify candidates with no provenance;
  these require separate GM confirmation before any update. Unrelated names,
  ambiguous aliases and macros sourced from other compendia stay untouched. Keep
  world names and IDs when applying selected updates and isolate each failure.
- Add functionality to scripts and expose it through the API. Avoid embedding
  implementation code or absolute module imports inside macro JSON.
- After modifying macro source JSON, always run `npm run compile`.

## Safety and settings

- Escape actor/user names, image attributes, notes and validation errors before
  interpolating them into HTML. Use the shared `escapeHtml`.
- Sphere counts must be safe integers ≥ 0. Convert by value with change; reject
  identical source/destination. Investiture drain transfers spheres to the same
  denomination in `dun`. Inventory identity comes from system metadata, not
  translated names. Reject stale transaction plans before writing.
- Guard missing tokens, actors, resource paths and optional animation modules.
  Await document updates; resource updates must work without animation modules.
- Only the active GM publishes automatic roll cards. Each client plays its roll
  effects locally once, respecting private roll visibility and client settings.
  `createChatMessage` handles rolls even when Dice So Nice skips animation;
  its optional completion event shares the same deduplication set.
- `rollHookSound`, `rollHookAnimation`, `soundVolume`, `useAnimations` have client
  scope, retaining former world values as initial defaults. Other behavior and
  table settings have world scope.
- Maintenance reports are whispered to all GMs; with no recipients they must
  not fall back to public chat.

## Development and validation

```bash
npm ci
npm test
npm run validate
npm run compile
```

`npm test` runs behavioral regressions without a Foundry installation.
`npm run validate` checks source metadata/IDs and compilation; compilation
requires installed npm dependencies. CI runs tests and validation for every push
and PR; the release workflow also requires them before packaging.

Real Foundry smoke tests are still necessary for compendium imports, dialogs,
permissions, active-GM election, multi-client audio/animation and system schemas.
Do not claim these runtime checks happened from Node tests alone.

## Releases and content

`.github/workflows/main.yml` handles published version tags, replaces manifest
placeholders, runs checks and builds a zip containing `module.json`, `README.md`,
`LICENSE`, `scripts/`, compiled packs, `sounds/` and `lang/`. JSON sources and tests
are not packaged. Missing required paths fail the build. Dependabot monitors
GitHub Actions and npm.

Comments and documentation are primarily Spanish; UI catalogs support English
and Spanish. Keep the original improvement report as historical context. New
content proposals C-1–C-20 are separate from robustness R-1–R-25. Reference
licensed official tables by UUID rather than copying their contents.
