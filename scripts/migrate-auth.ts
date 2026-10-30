import { getMigrations } from "better-auth/db/migration";
import { getAuth } from "../lib/auth.ts";
import { getPostgresPool } from "../lib/postgres.ts";

async function main() {
  const auth = getAuth();
  if (!auth)
    throw new Error(
      "Configure DATABASE_URL, BETTER_AUTH_SECRET, BETTER_AUTH_URL, GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET before migrating accounts.",
    );
  const pool = getPostgresPool();
  try {
    const migration = await getMigrations(auth.options);
    await migration.runMigrations();
    console.log("CivicWise account tables are ready. No existing device records were reassigned.");
  } finally {
    await pool.end();
  }
}

main().catch(() => {
  console.error(
    "Account migration failed. Check the database configuration and migration plan privately; no credentials or database details are logged here.",
  );
  process.exitCode = 1;
});
