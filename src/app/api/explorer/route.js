import {NextResponse} from "next/server";
import {explorerStore, CACHE_HEADERS} from "@/lib/explorerData.mjs";
export const runtime = "nodejs";
export async function GET() {
  return NextResponse.json(explorerStore.getIndex(), {headers: CACHE_HEADERS});
}
