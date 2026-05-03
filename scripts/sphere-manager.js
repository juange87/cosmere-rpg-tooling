import {
  buildCosmereChatCard,
  escapeHtml,
  getPlayerActors,
  normalizeNumber,
  postCosmereChatCard,
} from "./cosmere-helpers.js";

export const SPHERE_DENOMINATIONS = [
  { key: "spheres|chip", currency: "spheres", denom: "chip", label: "Chip infused", value: 1 },
  { key: "spheres|mark", currency: "spheres", denom: "mark", label: "Mark infused", value: 5 },
  { key: "spheres|broam", currency: "spheres", denom: "broam", label: "Broam infused", value: 20 },
  { key: "dun|chip", currency: "dun", denom: "chip", label: "Chip dun", value: 1 },
  { key: "dun|mark", currency: "dun", denom: "mark", label: "Mark dun", value: 5 },
  { key: "dun|broam", currency: "dun", denom: "broam", label: "Broam dun", value: 20 },
];

function findMoneyItem(actor, currency, denom) {
  return Array.from(actor?.items ?? []).find(item =>
    item?.type === "loot" &&
    item?.system?.isMoney === true &&
    item?.system?.price?.currency === currency &&
    item?.system?.price?.denomination?.primary === denom
  );
}

function itemName(currency, denom) {
  const label = denom.charAt(0).toUpperCase() + denom.slice(1);
  return currency === "dun" ? `${label} dun` : `${label} infused`;
}

function buildMoneyItemData(key, quantity) {
  const denomination = SPHERE_DENOMINATIONS.find(item => item.key === key);
  const currency = denomination?.currency ?? key.split("|")[0];
  const denom = denomination?.denom ?? key.split("|")[1];
  return {
    name: itemName(currency, denom),
    type: "loot",
    system: {
      isMoney: true,
      quantity,
      weight: { value: 0, unit: "lb" },
      price: {
        value: 1,
        currency,
        denomination: { primary: denom, secondary: "none" },
      },
      description: { value: "", chat: "", short: "" },
      events: {},
      relationships: {},
    },
  };
}

export function getSphereQuantity(actor, key) {
  const [currency, denom] = key.split("|");
  return normalizeNumber(findMoneyItem(actor, currency, denom)?.system?.quantity, 0);
}

export function summarizeSphereBalance(actor) {
  const rows = SPHERE_DENOMINATIONS.map(denom => {
    const quantity = getSphereQuantity(actor, denom.key);
    return {
      ...denom,
      quantity,
      valueTotal: quantity * denom.value,
    };
  }).filter(row => row.quantity > 0);

  return {
    actorId: actor?.id,
    actorName: actor?.name ?? "Sin actor",
    rows,
    totalQuantity: rows.reduce((sum, row) => sum + row.quantity, 0),
    totalValue: rows.reduce((sum, row) => sum + row.valueTotal, 0),
  };
}

export function planSphereTransaction({
  actors = [],
  changes = {},
  strict = true,
} = {}) {
  const results = actors.map(actor => {
    const current = {};
    const next = {};
    const deficit = {};

    for (const denomination of SPHERE_DENOMINATIONS) {
      const change = normalizeNumber(changes[denomination.key], 0);
      if (!change) continue;
      const available = getSphereQuantity(actor, denomination.key);
      const planned = available + change;
      current[denomination.key] = available;
      next[denomination.key] = Math.max(0, planned);
      if (planned < 0) deficit[denomination.key] = Math.abs(planned);
    }

    return {
      actorId: actor?.id,
      actorName: actor?.name ?? "Sin actor",
      current,
      next,
      deficit,
      ok: Object.keys(deficit).length === 0,
    };
  });

  return {
    ok: !strict || results.every(result => result.ok),
    strict,
    results,
  };
}

export function planSphereConversion({
  actor,
  fromKey = "spheres|mark",
  toKey = "dun|mark",
  quantity = 0,
  strict = true,
} = {}) {
  const amount = Math.max(0, normalizeNumber(quantity, 0));
  const changes = {
    [fromKey]: -amount,
    [toKey]: amount,
  };
  const transaction = planSphereTransaction({
    actors: actor ? [actor] : [],
    changes,
    strict,
  });
  return {
    ...transaction,
    actorId: actor?.id,
    actorName: actor?.name ?? "Sin actor",
    fromKey,
    toKey,
    quantity: amount,
    changes,
  };
}

export function planGroupSphereSpend({
  actors = [],
  key = "spheres|mark",
  quantity = 0,
} = {}) {
  let remaining = Math.max(0, normalizeNumber(quantity, 0));
  const allocations = [];

  for (const actor of actors) {
    if (remaining <= 0) break;
    const available = getSphereQuantity(actor, key);
    const spent = Math.min(available, remaining);
    if (spent > 0) {
      allocations.push({
        actorId: actor?.id,
        actorName: actor?.name ?? "Sin actor",
        key,
        quantity: spent,
      });
      remaining -= spent;
    }
  }

  return {
    ok: remaining === 0,
    key,
    requested: Math.max(0, normalizeNumber(quantity, 0)),
    allocations,
    deficit: remaining,
  };
}

