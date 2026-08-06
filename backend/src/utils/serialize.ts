import { RowDataPacket } from "mysql2/promise";

/**
 * MySQL2 with `dateStrings` and `decimalNumbers` already returns most
 * values as plain strings / numbers. This helper guards against any
 * remaining Buffer or Date serialization edge cases.
 */
export function serialize<T>(data: T): T {
  if (Array.isArray(data)) {
    return data.map((row) => serialize(row)) as unknown as T;
  }
  if (data && typeof data === "object") {
    const clean: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
      if (Buffer.isBuffer(v)) {
        clean[k] = v.toString();
      } else if (v instanceof Date) {
        clean[k] = v.toISOString();
      } else if (v !== undefined) {
        clean[k] = v;
      }
    }
    return clean as T;
  }
  return data;
}

/** RowDataPacket convenience type. */
export type Row = RowDataPacket & Record<string, unknown>;
