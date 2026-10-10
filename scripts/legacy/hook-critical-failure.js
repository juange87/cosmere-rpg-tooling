import { localize } from "../localization.js";
// Kept as a compatibility entry point for existing hotbars; registers no hooks.
export function run({ ui = globalThis.ui } = {}) {
  ui?.notifications?.info?.(localize("RetiredHookMacro"));
  return false;
}
