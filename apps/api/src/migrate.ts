import { readFile, readdir } from "node:fs/promises";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required to run migrations");

const pool = new pg.Pool({ connectionString: databaseUrl, max: 1, connectionTimeoutMillis: 5000 });
try {
  await pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (version VARCHAR(128) PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  const migrationsUrl = new URL("../../../database/migrations/", import.meta.url);
  const migrations = (await readdir(migrationsUrl))
    .filter((name) => name.endsWith(".sql"))
    .sort();

  for (const filename of migrations) {
    const version = filename.replace(/\\.sql$/, "");
    const alreadyApplied = await pool.query("SELECT version FROM schema_migrations WHERE version = $1", [version]);
    if (alreadyApplied.rowCount) {
      process.stdout.write(`Migration ${version} already applied\\n`);
      continue;
    }

    const sql = await readFile(new URL(filename, migrationsUrl), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations (version) VALUES ($1)", [version]);
      await client.query("COMMIT");
      process.stdout.write(`Applied migration ${version}\\n`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
} finally {
  await pool.end();
}
