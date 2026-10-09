import { runLegacySkillRoll } from "../legacy-tools.js";
export function run(options = {}) {
  return runLegacySkillRoll({ ...options, skillKey: "cra" });
}
