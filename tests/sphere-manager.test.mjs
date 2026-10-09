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
