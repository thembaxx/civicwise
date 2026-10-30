import { getPostgresPool } from "../lib/postgres.ts";
import { POSTGRES_STATE_SCHEMA } from "../lib/durable-state.ts";

async function main() {
  const pool = getPostgresPool();
  try {
    await pool.query(POSTGRES_STATE_SCHEMA);
    console.log("Shared CivicWise state schema is ready; existing rows were preserved.");
  } finally {
    await pool.end();
  }
}

main().catch(() => {
  console.error(
    "Database operation failed. Verify configuration and preserve the source backup before retrying.",
  );
  process.exitCode = 1;
});
