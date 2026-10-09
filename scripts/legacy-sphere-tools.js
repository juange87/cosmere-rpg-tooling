import { getSphereQuantity, summarizeSphereBalance, planSphereTransaction, applySphereInventoryPlan } from "./sphere-transactions.js";
import { SPHERE_DENOMINATIONS } from "./sphere-currency.js";
import { getPlayerActors, escapeHtml } from "./cosmere-helpers.js";
import { localize } from "./localization.js";
import { openCosmereDialog } from "./foundry-dialogs.js";

const DENOMINACIONES = SPHERE_DENOMINATIONS.filter(denom => denom.denom === "mark")
  .map(denom => ({ ...denom, color: denom.currency === "spheres" ? "#1a6fa8" : "#666666" }));

function formatStockLine(summary, currency) {
  const count = summary.rows.find(row => row.key === `${currency}|mark`)?.quantity ?? 0;
  if (count === 0) return "";
  return `${count} M`;
}

export function buildLegacySphereDialogContent(actors, { remove = false } = {}) {
  const actorRows = actors.map(a => {
    const summary = summarizeSphereBalance(a);
    const sphereLine = formatStockLine(summary, "spheres");
    const dunLine = formatStockLine(summary, "dun");
    const lines = [];
    if (sphereLine) lines.push(`<div class="cr-stock-line"><span class="cr-stock-dot" style="background:#1a6fa8"></span>${sphereLine}</div>`);
    if (dunLine) lines.push(`<div class="cr-stock-line"><span class="cr-stock-dot" style="background:#666666"></span>${dunLine}</div>`);
    const stockHTML = (lines.length ? lines.join("") : `<div class="cr-stock-empty">${localize("NoSpheres")}</div>`)
      + (summary.overflow || summary.invalidKeys.length ? `<div class="cr-warn">${escapeHtml(localize(summary.overflow ? "SphereSummaryOverflow" : "InvalidSphereInventory"))}</div>` : "");
    return `
    <label class="cr-actor">
      <input type="checkbox" class="actor-check" data-id="${escapeHtml(a.id)}" checked>
      <img src="${escapeHtml(a.img)}" alt="${escapeHtml(a.name)}">
      <span class="cr-name">${escapeHtml(a.name)}</span>
      <div class="cr-stock">${stockHTML}</div>
    </label>
  `;
  }).join("");

  const inputs = DENOMINACIONES.map(d => `
    <div class="cr-denom-row">
      <span class="cr-dot" style="background:${d.color}"></span>
      <span class="cr-denom-label">${d.label}</span>
      <input type="number" id="inp-${d.currency}-${d.denom}" class="cr-input" value="0" min="0">
    </div>
  `).join("");

  return `
    <style>
      #cr-wrap {
        font-family: "Signika", "Palatino Linotype", serif;
        color: #2a2a2a;
        font-size: 13px;
      }
      .cr-section { margin-bottom: 14px; }
      .cr-section h3 {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
        margin: 0 0 8px;
        font-family: "Modesto Condensed", "Palatino Linotype", serif;
        font-size: 20px;
        letter-spacing: 1px;
        color: #1e3a5f;
        border-bottom: 2px solid #1e3a5f;
        padding-bottom: 4px;
        font-weight: normal;
        text-transform: none;
      }
      .cr-section h3 .cr-h-text { flex: 0 1 auto; }

      .cr-actors { display: flex; flex-direction: row; flex-wrap: wrap; gap: 8px; }
      .cr-actor {
        display: flex; flex-direction: column; align-items: center;
        flex: 0 0 auto;
        cursor: pointer; padding: 8px 10px; border-radius: 5px;
        background: #1e3a5f;
        border: 1px solid #3a6186;
        min-width: 100px; text-align: center;
        color: #f4e8c1;
        transition: border-color 0.15s, background 0.15s, transform 0.15s;
      }
      .cr-actor:hover {
        border-color: #5a8ab6;
        background: #2a4a6f;
        transform: translateY(-1px);
      }
      .cr-actor input[type=checkbox] { accent-color: #f4e8c1; margin-bottom: 4px; }
      .cr-actor img {
        width: 44px; height: 44px; border-radius: 50%;
        object-fit: cover; border: 2px solid #5a8ab6; margin-bottom: 4px;
        background: #0e2540;
      }
      .cr-actor .cr-name {
        font-family: "Modesto Condensed", "Palatino Linotype", serif;
        font-size: 14px; letter-spacing: 0.5px;
        color: #f4e8c1; max-width: 96px;
        word-break: break-word; line-height: 1.2;
      }

      .cr-stock {
        display: flex; flex-direction: column; gap: 2px;
        margin-top: 5px; font-size: 10px;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-weight: 600;
      }
      .cr-stock-line {
        display: flex; align-items: center; gap: 4px;
        color: #c8d8e8; white-space: nowrap;
      }
      .cr-stock-dot {
        width: 7px; height: 7px; border-radius: 50%;
        flex-shrink: 0; border: 1px solid rgba(244,232,193,0.3);
      }
      .cr-stock-empty {
        font-size: 10px; color: #6a8aa8; font-style: italic;
      }

      .cr-toggle-all {
        width: auto !important;
        display: inline-block !important;
        flex: 0 0 auto;
        font-size: 12px;
        padding: 3px 12px;
        background: transparent;
        border: 1px solid #1e3a5f;
        border-radius: 3px;
        cursor: pointer;
        color: #1e3a5f;
        font-family: "Signika", serif;
        letter-spacing: 0;
        text-transform: none;
        font-weight: normal;
        line-height: 1.4;
      }
      .cr-toggle-all:hover {
        background: #1e3a5f;
        color: #f4e8c1;
      }

      .cr-denom-row {
        display: flex; align-items: center; gap: 10px;
        margin-bottom: 7px; padding: 5px 10px;
        background: rgba(30, 58, 95, 0.06);
        border-left: 3px solid #1e3a5f;
        border-radius: 3px;
      }
      .cr-dot {
        width: 11px; height: 11px; border-radius: 50%;
        flex-shrink: 0;
        border: 1px solid rgba(0,0,0,0.25);
        box-shadow: 0 0 0 1px rgba(244,232,193,0.4);
      }
      .cr-denom-label { flex: 1; color: #1e3a5f; font-size: 13px; font-weight: 500; }
      .cr-input {
        width: 80px;
        background: #fefcf5;
        border: 1px solid #3a6186;
        color: #1e3a5f;
        border-radius: 4px;
        padding: 4px 8px;
        font-size: 13px;
        font-weight: 600;
        text-align: right;
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        box-shadow: inset 0 1px 2px rgba(30,58,95,0.10);
      }
      .cr-input:focus {
        outline: none;
        border-color: #1e3a5f;
        box-shadow: 0 0 0 2px rgba(30,58,95,0.20);
      }

      .cr-opt {
        display: flex; align-items: center; gap: 8px;
        margin-bottom: 7px; font-size: 13px; cursor: pointer;
        color: #1e3a5f;
      }
      .cr-opt input[type=checkbox] {
        accent-color: #1e3a5f;
        width: 16px; height: 16px;
      }

      #cr-preview {
        background: #1e3a5f;
        border: 1px solid #3a6186;
        border-radius: 5px;
        padding: 10px 12px;
        font-size: 12px;
        color: #f4e8c1;
        min-height: 32px;
        line-height: 1.6;
      }
      #cr-preview strong { color: #ffe9a8; font-weight: 700; }
      #cr-preview em { color: #c8d8e8; font-style: normal; }
      .cr-warn { color: #ffb38a; font-weight: 600; }
      .cr-ok { color: #b6e6a8; }
    </style>

    <div id="cr-wrap">
      <div class="cr-section">
        <h3><span class="cr-h-text">${localize("Players")}</span><button type="button" class="cr-toggle-all">${localize("AllNone")}</button></h3>
        <div class="cr-actors">${actorRows}</div>
      </div>
      <div class="cr-section">
        <h3><span class="cr-h-text">${localize(remove ? "SpheresToRemove" : "SpheresToDistribute")}</span></h3>
        ${inputs}
      </div>
      <div class="cr-section">
        <h3><span class="cr-h-text">${localize("Options")}</span></h3>
        ${remove ? "" : `<label class="cr-opt">
          <input type="checkbox" id="opt-dividir">
          ${localize("SplitEvenlyAmongSelectedPlayers")}
        </label>`}
        <label class="cr-opt">
          <input type="checkbox" id="opt-chat" checked>
          ${localize("PostToChat2")}
        </label>
      </div>
      <div class="cr-section">
        <h3><span class="cr-h-text">${localize("Summary")}</span></h3>
        <div id="cr-preview">${localize("EnterAmountsToSeeTheSummary")}</div>
      </div>
    </div>
  `;
}

