import { localize, format } from "./localization.js";
import {
  buildCosmereChatCard,
  escapeHtml,
  notifyCosmere,
  getPlayerActors,
  postCosmereChatCard,
} from "./cosmere-helpers.js";
import { hasCosmereDialogSupport, openCosmereDialog } from "./foundry-dialogs.js";

export { SPHERE_DENOMINATIONS } from "./sphere-currency.js";
import { SPHERE_DENOMINATIONS, sphereDenominationLabel } from "./sphere-currency.js";

export { getSphereQuantity, summarizeSphereBalance, planSphereTransaction, planSphereConversion, planGroupSphereSpend, planInvestitureDrain, buildGroupSphereSpendTransaction } from "./sphere-transactions.js";
import { getSphereQuantity, summarizeSphereBalance, planSphereTransaction, planSphereConversion, planGroupSphereSpend, planInvestitureDrain, buildGroupSphereSpendTransaction, applySphereInventoryPlan, sphereSummaryWarnings } from "./sphere-transactions.js";

export function buildSphereTransactionChatCard({
  title = localize("SphereTransaction"),
  plan,
} = {}) {
  const sections = (plan?.results ?? []).map(result => {
    const changes = SPHERE_DENOMINATIONS
      .filter(denom => denom.key in (result.next ?? {}))
      .map(denom => `${denom.label}: ${result.current?.[denom.key] ?? 0} -> ${result.next?.[denom.key] ?? 0}`)
      .join(", ");
    const deficits = Object.entries(result.deficit ?? {})
      .filter(([, value]) => value > 0)
      .map(([key, value]) => `${sphereDenominationLabel(key)}${localize("Missing")}${value}`)
      .join(", ");

    return {
      label: result.actorName,
      value: [changes || localize("NoChanges"), deficits ? `${localize("Deficit")}: ${deficits}` : "", result.error, result.warning].filter(Boolean).join(" | "),
    };
  });

  return buildCosmereChatCard({
    eyebrow: localize("AdvancedSphereManager"),
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
  title = localize("SphereTransaction"),
  ChatMessage = globalThis.ChatMessage,
  game = globalThis.game,
  ui = globalThis.ui,
} = {}) {
  if (!plan?.results) throw new Error(localize("ThereIsNoSphereTransactionToApply"));
  if (!plan.ok) throw new Error(plan.error ?? localize("InsufficientFundsReviewTheDeficitBeforeApplying"));

  if (!plan.results.length) {
    if (!actors.length) notifyCosmere(localize("NoPlayerCharactersFound"), { type: "warn", game, ui });
    return plan;
  }
  await applySphereInventoryPlan({ actors, plan });
  const warnings = plan.results.filter(result => result.warning);
  if (warnings.length) {
    notifyCosmere(format("SphereInventoryWarnings", {
      actors: warnings.map(result => `${result.actorName}: ${result.warning}`).join("; "),
    }), { type: "warn", game, ui });
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
      : localize("NoSpheresRecorded");
    const total = summary.overflow ? localize("SphereSummaryOverflow") : `${summary.totalValue}${localize("AbstractValue")}`;
    return { label: summary.actorName, value: `${value} (${total}${summary.invalidKeys.length ? ` | ${localize("InvalidSphereInventory")}` : ""}` };
  });

  return buildCosmereChatCard({
    eyebrow: localize("AdvancedSphereManager"),
    title: localize("TreasurySummary"),
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
    const balance = summary.rows.map(row => `${row.quantity} ${row.label}`).join(", ") || localize("NoSpheres");
    const warnings = sphereSummaryWarnings(summary).map(warning => ` <span class="cr-warn">${escapeHtml(warning)}</span>`).join("");
    return `<li><strong>${escapeHtml(actor.name)}</strong>: ${escapeHtml(balance)}${warnings}</li>`;
  }).join("");
  return `
    <div>
      <p>${localize("CurrentBalanceByActor")}</p>
      <ul>${rows}</ul>
      <hr>
      <h3>${localize("ConvertSpheres")}</h3>
      <div class="form-group"><label>${localize("Actor")}</label><select name="convertActorId">${actorOptions(actors)}</select></div>
      <div class="form-group"><label>${localize("From")}</label><select name="convertFromKey">${denominationOptions()}</select></div>
      <div class="form-group"><label>${localize("To")}</label><select name="convertToKey">${denominationOptions()}</select></div>
      <div class="form-group"><label>${localize("Amount")}</label><input name="convertQuantity" type="number" value="1" min="0" step="1" /></div>
      <hr>
      <h3>${localize("GroupSpending")}</h3>
      <div class="form-group"><label>${localize("Denomination")}</label><select name="spendKey">${denominationOptions()}</select></div>
      <div class="form-group"><label>${localize("TotalAmount")}</label><input name="spendQuantity" type="number" value="1" min="0" step="1" /></div>
      <hr>
      <h3>${localize("DrainAfterInvestiture2")}</h3>
      <div class="form-group"><label>${localize("AmountPerActor")}</label><input name="drainAmount" type="number" value="1" min="0" step="1" /></div>
      <label><input name="publishChat" type="checkbox" checked /> ${localize("PostResultToChat")}</label>
    </div>
  `;
}

export function openSphereManager({
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  game = globalThis.game,
  ui = globalThis.ui,
} = {}) {
  if (!hasCosmereDialogSupport({ Dialog }) || !ChatMessage) {
    throw new Error(localize("FoundryIsNotAvailableToOpenTheSphereManager"));
  }
  const actors = getPlayerActors({ game });
  openCosmereDialog({
    title: localize("AdvancedSphereManager"),
    content: buildSphereManagerDialogContent(actors),
    buttons: {
      publish: {
        icon: '<i class="fas fa-coins"></i>',
        label: localize("PostSummary"),
        callback: async () => {
          try {
            await postSphereSummary({ actors, ChatMessage });
          } catch (error) {
            notifyCosmere(error.message, { type: "error", game, ui });
          }
        },
      },
      convert: {
        icon: '<i class="fas fa-exchange-alt"></i>',
        label: localize("Convert"),
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
              title: localize("SphereConversion"),
              publishChat: html.find("[name=publishChat]").is(":checked"),
              ChatMessage, game, ui,
            });
          } catch (error) {
            notifyCosmere(error.message, { type: "error", game, ui });
          }
        },
      },
      spend: {
        icon: '<i class="fas fa-hand-holding-usd"></i>',
        label: localize("GroupSpend"),
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
              title: localize("GroupSpending"),
              publishChat: html.find("[name=publishChat]").is(":checked"),
              ChatMessage, game, ui,
            });
          } catch (error) {
            notifyCosmere(error.message, { type: "error", game, ui });
          }
        },
      },
      drain: {
        icon: '<i class="fas fa-bolt"></i>',
        label: localize("Drain"),
        callback: async html => {
          try {
            const plan = planInvestitureDrain({
              actors,
              amount: html.find("[name=drainAmount]").val(),
            });
            await applySphereTransactionPlan({
              actors,
              plan,
              title: localize("DrainAfterInvestiture"),
              publishChat: html.find("[name=publishChat]").is(":checked"),
              ChatMessage, game, ui,
            });
          } catch (error) {
            notifyCosmere(error.message, { type: "error", game, ui });
          }
        },
      },
      close: { icon: '<i class="fas fa-times"></i>', label: localize("Close") },
    },
    default: "publish",
    width: 560,
  }, { Dialog });
}
