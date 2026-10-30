import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { Pool } from "pg";
import {
  POSTGRES_STATE_SCHEMA,
  PostgresStateStore,
  DurableStateCorruptionError,
} from "../lib/durable-state.ts";

test(
  "shared PostgreSQL preserves concurrent updates, rollback and invalid data across independent pools",
  { skip: !process.env.TEST_DATABASE_URL },
  async () => {
    const schema = `civicwise_test_${randomUUID().replaceAll("-", "")}`;
    const admin = new Pool({ connectionString: process.env.TEST_DATABASE_URL });
    const settings = {
      connectionString: process.env.TEST_DATABASE_URL,
      options: `-c search_path=${schema}`,
      max: 3,
    };
    const first = new Pool(settings);
    const second = new Pool(settings);
    try {
      await admin.query(`CREATE SCHEMA ${schema}`);
      await first.query(POSTGRES_STATE_SCHEMA);
      const stores = [new PostgresStateStore(first), new PostgresStateStore(second)];
      const initial = () => ({ count: 0, references: [] as number[] });
      await Promise.all(
        Array.from({ length: 40 }, (_, index) =>
          stores[index % 2].transaction("issues", initial, (state, tx) => {
            state.count++;
            state.references.push(tx.nextSequence());
          }),
        ),
      );
      const saved = await stores[1].read("issues", initial);
      assert.equal(saved.count, 40);
      assert.deepEqual(
        saved.references.sort((a, b) => a - b),
        Array.from({ length: 40 }, (_, i) => i + 1),
      );
      await assert.rejects(
        stores[0].transaction("issues", initial, (state, tx) => {
          state.count = 900;
          tx.nextSequence();
          throw new Error("Abort update");
        }),
        /Abort update/,
      );
      assert.deepEqual(await stores[1].read("issues", initial), saved);
      assert.equal(
        await stores[1].transaction("issues", initial, (_, tx) => tx.nextSequence()),
        41,
      );
      await assert.rejects(
        stores[0].transaction("issues", initial, async () => {}),
        /synchronous/,
      );
      await assert.rejects(
        stores[0].transaction("issues", initial, (state) => {
          state.count = NaN;
        }),
        /JSON/,
      );
      await first.query("UPDATE civicwise_state SET payload='[]' WHERE namespace='issues'");
      await assert.rejects(
        stores[1].read("issues", initial, {
          validate: (value): value is ReturnType<typeof initial> =>
            Boolean(value && typeof value === "object" && "count" in value),
        }),
        DurableStateCorruptionError,
      );
      assert.equal(
        (await first.query("SELECT payload FROM civicwise_state WHERE namespace='issues'")).rows[0]
          .payload,
        "[]",
      );
      assert.deepEqual(await stores[0].read("reports", initial), initial());
      assert.equal(
        await stores[0].transaction("reports", initial, (_, tx) => tx.nextSequence()),
        1,
      );
    } finally {
      await first.end();
      await second.end();
      await admin.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await admin.end();
    }
  },
);
