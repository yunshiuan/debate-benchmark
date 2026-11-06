import {NextResponse} from "next/server";
import {explorerStore, requestSession, ExplorerError, CACHE_HEADERS} from "@/lib/explorerData.mjs";
export const runtime = "nodejs";
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  try {
    const run = explorerStore.getRun(requestSession(params), params.get("model"), params.get("version"));
    return NextResponse.json({data: run.data.filter((row) => row.event === "Initial Opinion"), humanData: run.humanData.filter((row) => row.event === "Initial Opinion")}, {headers: CACHE_HEADERS});
  } catch (error) {
    return NextResponse.json({error: error instanceof ExplorerError ? error.message : "Unable to load initial opinions."}, {status: error.status || 500});
  }
}
