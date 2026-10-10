import { runLegacySphereTool } from "../legacy-sphere-tools.js";
export function run(context = {}) {
  return runLegacySphereTool({ ...context, remove: true });
}
