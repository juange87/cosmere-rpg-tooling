import test from "node:test";
import assert from "node:assert/strict";
import { localize } from "../scripts/localization.js";
import { SPHERE_DENOMINATIONS, planSphereConversion, applySphereTransactionPlan } from "../scripts/sphere-manager.js";
import { buildSphereManagerDialogContent } from "../scripts/sphere-manager.js";
const actor = { id: "actor", items: SPHERE_DENOMINATIONS.map(({ currency, denom }) => ({ type: "loot", system: { isMoney: true, quantity: 100, price: { currency, denomination: { primary: denom } } } })) };

test("sphere conversions reject equal, unknown and unfunded denominations", () => {
  assert.equal(planSphereConversion({ actor, fromKey: "spheres|mark", toKey: "spheres|mark", quantity: 1 }).ok, false);
  assert.equal(planSphereConversion({ actor, fromKey: "unknown", quantity: 1 }).ok, false);
  assert.equal(planSphereConversion({ actor, quantity: 101, strict: false }).ok, false);
});

test("every denomination conversion conserves monetary value including change", () => {
  for (const from of SPHERE_DENOMINATIONS) {
    for (const to of SPHERE_DENOMINATIONS.filter(item => item.key !== from.key)) {
      for (const quantity of [0, 1, 7, 20]) {
        const plan = planSphereConversion({ actor, fromKey: from.key, toKey: to.key, quantity });
        assert.equal(plan.ok, true);
        const valueDelta = SPHERE_DENOMINATIONS.reduce((sum, denom) => sum + (plan.changes[denom.key] ?? 0) * denom.value, 0);
        assert.equal(valueDelta, 0, `${from.key} -> ${to.key}`);
      }
    }
  }
  const plan = planSphereConversion({ actor, fromKey: "spheres|mark", toKey: "dun|broam", quantity: 5 });
  assert.equal(plan.converted, 1);
  assert.equal(plan.remainder, 5);
  assert.equal(plan.changes["spheres|chip"], 5);
});

test("invalid conversion plans cannot update actor documents", async () => {
  const plan = planSphereConversion({ actor, fromKey: "dun|chip", toKey: "dun|chip", quantity: 1 });
  await assert.rejects(applySphereTransactionPlan({ actors: [actor], plan, publishChat: false }));
});

const { planInvestitureDrain, planGroupSphereSpend, planSphereTransaction } = await import("../scripts/sphere-manager.js");

test("Investiture drain transfers each sphere to its matching dun denomination", () => {
  const plan = planInvestitureDrain({ actors: [actor], amount: 103 });
  assert.equal(plan.ok, true);
  const result = plan.results[0];
  assert.equal(result.next["spheres|broam"], 0);
  assert.equal(result.next["dun|broam"], 200);
  assert.equal(result.next["spheres|mark"], 97);
  assert.equal(result.next["dun|mark"], 103);
  const delta = SPHERE_DENOMINATIONS.reduce((sum, denom) => sum + ((result.next[denom.key] ?? 100) - 100) * denom.value, 0);
  assert.equal(delta, 0);
});

test("invalid quantities cannot drain, spend, convert or change inventories", () => {
  for (const amount of [-1, 1.5, Infinity, NaN, "oops"]) {
    assert.equal(planInvestitureDrain({ actors: [actor], amount }).ok, false);
    assert.equal(planGroupSphereSpend({ actors: [actor], quantity: amount }).ok, false);
    assert.equal(planSphereConversion({ actor, quantity: amount }).ok, false);
  }
  assert.equal(planSphereTransaction({ actors: [actor], changes: { "dun|mark": 1.5 } }).ok, false);
  assert.equal(planSphereTransaction({ actors: [actor], changes: { "unknown": 1 } }).ok, false);
});

const { getSphereQuantity, applySphereInventoryPlan } = await import("../scripts/sphere-transactions.js");

test("shared sphere accounting spends across duplicate legacy money items", async () => {
  const items = [];
  for (const quantity of [2, 3]) {
    const item = { type: "loot", system: { isMoney: true, quantity, price: { currency: "spheres", denomination: { primary: "mark" } } },
      update: async changes => { item.system.quantity = changes["system.quantity"]; },
      delete: async () => items.splice(items.indexOf(item), 1),
    };
    items.push(item);
  }
  const actor = { id: "duplicates", items };
  assert.equal(getSphereQuantity(actor, "spheres|mark"), 5);
  const plan = planSphereTransaction({ actors: [actor], changes: { "spheres|mark": -4 } });
  await applySphereInventoryPlan({ actors: [actor], plan });
  assert.equal(getSphereQuantity(actor, "spheres|mark"), 1);
});

