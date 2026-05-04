import test from "node:test";
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

import {
  createDialogHtmlAdapter,
  hasCosmereDialogSupport,
  openCosmereDialog,
} from "../scripts/foundry-dialogs.js";

const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function fakeElement({ value = "", checked = false, dataset = {} } = {}) {
  const listeners = {};
  return {
    value,
    checked,
    dataset,
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    dispatch(type, event = {}) {
      return listeners[type]?.(event);
    },
    matches(selector) {
      return selector === ":checked" ? checked : false;
    },
  };
}

function fakeRoot(selectors) {
  return {
    querySelectorAll(selector) {
      return selectors[selector] ?? [];
    },
  };
}

async function collectFiles(directory, predicate) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(fullPath, predicate));
    else if (predicate(entry.name)) files.push(fullPath);
  }
  return files;
}

test("dialog html adapter preserves the V1 html.find affordances used by macros", () => {
  const button = fakeElement();
  const root = fakeRoot({
    "[name=culture]": [fakeElement({ value: "Alethi Names" })],
    "[name=whisper]": [fakeElement({ checked: true })],
    ".actor-check:checked": [
      fakeElement({ dataset: { id: "actor-1" } }),
      fakeElement({ dataset: { id: "actor-2" } }),
    ],
    "button[data-action]": [button],
  });

  const html = createDialogHtmlAdapter(root);
  assert.equal(html.find("[name=culture]").val(), "Alethi Names");
  assert.equal(html.find("[name=whisper]").is(":checked"), true);
  assert.deepEqual([...html.find(".actor-check:checked")].map(element => element.dataset.id), ["actor-1", "actor-2"]);

  let clicked = false;
  html.find("button[data-action]").click(() => {
    clicked = true;
  });
  button.dispatch("click");
  assert.equal(clicked, true);
});

test("openCosmereDialog prefers DialogV2 while keeping V1-style callbacks", async () => {
  const root = fakeRoot({
    "[name=choice]": [fakeElement({ value: "Windrunner" })],
  });
  let capturedConfig;
  let renderOptions;
  let renderValue;
  let callbackValue;

  class FakeDialogV2 {
    constructor(config) {
      capturedConfig = config;
      this.element = root;
      this.handlers = {};
    }

    addEventListener(type, handler) {
      this.handlers[type] = handler;
    }

    render(options) {
      renderOptions = options;
      this.handlers.render?.({ type: "render" });
      return this;
    }
  }

  const dialog = openCosmereDialog({
    title: "Elegir orden",
    content: "<form></form>",
    default: "ok",
    width: 510,
    render: html => {
      renderValue = html.find("[name=choice]").val();
    },
    buttons: {
      ok: {
        icon: '<i class="fas fa-check"></i>',
        label: "Aceptar",
        callback: html => {
          callbackValue = html.find("[name=choice]").val();
        },
      },
    },
  }, { Dialog: null, DialogV2: FakeDialogV2, foundry: null });

  assert.equal(dialog instanceof FakeDialogV2, true);
  assert.deepEqual(renderOptions, { force: true });
  assert.equal(capturedConfig.window.title, "Elegir orden");
  assert.equal(capturedConfig.position.width, 510);
  assert.equal(capturedConfig.buttons[0].action, "ok");
  assert.equal(capturedConfig.buttons[0].icon, "fas fa-check");
  assert.equal(capturedConfig.buttons[0].default, true);
  assert.equal(renderValue, "Windrunner");

  await capturedConfig.buttons[0].callback({}, { form: root }, dialog);
  assert.equal(callbackValue, "Windrunner");
});

test("openCosmereDialog falls back to Dialog V1 when DialogV2 is unavailable", () => {
  let capturedConfig;
  let renderForce;

  class FakeDialog {
    constructor(config) {
      capturedConfig = config;
    }

    render(force) {
      renderForce = force;
      return this;
    }
  }

  assert.equal(hasCosmereDialogSupport({ Dialog: FakeDialog, foundry: null }), true);
  openCosmereDialog({
    title: "Compat",
    content: "",
    buttons: { ok: { label: "Aceptar" } },
    default: "ok",
  }, { Dialog: FakeDialog, DialogV2: null, foundry: null });

  assert.equal(renderForce, true);
  assert.equal(capturedConfig.title, "Compat");
  assert.equal(capturedConfig.default, "ok");
  assert.equal(capturedConfig.buttons.ok.label, "Aceptar");
});

test("openCosmereDialog omits undefined DialogV2 option objects", () => {
  let capturedConfig;

  class FakeDialogV2 {
    constructor(config) {
      capturedConfig = config;
    }

    render() {
      return this;
    }
  }

  openCosmereDialog({
    title: "Sin ancho fijo",
    content: "",
    buttons: { ok: { label: "Aceptar" } },
  }, { Dialog: null, DialogV2: FakeDialogV2, foundry: null });

  assert.equal("position" in capturedConfig, false);
});

test("module script dialogs route through the DialogV2 compatibility helper", async () => {
  const scriptNames = (await readdir("scripts")).filter(name => name.endsWith(".js") && name !== "foundry-dialogs.js");
  const offenders = [];
  for (const scriptName of scriptNames) {
    const source = await readFile(join("scripts", scriptName), "utf8");
    if (/\bnew\s+Dialog\s*\(/.test(source)) offenders.push(scriptName);
  }

  assert.deepEqual(offenders, []);
});

test("macro source dialogs route through the DialogV2 compatibility helper", async () => {
  const macroFiles = await collectFiles("packs/_source", name => name.endsWith(".json"));
  const offenders = [];
  for (const file of macroFiles) {
    const source = await readFile(file, "utf8");
    if (/\bnew\s+Dialog\s*\(/.test(source)) offenders.push(file);
  }

  assert.deepEqual(offenders, []);
});

test("macro source commands remain parseable after dialog migration", async () => {
  const macroFiles = await collectFiles("packs/_source", name => name.endsWith(".json"));
  const failures = [];
  for (const file of macroFiles) {
    const macro = JSON.parse(await readFile(file, "utf8"));
    try {
      new AsyncFunction(macro.command ?? "");
    } catch (error) {
      failures.push(`${file}: ${error.message}`);
    }
  }

  assert.deepEqual(failures, []);
});
