// Prefer the complete collection when both editions are active.
export const JB2A_MODULE_IDS = ["jb2a_patreon", "JB2A_DnD5e"];

export function getActiveJb2aModuleId(game = globalThis.game) {
  const modules = game?.modules;
  return JB2A_MODULE_IDS.find(id => {
    const module = typeof modules?.get === "function"
      ? modules.get(id)
      : Array.isArray(modules)
        ? modules.find(item => item?.id === id)
        : modules?.[id];
    return Boolean(module?.active ?? module?.enabled);
  });
}

export function resolveJb2aAssetPath(relativePath, game = globalThis.game) {
  const moduleId = getActiveJb2aModuleId(game);
  return moduleId ? `modules/${moduleId}/${relativePath}` : null;
}
