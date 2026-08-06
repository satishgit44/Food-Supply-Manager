import mysql, { Pool, PoolConnection, ResultSetHeader } from "mysql2/promise";
import { config } from "../config";


export const pool: Pool = mysql.createPool({
  host: config.mysql.host,
  user: config.mysql.user,
  password: config.mysql.password,
  database: config.mysql.database,
  port: config.mysql.port,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
  decimalNumbers: true,
});

export type QueryResult<T> = Promise<{ rows: T[]; err: string | null }>;

/**
 * Run a parameterized SELECT / plain query. Returns { rows, err }.
 * - fetchOne: return a single row (or null)
 * - fetchAll: return all rows
 */
export async function dbQuery<T = Record<string, unknown>>(
  sql: string,
  params: unknown[] = [],
  mode: "all" | "one" = "all",
): Promise<{ rows: T[] | T | null; err: string | null }> {
  try {
    const [result] = await pool.query(sql, params);
    const arr = result as unknown as T[];
    if (mode === "one") {
      return { rows: arr[0] ?? null, err: null };
    }
    return { rows: arr, err: null };
  } catch (e) {
    return { rows: null, err: (e as Error).message };
  }
}

/** Run an INSERT / UPDATE / DELETE and commit. */
export async function dbExecute(
  sql: string,
  params: unknown[] = [],
): Promise<{ err: string | null; insertId?: number; affectedRows?: number }> {
  try {
    const [result] = await pool.query(sql, params);
    return {
      err: null,
      insertId: (result as ResultSetHeader).insertId,
      affectedRows: (result as ResultSetHeader).affectedRows,
    };
  } catch (e) {
    return { err: (e as Error).message };
  }
}

/** Get a connection from the pool (used for stored procedures / transactions). */
export async function getConnection(): Promise<PoolConnection> {
  return pool.getConnection();
}

/**
 * Call a stored procedure and return the first result set as rows.
 */
export async function callProcedure<T = Record<string, unknown>>(
  procedure: string,
  args: unknown[] = [],
): Promise<{ rows: T[]; err: string | null }> {
  let conn: PoolConnection | null = null;
  try {
    conn = await pool.getConnection();
    const [rows] = await conn.query(`CALL ${procedure}(${args.map(() => "?").join(",")})`, args);
    return { rows: rows as unknown as T[], err: null };
  } catch (e) {
    return { rows: [], err: (e as Error).message };
  } finally {
    if (conn) conn.release();
  }
}

/** Simple numeric fallback used by dashboards. */
export async function countRows(sql: string, params: unknown[] = []): Promise<number> {
  const { rows } = await dbQuery<{ c: number }>(sql, params, "one");
  const r = rows as { c: number } | null;
  return r ? Number(r.c) : 0;
}
