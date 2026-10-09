import { localize } from "./localization.js";
import { normalizeNumber } from "./cosmere-helpers.js";
import { SPHERE_DENOMINATIONS, sphereItemName as itemName } from "./sphere-currency.js";

export function findMoneyItems(actor, currency, denom) {
  return Array.from(actor?.items ?? []).filter(item =>
    item?.type === "loot" &&
    item?.system?.isMoney === true &&
    item?.system?.price?.currency === currency &&
    item?.system?.price?.denomination?.primary === denom
  );
}

export function buildMoneyItemData(key, quantity) {
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
  return findMoneyItems(actor, currency, denom).reduce((total, item) => {
    const quantity = Number(item.system.quantity ?? 0);
    if (!Number.isSafeInteger(quantity) || quantity < 0 || !Number.isSafeInteger(total + quantity)) {
      throw new Error(localize("InvalidSphereQuantity"));
    }
    return total + quantity;
  }, 0);
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
    actorName: actor?.name ?? localize("NoActor"),
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
  if (Object.entries(changes).some(([key, value]) =>
    !SPHERE_DENOMINATIONS.some(denom => denom.key === key) || !Number.isSafeInteger(Number(value)))) {
    return { ok: false, results: [], error: localize("InvalidSphereQuantity") };
  }
  const results = actors.map(actor => {
    const current = {};
    const next = {};
    const deficit = {};

    for (const denomination of SPHERE_DENOMINATIONS) {
      const change = normalizeNumber(changes[denomination.key], 0);
      if (!change) continue;
      const available = getSphereQuantity(actor, denomination.key);
      const planned = available + change;
      if (!Number.isSafeInteger(planned)) return { actorId: actor?.id, ok: false, current: {}, next: {}, deficit: { overflow: 1 } };
      current[denomination.key] = available;
      next[denomination.key] = Math.max(0, planned);
      if (planned < 0) deficit[denomination.key] = Math.abs(planned);
    }

    return {
      actorId: actor?.id,
      actorName: actor?.name ?? localize("NoActor"),
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
  const amount = Number(quantity);
  const from = SPHERE_DENOMINATIONS.find(item => item.key === fromKey);
  const to = SPHERE_DENOMINATIONS.find(item => item.key === toKey);
  if (!actor || !from || !to || fromKey === toKey || !Number.isSafeInteger(amount) || amount < 0) {
    return { ok: false, results: [], changes: {}, error: localize("InvalidSphereConversion") };
  }
  if (getSphereQuantity(actor, fromKey) < amount) {
    return { ok: false, results: [], changes: {}, error: localize("InsufficientFundsReviewTheDeficitBeforeApplying") };
  }
  const value = amount * from.value;
  if (!Number.isSafeInteger(value)) return { ok: false, results: [], error: localize("InvalidSphereQuantity") };
  const converted = Math.floor(value / to.value);
  const remainder = value % to.value;
  const changes = { [fromKey]: -amount };
  changes[toKey] = (changes[toKey] ?? 0) + converted;
  // Return change as chips in the original currency; never discard value.
  const changeKey = `${from.currency}|chip`;
  changes[changeKey] = (changes[changeKey] ?? 0) + remainder;
  const transaction = planSphereTransaction({ actors: [actor], changes, strict: true });
  return {
    ...transaction,
    actorId: actor.id,
    actorName: actor.name ?? localize("NoActor"),
    fromKey, toKey, quantity: amount, converted, remainder, changes,
  };
}

export function planGroupSphereSpend({
  actors = [],
  key = "spheres|mark",
  quantity = 0,
} = {}) {
  if (!Number.isSafeInteger(Number(quantity)) || Number(quantity) < 0 || !SPHERE_DENOMINATIONS.some(denom => denom.key === key)) {
    return { ok: false, allocations: [], requested: quantity, deficit: 0, error: localize("InvalidSphereQuantity") };
  }
  let remaining = Number(quantity);
  const allocations = [];

  for (const actor of actors) {
    if (remaining <= 0) break;
    const available = getSphereQuantity(actor, key);
    const spent = Math.min(available, remaining);
    if (spent > 0) {
      allocations.push({
        actorId: actor?.id,
        actorName: actor?.name ?? localize("NoActor"),
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
  if (!Number.isSafeInteger(Number(amount)) || Number(amount) < 0) {
    return { ok: false, results: [], error: localize("InvalidSphereQuantity") };
  }
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
        changes[key.replace("spheres|", "dun|")] = drained;
        remaining -= drained;
      }
    }
    const result = planSphereTransaction({ actors: [actor], changes, strict: true }).results[0] ?? {
      actorId: actor?.id,
      actorName: actor?.name ?? localize("NoActor"),
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
      actorName: actor?.name ?? localize("NoActor"),
      current: {},
      next: {},
      deficit: {},
      ok: true,
    };
  });

  return {
    ok: spend.ok,
    error: spend.error,
    key,
    requested: spend.requested,
    deficit: spend.deficit,
    allocations: spend.allocations,
    results,
  };
}


/** Common inventory writer for the advanced manager and classic sphere tools. */
export async function applySphereInventoryPlan({ actors = [], plan } = {}) {
  if (!plan?.ok || !Array.isArray(plan.results)) throw new Error(plan?.error ?? localize("InsufficientFundsReviewTheDeficitBeforeApplying"));
  // Check the entire plan before writing; a stale dialog must not restore money
  // another transaction has already spent.
  for (const result of plan.results) {
    const actor = actors.find(item => item?.id === result.actorId);
    if (!actor) throw new Error(localize("ActorNotFound"));
    for (const [key, quantity] of Object.entries(result.current)) {
      if (getSphereQuantity(actor, key) !== quantity) throw new Error(localize("SphereBalanceChanged"));
    }
  }
  for (const result of plan.results) {
    const actor = actors.find(item => item?.id === result.actorId);
    for (const [key, next] of Object.entries(result.next)) {
      if (!Number.isSafeInteger(next) || next < 0) throw new Error(localize("InvalidSphereQuantity"));
      const [currency, denom] = key.split("|");
      const items = findMoneyItems(actor, currency, denom);
      let delta = next - getSphereQuantity(actor, key);
      if (delta > 0) {
        if (items.length) await items[0].update({ "system.quantity": Number(items[0].system.quantity) + delta });
        else await actor.createEmbeddedDocuments("Item", [buildMoneyItemData(key, next)]);
      } else if (delta < 0) {
        for (const item of items) {
          if (!delta) break;
          const taken = Math.min(Number(item.system.quantity), -delta);
          const remaining = Number(item.system.quantity) - taken;
          if (remaining === 0) await item.delete();
          else await item.update({ "system.quantity": remaining });
          delta += taken;
        }
      }
    }
  }
  return plan;
}
