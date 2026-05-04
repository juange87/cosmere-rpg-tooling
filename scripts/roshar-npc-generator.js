import { hasCosmereDialogSupport, openCosmereDialog } from "./foundry-dialogs.js";

export const ROSHAR_NPC_CULTURE_TABLES = [
  "Alethi Names",
  "Azish Names",
  "Herdazian Names",
  "Reshi Names",
  "Shin Names",
  "Thaylen Names",
  "Unkalaki Names",
  "Veden Names",
];

export const ROSHAR_NPC_TRAITS = {
  attitude: [
    "Desea ayudar, pero no quiere parecer demasiado disponible.",
    "Habla con cortesia impecable mientras mide cada palabra.",
    "Esta irritado por algo reciente y busca a quien culpar.",
    "Se muestra alegre para ocultar que tiene miedo.",
    "Quiere negociar antes de revelar cualquier informacion.",
    "Trata al grupo como una molestia necesaria.",
    "Admira a los forasteros y pregunta demasiado.",
    "Parece distraido, como si escuchara algo que nadie mas oye.",
    "Obedece ordenes, aunque no cree que sean justas.",
    "Tiene prisa y solo coopera si ve un beneficio inmediato.",
  ],
  problem: [
    "Debe entregar un mensaje antes de que cambie la guardia.",
    "Ha perdido una esfera valiosa y no puede admitirlo.",
    "Un familiar desaparecio tras la ultima tormenta alta.",
    "Debe ocultar una herida antes de que alguien haga preguntas.",
    "Su patron le exige un resultado imposible antes del anochecer.",
    "Alguien esta usando su nombre para cerrar tratos falsos.",
    "Necesita escolta para cruzar una zona barrida por la tormenta.",
    "Un spren insiste en seguirle y atrae demasiada atencion.",
    "Tiene una deuda que vence hoy.",
    "Ha oido algo que no debia durante una conversacion privada.",
  ],
  secret: [
    "Sirve en secreto a una casa rival.",
    "Conoce una entrada secundaria a un lugar vigilado.",
    "Ha visto una Shardblade sin registrar.",
    "Guarda un spanreed que no deberia tener.",
    "Finge una posicion social mas alta de la que tiene.",
    "Esta protegiendo a alguien acusado injustamente.",
    "Sabe que una tormenta reciente dejo algo extrano en las crem.",
    "Debe dinero a un comerciante peligroso.",
    "Ha hecho un trato con un spren que no entiende bien.",
    "Reconoce a uno de los personajes de otra vida.",
  ],
  resource: [
    "Puede conseguir una audiencia breve con alguien importante.",
    "Conoce una ruta segura fuera del distrito.",
    "Tiene acceso a un almacen con ropa, cuerdas y lamparas.",
    "Puede prestar un spanreed durante una escena.",
    "Sabe que guardia acepta sobornos pequenos.",
    "Tiene un mapa incompleto pero util de la zona.",
    "Puede presentar al grupo como invitados de baja prioridad.",
    "Conoce a un artifabrian capaz de responder una pregunta dificil.",
    "Puede identificar insignias, uniformes o colores de casa.",
    "Tiene suficientes esferas para encender una negociacion breve.",
  ],
  hook: [
    "Ha visto un spren comportarse de una forma que no encaja con lo conocido.",
    "Una tormenta alta revelo una puerta donde antes habia pared lisa.",
    "Un brightlord menor busca discretamente gente que no haga preguntas.",
    "Una caravana llego con todos sus carros intactos y ningun conductor.",
    "Alguien paga por nombres de personas que suenan con luces imposibles.",
    "Un ardent desaparecio tras copiar un texto demasiado antiguo.",
    "Un fabrial comun empezo a funcionar al reves.",
    "Hay marcas nuevas en la piedra que solo aparecen despues de la lluvia.",
    "Un testigo jura haber visto a un muerto caminando antes del amanecer.",
    "Una disputa menor entre casas esta a punto de volverse violenta.",
  ],
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function pickRandom(items, random) {
  const index = Math.min(Math.floor(random() * items.length), items.length - 1);
  return items[index];
}

function getCultureName(cultureTable) {
  return String(cultureTable ?? "").replace(/\s+Names$/, "");
}

async function drawTableText(game, tableName) {
  const table = game?.tables?.getName?.(tableName);
  if (!table) {
    throw new Error(`No se encontro la tabla "${tableName}".`);
  }

  const draw = await table.draw({ displayChat: false });
  const result = draw?.results?.[0];
  const text = result?.name ?? result?.description ?? result?.text ?? "";

  if (!text) {
    throw new Error(`La tabla "${tableName}" no devolvio ningun resultado.`);
  }

  return String(text);
}

export async function generateRosharNpc({
  game = globalThis.game,
  cultureTable = "",
  random = Math.random,
} = {}) {
  const selectedCultureTable = cultureTable || pickRandom(ROSHAR_NPC_CULTURE_TABLES, random);

  return {
    name: await drawTableText(game, selectedCultureTable),
    cultureTable: selectedCultureTable,
    culture: getCultureName(selectedCultureTable),
    attitude: pickRandom(ROSHAR_NPC_TRAITS.attitude, random),
    problem: pickRandom(ROSHAR_NPC_TRAITS.problem, random),
    secret: pickRandom(ROSHAR_NPC_TRAITS.secret, random),
    resource: pickRandom(ROSHAR_NPC_TRAITS.resource, random),
    hook: pickRandom(ROSHAR_NPC_TRAITS.hook, random),
  };
}

export function buildRosharNpcChatCard(npc) {
  return `
    <div style="border:1px solid #8b5a2b;border-radius:6px;background:#fcfaf6;padding:12px;color:#1f2933;">
      <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.06em;">Generador de PNJ</div>
      <h2 style="margin:2px 0 8px;font-family:Modesto Condensed,serif;color:#6d3f16;font-size:24px;">
        PNJ de Roshar
      </h2>
      <div style="margin-bottom:8px;">
        <div style="font-size:20px;font-family:Modesto Condensed,serif;color:#1e3a5f;">${escapeHtml(npc.name)}</div>
        <div style="font-size:11px;color:#6f7f95;">${escapeHtml(npc.culture)} - ${escapeHtml(npc.cultureTable)}</div>
      </div>
      <div style="display:grid;gap:8px;">
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Actitud</div>
          <div>${escapeHtml(npc.attitude)}</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Problema inmediato</div>
          <div>${escapeHtml(npc.problem)}</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Secreto o giro</div>
          <div>${escapeHtml(npc.secret)}</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Recurso</div>
          <div>${escapeHtml(npc.resource)}</div>
        </div>
        <div>
          <div style="font-size:11px;text-transform:uppercase;color:#6f7f95;letter-spacing:0.04em;">Rumor o gancho</div>
          <div>${escapeHtml(npc.hook)}</div>
        </div>
      </div>
    </div>
  `;
}

function buildDialogContent() {
  const cultureOptions = [
    '<option value="">Aleatoria</option>',
    ...ROSHAR_NPC_CULTURE_TABLES.map(tableName => `<option value="${escapeHtml(tableName)}">${escapeHtml(tableName)}</option>`),
  ].join("");

  return `
    <form>
      <div class="form-group">
        <label for="cr-roshar-npc-culture">Cultura / nombre</label>
        <select id="cr-roshar-npc-culture" name="cultureTable">${cultureOptions}</select>
      </div>
      <div class="form-group">
        <label>
          <input type="checkbox" id="cr-roshar-npc-whisper" name="whisper" checked>
          Enviar solo al GM
        </label>
      </div>
    </form>
  `;
}

export function openRosharNpcGenerator({
  game = globalThis.game,
  Dialog = globalThis.Dialog,
  ChatMessage = globalThis.ChatMessage,
  ui = globalThis.ui,
} = {}) {
  if (!hasCosmereDialogSupport({ Dialog }) || !ChatMessage) {
    throw new Error("Foundry no esta disponible para abrir el generador de PNJ.");
  }

  openCosmereDialog({
    title: "Generador de PNJ Roshar",
    content: buildDialogContent(),
    buttons: {
      generate: {
        icon: '<i class="fas fa-user-plus"></i>',
        label: "Generar",
        callback: async html => {
          try {
            const cultureTable = html.find("#cr-roshar-npc-culture").val();
            const whisperOnly = html.find("#cr-roshar-npc-whisper").is(":checked");
            const npc = await generateRosharNpc({ game, cultureTable });
            const whisper = whisperOnly
              ? ChatMessage.getWhisperRecipients("GM").map(user => user.id)
              : undefined;

            await ChatMessage.create({
              content: buildRosharNpcChatCard(npc),
              speaker: ChatMessage.getSpeaker(),
              whisper,
            });

            ui?.notifications?.info?.("PNJ de Roshar generado.");
          } catch (error) {
            ui?.notifications?.error?.(error.message);
          }
        },
      },
      cancel: {
        icon: '<i class="fas fa-times"></i>',
        label: "Cancelar",
      },
    },
    default: "generate",
  }, { Dialog });
}
