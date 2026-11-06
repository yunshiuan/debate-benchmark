import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {createExplorerStore, ExplorerError, requestSession} from "../src/lib/explorerData.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const store = createExplorerStore(path.join(root, "data/explorers"));
const index = store.getIndex();

test("loader returns a selected model's paired human records", () => {
  for (const model of ["llama-sft-group", "qwen-sft-topic", "mistral-sft-group", "gpt-5-mini"]) {
    for (const version of ["v0", "v1_5"]) {
      const session = index.sessions.find((item) => item.available.includes(`${model}:${version}`));
      assert.ok(session);
      const run = store.getRun(session.id, model, version);
      const raw = store.getSession(session.id).runs[`${model}:${version}`];
      assert.deepEqual(run.humanData, store.getSession(session.id).human[raw.human_reference]);
      assert.ok(run.data.some((row) => row.text.trim() && !row.conditioned));
      assert.equal(run.datasetCommit, "39ae48ab86048a4c480e224c9a6badfabde79a39");
    }
  }
});

test("unknown IDs cannot become filesystem paths", () => {
  for (const id of ["../../package.json", "__proto__", "constructor", "0000000000000000", ""]) {
    assert.throws(() => store.getSession(id), (error) => error instanceof ExplorerError && error.status === 404);
  }
  assert.throws(() => store.getRun(index.sessions[0].id, "../bad", "v0"), ExplorerError);
  assert.throws(() => store.getRun(index.sessions[0].id, "gpt-5-mini", "__proto__"), ExplorerError);
});

test("missing model output produces an explicit unavailable response", () => {
  const session = index.sessions.find((item) => !item.available.includes("llama-sft-group:v0"));
  assert.ok(session);
  assert.throws(() => store.getRun(session.id, "llama-sft-group", "v0"), (error) => error instanceof ExplorerError && error.status === 404);
});

test("legacy full session keys map only to indexed session IDs", () => {
  const session = store.getSession(index.sessions[0].id);
  const params = new URLSearchParams({dataPrefix: session.prefix});
  assert.equal(requestSession(params), session.id);
  assert.equal(requestSession(new URLSearchParams({session: session.id})), session.id);
});
