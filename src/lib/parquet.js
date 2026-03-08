import * as parquet from "parquetjs-lite";

export async function readParquetRows(filePath, columns = null) {
  let reader;
  try {
    reader = await parquet.ParquetReader.openFile(filePath);
    const cursor = reader.getCursor(columns || undefined);
    const rows = [];
    let record = await cursor.next();
    while (record) {
      rows.push(record);
      record = await cursor.next();
    }
    return rows;
  } finally {
    if (reader) {
      await reader.close();
    }
  }
}

export function coerceRowsToStrings(rows) {
  return rows.map((row) => {
    const next = {};
    Object.entries(row || {}).forEach(([key, value]) => {
      if (value === null || value === undefined) {
        next[key] = "";
        return;
      }
      if (typeof value === "string") {
        next[key] = value;
        return;
      }
      if (typeof value === "bigint") {
        next[key] = value.toString();
        return;
      }
      if (Buffer.isBuffer(value)) {
        next[key] = value.toString("utf8");
        return;
      }
      next[key] = String(value);
    });
    return next;
  });
}
