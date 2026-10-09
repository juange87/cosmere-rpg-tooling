import test from "node:test";
import assert from "node:assert/strict";
import { SPHERE_DENOMINATIONS, planSphereConversion, applySphereTransactionPlan } from "../scripts/sphere-manager.js";
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
