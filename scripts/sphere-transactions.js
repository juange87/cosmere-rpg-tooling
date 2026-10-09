import { localize, format } from "./localization.js";
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

function addSphereItem(balance, item) {
  const quantity = Number(item.system.quantity ?? 0);
  if (!Number.isSafeInteger(quantity) || quantity < 0 || quantity > Number.MAX_SAFE_INTEGER - balance.quantity) {
    balance.invalidItems.push(item);
  } else {
    balance.quantity += quantity;
  }
}

export function inspectSphereQuantity(actor, key) {
  const [currency, denom] = key.split("|");
  const balance = { quantity: 0, invalidItems: [] };
  for (const item of findMoneyItems(actor, currency, denom)) addSphereItem(balance, item);
  return balance;
}

export function inspectSphereInventory(actor) {
  const balances = new Map(SPHERE_DENOMINATIONS.map(denom => [denom.key, { quantity: 0, invalidItems: [] }]));
  for (const item of actor?.items ?? []) {
    if (item?.type !== "loot" || item?.system?.isMoney !== true) continue;
    const price = item.system.price;
    const balance = balances.get(`${price?.currency}|${price?.denomination?.primary}`);
    if (balance) addSphereItem(balance, item);
  }
  return balances;
}

// Browsing an inventory must remain possible even when an old item is malformed.
// Writes use strict reads so ignored items are never silently changed or spent.
export function getSphereQuantity(actor, key, { strict = false } = {}) {
  const { quantity, invalidItems } = inspectSphereQuantity(actor, key);
  if (strict && invalidItems.length) throw new Error(localize("InvalidSphereInventory"));
  return quantity;
}

export function summarizeSphereBalance(actor) {
  const invalidKeys = [];
  const balances = inspectSphereInventory(actor);
  const rows = SPHERE_DENOMINATIONS.map(denom => {
    const { quantity, invalidItems } = balances.get(denom.key);
    if (invalidItems.length) invalidKeys.push(denom.key);
    return {
      ...denom,
      quantity,
      valueTotal: quantity > Math.floor(Number.MAX_SAFE_INTEGER / denom.value) ? null : quantity * denom.value,
    };
  }).filter(row => row.quantity > 0);

  const safeSum = (sum, value) => sum === null || value === null || value > Number.MAX_SAFE_INTEGER - sum ? null : sum + value;
  const totalQuantity = rows.reduce((sum, row) => safeSum(sum, row.quantity), 0);
  const totalValue = rows.reduce((sum, row) => safeSum(sum, row.valueTotal), 0);
  return {
    actorId: actor?.id,
    actorName: actor?.name ?? localize("NoActor"),
    invalidKeys,
    rows,
    totalQuantity,
    totalValue,
    overflow: totalQuantity === null || totalValue === null,
  };
}

export function sphereSummaryWarnings(summary) {
  return [summary.overflow ? localize("SphereSummaryOverflow") : "",
    summary.invalidKeys.length ? localize("InvalidSphereInventory") : ""].filter(Boolean);
}

