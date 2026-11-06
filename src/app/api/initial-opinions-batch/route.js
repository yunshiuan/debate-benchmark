import {NextResponse} from "next/server";
import {explorerStore, ExplorerError, CACHE_HEADERS} from "@/lib/explorerData.mjs";
export const runtime = "nodejs";
async function respond(body) {
  try {
    if (!Array.isArray(body.sessions) || body.sessions.length > 50) throw new ExplorerError("Provide at most 50 session IDs.");
    const data = Object.create(null);
    for (const id of body.sessions) {
      try {
        const run = explorerStore.getRun(id, body.model, body.version);
        data[id] = {data: run.data.filter((row) => row.event === "Initial Opinion"), humanData: run.humanData.filter((row) => row.event === "Initial Opinion")};
      } catch (error) {
        if (!(error instanceof ExplorerError)) throw error;
        data[id] = {error: error.message};
      }
    }
    return NextResponse.json({data}, {headers: CACHE_HEADERS});
  } catch (error) {
    return NextResponse.json({error: error instanceof ExplorerError ? error.message : "Unable to load initial opinions."}, {status: error.status || 500});
  }
}
export async function POST(request) {
  try { return respond(await request.json()); }
  catch { return NextResponse.json({error: "Invalid JSON body."}, {status: 400}); }
}
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  return respond({sessions: params.getAll("session"), model: params.get("model"), version: params.get("version")});
}
