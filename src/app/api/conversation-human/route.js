import {NextResponse} from "next/server";
import {explorerStore, requestSession, ExplorerError, CACHE_HEADERS} from "@/lib/explorerData.mjs";
export const runtime = "nodejs";
export async function GET(request) {
  try {
    const session = explorerStore.getSession(requestSession(new URL(request.url).searchParams));
    return NextResponse.json({data: session.human.canonical, participants: session.participants, session: session.id}, {headers: CACHE_HEADERS});
  } catch (error) {
    return NextResponse.json({error: error instanceof ExplorerError ? error.message : "Unable to load human conversation data."}, {status: error.status || 500});
  }
}
