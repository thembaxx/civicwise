import assert from "node:assert/strict";
import { randomUUID, createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { DatabaseSync } from "node:sqlite";
import { Pool } from "pg";
import test from "node:test";
import { POSTGRES_STATE_SCHEMA } from "../lib/durable-state.ts";

test(
  "SQLite migration validates domain schemas, preserves source bytes and refuses target overwrite",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const execute = promisify(execFile);
    const schema = `import_test_${randomUUID().replaceAll("-", "")}`;
    const databaseUrl = new URL(process.env.TEST_DATABASE_URL!);
    databaseUrl.searchParams.set("options", `-csearch_path=${schema}`);
    const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const target = new Pool({ connectionString: databaseUrl.toString() });
    const directory = mkdtempSync(join(tmpdir(), "civicwise-import-"));
    const path = join(directory, "backup.sqlite");
    const updateSource = (namespace: string, payload: string) => {
      const source = new DatabaseSync(path);
      source.exec(
        "CREATE TABLE IF NOT EXISTS civicwise_state(namespace TEXT PRIMARY KEY,payload TEXT,sequence INTEGER,revision INTEGER)",
      );
      source.exec("DELETE FROM civicwise_state");
      source.prepare("INSERT INTO civicwise_state VALUES(?,?,120,9)").run(namespace, payload);
      source.close();
    };
    const digest = () => createHash("sha256").update(readFileSync(path)).digest("hex");
    const run = (apply = false) =>
      execute(
        process.execPath,
        [
          "--conditions=react-server",
          "--experimental-strip-types",
          "scripts/import-sqlite.ts",
          `--source=${path}`,
          ...(apply ? ["--apply"] : []),
        ],
        {
          cwd: new URL("..", import.meta.url),
          env: { ...process.env, DATABASE_URL: databaseUrl.toString() },
        },
      );
    try {
      await admin.query(`CREATE SCHEMA ${schema}`);
      await target.query(POSTGRES_STATE_SCHEMA);
      for (const [namespace, payload] of [
        ["issues", "[]"],
        ["reports", '{"reports":[],"seeded":"broken"}'],
        ["unexpected", "{}"],
      ]) {
        updateSource(namespace, payload);
        const before = digest();
        await assert.rejects(run());
        await assert.rejects(run(true));
        assert.equal(digest(), before);
        assert.equal(
          Number((await target.query("SELECT count(*) FROM civicwise_state")).rows[0].count),
          0,
        );
      }
      updateSource("issues", '{"issues":[]}');
      const before = digest();
      assert.match((await run()).stdout, /Dry run only/);
      assert.equal(
        Number((await target.query("SELECT count(*) FROM civicwise_state")).rows[0].count),
        0,
      );
      await run(true);
      assert.deepEqual(
        (await target.query("SELECT namespace,payload,sequence,revision FROM civicwise_state"))
          .rows,
        [{ namespace: "issues", payload: '{"issues":[]}', sequence: "120", revision: "9" }],
      );
      await assert.rejects(run(true));
      assert.equal(digest(), before);
      assert.equal(
        Number((await target.query("SELECT count(*) FROM civicwise_state")).rows[0].count),
        1,
      );
    } finally {
      await target.end();
      await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await admin.end();
      rmSync(directory, { recursive: true, force: true });
    }
  },
);
