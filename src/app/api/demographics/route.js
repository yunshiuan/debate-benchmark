import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { readParquetRows, coerceRowsToStrings } from "@/lib/parquet";

export const runtime = "nodejs";

function parseCsv(text) {
  if (!text) return [];
  const rows = [];
  let currentRow = [];
  let currentField = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentField += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      currentRow.push(currentField);
      currentField = "";
    } else if ((char === "\n" || (char === "\r" && nextChar === "\n")) && !inQuotes) {
      if (char === "\r") i++;
      currentRow.push(currentField);
      if (currentRow.length > 0 && currentRow.some((f) => f.trim())) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentField = "";
    } else {
      currentField += char;
    }
  }

  if (currentField || currentRow.length > 0) {
    currentRow.push(currentField);
    if (currentRow.some((f) => f.trim())) {
      rows.push(currentRow);
    }
  }

  if (rows.length < 2) return [];
  const headers = rows[0];
  return rows.slice(1).map((row) => {
    const obj = {};
    headers.forEach((header, idx) => {
      obj[header] = row[idx] ?? "";
    });
    return obj;
  });
}

export async function GET() {
  const parquetPath = path.join(process.cwd(), "result_parquet", "all_demographic_wide.parquet");
  const csvPath = path.join(process.cwd(), "all_demographic_wide.csv");
  try {
    if (fs.existsSync(parquetPath)) {
      const data = await readParquetRows(parquetPath);
      return NextResponse.json({ data: coerceRowsToStrings(data) }, { status: 200 });
    }

    if (!fs.existsSync(csvPath)) {
      return NextResponse.json({ error: "Demographics file not found" }, { status: 404 });
    }
    const csvContent = fs.readFileSync(csvPath, "utf8");
    const data = parseCsv(csvContent);
    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error("Error reading demographics data:", error);
    return NextResponse.json({ error: "Failed to read demographics data" }, { status: 500 });
  }
}
