import fs from "fs";
import path from "path";
import { NextResponse } from "next/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const dataPrefix = searchParams.get("dataPrefix");

  if (!dataPrefix) {
    return NextResponse.json(
      { error: "Missing required parameters" },
      { status: 400 }
    );
  }

  const filePath = path.join(
    process.cwd(),
    "result",
    "eval_v3",
    "validity",
    dataPrefix,
    "simulation-human.csv"
  );

  try {
    if (!fs.existsSync(filePath)) {
      console.error("CSV file not found:", filePath);
      return NextResponse.json(
        { error: "CSV file not found", path: filePath },
        { status: 404 }
      );
    }

    const csvContent = fs.readFileSync(filePath, "utf8");
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
      },
    });
  } catch (error) {
    console.error("Error reading CSV:", error);
    return NextResponse.json(
      { error: "Failed to read CSV file" },
      { status: 500 }
    );
  }
}