export function setupLegacySpherePreview(root, actors, { remove = false } = {}) {
  if (!root?.querySelectorAll) return;
  const refresh = () => {
    const checked = [...root.querySelectorAll(".actor-check:checked")];
    const selected = actors.filter(actor => checked.some(input => input.dataset.id === actor.id));
    const names = checked.map(input => input.closest("label")?.querySelector("span")?.textContent ?? "?");
    const count = checked.length;
    const split = !remove && root.querySelector("#opt-dividir")?.checked;
    const lines = [];
    for (const denom of DENOMINACIONES) {
      const value = Number(root.querySelector(`#inp-${denom.currency}-${denom.denom}`)?.value ?? 0);
      if (!Number.isSafeInteger(value) || value < 0) {
        lines.push(`<span class="cr-warn">${escapeHtml(localize("InvalidSphereQuantity"))}</span>`);
        continue;
      }
      if (!value) continue;
      const insufficient = remove ? selected.map(actor => ({ name: actor.name, quantity: getSphereQuantity(actor, denom.key) })).filter(actor => actor.quantity < value) : [];
      if (insufficient.length) {
        const details = insufficient.map(actor => `${escapeHtml(actor.name)}${localize("Has")}${actor.quantity})`).join(", ");
        lines.push(`<span class="cr-warn">⚠️ ${value} ${denom.label}${localize("InsufficientFunds")}${details}</span>`);
      } else if (split && count > 1) {
        const each = Math.floor(value / count), remainder = value % count;
        lines.push(each > 0
          ? `<strong>${value}</strong> ${denom.label} → <strong>${each}</strong> ${localize("Each")}${remainder ? ` <em>(+${remainder} ${localize("Remaining")})</em>` : ""}`
          : `<strong>${value}</strong> ${denom.label} → <em class="cr-warn">${localize("RemainingLessThan1PerPlayer")}</em>`);
      } else {
        lines.push(`<strong>${value}</strong> ${denom.label}${localize(remove ? "RemovedFromEachPlayer" : "ToEachPlayer")}`);
      }
    }
    const box = root.querySelector("#cr-preview");
    if (!box) return;
    box.innerHTML = !count ? `<span class="cr-warn">${localize("SelectAtLeastOnePlayer")}</span>`
      : !lines.length ? localize("EnterAmountsToSeeTheSummary")
      : lines.join("<br>") + `<br><em>→ ${names.map(escapeHtml).join(", ")}</em>`;
  };
  root.querySelectorAll(".cr-input, .actor-check, #opt-dividir").forEach(element => {
    element.addEventListener("input", refresh);
    element.addEventListener("change", refresh);
  });
  root.querySelector(".cr-toggle-all")?.addEventListener("click", event => {
    event.preventDefault();
    const checks = [...root.querySelectorAll(".actor-check")];
    const allChecked = checks.every(input => input.checked);
    checks.forEach(input => { input.checked = !allChecked; });
    refresh();
  });
  refresh();
}

