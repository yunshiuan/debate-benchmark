import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";
import { readParquetRows, coerceRowsToStrings } from "@/lib/parquet";

export const runtime = "nodejs";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dataPrefix = searchParams.get("dataPrefix");

  if (!dataPrefix) {
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
    "simulation-human.parquet"
  );

  const csvPath = path.join(
    process.cwd(),
    "public",
    "result",
    "eval_v3",
    "validity",
    dataPrefix,
    "simulation-human.csv"
  );

  const parseCsv = (text) => {
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
  };

  try {
    if (fs.existsSync(parquetPath)) {
      const rows = await readParquetRows(parquetPath);
      return NextResponse.json({ data: coerceRowsToStrings(rows) }, { status: 200 });
    }

    if (!fs.existsSync(csvPath)) {
      console.error("Human conversation file not found:", parquetPath, csvPath);
      return NextResponse.json(
        { error: "Human conversation file not found", parquetPath, csvPath },
        { status: 404 }
      );
    }

    const csvContent = fs.readFileSync(csvPath, "utf8");
    const rows = parseCsv(csvContent);
    return NextResponse.json({ data: rows }, { status: 200 });
  } catch (error) {
    console.error("Error reading human conversation data:", error);
    return NextResponse.json(
      { error: "Failed to read human conversation data" },
      { status: 500 }
    );
  }
}
