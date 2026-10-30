import { DatabaseSync } from "node:sqlite";
import { getPostgresPool } from "../lib/postgres.ts";
import { assertJson } from "../lib/durable-state.ts";
import { isIssueState } from "../lib/issues-store.ts";
import { isReportState } from "../lib/report-store.ts";

async function main() {
  // Take an SQLite-aware backup first. Reads never migrate or alter the source database.
  const sourcePath = process.argv.find((value) => value.startsWith("--source="))?.slice(9);
  if (!sourcePath || sourcePath === ":memory:")
    throw new Error("Pass --source=/path/to/backup.sqlite.");
  const source = new DatabaseSync(sourcePath, { readOnly: true });
  try {
    const rows = source
      .prepare("SELECT namespace,payload,sequence,revision FROM civicwise_state")
      .all();
    for (const row of rows) {
      if (typeof row.namespace !== "string" || !/^[a-z][a-z0-9._-]{0,63}$/.test(row.namespace))
        throw new Error("Invalid source namespace.");
      if (typeof row.payload !== "string") throw new Error("Invalid source payload.");
      const state: unknown = JSON.parse(row.payload);
      assertJson(state);
      if (
        !(
          (row.namespace === "issues" && isIssueState(state)) ||
          (row.namespace === "reports" && isReportState(state))
        )
      )
        throw new Error("Unknown namespace or invalid source record schema.");
      for (const key of ["sequence", "revision"]) {
        if (!Number.isSafeInteger(row[key]) || Number(row[key]) < 0)
          throw new Error("Invalid source counter.");
      }
    }
    console.log(
      `Validated ${rows.length} namespace(s). Device ownership, revisions and references remain unchanged.`,
    );
    if (process.argv.includes("--apply")) {
      const pool = getPostgresPool();
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("LOCK TABLE civicwise_state IN EXCLUSIVE MODE");
        if (
          Number((await client.query("SELECT count(*) FROM civicwise_state")).rows[0].count) !== 0
        )
          throw new Error("Target is not empty; refusing to overwrite existing records.");
        for (const row of rows) {
          await client.query(
            "INSERT INTO civicwise_state(namespace,payload,sequence,revision) VALUES($1,$2,$3,$4)",
            [row.namespace, row.payload, row.sequence, row.revision],
          );
        }
        await client.query("COMMIT");
        console.log("Import committed. Source backup was not changed.");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
        await pool.end();
      }
    } else {
      console.log("Dry run only. Add --apply after the target schema is migrated and reviewed.");
    }
  } finally {
    source.close();
  }
}

main().catch(() => {
  console.error(
    "Database operation failed. Verify configuration and preserve the source backup before retrying.",
  );
  process.exitCode = 1;
});