function formatCoins(coins, { deficit = false } = {}) {
  return Object.entries(coins).filter(([, quantity]) => quantity > 0).map(([key, quantity]) => {
    const label = DENOMINACIONES.find(denom => denom.key === key)?.label ?? key;
    const text = `${quantity} ${escapeHtml(label)}`;
    return deficit ? `<span style="color:#c0392b">${text} ${localize("InsufficientFunds2")}</span>` : text;
  }).join(", ");
}

function buildLegacySphereChat(results, { remove, split }) {
  const rows = results.map(({ actor, coins, deficit }) => `<li><strong>${escapeHtml(actor.name)}</strong>: ${[formatCoins(coins), formatCoins(deficit, { deficit: true })].filter(Boolean).join(" · ") || "—"}</li>`).join("");
  return `<div style="border:1px solid ${remove ? "#d8a8a8" : "#8abed8"};border-radius:6px;padding:10px;background:${remove ? "rgba(168,26,26,0.04)" : "rgba(26,111,168,0.05)"};">
    <h3 style="color:${remove ? "#8a1a1a" : "#1a5f8a"};margin:0 0 6px;font-size:14px;">${localize(remove ? "SphereRemoval" : "SphereDistribution")}</h3>
    ${split ? `<p style="font-size:11px;color:#555;margin:0 0 6px">${localize("SplitEvenly")}</p>` : ""}
    <ul style="margin:0;padding-left:16px;font-size:12px;color:#1a1a1a;">${rows}</ul>
  </div>`;
}

