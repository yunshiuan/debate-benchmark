import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { readParquetRows, coerceRowsToStrings } from "@/lib/parquet";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dataPrefix = searchParams.get("dataPrefix");
  const model = searchParams.get("model");
  const version = searchParams.get("version");

  if (!dataPrefix || !model || !version) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const parquetPath = path.join(
    process.cwd(),
    "result_parquet",
    "eval_v3",
    "validity",
    dataPrefix,
    model,
    `simulation-llm-${version}.parquet`
  );

  if (!fs.existsSync(parquetPath)) {
    return NextResponse.json(
      { error: "Conversation file not found", parquetPath },
      { status: 404 }
    );
  }

  try {
    const rows = coerceRowsToStrings(await readParquetRows(parquetPath));
    const byWorker = new Map();

    rows.forEach((row) => {
      if (row.event_type !== "Initial Opinion") return;
      const workerId = row.worker_id || row.sender_id;
      if (!workerId) return;
      const existing = byWorker.get(workerId);
      if (!existing) {
        byWorker.set(workerId, row);
        return;
      }
      if (new Date(row.time) < new Date(existing.time)) {
        byWorker.set(workerId, row);
      }
    });

    const data = Array.from(byWorker.values()).map((row) => ({
      worker_id: row.worker_id || row.sender_id || "",
      time: row.time || "",
      llm_text: row.llm_text || "",
      text: row.text || "",
      label_pred: row.label_pred || row.llm_label_pred || row.human_label_pred || "",
      event_type: row.event_type || "Initial Opinion",
    }));

    return NextResponse.json(
      { data },
      {
        status: 200,
        headers: {
          "Cache-Control": "public, max-age=300, s-maxage=900, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    console.error("Error reading initial opinions:", error);
    return NextResponse.json(
      { error: "Failed to read initial opinions" },
      { status: 500 }
    );
  }
}