test("a stale sphere plan is rejected before overwriting changed balances", async () => {
  const item = { type: "loot", system: { isMoney: true, quantity: 5, price: { currency: "spheres", denomination: { primary: "mark" } } }, update: () => assert.fail("Stale write") };
  const actor = { id: "changed", items: [item] };
  const plan = planSphereTransaction({ actors: [actor], changes: { "spheres|mark": -1 } });
  item.system.quantity = 3;
  await assert.rejects(applySphereInventoryPlan({ actors: [actor], plan }), /changed|cambiado/);
  assert.equal(item.system.quantity, 3);
});

test("integer overflow is rejected even for non-strict sphere transactions", () => {
  const actor = { id: "overflow", items: [{ type: "loot", system: { isMoney: true, quantity: Number.MAX_SAFE_INTEGER, price: { currency: "dun", denomination: { primary: "mark" } } } }] };
  assert.equal(planSphereTransaction({ actors: [actor], changes: { "dun|mark": 1 }, strict: false }).ok, false);
});

test("overflow retains the transaction result contract and a useful actor label", async () => {
  const { buildSphereTransactionChatCard } = await import("../scripts/sphere-manager.js");
  const overflowing = { id: "overflow", name: "Overflow Actor", items: [{ type: "loot", system: { isMoney: true, quantity: Number.MAX_SAFE_INTEGER, price: { currency: "dun", denomination: { primary: "mark" } } } }] };
  const plan = planSphereTransaction({ actors: [overflowing], changes: { "dun|mark": 1 } });
  assert.equal(plan.results[0].actorName, "Overflow Actor");
  assert.deepEqual(plan.results[0].deficit, {});
  assert.equal(typeof plan.results[0].error, "string");
  const card = buildSphereTransactionChatCard({ plan });
  assert.match(card, /Overflow Actor/);
  assert.doesNotMatch(card, /undefined|overflow.*Missing/);
  const conversion = planSphereConversion({ actor: overflowing, fromKey: "dun|mark", toKey: "spheres|chip", quantity: Number.MAX_SAFE_INTEGER });
  assert.equal(conversion.ok, false);
  assert.deepEqual(conversion.changes, {});
  for (const key of ["actorId", "actorName", "fromKey", "toKey", "quantity", "converted", "remainder", "results", "error"]) assert.ok(key in conversion, key);
});

test("malformed legacy money is readable but cannot be modified, and healthy actors remain usable", async () => {
  for (const quantity of [-1, 1.5, "oops"]) {
    const malformed = { id: "broken", name: "Broken", items: [{ type: "loot", system: { isMoney: true, quantity, price: { currency: "spheres", denomination: { primary: "mark" } } }, update: () => assert.fail("Malformed item changed") }] };
    const item = { type: "loot", system: { isMoney: true, quantity: 3, price: { currency: "spheres", denomination: { primary: "mark" } } }, update: async changes => { item.system.quantity = changes["system.quantity"]; } };
    const healthy = { id: "healthy", name: "Healthy", items: [item] };
    assert.equal(getSphereQuantity(malformed, "spheres|mark"), 0);
    assert.match(buildSphereManagerDialogContent([malformed, healthy]), /invalid|inválid/);
    const badPlan = planSphereTransaction({ actors: [malformed], changes: { "spheres|mark": 1 } });
    assert.equal(badPlan.ok, false);
    assert.equal(badPlan.results[0].invalid, true);
    await assert.rejects(applySphereInventoryPlan({ actors: [malformed], plan: badPlan }), /invalid|inválid/);
    const goodPlan = planSphereTransaction({ actors: [healthy], changes: { "spheres|mark": -1 } });
    await applySphereInventoryPlan({ actors: [malformed, healthy], plan: goodPlan });
    assert.equal(item.system.quantity, 2);
  }
});

test("group spending excludes malformed denominations before planning and remains applicable", async () => {
  const { buildGroupSphereSpendTransaction } = await import("../scripts/sphere-transactions.js");
  const malformed = { id: "broken", name: "Broken", items: [1.5, 2].map(quantity => ({ type: "loot", system: { isMoney: true, quantity, price: { currency: "spheres", denomination: { primary: "mark" } } }, update: () => assert.fail("Malformed denomination spent") })) };
  const item = { type: "loot", system: { isMoney: true, quantity: 5, price: { currency: "spheres", denomination: { primary: "mark" } } }, update: async changes => { item.system.quantity = changes["system.quantity"]; } };
  const healthy = { id: "healthy", name: "Healthy", items: [item] };
  const plan = buildGroupSphereSpendTransaction({ actors: [malformed, healthy], quantity: 3 });
  assert.equal(plan.ok, true);
  assert.equal(plan.excluded[0].actorId, "broken");
  assert.equal(plan.results[0].excluded, true);
  assert.deepEqual(plan.allocations.map(allocation => allocation.actorId), ["healthy"]);
  await applySphereInventoryPlan({ actors: [malformed, healthy], plan });
  assert.equal(item.system.quantity, 2);
  assert.equal(malformed.items[1].system.quantity, 2);
});

