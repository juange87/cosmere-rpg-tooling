export const COSMERE_MODULE_ID = "cosmere-rpg-tooling";

export const COSMERE_HELPER_KEYS = [
  "actor",
  "resources",
  "spheres",
  "chat",
  "dependencies",
  "formatting",
];

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function normalizeText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

export function normalizeNumber(value, fallback = 0) {
  if (value === "" || value === null || value === undefined) return fallback;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function getProperty(source, path, fallback = undefined) {
  const parts = String(path ?? "").split(".").filter(Boolean);
  let current = source;
  for (const part of parts) {
    if (current == null || !(part in current)) return fallback;
    current = current[part];
  }
  return current;
}

export function resolveCosmereActor({
  controlledTokens = globalThis.canvas?.tokens?.controlled ?? [],
  userCharacter = globalThis.game?.user?.character,
} = {}) {
  return controlledTokens.find(token => token?.actor)?.actor ?? userCharacter ?? null;
}

export function getControlledActors({
  controlledTokens = globalThis.canvas?.tokens?.controlled ?? [],
  fallbackActor = null,
} = {}) {
  const actors = controlledTokens.map(token => token?.actor).filter(Boolean);
  if (actors.length) return actors;
  return fallbackActor ? [fallbackActor] : [];
}

export function getPlayerActors({ game = globalThis.game } = {}) {
  const actors = game?.actors;
  if (!actors) return [];
  const values = typeof actors.filter === "function"
    ? actors
    : Array.from(actors.values?.() ?? []);
  return values.filter(actor => actor?.hasPlayerOwner && actor?.type === "character");
}

export function buildCosmereChatCard({
  eyebrow = "Cosmere RPG Tooling",
  title = "",
  subtitle = "",
  sections = [],
  accent = "#1e3a5f",
  background = "#f7fafc",
  footer = "",
} = {}) {
  const renderedSections = sections.map(section => `
    <div style="padding:7px 9px;border-left:3px solid ${accent};background:rgba(30,58,95,0.06);">
      <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">${escapeHtml(section.label)}</div>
      <div>${escapeHtml(section.value)}</div>
    </div>
  `).join("");

  const subtitleBlock = subtitle
    ? `<p style="margin:0 0 8px;color:#4a5568;">${escapeHtml(subtitle)}</p>`
    : "";
  const footerBlock = footer
    ? `<div style="margin-top:8px;font-size:11px;color:#6f7f95;">${escapeHtml(footer)}</div>`
    : "";

  return `
    <div style="border:1px solid ${accent};border-radius:6px;background:${background};padding:12px;color:#1f2933;">
      <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.06em;">${escapeHtml(eyebrow)}</div>
      <h2 style="margin:2px 0 8px;font-family:Modesto Condensed,serif;color:${accent};font-size:24px;">
        ${escapeHtml(title)}
      </h2>
      ${subtitleBlock}
      <div style="display:grid;gap:8px;">${renderedSections}</div>
      ${footerBlock}
    </div>
  `;
}

export function gmWhisper(ChatMessage = globalThis.ChatMessage) {
  return ChatMessage?.getWhisperRecipients?.("GM")?.map(user => user.id) ?? [];
}

export async function postCosmereChatCard({
  content,
  whisperOnly = false,
  ChatMessage = globalThis.ChatMessage,
} = {}) {
  if (!ChatMessage) {
    throw new Error("Foundry no esta disponible para publicar en chat.");
  }

  return ChatMessage.create({
    content,
    speaker: ChatMessage.getSpeaker?.(),
    whisper: whisperOnly ? gmWhisper(ChatMessage) : undefined,
  });
}
