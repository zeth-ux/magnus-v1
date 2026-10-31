/**
 * Test databases for the SQL in supabase/migrations.
 *
 * - `pgliteDb()`: real Postgres compiled to WebAssembly, in memory. Runs
 *   anywhere `npm test` runs, no setup.
 * - `postgresDb()`: a throwaway database on a real Postgres server, for the
 *   tests that need two connections at once (concurrency). Only when
 *   TEST_DATABASE_URL is set (CI sets it).
 *
 * Both load a small Supabase stand-in (supabase-stub.sql), then every
 * migration in order, and let a test act as a signed-in user.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { randomUUID } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";
import pg from "pg";

const ROOT = join(__dirname, "..", "..", "..");
const MIGRATIONS = join(ROOT, "supabase", "migrations");
const STUB = readFileSync(join(__dirname, "supabase-stub.sql"), "utf8");

export function migrationSql(): string[] {
  return readdirSync(MIGRATIONS)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => readFileSync(join(MIGRATIONS, f), "utf8"));
}

export type Row = Record<string, unknown>;

export interface TestDb {
  /** Run as the database owner (like Supabase's SQL editor). */
  admin(sql: string, params?: unknown[]): Promise<Row[]>;
  /** Run one statement as a signed-in user (role authenticated, auth.uid() = userId). */
  as(userId: string, sql: string, params?: unknown[]): Promise<Row[]>;
  close(): Promise<void>;
}

const ACT_AS = "select set_config('request.jwt.claim.sub', $1, true)";

export async function pgliteDb(): Promise<TestDb> {
  const db = new PGlite();
  await db.exec(STUB);
  for (const sql of migrationSql()) await db.exec(sql);
  return {
    async admin(sql, params = []) {
      return (await db.query<Row>(sql, params)).rows;
    },
    async as(userId, sql, params = []) {
      return db.transaction(async (tx) => {
        await tx.exec("set local role authenticated");
        await tx.query(ACT_AS, [userId]);
        return (await tx.query<Row>(sql, params)).rows;
      });
    },
    close: () => db.close(),
  };
}

export const POSTGRES_URL = process.env.TEST_DATABASE_URL;

/** A fresh database on a real server; `connect()` gives extra independent connections. */
export async function postgresDb(): Promise<TestDb & { pool: pg.Pool }> {
  if (!POSTGRES_URL) throw new Error("TEST_DATABASE_URL is not set");
  const name = `bayu_test_${randomUUID().replace(/-/g, "")}`;
  const root = new pg.Client({ connectionString: POSTGRES_URL });
  await root.connect();
  await root.query(`create database ${name}`);
  await root.end();

  const url = new URL(POSTGRES_URL);
  url.pathname = `/${name}`;
  const pool = new pg.Pool({ connectionString: url.toString(), max: 10 });
  await pool.query(STUB);
  for (const sql of migrationSql()) await pool.query(sql);

  return {
    pool,
    async admin(sql, params = []) {
      return (await pool.query(sql, params)).rows;
    },
    async as(userId, sql, params = []) {
      const client = await pool.connect();
      try {
        await client.query("begin");
        await client.query("set local role authenticated");
        await client.query(ACT_AS, [userId]);
        const res = await client.query(sql, params);
        await client.query("commit");
        return res.rows;
      } catch (e) {
        await client.query("rollback").catch(() => {});
        throw e;
      } finally {
        client.release();
      }
    },
    async close() {
      await pool.end();
      const admin = new pg.Client({ connectionString: POSTGRES_URL });
      await admin.connect();
      await admin.query(`drop database if exists ${name} with (force)`);
      await admin.end();
    },
  };
}

/** Create a signed-up user with a profile (as Supabase auth + the profile step would). */
export async function makeUser(db: TestDb, name: string): Promise<string> {
  const id = randomUUID();
  await db.admin("insert into auth.users (id, email) values ($1, $2)", [id, `${name.toLowerCase()}@example.com`]);
  await db.as(id, "insert into public.profiles (id, display_name, area) values ($1, $2, 'Sa-dong')", [id, name]);
  return id;
}

let isbnCounter = 0;
/** A valid-looking ISBN-13 for tests (the schema checks the 978/979 prefix and length). */
export function nextIsbn(): string {
  isbnCounter += 1;
  return `978${String(isbnCounter).padStart(10, "0")}`;
}

/** List a copy as its owner. */
export async function listCopy(db: TestDb, owner: string, mode: "give" | "lend" = "give", lendMax: string | null = null) {
  const isbn = nextIsbn();
  await db.as(owner, "insert into public.books (isbn, title) values ($1, 'Test book') on conflict do nothing", [isbn]);
  const rows = await db.as(
    owner,
    "insert into public.copies (owner_id, isbn, mode, lend_max) values ($1, $2, $3, $4) returning id",
    [owner, isbn, mode, mode === "lend" ? (lendMax ?? "4_weeks") : null],
  );
  return rows[0].id as string;
}

export async function credits(db: TestDb, user: string) {
  const [row] = await db.as(user, "select * from public.my_credits()");
  return { balance: Number(row.balance), locked: Number(row.locked), available: Number(row.available) };
}
