import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, writeFile, readFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { compilePacks } from "../compile-packs.js";

async function fixture(t, { valid = true } = {}) {
  const root = await mkdtemp(join(tmpdir(), "cosmere-packs-"));
  t.after(() => rm(root, { recursive: true, force: true }));
  for (const name of ["a", "b"]) {
    await mkdir(join(root, "packs/_source", name), { recursive: true });
    await mkdir(join(root, "packs", name), { recursive: true });
    await writeFile(join(root, "packs", name, "sentinel"), "previous pack");
    await writeFile(join(root, "packs/_source", name, "macro.json"), JSON.stringify({ _id: valid ? "1234567890123456" : "bad", _key: "!macros!1234567890123456", name: "Test", type: "script", command: "return;" }));
  }
  return root;
}

test("invalid sources are rejected before any compilation or output deletion", async t => {
  const root = await fixture(t, { valid: false });
  await assert.rejects(compilePacks({ root, packNames: ["a", "b"], compiler: () => assert.fail("Should not compile") }), /validation failed/);
  assert.equal(await readFile(join(root, "packs/a/sentinel"), "utf8"), "previous pack");
});

test("a later compilation failure preserves all previous packs", async t => {
  const root = await fixture(t);
  let count = 0;
  await assert.rejects(compilePacks({ root, packNames: ["a", "b"], compiler: async (_, output) => {
    await mkdir(output);
    await writeFile(join(output, "new"), "partial");
    if (++count === 2) throw Error("compiler failed");
  } }), /compiler failed/);
  for (const name of ["a", "b"]) assert.equal(await readFile(join(root, "packs", name, "sentinel"), "utf8"), "previous pack");
  assert.deepEqual((await readdir(join(root, "packs"))).sort(), ["_source", "a", "b"]);
});

test("successful builds replace all packs and remove staging/backups", async t => {
  const root = await fixture(t);
  await compilePacks({ root, packNames: ["a", "b"], compiler: async (_, output) => {
    await mkdir(output);
    await writeFile(join(output, "new"), "compiled");
  } });
  for (const name of ["a", "b"]) assert.deepEqual(await readdir(join(root, "packs", name)), ["new"]);
  assert.deepEqual((await readdir(join(root, "packs"))).sort(), ["_source", "a", "b"]);
});
