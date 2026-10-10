# CLAUDE.md

Read [AGENTS.md](AGENTS.md) for the shared project architecture, development
commands, release process and maintenance rules. It is the canonical project
instruction file so both assistants use the same current guidance.

The module contains 66 macro documents (21 player, 45 GM), 21 roll tables,
English/Spanish catalogs in `lang/`, and automated Node tests. Compendium macros
call the public module API; implementations live in `scripts/`. Run `npm test`
and `npm run validate` before publishing, and `npm run compile` after changing
macro source JSON. Foundry runtime smoke tests are separate from Node tests.