/** One dialog, preview and transaction path for both classic sphere macros. */
export async function runLegacySphereTool({
  remove = false, game = globalThis.game, Dialog = globalThis.Dialog,
  ui = globalThis.ui, ChatMessage = globalThis.ChatMessage,
} = {}) {
  const actors = getPlayerActors({ game });
  if (!actors.length) {
    ui?.notifications?.warn?.(localize("NoPlayerCharactersFound"));
    return;
  }
  return openCosmereDialog({
    title: localize(remove ? "RemoveSpheresCosmereRPG" : "DistributeSpheresCosmereRPG"),
    content: buildLegacySphereDialogContent(actors, { remove }),
    buttons: {
      ok: {
        icon: remove ? '<i class="fas fa-minus-circle"></i>' : '<i class="fas fa-gem"></i>',
        label: localize(remove ? "Remove" : "Distribute"),
        callback: async html => {
          const ids = [...html.find(".actor-check:checked")].map(input => input.dataset.id);
          const selected = actors.filter(actor => ids.includes(actor.id));
          if (!selected.length) { ui?.notifications?.warn?.(localize("NoPlayersSelected")); return; }
          const split = !remove && html.find("#opt-dividir").is(":checked");
          const publishChat = html.find("#opt-chat").is(":checked");
          const totals = Object.fromEntries(DENOMINACIONES.map(denom => {
            const quantity = Number(html.find(`#inp-${denom.currency}-${denom.denom}`).val());
            if (!Number.isSafeInteger(quantity) || quantity < 0) throw new Error(localize("InvalidSphereQuantity"));
            return [denom.key, quantity];
          }));
          const plans = selected.map(actor => {
            const changes = Object.fromEntries(Object.entries(totals).map(([key, quantity]) => [key, remove ? -quantity : split ? Math.floor(quantity / selected.length) : quantity]));
            return planSphereTransaction({ actors: [actor], changes, strict: !remove });
          });
          // Validate every selected inventory before the shared writer changes any.
          await applySphereInventoryPlan({ actors: selected, plan: { ok: plans.every(plan => plan.ok), results: plans.flatMap(plan => plan.results), error: plans.find(plan => !plan.ok)?.error } });
          const results = plans.map((plan, index) => {
            const result = plan.results[0];
            const coins = Object.fromEntries(Object.keys(result.next).map(key => [key, Math.abs(result.next[key] - result.current[key])]));
            return { actor: selected[index], coins, deficit: result.deficit };
          });
          const deficits = results.filter(result => Object.values(result.deficit).some(quantity => quantity > 0));
          if (deficits.length) ui?.notifications?.warn?.(`${localize("InsufficientFundsFor")}${deficits.map(result => result.actor.name).join(", ")}${localize("AvailableFundsRemoved")}`);
          if (split) {
            const remaining = Object.fromEntries(Object.entries(totals).map(([key, quantity]) => [key, quantity % selected.length]));
            if (Object.values(remaining).some(quantity => quantity > 0)) ui?.notifications?.info?.(`${localize("UndistributedRemainder")}${DENOMINACIONES.filter(denom => remaining[denom.key]).map(denom => `${remaining[denom.key]} ${denom.label}`).join(", ")}`);
          }
          if (publishChat) await ChatMessage.create({ content: buildLegacySphereChat(results, { remove, split }), speaker: ChatMessage.getSpeaker({ alias: "GM" }) });
          ui?.notifications?.info?.(`${localize(remove ? "SpheresRemovedFrom" : "SpheresDistributedTo")}${selected.length}${localize("PlayerS")}`);
        },
      },
      cancelar: { icon: '<i class="fas fa-times"></i>', label: localize("Cancel") },
    },
    default: "ok",
    render: html => setupLegacySpherePreview(html.element ?? html[0], actors, { remove }),
    width: 720,
  }, { Dialog });
}
