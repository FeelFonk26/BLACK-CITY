import { readFile } from "node:fs/promises";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to run migrations");

const pool = new pg.Pool({ connectionString: databaseUrl, max: 1, connectionTimeoutMillis: 5000 });
try {
  await pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(128) PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  const version = "0001_initial";
  const alreadyApplied = await pool.query("SELECT version FROM schema_migrations WHERE version = $1", [version]);
  if (alreadyApplied.rowCount === 0) {
    const migrationUrl = new URL("../../../database/migrations/0001_initial.sql", import.meta.url);
    const sql = await readFile(migrationUrl, "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [version]);
      await client.query("COMMIT");
      process.stdout.write(`Applied migration ${version}\n`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } else {
    process.stdout.write(`Migration ${version} already applied\n`);
  }
} finally {
  await pool.end();
}