export function planInvestitureDrain({
  actors = [],
  amount = 1,
} = {}) {
  const drainOrder = ["spheres|broam", "spheres|mark", "spheres|chip"];
  const results = actors.map(actor => {
    let remaining = Math.max(0, normalizeNumber(amount, 0));
    const changes = {};
    for (const key of drainOrder) {
      if (remaining <= 0) break;
      const available = getSphereQuantity(actor, key);
      const drained = Math.min(available, remaining);
      if (drained > 0) {
        changes[key] = -drained;
        remaining -= drained;
      }
    }
    const result = planSphereTransaction({ actors: [actor], changes, strict: true }).results[0] ?? {
      actorId: actor?.id,
      actorName: actor?.name ?? "Sin actor",
      current: {},
      next: {},
      deficit: {},
      ok: remaining === 0,
    };
    if (remaining > 0) {
      result.deficit.investitureDrain = remaining;
      result.ok = false;
    }
    return result;
  });

  return {
    ok: results.every(result => result.ok),
    amount: Math.max(0, normalizeNumber(amount, 0)),
    results,
  };
}

export function buildGroupSphereSpendTransaction({
  actors = [],
  key = "spheres|mark",
  quantity = 0,
} = {}) {
  const spend = planGroupSphereSpend({ actors, key, quantity });
  const results = actors.map(actor => {
    const allocation = spend.allocations.find(item => item.actorId === actor?.id);
    const changes = allocation ? { [key]: -allocation.quantity } : {};
    return planSphereTransaction({ actors: [actor], changes, strict: true }).results[0] ?? {
      actorId: actor?.id,
      actorName: actor?.name ?? "Sin actor",
      current: {},
      next: {},
      deficit: {},
      ok: true,
    };
  });

  return {
    ok: spend.ok,
    key,
    requested: spend.requested,
    deficit: spend.deficit,
    allocations: spend.allocations,
    results,
  };
}

export function buildSphereTransactionChatCard({
  title = "Operacion de esferas",
  plan,
} = {}) {
  const sections = (plan?.results ?? []).map(result => {
    const changes = SPHERE_DENOMINATIONS
      .filter(denom => denom.key in (result.next ?? {}))
      .map(denom => `${denom.label}: ${result.current?.[denom.key] ?? 0} -> ${result.next?.[denom.key] ?? 0}`)
      .join(", ");
    const deficits = Object.entries(result.deficit ?? {})
      .filter(([, value]) => value > 0)
      .map(([key, value]) => `${key}: faltan ${value}`)
      .join(", ");

    return {
      label: result.actorName,
      value: [changes || "Sin cambios", deficits ? `Deficit: ${deficits}` : ""].filter(Boolean).join(" | "),
    };
  });

  return buildCosmereChatCard({
    eyebrow: "Gestor de Esferas Avanzado",
    title,
    sections,
    accent: plan?.ok === false ? "#9f3a38" : "#1a6fa8",
    background: "#f5fbff",
  });
}

function findActorById(actors, actorId) {
  return actors.find(actor => actor?.id === actorId);
}

export async function applySphereTransactionPlan({
  actors = [],
  plan,
  publishChat = true,
  title = "Operacion de esferas",
  ChatMessage = globalThis.ChatMessage,
} = {}) {
  if (!plan?.results) throw new Error("No hay plan de esferas para aplicar.");
  if (!plan.ok) throw new Error("Fondos insuficientes: revisa el deficit antes de aplicar.");

  for (const result of plan.results) {
    const actor = findActorById(actors, result.actorId);
    if (!actor) continue;
    for (const [key, nextQuantity] of Object.entries(result.next ?? {})) {
      const [currency, denom] = key.split("|");
      const item = findMoneyItem(actor, currency, denom);
      if (nextQuantity <= 0) {
        await item?.delete?.();
      } else if (item) {
        await item.update?.({ "system.quantity": nextQuantity });
      } else {
        await actor.createEmbeddedDocuments?.("Item", [buildMoneyItemData(key, nextQuantity)]);
      }
    }
  }

  if (publishChat) {
    await postCosmereChatCard({
      content: buildSphereTransactionChatCard({ title, plan }),
      ChatMessage,
    });
  }

  return plan;
}

export function buildSphereSummaryChatCard({ actors = [] } = {}) {
  const sections = actors.map(actor => {
    const summary = summarizeSphereBalance(actor);
    const value = summary.rows.length
      ? summary.rows.map(row => `${row.quantity} ${row.label}`).join(", ")
      : "Sin esferas registradas";
    return { label: summary.actorName, value: `${value} (${summary.totalValue} valor abstracto)` };
  });

  return buildCosmereChatCard({
    eyebrow: "Gestor de Esferas Avanzado",
    title: "Resumen de tesoreria",
    sections,
    accent: "#1a6fa8",
    background: "#f5fbff",
  });
}

