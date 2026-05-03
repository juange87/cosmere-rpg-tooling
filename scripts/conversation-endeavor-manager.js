import {
  buildCosmereChatCard,
  clamp,
  normalizeNumber,
  normalizeText,
  postCosmereChatCard,
} from "./cosmere-helpers.js";

export const TRACK_TYPES = [
  { key: "conversation", label: "Conversacion" },
  { key: "endeavor", label: "Endeavor" },
];

function resolveTrackType(type) {
  return TRACK_TYPES.find(item => item.key === type) ?? TRACK_TYPES[0];
}

export function buildNonCombatTrack({
  type = "conversation",
  title = "",
  target = "",
  resistance = 4,
  focus = "",
  progress = 0,
  failures = 0,
  beats = [],
  summary = "",
} = {}) {
  const resolvedType = resolveTrackType(type);
  const requiredProgress = Math.max(1, normalizeNumber(resistance, 4));
  const currentProgress = clamp(normalizeNumber(progress, 0), 0, requiredProgress);

  return {
    type: resolvedType.key,
    typeLabel: resolvedType.label,
    title: normalizeText(title, resolvedType.key === "conversation" ? "Conversacion sin titulo" : "Endeavor sin titulo"),
    target: normalizeText(target, "Sin objetivo"),
    resistance: requiredProgress,
    focus: normalizeText(focus),
    progress: currentProgress,
    failures: Math.max(0, normalizeNumber(failures, 0)),
    beats: Array.isArray(beats) ? beats : [],
    summary: normalizeText(summary),
    complete: currentProgress >= requiredProgress,
  };
}

export function recordTrackStep(track, {
  progress = 0,
  failure = false,
  opportunity = "",
  complication = "",
  note = "",
  finish = false,
  summary = "",
} = {}) {
  const current = buildNonCombatTrack(track);
  const finalSummary = normalizeText(summary);
  const shouldFinish = Boolean(finish) || Boolean(finalSummary);
  const nextProgress = shouldFinish
    ? current.resistance
    : clamp(current.progress + normalizeNumber(progress, 0), 0, current.resistance);
  const beat = {
    progress: normalizeNumber(progress, 0),
    failure: Boolean(failure),
    opportunity: normalizeText(opportunity),
    complication: normalizeText(complication),
    note: normalizeText(note),
  };

  return buildNonCombatTrack({
    ...current,
    progress: nextProgress,
    failures: current.failures + (failure ? 1 : 0),
    beats: [...current.beats, beat],
    summary: finalSummary || current.summary,
  });
}

export function buildNonCombatChatCard(track) {
  const resolved = buildNonCombatTrack(track);
  const lastBeat = resolved.beats.at(-1);
  const sections = [
    { label: "Objetivo", value: resolved.target },
    { label: "Progreso", value: `${resolved.progress} / ${resolved.resistance}` },
    { label: "Fallos", value: String(resolved.failures) },
  ];

  if (resolved.focus) sections.push({ label: "Foco o resistencia", value: resolved.focus });
  if (lastBeat?.opportunity) sections.push({ label: "Opportunity", value: lastBeat.opportunity });
  if (lastBeat?.complication) sections.push({ label: "Complication", value: lastBeat.complication });
  if (lastBeat?.note) sections.push({ label: "Nota", value: lastBeat.note });
  if (resolved.summary) sections.push({ label: "Resumen final", value: resolved.summary });

  return buildCosmereChatCard({
    eyebrow: "Gestor de Conversaciones y Endeavors",
    title: resolved.title,
    subtitle: resolved.typeLabel,
    sections,
    accent: resolved.complete ? "#237a3b" : "#1e3a5f",
  });
}

export async function postNonCombatTrack({
  track,
  whisperOnly = false,
  ChatMessage = globalThis.ChatMessage,
} = {}) {
  const resolved = buildNonCombatTrack(track);
  await postCosmereChatCard({
    content: buildNonCombatChatCard(resolved),
    whisperOnly,
    ChatMessage,
  });
  return resolved;
}

function buildTrackDialogContent() {
  const typeOptions = TRACK_TYPES.map(type => `<option value="${type.key}">${type.label}</option>`).join("");
  return `
    <form>
      <div class="form-group">
        <label>Tipo</label>
        <select name="type">${typeOptions}</select>
      </div>
      <div class="form-group">
        <label>Titulo</label>
        <input name="title" type="text" />
      </div>
      <div class="form-group">
        <label>PNJ objetivo, resistencia o foco</label>
        <input name="target" type="text" />
      </div>
      <div class="form-group">
        <label>Progreso requerido</label>
        <input name="resistance" type="number" value="4" min="1" />
      </div>
      <div class="form-group">
        <label>Avance</label>
        <input name="progress" type="number" value="1" />
      </div>
      <div class="form-group">
        <label>Opportunity</label>
        <textarea name="opportunity" rows="2"></textarea>
      </div>
      <div class="form-group">
        <label>Complication</label>
        <textarea name="complication" rows="2"></textarea>
      </div>
      <div class="form-group">
        <label>Nota del avance</label>
        <textarea name="note" rows="2"></textarea>
      </div>
      <div class="form-group">
        <label>Resumen final</label>
        <textarea name="summary" rows="2"></textarea>
      </div>
      <label><input name="failure" type="checkbox" /> Registrar fallo</label>
      <label><input name="whisper" type="checkbox" /> Enviar solo al GM</label>
    </form>
  `;
}

export function openConversationEndeavorManager({
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  ui = globalThis.ui,
} = {}) {
  if (!Dialog || !ChatMessage) {
    throw new Error("Foundry no esta disponible para abrir el gestor no-combate.");
  }

  const publishTrack = async (html, { finish = false } = {}) => {
    const base = buildNonCombatTrack({
      type: html.find("[name=type]").val(),
      title: html.find("[name=title]").val(),
      target: html.find("[name=target]").val(),
      resistance: html.find("[name=resistance]").val(),
    });
    const track = recordTrackStep(base, {
      progress: html.find("[name=progress]").val(),
      failure: html.find("[name=failure]").is(":checked"),
      opportunity: html.find("[name=opportunity]").val(),
      complication: html.find("[name=complication]").val(),
      note: html.find("[name=note]").val(),
      summary: html.find("[name=summary]").val(),
      finish,
    });
    await postNonCombatTrack({
      track,
      whisperOnly: html.find("[name=whisper]").is(":checked"),
      ChatMessage,
    });
  };

  new Dialog({
    title: "Gestor de Conversaciones y Endeavors",
    content: buildTrackDialogContent(),
    buttons: {
      publish: {
        icon: '<i class="fas fa-comments"></i>',
        label: "Registrar avance",
        callback: async html => {
          try {
            await publishTrack(html);
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      finish: {
        icon: '<i class="fas fa-flag-checkered"></i>',
        label: "Finalizar con resumen",
        callback: async html => {
          try {
            await publishTrack(html, { finish: true });
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" },
    },
    default: "publish",
  }).render(true);
}
