import {
  COSMERE_MODULE_ID,
  buildCosmereChatCard,
  clamp,
  getControlledActors,
  getProperty,
  normalizeNumber,
  normalizeText,
  postCosmereChatCard,
} from "./cosmere-helpers.js";
import { hasCosmereDialogSupport, openCosmereDialog } from "./foundry-dialogs.js";

export const RESOURCE_KEYS = [
  { key: "health", label: "Salud", path: "system.resources.hea.value", maxPath: "system.resources.hea.max" },
  { key: "focus", label: "Foco", path: "system.resources.foc.value", maxPath: "system.resources.foc.max" },
  { key: "investiture", label: "Investiture", path: "system.resources.inv.value", maxPath: "system.resources.inv.max" },
];

export const NARRATIVE_STATES = [
  { key: "advantaged", label: "Con ventaja", tone: "Impulso narrativo favorable." },
  { key: "exposed", label: "Expuesto", tone: "Posicion vulnerable o coste pendiente." },
  { key: "exhausted", label: "Agotado", tone: "Cansancio, presion o desgaste acumulado." },
  { key: "inspired", label: "Inspirado", tone: "Determinacion, luz o apoyo en la escena." },
];

function resolveResource(resourceKey) {
  return RESOURCE_KEYS.find(resource => resource.key === resourceKey) ?? RESOURCE_KEYS[0];
}

function resolveNarrativeState(stateKey) {
  return NARRATIVE_STATES.find(state => state.key === stateKey) ?? NARRATIVE_STATES[0];
}

function readMax(actor, path) {
  const raw = getProperty(actor, path, undefined);
  if (typeof raw === "object" && raw !== null && "value" in raw) return normalizeNumber(raw.value, 0);
  return normalizeNumber(raw, 0);
}

export function buildResourceUpdatePlan({
  actors = [],
  resourceKey = "health",
  delta = 0,
  absoluteValue = null,
} = {}) {
  const resource = resolveResource(resourceKey);
  const numericDelta = normalizeNumber(delta, 0);
  const hasAbsoluteValue = absoluteValue !== null && absoluteValue !== undefined && absoluteValue !== "";

  const results = actors.map(actor => {
    const current = normalizeNumber(getProperty(actor, resource.path, 0), 0);
    const max = readMax(actor, resource.maxPath);
    const unclampedNext = hasAbsoluteValue ? normalizeNumber(absoluteValue, current) : current + numericDelta;
    const next = max > 0 ? clamp(unclampedNext, 0, max) : Math.max(0, unclampedNext);
    return {
      actorId: actor?.id,
      actorName: actor?.name ?? "Sin actor",
      path: resource.path,
      current,
      next,
      delta: next - current,
    };
  });

  return { resource, results };
}

export function buildResourceSummaryChatCard(plan) {
  return buildCosmereChatCard({
    eyebrow: "Control Rapido de Recursos",
    title: plan.resource.label,
    sections: plan.results.map(result => ({
      label: result.actorName,
      value: `${result.current} -> ${result.next} (${result.delta >= 0 ? "+" : ""}${result.delta})`,
    })),
    accent: "#237a3b",
  });
}

export function buildNarrativeStatePlan({
  actors = [],
  stateKey = "advantaged",
  mode = "add",
  note = "",
} = {}) {
  const state = resolveNarrativeState(stateKey);
  const normalizedMode = mode === "remove" ? "remove" : "add";
  const cleanNote = normalizeText(note);
  return {
    state,
    mode: normalizedMode,
    note: cleanNote,
    results: actors.map(actor => ({
      actorId: actor?.id,
      actorName: actor?.name ?? "Sin actor",
      action: normalizedMode,
      label: state.label,
      note: cleanNote,
    })),
  };
}

export function buildNarrativeStateSummaryChatCard(plan) {
  return buildCosmereChatCard({
    eyebrow: "Control Rapido de Recursos",
    title: plan.mode === "remove" ? "Estado narrativo retirado" : "Estado narrativo aplicado",
    sections: plan.results.map(result => ({
      label: result.actorName,
      value: `${result.label}${result.note ? `: ${result.note}` : ""}`,
    })),
    accent: plan.mode === "remove" ? "#6f7f95" : "#6f2b91",
    background: "#fbf8fc",
  });
}