function invalidActorResult(actor, error, current = {}) {
  return { actorId: actor?.id, actorName: actor?.name ?? localize("NoActor"),
    ok: false, invalid: true, error, current, next: {}, deficit: {} };
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
      const { quantity: available, invalidItems } = inspectSphereQuantity(actor, denomination.key);
      if (invalidItems.length) return invalidActorResult(actor, localize("InvalidSphereInventory"));
      const planned = available + change;
      if (!Number.isSafeInteger(planned)) return invalidActorResult(actor, localize("InvalidSphereQuantity"), { ...current, [denomination.key]: available });
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
    ok: results.every(result => !result.invalid) && (!strict || results.every(result => result.ok)),
    strict,
    results,
    error: results.find(result => result.invalid)?.error,
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
  const invalidConversion = error => ({
    ok: false, results: [], changes: {}, error,
    actorId: actor?.id, actorName: actor?.name ?? localize("NoActor"),
    fromKey, toKey, quantity: amount, converted: 0, remainder: 0,
  });
  if (!actor || !from || !to || fromKey === toKey || !Number.isSafeInteger(amount) || amount < 0) {
    return invalidConversion(localize("InvalidSphereConversion"));
  }
  const source = inspectSphereQuantity(actor, fromKey);
  if (source.invalidItems.length) return invalidConversion(localize("InvalidSphereInventory"));
  if (source.quantity < amount) {
    return invalidConversion(localize("InsufficientFundsReviewTheDeficitBeforeApplying"));
  }
  const value = amount * from.value;
  if (!Number.isSafeInteger(value)) return invalidConversion(localize("InvalidSphereQuantity"));
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

function excludedActorResult(actor, key) {
  return { actorId: actor?.id, actorName: actor?.name ?? localize("NoActor"), key,
    excluded: true, warning: localize("InvalidSphereInventory"),
    current: {}, next: {}, deficit: {}, ok: true };
}

function insufficientFundsError(excluded) {
  const reason = localize("InsufficientFundsReviewTheDeficitBeforeApplying");
  return excluded.length ? `${reason} ${format("ExcludedSphereActors", {
    actors: excluded.map(result => `${result.actorName}: ${result.warning}`).join("; "),
  })}` : reason;
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
  const excluded = [];

  for (const actor of actors) {
    if (remaining <= 0) break;
    const { quantity: available, invalidItems } = inspectSphereQuantity(actor, key);
    if (invalidItems.length) {
      excluded.push(excludedActorResult(actor, key));
      continue;
    }
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
    excluded,
    deficit: remaining,
    error: remaining > 0 ? insufficientFundsError(excluded) : undefined,
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
      const { quantity: available, invalidItems } = inspectSphereQuantity(actor, key);
      if (invalidItems.length) return excludedActorResult(actor, key);
      const drained = Math.min(available, remaining);
      if (drained > 0) {
        const destination = key.replace("spheres|", "dun|");
        if (inspectSphereQuantity(actor, destination).invalidItems.length) return excludedActorResult(actor, destination);
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

  const excluded = results.filter(result => result.excluded);
  const ok = results.every(result => result.ok && !result.invalid)
    && (Number(amount) === 0 || results.some(result => !result.excluded));
  return {
    ok,
    invalid: results.some(result => result.invalid),
    error: results.find(result => result.invalid)?.error ?? (!ok ? insufficientFundsError(excluded) : undefined),
    excluded,
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
    const excluded = spend.excluded?.find(item => item.actorId === actor?.id);
    if (excluded) return { ...excluded, excluded: true, current: {}, next: {}, deficit: {}, ok: true };
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
    ok: spend.ok && results.every(result => result.ok && !result.invalid),
    invalid: results.some(result => result.invalid),
    error: results.find(result => result.invalid)?.error ?? spend.error,
    key,
    requested: spend.requested,
    deficit: spend.deficit,
    allocations: spend.allocations,
    excluded: spend.excluded ?? [],
    results,
  };
}


/** Common inventory writer for the advanced manager and classic sphere tools. */
export async function applySphereInventoryPlan({ actors = [], plan } = {}) {
  if (!plan?.ok || !Array.isArray(plan.results)) throw new Error(plan?.error ?? localize("InsufficientFundsReviewTheDeficitBeforeApplying"));
  // Check the entire plan before writing; a stale dialog must not restore money
  // another transaction has already spent.
  for (const result of plan.results) {
    if (result.invalid) throw new Error(result.error ?? localize("InvalidSphereQuantity"));
    const actor = actors.find(item => item?.id === result.actorId);
    if (!actor) throw new Error(localize("ActorNotFound"));
    for (const [key, quantity] of Object.entries(result.current)) {
      if (getSphereQuantity(actor, key, { strict: true }) !== quantity) throw new Error(localize("SphereBalanceChanged"));
    }
  }
  for (const result of plan.results) {
    const actor = actors.find(item => item?.id === result.actorId);
    for (const [key, next] of Object.entries(result.next)) {
      if (!Number.isSafeInteger(next) || next < 0) throw new Error(localize("InvalidSphereQuantity"));
      const [currency, denom] = key.split("|");
      const items = findMoneyItems(actor, currency, denom);
      let delta = next - getSphereQuantity(actor, key, { strict: true });
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
