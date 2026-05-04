function getDialogV2Class({ DialogV2, foundry = globalThis.foundry } = {}) {
  return DialogV2 ?? foundry?.applications?.api?.DialogV2;
}

export function hasCosmereDialogSupport({
  Dialog = globalThis.Dialog,
  DialogV2,
  foundry = globalThis.foundry,
} = {}) {
  return Boolean(getDialogV2Class({ DialogV2, foundry }) ?? Dialog);
}

function normalizeIconClass(icon) {
  const text = String(icon ?? "").trim();
  if (!text) return undefined;
  const classMatch = text.match(/class=["']([^"']+)["']/i);
  return (classMatch?.[1] ?? text).replace(/<[^>]+>/g, "").trim() || undefined;
}

export function createDialogHtmlAdapter(root) {
  const queryRoot = root?.querySelectorAll ? root : root?.[0];
  const query = selector => Array.from(queryRoot?.querySelectorAll?.(selector) ?? []);

  return {
    find(selector) {
      const elements = query(selector);
      return {
        length: elements.length,
        0: elements[0],
        [Symbol.iterator]: () => elements[Symbol.iterator](),
        at(index) {
          return elements.at(index);
        },
        click(handler) {
          for (const element of elements) element.addEventListener?.("click", handler);
          return this;
        },
        on(type, handler) {
          for (const element of elements) {
            element.addEventListener?.(type, event => handler.call(element, event));
          }
          return this;
        },
        is(selectorText) {
          return Boolean(elements[0]?.matches?.(selectorText));
        },
        val(value) {
          if (value !== undefined) {
            for (const element of elements) element.value = value;
            return this;
          }
          return elements[0]?.value;
        },
      };
    },
  };
}

function toDialogV2Buttons(buttons = {}, defaultButton = "") {
  return Object.entries(buttons).map(([action, button]) => ({
    action,
    label: button.label ?? action,
    icon: normalizeIconClass(button.icon),
    default: action === defaultButton,
    callback: button.callback
      ? (event, htmlButton, dialog) => {
          const root = htmlButton?.form ?? dialog?.element;
          return button.callback(createDialogHtmlAdapter(root), event, htmlButton, dialog);
        }
      : undefined,
  }));
}

export function openCosmereDialog({
  title = "",
  content = "",
  buttons = {},
  default: defaultButton = "",
  render,
  width,
  modal = false,
} = {}, {
  Dialog = globalThis.Dialog,
  DialogV2,
  foundry = globalThis.foundry,
} = {}) {
  const dialogButtons = Object.keys(buttons).length
    ? buttons
    : { close: { icon: '<i class="fas fa-times"></i>', label: "Cerrar" } };
  const DialogV2Class = getDialogV2Class({ DialogV2, foundry });
  if (DialogV2Class) {
    const dialogOptions = {
      window: { title },
      content,
      modal,
      buttons: toDialogV2Buttons(dialogButtons, defaultButton),
    };
    if (width) dialogOptions.position = { width };

    const dialog = new DialogV2Class(dialogOptions);
    if (typeof render === "function") {
      dialog.addEventListener?.("render", (event) => render(createDialogHtmlAdapter(dialog.element), event, dialog));
    }
    return dialog.render({ force: true });
  }

  if (!Dialog) throw new Error("Foundry no esta disponible para abrir dialogos.");
  return new Dialog({
    title,
    content,
    buttons: dialogButtons,
    default: defaultButton,
    render,
    width,
  }).render(true);
}
