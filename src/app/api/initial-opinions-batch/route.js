import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { readParquetRows, coerceRowsToStrings } from "@/lib/parquet";

export const runtime = "nodejs";

const buildParquetPath = (dataPrefix, model, version) =>
  path.join(
    process.cwd(),
    "result_parquet",
    "eval_v3",
    "validity",
    dataPrefix,
    model,
    `simulation-llm-${version}.parquet`
  );

const extractInitialOpinions = (rows) => {
  const byWorker = new Map();
  rows.forEach((row) => {
    if (row.event_type !== "Initial Opinion") return;
    const workerId = row.worker_id || row.sender_id;
    if (!workerId) return;
    const existing = byWorker.get(workerId);
    if (!existing || new Date(row.time) < new Date(existing.time)) {
      byWorker.set(workerId, row);
    }
  });
  return Array.from(byWorker.values()).map((row) => ({
    worker_id: row.worker_id || row.sender_id || "",
    time: row.time || "",
    llm_text: row.llm_text || "",
    text: row.text || "",
    label_pred: row.label_pred || row.llm_label_pred || row.human_label_pred || "",
    event_type: row.event_type || "Initial Opinion",
  }));
};

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dataPrefixesParam = searchParams.get("dataPrefixes");
  const model = searchParams.get("model");
  const version = searchParams.get("version");

  if (!dataPrefixesParam || !model || !version) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const dataPrefixes = dataPrefixesParam
    .split(",")
    .map((value) => decodeURIComponent(value.trim()))
    .filter(Boolean);

  if (dataPrefixes.length === 0) {
    return NextResponse.json({ data: {} }, { status: 200 });
  }

  const data = {};

  try {
    for (const dataPrefix of dataPrefixes) {
      const parquetPath = buildParquetPath(dataPrefix, model, version);
      if (!fs.existsSync(parquetPath)) {
        data[dataPrefix] = [];
        continue;
      }
      const rows = coerceRowsToStrings(await readParquetRows(parquetPath));
      data[dataPrefix] = extractInitialOpinions(rows);
    }

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
    console.error("Error reading initial opinions batch:", error);
    return NextResponse.json(
      { error: "Failed to read initial opinions batch" },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch (error) {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const dataPrefixes = Array.isArray(body?.dataPrefixes) ? body.dataPrefixes : [];
  const model = body?.model;
  const version = body?.version;

  if (!dataPrefixes.length || !model || !version) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const data = {};

  try {
    for (const dataPrefix of dataPrefixes) {
      const parquetPath = buildParquetPath(dataPrefix, model, version);
      if (!fs.existsSync(parquetPath)) {
        data[dataPrefix] = [];
        continue;
      }
      const rows = coerceRowsToStrings(await readParquetRows(parquetPath));
      data[dataPrefix] = extractInitialOpinions(rows);
    }

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
    console.error("Error reading initial opinions batch:", error);
    return NextResponse.json(
      { error: "Failed to read initial opinions batch" },
      { status: 500 }
    );
  }
}
