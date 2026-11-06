import {NextResponse} from "next/server";
import {explorerStore, requestSession, ExplorerError, CACHE_HEADERS} from "@/lib/explorerData.mjs";
export const runtime = "nodejs";
export async function GET(request) {
  const params = new URL(request.url).searchParams;
  try {
    const result = explorerStore.getRun(requestSession(params), params.get("model"), params.get("version"));
    return NextResponse.json(result, {headers: CACHE_HEADERS});
  } catch (error) {
    if (!(error instanceof ExplorerError)) console.error("Unable to read released conversation data", error.message);
    return NextResponse.json({error: error instanceof ExplorerError ? error.message : "Unable to load conversation data."}, {status: error.status || 500});
  }
}
