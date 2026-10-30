import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { promisify } from "node:util";
import { DatabaseSync } from "node:sqlite";
import test from "node:test";
import {
  DurableStateCorruptionError,
  DurableStateStore,
  resolveDatabasePath,
} from "../lib/durable-state.ts";

const execute = promisify(execFile);
const initial = () => ({ count: 0, references: [] as number[] });
const temporary = () => {
  const directory = mkdtempSync(join(tmpdir(), "civicwise-state-"));
  return {
    path: join(directory, "state.sqlite"),
    cleanup: () => rmSync(directory, { recursive: true, force: true }),
  };
};

test("issues and reports persist through reopening with independent stable sequences", () => {
  const fixture = temporary();
  try {
    const first = new DurableStateStore(fixture.path);
    first.transaction(
      "issues",
      initial,
      (state, transaction) => {
        state.count += 1;
        state.references.push(transaction.nextSequence());
      },
      { initialSequence: 120 },
    );
    first.transaction(
      "reports",
      initial,
      (state, transaction) => {
        state.count += 2;
        state.references.push(transaction.nextSequence());
      },
      { initialSequence: 1040 },
    );
    first.close();
    const reopened = new DurableStateStore(fixture.path);
    try {
      assert.deepEqual(reopened.read("issues", initial), { count: 1, references: [121] });
      assert.deepEqual(reopened.read("reports", initial), { count: 2, references: [1041] });
      assert.equal(
        reopened.transaction("issues", initial, (_, transaction) => transaction.nextSequence()),
        122,
      );
    } finally {
      reopened.close();
    }
  } finally {
    fixture.cleanup();
  }
});

test("exceptions roll back both state changes and allocated sequence numbers", () => {
  const fixture = temporary();
  const store = new DurableStateStore(fixture.path);
  try {
    store.read("issues", initial);
    assert.throws(
      () =>
        store.transaction("issues", initial, (state, transaction) => {
          state.count = 500;
          transaction.nextSequence();
          throw new Error("Reject change");
        }),
      /Reject change/,
    );
    assert.deepEqual(store.read("issues", initial), initial());
    assert.equal(
      store.transaction("issues", initial, (_, transaction) => transaction.nextSequence()),
      1,
    );
  } finally {
    store.close();
    fixture.cleanup();
  }
});

test("two concurrent processes reread locked state and cannot lose updates or reference numbers", async () => {
  const fixture = temporary();
  const moduleUrl = new URL("../lib/durable-state.ts", import.meta.url).href;
  const source = `
    import {DurableStateStore} from ${JSON.stringify(moduleUrl)};
    const store = new DurableStateStore(process.argv[1]);
    try {
      for (let index = 0; index < 40; index++) {
        store.transaction('issues', () => ({count: 0, references: []}), (state, tx) => {
          state.count++;
          state.references.push(tx.nextSequence());
        });
      }
    } finally { store.close(); }
  `;
  try {
    await Promise.all(
      [0, 1].map(() =>
        execute(
          process.execPath,
          ["--experimental-strip-types", "--input-type=module", "-e", source, fixture.path],
          { timeout: 15_000 },
        ),
      ),
    );
    const store = new DurableStateStore(fixture.path);
    try {
      const state = store.read("issues", initial);
      assert.equal(state.count, 80);
      assert.deepEqual(
        [...state.references].sort((a, b) => a - b),
        Array.from({ length: 80 }, (_, index) => index + 1),
      );
    } finally {
      store.close();
    }
  } finally {
    fixture.cleanup();
  }
});