export async function applyResourceUpdatePlan({
  plan,
  actors = Array.from(globalThis.game?.actors ?? []),
  publishChat = true,
  ChatMessage = globalThis.ChatMessage,
} = {}) {
  for (const result of plan.results) {
    const actor = actors.find(item => item?.id === result.actorId);
    await actor?.update?.({ [result.path]: result.next });
  }
  if (publishChat) {
    await postCosmereChatCard({ content: buildResourceSummaryChatCard(plan), ChatMessage });
  }
  return plan;
}

export async function applyNarrativeStatePlan({
  plan,
  actors = Array.from(globalThis.game?.actors ?? []),
  publishChat = true,
  ChatMessage = globalThis.ChatMessage,
} = {}) {
  const flagKey = `narrativeStates.${plan.state.key}`;
  for (const result of plan.results) {
    const actor = actors.find(item => item?.id === result.actorId);
    if (!actor) continue;
    if (plan.mode === "remove") {
      await actor.unsetFlag?.(COSMERE_MODULE_ID, flagKey);
    } else {
      await actor.setFlag?.(COSMERE_MODULE_ID, flagKey, {
        label: plan.state.label,
        note: result.note,
      });
    }
  }
  if (publishChat) {
    await postCosmereChatCard({ content: buildNarrativeStateSummaryChatCard(plan), ChatMessage });
  }
  return plan;
}

function resourceOptions() {
  return RESOURCE_KEYS.map(resource => `<option value="${resource.key}">${resource.label}</option>`).join("");
}

function stateOptions() {
  return NARRATIVE_STATES.map(state => `<option value="${state.key}">${state.label}</option>`).join("");
}

export function openResourceControl({
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  canvas = globalThis.canvas,
  game = globalThis.game,
  ui = globalThis.ui,
} = {}) {
  if (!hasCosmereDialogSupport({ Dialog }) || !ChatMessage) {
    throw new Error("Foundry no esta disponible para abrir recursos.");
  }
  const actors = getControlledActors({
    controlledTokens: canvas?.tokens?.controlled ?? [],
    fallbackActor: game?.user?.character,
  });
  if (!actors.length) {
    ui?.notifications?.warn?.("Selecciona tokens o configura un personaje de usuario.");
    return;
  }

  openCosmereDialog({
    title: "Control Rapido de Recursos",
    content: `
      <form>
        <h3>Recursos numericos</h3>
        <div class="form-group"><label>Recurso</label><select name="resourceKey">${resourceOptions()}</select></div>
        <div class="form-group"><label>Incremento</label><input name="delta" type="number" value="1" /></div>
        <hr>
        <h3>Estado narrativo simple</h3>
        <div class="form-group"><label>Estado narrativo</label><select name="stateKey">${stateOptions()}</select></div>
        <div class="form-group">
          <label>Accion</label>
          <select name="stateMode">
            <option value="add">Aplicar</option>
            <option value="remove">Retirar</option>
          </select>
        </div>
        <div class="form-group"><label>Nota</label><input name="stateNote" type="text" /></div>
        <label><input name="publishChat" type="checkbox" checked /> Publicar resumen</label>
      </form>
    `,
    buttons: {
      apply: {
        icon: '<i class="fas fa-heart"></i>',
        label: "Aplicar",
        callback: async html => {
          try {
            const plan = buildResourceUpdatePlan({
              actors,
              resourceKey: html.find("[name=resourceKey]").val(),
              delta: html.find("[name=delta]").val(),
            });
            await applyResourceUpdatePlan({
              plan,
              actors,
              publishChat: html.find("[name=publishChat]").is(":checked"),
              ChatMessage,
            });
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      state: {
        icon: '<i class="fas fa-tag"></i>',
        label: "Aplicar estado",
        callback: async html => {
          try {
            const plan = buildNarrativeStatePlan({
              actors,
              stateKey: html.find("[name=stateKey]").val(),
              mode: html.find("[name=stateMode]").val(),
              note: html.find("[name=stateNote]").val(),
            });
            await applyNarrativeStatePlan({
              plan,
              actors,
              publishChat: html.find("[name=publishChat]").is(":checked"),
              ChatMessage,
            });
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      cancel: { icon: '<i class="fas fa-times"></i>', label: "Cancelar" },
    },
    default: "apply",
  }, { Dialog });
}
