import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { createHash } from "node:crypto";

export class ExplorerError extends Error {
  constructor(message, status = 400) { super(message); this.status = status; }
}

export function createExplorerStore(directory) {
  let index;
  let demographics;
  const cache = new Map();
  const readJson = (name) => JSON.parse(fs.readFileSync(path.join(directory, name), "utf8"));
  const getIndex = () => (index ||= readJson("index.json"));
  const getDemographics = () => (demographics ||= readJson("demographics.json"));
  function getSession(id) {
    if (!getIndex().sessions.some((session) => session.id === id)) throw new ExplorerError("Unknown conversation group.", 404);
    if (!cache.has(id)) {
      const content = JSON.parse(gunzipSync(fs.readFileSync(path.join(directory, "sessions", `${id}.json.gz`))).toString("utf8"));
      if (content.id !== id) throw new Error("Session metadata mismatch");
      if (cache.size >= 4) cache.delete(cache.keys().next().value);
      cache.set(id, content);
    }
    return cache.get(id);
  }
  function getRun(id, model, version) {
    if (!getIndex().models.some((item) => item.id === model)) throw new ExplorerError("Unknown model.");
    if (!Object.hasOwn(getIndex().modes, version)) throw new ExplorerError("Unknown simulation mode.");
    const session = getSession(id);
    const run = session.runs[`${model}:${version}`];
    if (!run) throw new ExplorerError("No cached model output is available for this group and simulation mode.", 404);
    if (!Object.hasOwn(session.human, run.human_reference)) throw new Error("Missing paired human reference");
    return {data: run.rows, humanData: session.human[run.human_reference], participants: session.participants,
      session: id, model, version, source: run.source, humanSource: run.human_source,
      datasetCommit: getIndex().dataset_commit};
  }
  return {getIndex, getDemographics, getSession, getRun};
}

export function requestSession(params) {
  const id = params.get("session");
  if (id) return id;
  const legacyPrefix = params.get("dataPrefix");
  return legacyPrefix ? createHash("sha256").update(legacyPrefix).digest("hex").slice(0, 16) : "";
}

export const explorerStore = createExplorerStore(path.join(process.cwd(), "data", "explorers"));
export const CACHE_HEADERS = {"Cache-Control": "public, max-age=300, s-maxage=3600, stale-while-revalidate=600"};
