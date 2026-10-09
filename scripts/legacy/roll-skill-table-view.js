// Roll Skill (Table View): implementation behind the public module API.
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
  const { localize, format } = await import("../localization.js");
  const { openCosmereDialog } = await import("../foundry-dialogs.js");

  // MAPEO de habilidades organizadas por categoría
  const categorias = {
    physical: {
      nombre: localize("Physical"),
      habilidades: {
        "agi": { nombre: localize("Agility2"), attr: "spd" },
        "ath": { nombre: localize("Athletics2"), attr: "str" },
        "hwp": { nombre: localize("HeavyWeapons2"), attr: "str" },
        "lwp": { nombre: localize("LightWeapons2"), attr: "spd" },
        "stl": { nombre: localize("Stealth2"), attr: "spd" },
        "thv": { nombre: localize("Thievery3"), attr: "spd" }
      }
    },
    cognitive: {
      nombre: localize("Cognitive"),
      habilidades: {
        "cra": { nombre: localize("Crafting3"), attr: "int" },
        "ded": { nombre: localize("Deduction2"), attr: "int" },
        "dis": { nombre: localize("Discipline2"), attr: "wil" },
        "inm": { nombre: localize("Intimidation2"), attr: "wil" },
        "lor": { nombre: localize("Lore2"), attr: "int" },
        "med": { nombre: localize("Medicine2"), attr: "int" }
      }
    },
    spiritual: {
      nombre: localize("Spiritual"),
      habilidades: {
        "dec": { nombre: localize("Deception2"), attr: "pre" },
        "ins": { nombre: localize("Insight2"), attr: "awa" },
        "lea": { nombre: localize("Leadership2"), attr: "pre" },
        "prc": { nombre: localize("Perception2"), attr: "awa" },
        "prs": { nombre: localize("Persuasion2"), attr: "pre" },
        "sur": { nombre: localize("Survival2"), attr: "awa" }
      }
    }
  };

  const attrNames = {
    "str": "STR", "spd": "SPD", "int": "INT",
    "wil": "WIL", "awa": "AWA", "pre": "PRE"
  };

  // Buscar actor
  let actor = (canvas?.tokens?.controlled ?? [])[0]?.actor ?? game.user.character;
  if (!actor || typeof actor.rollSkill !== "function" || actor.isOwner === false) {
    ui.notifications.error(localize("YouHaveNoActiveCharacterOrSelectedToken"));
    return;
  }

  const actorSkills = actor.system?.skills ?? {};
  const actorAttrs = actor.system?.attributes ?? {};

  // Convertir habilidades a arrays para poder iterar por filas
  const cols = Object.values(categorias).map(cat => {
    return {
      nombre: cat.nombre,
      skills: Object.entries(cat.habilidades).map(([key, data]) => {
        const skillVal = normalizeNumber(actorSkills[key]?.rank);
        const attrVal = normalizeNumber(actorAttrs[data.attr]?.value);
        return {
          key,
          nombre: data.nombre,
          attr: attrNames[data.attr],
          total: skillVal + attrVal
        };
      })
    };
  });

  const numRows = Math.max(...cols.map(c => c.skills.length));

  // Generar HTML
  let htmlContent = `
  <style>
    .skills-table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 6px;
    }
    .skills-table th {
      font-family: 'Modesto Condensed', serif;
      font-size: 22px;
      color: #f4e8c1;
      padding: 8px;
      text-align: center;
    }
    .skill-cell {
      background: #1e3a5f;
      border: 1px solid #3a6186;
      border-radius: 4px;
      padding: 10px 14px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .skill-cell:hover {
      background: #2a4a6f;
      border-color: #5a8ab6;
      transform: scale(1.03);
    }
    .skill-name { color: #f4e8c1; font-size: 13px; }
    .skill-attr { color: #8ab4d4; font-size: 11px; margin-left: 4px; }
    .skill-total { color: #f4e8c1; font-size: 13px; }
  </style>

  <table class="skills-table">
    <thead>
      <tr>
        ${cols.map(c => `<th>${c.nombre}</th>`).join('')}
      </tr>
    </thead>
    <tbody>
  `;

  for (let i = 0; i < numRows; i++) {
    htmlContent += '<tr>';
    for (const col of cols) {
      const skill = col.skills[i];
      if (skill) {
        htmlContent += `
          <td class="skill-cell" data-skill="${skill.key}">
            <span class="skill-name">${skill.nombre}</span>
            <span class="skill-attr">${skill.attr}</span>
            <span class="skill-total">(+${escapeHtml(skill.total)})</span>
          </td>
        `;
      } else {
        htmlContent += '<td></td>';
      }
    }
    htmlContent += '</tr>';
  }

  htmlContent += `
    </tbody>
  </table>
  `;

  // Crear diálogo
  const dialog = openCosmereDialog({
    title: `${escapeHtml(actor.name)}'s Skills`,
    content: htmlContent,
    buttons: {},
    render: html => {
      html.find(".skill-cell").on("click", async event => {
        const skillKey = event.currentTarget.dataset.skill;
        dialog.close();
        await actor.rollSkill(skillKey, { chatMessage: true });
      });
    },
    width: 650,
  }, { Dialog });
}