test("drain propagates destination overflow and rejects it with the actual error", async () => {
  const overflowing = { id: "overflow", name: "Overflow", items: [["spheres", 1], ["dun", Number.MAX_SAFE_INTEGER]].map(([currency, quantity]) => ({ type: "loot", system: { isMoney: true, quantity, price: { currency, denomination: { primary: "broam" } } }, update: () => assert.fail("Overflow written") })) };
  const plan = planInvestitureDrain({ actors: [overflowing], amount: 1 });
  assert.equal(plan.ok, false);
  assert.equal(plan.invalid, true);
  assert.equal(plan.error, plan.results[0].error);
  assert.equal(plan.error, localize("InvalidSphereQuantity"));
  await assert.rejects(applySphereTransactionPlan({ actors: [overflowing], plan, publishChat: false }), error => error.message === plan.error);
});

test("group transactions cannot report success when an allocation becomes invalid during planning", async () => {
  const { buildGroupSphereSpendTransaction } = await import("../scripts/sphere-transactions.js");
  let reads = 0;
  const changing = { id: "changed", items: [{ type: "loot", system: { isMoney: true, get quantity() { return ++reads === 1 ? 5 : 1.5; }, price: { currency: "spheres", denomination: { primary: "mark" } } }, update: () => assert.fail("Invalid plan written") }] };
  const plan = buildGroupSphereSpendTransaction({ actors: [changing], quantity: 3 });
  assert.equal(plan.ok, false);
  assert.equal(plan.invalid, true);
  assert.equal(plan.error, plan.results[0].error);
  await assert.rejects(applySphereInventoryPlan({ actors: [changing], plan }), error => error.message === plan.error);
});

test("sphere summaries never publish unsafe products or totals and scan each inventory once", async () => {
  const { summarizeSphereBalance } = await import("../scripts/sphere-transactions.js");
  const { buildLegacySphereDialogContent } = await import("../scripts/legacy-sphere-tools.js");
  let scans = 0;
  const overflowing = { id: "large", name: "Large", items: { *[Symbol.iterator]() {
    scans++;
    yield { type: "loot", system: { isMoney: true, quantity: Number.MAX_SAFE_INTEGER, price: { currency: "spheres", denomination: { primary: "broam" } } } };
  } } };
  const summary = summarizeSphereBalance(overflowing);
  assert.equal(scans, 1);
  assert.equal(summary.overflow, true);
  assert.equal(summary.totalValue, null);
  assert.equal(summary.rows[0].valueTotal, null);
  assert.equal(summary.totalQuantity, Number.MAX_SAFE_INTEGER);
  scans = 0;
  assert.match(buildLegacySphereDialogContent([overflowing]), /safe integer|enteros seguros/);
  assert.equal(scans, 1);
  const summed = { items: ["spheres", "dun"].map(currency => ({ type: "loot", system: { isMoney: true, quantity: Number.MAX_SAFE_INTEGER, price: { currency, denomination: { primary: "chip" } } } })) };
  assert.equal(summarizeSphereBalance(summed).totalQuantity, null);
  assert.equal(summarizeSphereBalance(summed).totalValue, null);
});

function moneyActor(id, entries) {
  return { id, name: id, items: entries.map(([key, quantity]) => {
    const [currency, primary] = key.split("|");
    const item = { type: "loot", system: { isMoney: true, quantity, price: { currency, denomination: { primary } } },
      update: async changes => { item.system.quantity = changes["system.quantity"]; } };
    return item;
  }) };
}

test("group shortages explain excluded actors and invalid inventories", async () => {
  const { buildGroupSphereSpendTransaction } = await import("../scripts/sphere-transactions.js");
  const broken = moneyActor("Broken", [["spheres|mark", 1.5]]);
  const healthy = moneyActor("Healthy", [["spheres|mark", 2]]);
  const plan = buildGroupSphereSpendTransaction({ actors: [broken, healthy], quantity: 3 });
  assert.equal(plan.ok, false);
  assert.equal(plan.deficit, 1);
  assert.match(plan.error, /Broken/);
  assert.match(plan.error, /invalid|inválid/);
  await assert.rejects(applySphereInventoryPlan({ actors: [broken, healthy], plan }), error => error.message === plan.error);
  assert.equal(healthy.items[0].system.quantity, 2);
});

