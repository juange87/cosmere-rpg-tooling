import { getSphereQuantity, planSphereTransaction, applySphereInventoryPlan } from "../sphere-transactions.js";
import { SPHERE_DENOMINATIONS } from "../sphere-currency.js";
import { getPlayerActors as playerActors } from "../cosmere-helpers.js";
// Distribute Spheres / Distribuir Esferas: implementation behind the public module API.
export async function run({
  game = globalThis.game,
  canvas = globalThis.canvas,
  ui = globalThis.ui,
  ChatMessage = globalThis.ChatMessage,
  Dialog = globalThis.Dialog,
  Hooks = globalThis.Hooks,
  Sequence = globalThis.Sequence,
  Sequencer = globalThis.Sequencer,
  AudioHelper = globalThis.foundry?.audio?.AudioHelper ?? globalThis.AudioHelper,
  token = canvas?.tokens?.controlled?.[0],
} = {}) {
  const { escapeHtml, normalizeNumber } = await import("../cosmere-helpers.js");
  const { localize } = await import("../localization.js");
  const { openCosmereDialog } = await import("../foundry-dialogs.js");

  // ============================================================
  // MACRO: Distribuir Esferas a Jugadores — Cosmere RPG
  // Foundry VTT · Sistema cosmere-rpg
  // ============================================================

  const DENOMINACIONES = SPHERE_DENOMINATIONS.filter(denom => denom.denom === "mark")
    .map(denom => ({ ...denom, color: denom.currency === "spheres" ? "#1a6fa8" : "#666666", valor: denom.value }));

  function getPlayerActors() { return playerActors({ game }); }
  function getActorStock(actor, currency, denom) { return getSphereQuantity(actor, `${currency}|${denom}`); }

  function formatStockLine(actor, currency) {
    const count = getActorStock(actor, currency, "mark");
    if (count === 0) return "";
    return `${count} M`;
  }

  function buildHTML(actors) {
    const actorRows = actors.map(a => {
      const sphereLine = formatStockLine(a, "spheres");
      const dunLine = formatStockLine(a, "dun");
      const lines = [];
      if (sphereLine) lines.push(`<div class="cr-stock-line"><span class="cr-stock-dot" style="background:#1a6fa8"></span>${sphereLine}</div>`);
      if (dunLine) lines.push(`<div class="cr-stock-line"><span class="cr-stock-dot" style="background:#666666"></span>${dunLine}</div>`);
      const stockHTML = lines.length ? lines.join("") : `<div class="cr-stock-empty">${localize("NoSpheres")}</div>`;
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
          <h3><span class="cr-h-text">${localize("SpheresToDistribute")}</span></h3>
          ${inputs}
        </div>
        <div class="cr-section">
          <h3><span class="cr-h-text">${localize("Options")}</span></h3>
          <label class="cr-opt">
            <input type="checkbox" id="opt-dividir">
            ${localize("SplitEvenlyAmongSelectedPlayers")}
          </label>
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

  function setupPreview() {
    const refresh = () => {
      const checked = [...document.querySelectorAll(".actor-check:checked")];
      const n = checked.length;
      const dividir = document.getElementById("opt-dividir")?.checked;
      const nombres = checked.map(c => c.closest("label")?.querySelector("span")?.textContent ?? "?");

      const lineas = [];
      for (const d of DENOMINACIONES) {
        const val = parseInt(document.getElementById(`inp-${d.currency}-${d.denom}`)?.value) || 0;
        if (!val) continue;
        if (dividir && n > 1) {
          const cada = Math.floor(val / n);
          const resto = val % n;
          if (cada > 0) {
            lineas.push(`<strong>${val}</strong> ${d.label} → <strong>${cada}</strong> ${localize("Each")}${resto ? ` <em>(+${resto} ${localize("Remaining")}</em>` : ""}`);
          } else {
            lineas.push(`<strong>${val}</strong> ${d.label} → <em class="cr-warn">${localize("RemainingLessThan1PerPlayer")}</em>`);
          }
        } else {
          lineas.push(`<strong>${val}</strong> ${d.label}${localize("ToEachPlayer")}`);
        }
      }

      const box = document.getElementById("cr-preview");
      if (!box) return;
      if (!n) { box.innerHTML = `<span class="cr-warn">${localize("SelectAtLeastOnePlayer")}</span>`; return; }
      if (!lineas.length) { box.innerHTML = localize("EnterAmountsToSeeTheSummary"); return; }
      box.innerHTML = lineas.join("<br>") + `<br><em>→ ${nombres.map(escapeHtml).join(", ")}</em>`;
    };

    document.querySelectorAll(".cr-input, .actor-check, #opt-dividir").forEach(el => {
      el.addEventListener("input", refresh);
      el.addEventListener("change", refresh);
    });

    const toggleBtn = document.querySelector(".cr-toggle-all");
    if (toggleBtn) {
      toggleBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const checks = [...document.querySelectorAll(".actor-check")];
        const allChecked = checks.every(c => c.checked);
        checks.forEach(c => { c.checked = !allChecked; });
        refresh();
      });
    }

    refresh();
  }

  async function addCoinsToActor(actor, coins) {
    const plan = planSphereTransaction({ actors: [actor], changes: coins });
    await applySphereInventoryPlan({ actors: [actor], plan });
  }

  function buildChatMsg(resultados, dividido) {
    const filas = resultados.map(({ actor, coins }) => {
      const items = Object.entries(coins)
        .filter(([, v]) => v > 0)
        .map(([k, v]) => {
          const [currency, denom] = k.split("|");
          const info = DENOMINACIONES.find(d => d.currency === currency && d.denom === denom);
          return `${v} ${info?.label ?? k}`;
        }).join(", ");
      return `<li><strong>${escapeHtml(actor.name)}</strong>: ${items || "—"}</li>`;
    }).join("");

    return `
      <div style="border:1px solid #8abed8;border-radius:6px;padding:10px;background:rgba(26,111,168,0.05);">
        <h3 style="color:#1a5f8a;margin:0 0 6px;font-size:14px;">${localize("SphereDistribution")}</h3>
        ${dividido ? `<p style="font-size:11px;color:#555;margin:0 0 6px">${localize("SplitEvenly")}</p>` : ""}
        <ul style="margin:0;padding-left:16px;font-size:12px;color:#1a1a1a;">${filas}</ul>
      </div>
    `;
  }

  // ── MAIN ─────────────────────────────────────────────────────
  const actores = getPlayerActors();

  if (!actores.length) {
    ui.notifications.warn(localize("NoPlayerCharactersFound"));
  } else {
    openCosmereDialog({
      title: localize("DistributeSpheresCosmereRPG"),
      content: buildHTML(actores),
      buttons: {
        ok: {
          icon: '<i class="fas fa-gem"></i>',
          label: localize("Distribute"),
          callback: async (html) => {
            const ids = [...html.find(".actor-check:checked")].map(el => el.dataset.id);
            const seleccionados = actores.filter(a => ids.includes(a.id));
            if (!seleccionados.length) { ui.notifications.warn(localize("NoPlayersSelected")); return; }

            const dividir = html.find("#opt-dividir").is(":checked");
            const chat    = html.find("#opt-chat").is(":checked");
            const n       = seleccionados.length;

            const totales = {};
            for (const d of DENOMINACIONES) {
              const v = Number(html.find(`#inp-${d.currency}-${d.denom}`).val());
              if (!Number.isSafeInteger(v) || v < 0) throw new Error(localize("InvalidSphereQuantity"));
              totales[`${d.currency}|${d.denom}`] = v;
            }

            const resultados = seleccionados.map(actor => {
              const coins = {};
              for (const [key, total] of Object.entries(totales)) {
                coins[key] = dividir ? Math.floor(total / n) : total;
              }
              return { actor, coins };
            });

            for (const { actor, coins } of resultados) {
              await addCoinsToActor(actor, coins);
            }

            if (dividir) {
              const sobraItems = DENOMINACIONES
                .map(d => {
                  const key = `${d.currency}|${d.denom}`;
                  const resto = totales[key] % n;
                  return resto > 0 ? `${resto} ${d.label}` : null;
                })
                .filter(Boolean);
              if (sobraItems.length) ui.notifications.info(`${localize("UndistributedRemainder")}${sobraItems.join(", ")}`);
            }

            if (chat) {
              await ChatMessage.create({
                content: buildChatMsg(resultados, dividir),
                speaker: ChatMessage.getSpeaker({ alias: "GM" }),
              });
            }

            ui.notifications.info(`${localize("SpheresDistributedTo")}${seleccionados.length}${localize("PlayerS")}`);
          }
        },
        cancelar: { icon: '<i class="fas fa-times"></i>', label: localize("Cancel") }
      },
      default: "ok",
      render: () => setupPreview(),
      width: 720,
    }, { Dialog });
  }
}
