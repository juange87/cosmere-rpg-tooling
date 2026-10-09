import { runLegacyResourceChange } from "../legacy-tools.js";
export function run(options = {}) {
  return runLegacyResourceChange({ ...options, resourceKey: "hea", delta: 1 });
}