test("corrupt persisted JSON is preserved and cannot be replaced by defaults or a mutation", () => {
  const fixture = temporary();
  const store = new DurableStateStore(fixture.path);
  try {
    store.read("issues", initial);
    const inspection = new DatabaseSync(fixture.path);
    try {
      inspection.exec("PRAGMA ignore_check_constraints = ON");
      inspection
        .prepare("UPDATE civicwise_state SET payload = ? WHERE namespace = ?")
        .run("{broken", "issues");
      assert.throws(() => store.read("issues", initial), DurableStateCorruptionError);
      assert.throws(
        () =>
          store.transaction("issues", initial, (state) => {
            state.count = 42;
          }),
        DurableStateCorruptionError,
      );
      assert.equal(
        (
          inspection
            .prepare("SELECT payload FROM civicwise_state WHERE namespace = ?")
            .get("issues") as { payload: string }
        ).payload,
        "{broken",
      );
    } finally {
      inspection.close();
    }
  } finally {
    store.close();
    fixture.cleanup();
  }
});

test("schema corruption and non-JSON updates fail without discarding the last good state", () => {
  const fixture = temporary();
  const store = new DurableStateStore(fixture.path);
  const validate = (value: unknown): value is ReturnType<typeof initial> =>
    Boolean(
      value &&
      typeof value === "object" &&
      "count" in value &&
      typeof value.count === "number" &&
      Number.isSafeInteger(value.count) &&
      value.count >= 0 &&
      "references" in value &&
      Array.isArray(value.references),
    );
  try {
    store.read("issues", initial, { validate });
    assert.throws(
      () =>
        store.transaction("issues", initial, (state) => {
          state.count = NaN;
        }),
      /JSON/,
    );
    assert.throws(
      () =>
        store.transaction(
          "issues",
          initial,
          (state) => {
            state.count = -1;
          },
          { validate },
        ),
      /schema/,
    );
    assert.throws(
      () =>
        store.transaction("issues", initial, (state) => {
          state.references = undefined as unknown as number[];
        }),
      /JSON/,
    );
    assert.throws(() => store.transaction("issues", initial, async () => {}), /synchronous/);
    assert.deepEqual(store.read("issues", initial, { validate }), initial());
    assert.throws(
      () =>
        store.read("issues", initial, {
          validate: (value): value is ReturnType<typeof initial> => {
            void value;
            return false;
          },
        }),
      DurableStateCorruptionError,
    );
    assert.deepEqual(store.read("issues", initial), initial());
  } finally {
    store.close();
    fixture.cleanup();
  }
});

test("sample seeding requires explicit opt-in and never replaces existing personal state", () => {
  const fixture = temporary();
  const store = new DurableStateStore(fixture.path);
  const original = process.env.CIVICWISE_DEMO_DATA;
  const sample = () => ({ count: 99, references: [99] });
  try {
    delete process.env.CIVICWISE_DEMO_DATA;
    assert.deepEqual(store.read("issues", initial, { sample }), initial());
    process.env.CIVICWISE_DEMO_DATA = "true";
    assert.deepEqual(store.read("issues", initial, { sample }), initial());
    assert.deepEqual(store.read("reports", initial, { sample }), sample());
  } finally {
    if (original === undefined) delete process.env.CIVICWISE_DEMO_DATA;
    else process.env.CIVICWISE_DEMO_DATA = original;
    store.close();
    fixture.cleanup();
  }
});

test("hosted production requires an explicit persistent path; local development retains its default", () => {
  assert.throws(
    () => resolveDatabasePath(undefined, { VERCEL: "1", NODE_ENV: "production" }),
    /transactional shared database adapter/,
  );
  assert.throws(
    () => resolveDatabasePath(":memory:", { VERCEL: "1", VERCEL_ENV: "production", NODE_ENV: "production" }),
    /transactional shared database adapter/,
  );
  assert.throws(
    () => resolveDatabasePath("/data/civicwise.sqlite", { VERCEL: "1", NODE_ENV: "production" }),
    /transactional shared database adapter/,
  );
  assert.throws(
    () => resolveDatabasePath("/tmp/civicwise.sqlite", { VERCEL: "1", NODE_ENV: "production" }),
    /transactional shared database adapter/,
  );
  assert.equal(resolveDatabasePath(undefined, { NODE_ENV: "development" }), resolve(".data/civicwise.sqlite"));
  assert.throws(() => resolveDatabasePath("  ", { NODE_ENV: "development" }), /valid database path/);
});