export async function postSphereSummary({
  actors = getPlayerActors(),
  ChatMessage = globalThis.ChatMessage,
} = {}) {
  await postCosmereChatCard({
    content: buildSphereSummaryChatCard({ actors }),
    ChatMessage,
  });
  return actors.map(actor => summarizeSphereBalance(actor));
}

function denominationOptions() {
  return SPHERE_DENOMINATIONS.map(denom => `<option value="${denom.key}">${denom.label}</option>`).join("");
}

function actorOptions(actors) {
  return actors.map(actor => `<option value="${escapeHtml(actor.id)}">${escapeHtml(actor.name)}</option>`).join("");
}

export function buildSphereManagerDialogContent(actors) {
  const rows = actors.map(actor => {
    const summary = summarizeSphereBalance(actor);
    const balance = summary.rows.map(row => `${row.quantity} ${row.label}`).join(", ") || "sin esferas";
    return `<li><strong>${escapeHtml(actor.name)}</strong>: ${escapeHtml(balance)}</li>`;
  }).join("");
  return `
    <div>
      <p>Balance actual por actor:</p>
      <ul>${rows}</ul>
      <hr>
      <h3>Convertir esferas</h3>
      <div class="form-group"><label>Actor</label><select name="convertActorId">${actorOptions(actors)}</select></div>
      <div class="form-group"><label>Desde</label><select name="convertFromKey">${denominationOptions()}</select></div>
      <div class="form-group"><label>Hacia</label><select name="convertToKey">${denominationOptions()}</select></div>
      <div class="form-group"><label>Cantidad</label><input name="convertQuantity" type="number" value="1" min="0" step="1" /></div>
      <hr>
      <h3>Gasto de grupo</h3>
      <div class="form-group"><label>Denominacion</label><select name="spendKey">${denominationOptions()}</select></div>
      <div class="form-group"><label>Cantidad total</label><input name="spendQuantity" type="number" value="1" min="0" step="1" /></div>
      <hr>
      <h3>Drenar tras Investiture</h3>
      <div class="form-group"><label>Cantidad por actor</label><input name="drainAmount" type="number" value="1" min="0" step="1" /></div>
      <label><input name="publishChat" type="checkbox" checked /> Publicar resultado en chat</label>
    </div>
  `;
}

export function openSphereManager({
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  game = globalThis.game,
  ui = globalThis.ui,
} = {}) {
  if (!Dialog || !ChatMessage) throw new Error("Foundry no esta disponible para abrir el gestor de esferas.");
  const actors = getPlayerActors({ game });
  new Dialog({
    title: "Gestor de Esferas Avanzado",
    content: buildSphereManagerDialogContent(actors),
    buttons: {
      publish: {
        icon: '<i class="fas fa-coins"></i>',
        label: "Publicar resumen",
        callback: async () => {
          try {
            await postSphereSummary({ actors, ChatMessage });
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      convert: {
        icon: '<i class="fas fa-exchange-alt"></i>',
        label: "Convertir",
        callback: async html => {
          try {
            const actor = findActorById(actors, html.find("[name=convertActorId]").val());
            const plan = planSphereConversion({
              actor,
              fromKey: html.find("[name=convertFromKey]").val(),
              toKey: html.find("[name=convertToKey]").val(),
              quantity: html.find("[name=convertQuantity]").val(),
            });
            await applySphereTransactionPlan({
              actors,
              plan,
              title: "Conversion de esferas",
              publishChat: html.find("[name=publishChat]").is(":checked"),
              ChatMessage,
            });
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      spend: {
        icon: '<i class="fas fa-hand-holding-usd"></i>',
        label: "Gastar grupo",
        callback: async html => {
          try {
            const plan = buildGroupSphereSpendTransaction({
              actors,
              key: html.find("[name=spendKey]").val(),
              quantity: html.find("[name=spendQuantity]").val(),
            });
            await applySphereTransactionPlan({
              actors,
              plan,
              title: "Gasto de grupo",
              publishChat: html.find("[name=publishChat]").is(":checked"),
              ChatMessage,
            });
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      drain: {
        icon: '<i class="fas fa-bolt"></i>',
        label: "Drenar",
        callback: async html => {
          try {
            const plan = planInvestitureDrain({
              actors,
              amount: html.find("[name=drainAmount]").val(),
            });
            await applySphereTransactionPlan({
              actors,
              plan,
              title: "Drenaje tras Investiture",
              publishChat: html.find("[name=publishChat]").is(":checked"),
              ChatMessage,
            });
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      close: { icon: '<i class="fas fa-times"></i>', label: "Cerrar" },
    },
    default: "publish",
    width: 560,
  }).render(true);
}
