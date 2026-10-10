import { runLegacyResourceChange } from "../legacy-tools.js";
export function run(options = {}) {
  return runLegacyResourceChange({ ...options, resourceKey: "foc", delta: 1 });
}