test("drain excludes affected invalid actors while applying healthy actors", async () => {
  for (const brokenKey of ["spheres|broam", "dun|broam"]) {
    const broken = moneyActor("Broken", [["spheres|broam", 2], ["dun|broam", 0]]);
    broken.items.find(item => `${item.system.price.currency}|${item.system.price.denomination.primary}` === brokenKey).system.quantity = 1.5;
    broken.items.forEach(item => { item.update = () => assert.fail("Excluded actor changed"); });
    const healthy = moneyActor("Healthy", [["spheres|broam", 3], ["dun|broam", 0]]);
    const plan = planInvestitureDrain({ actors: [broken, healthy], amount: 1 });
    assert.equal(plan.ok, true);
    assert.equal(plan.excluded[0].actorId, "Broken");
    assert.deepEqual(plan.results[0].next, {});
    await applySphereInventoryPlan({ actors: [broken, healthy], plan });
    assert.equal(healthy.items[0].system.quantity, 2);
    assert.equal(healthy.items[1].system.quantity, 1);
    const empty = planInvestitureDrain({ actors: [broken], amount: 1 });
    assert.equal(empty.ok, false);
    assert.match(empty.error, /Broken/);
  }
});

test("both dialogs show simultaneous overflow and invalid-inventory warnings", async () => {
  const { buildLegacySphereDialogContent } = await import("../scripts/legacy-sphere-tools.js");
  const broken = moneyActor("Both warnings", [["spheres|broam", Number.MAX_SAFE_INTEGER], ["dun|mark", 1.5]]);
  for (const build of [buildSphereManagerDialogContent, buildLegacySphereDialogContent]) {
    const content = build([broken]);
    assert.ok(content.includes(localize("SphereSummaryOverflow")));
    assert.ok(content.includes(localize("InvalidSphereInventory")));
    assert.equal((content.match(/class="cr-warn"/g) ?? []).length, 2);
  }
});

test("conversion funding checks reuse the source inventory inspection", () => {
  let scans = 0;
  const money = moneyActor("Poor", [["spheres|mark", 1]]);
  const source = { ...money, items: { *[Symbol.iterator]() { scans++; yield* money.items; } } };
  const plan = planSphereConversion({ actor: source, quantity: 2 });
  assert.equal(plan.ok, false);
  assert.equal(scans, 1);
});

test("successful group spend and drain warn about exclusions even with chat disabled", async () => {
  const { buildGroupSphereSpendTransaction } = await import("../scripts/sphere-transactions.js");
  for (const operation of ["spend", "drain"]) {
    const broken = moneyActor("Kal's Squire <img>", [["spheres|broam", 1.5], ["spheres|mark", 1.5]]);
    const healthy = moneyActor("Healthy", [["spheres|mark", 5], ["dun|mark", 0]]);
    const actors = [broken, healthy], notices = [];
    const plan = operation === "spend" ? buildGroupSphereSpendTransaction({ actors, quantity: 1 }) : planInvestitureDrain({ actors, amount: 1 });
    assert.equal(plan.ok, true);
    await applySphereTransactionPlan({ actors, plan, publishChat: false, game: { release: { generation: 13 } },
      ChatMessage: { create: () => assert.fail("Chat publication enabled") },
      ui: { notifications: { warn: (text, options) => notices.push({ text, options }) } } });
    assert.equal(notices.length, 1);
    assert.ok(notices[0].text.includes("Kal's Squire"));
    assert.ok(notices[0].text.includes(localize("InvalidSphereInventory")));
    assert.deepEqual(notices[0].options, { clean: true });
  }
});

test("notification text escapes once in v12 and delegates cleaning to v13", async () => {
  const { notifyCosmere } = await import("../scripts/cosmere-helpers.js");
  for (const generation of [12, 13]) {
    const notices = [];
    notifyCosmere("Kal's Squire <img src=x onerror=bad()>", { type: "error", game: { release: { generation } },
      ui: { notifications: { error: (...args) => notices.push(args) } } });
    assert.equal(notices.length, 1);
    if (generation === 13) {
      assert.ok(notices[0][0].startsWith("Kal's Squire"));
      assert.deepEqual(notices[0][1], { clean: true });
    } else {
      assert.ok(notices[0][0].startsWith("Kal&#39;s Squire"));
      assert.ok(notices[0][0].includes("&lt;img"));
      assert.ok(!notices[0][0].includes("&amp;#39;"));
    }
  }
});
