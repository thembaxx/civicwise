import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";

export type StateValidator<T> = (value: unknown) => value is T;

export interface NamespaceOptions<T> {
  validate?: StateValidator<T>;
  initialSequence?: number;
  /** Empty state is the default. Samples are created only after explicit demo opt-in. */
  sample?: () => T;
}

export interface StateTransaction {
  nextSequence(): number;
  readonly revision: number;
}

interface StoredState {
  payload: string;
  sequence: number;
  revision: number;
}

export class DurableStateCorruptionError extends Error {
  constructor(namespace: string) {
    super(`Stored ${namespace} data is invalid; it has been preserved for recovery.`);
    this.name = "DurableStateCorruptionError";
  }
}

export function demoDataEnabled(): boolean {
  return process.env.CIVICWISE_DEMO_DATA === "true";
}

export function resolveDatabasePath(
  explicitPath?: string,
  environment: NodeJS.ProcessEnv = process.env,
): string {
  const configured = explicitPath ?? environment.CIVICWISE_DATABASE_PATH;
  const hostedProduction =
    environment.VERCEL === "1" &&
    (environment.NODE_ENV === "production" || environment.VERCEL_ENV === "production");
  // A path on Vercel is never a durable shared SQLite volume. Even an explicit
  // absolute path can appear to work until the next cold start, silently losing
  // resident reports. Refuse all hosted production writes until a transactional
  // shared database adapter is implemented.
  if (hostedProduction) {
    throw new Error(
      "CivicWise cannot store resident reports in local SQLite on Vercel. Configure a transactional shared database adapter before enabling live reporting.",
    );
  }
  if (configured !== undefined && (!configured.trim() || configured.includes("\0"))) {
    throw new Error("CIVICWISE_DATABASE_PATH must be a valid database path.");
  }
  if (configured === ":memory:") return configured;
  return resolve(configured ?? ".data/civicwise.sqlite");
}

function assertJson(value: unknown, seen = new Set<object>(), depth = 0): void {
  if (depth > 100) throw new Error("State is too deeply nested.");
  if (value === null || typeof value === "string" || typeof value === "boolean") return;
  if (typeof value === "number" && Number.isFinite(value)) return;
  if (typeof value !== "object") throw new Error("State must contain only JSON values.");
  if (seen.has(value)) throw new Error("State must not contain circular references.");
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) {
    throw new Error("State must contain only plain objects and arrays.");
  }
  seen.add(value);
  for (const entry of Array.isArray(value) ? value : Object.values(value)) {
    assertJson(entry, seen, depth + 1);
  }
  seen.delete(value);
}

function encodeState<T>(value: T, validate?: StateValidator<T>): string {
  assertJson(value);
  if (validate && !validate(value)) throw new Error("Updated state does not match its schema.");
  return JSON.stringify(value);
}

function decodeState<T>(namespace: string, payload: string, validate?: StateValidator<T>): T {
  try {
    const value: unknown = JSON.parse(payload);
    assertJson(value);
    if (validate && !validate(value)) throw new Error("Schema mismatch");
    return value as T;
  } catch {
    throw new DurableStateCorruptionError(namespace);
  }
}

function enableWal(database: DatabaseSync): void {
  const deadline = Date.now() + 5000;
  const pause = new Int32Array(new SharedArrayBuffer(4));
  while (true) {
    try {
      database.exec("PRAGMA journal_mode = WAL");
      return;
    } catch (error) {
      // Simultaneous first opens can contend while changing journal mode; SQLite
      // does not apply busy_timeout consistently to this pragma.
      if (
        !error ||
        typeof error !== "object" ||
        !("errcode" in error) ||
        ![5, 6].includes(Number(error.errcode)) ||
        Date.now() >= deadline
      )
        throw error;
      Atomics.wait(pause, 0, 0, 10);
    }
  }
}

/** Synchronous read-modify-write transactions reread committed state under SQLite's writer lock. */
export class DurableStateStore {
  private readonly database: DatabaseSync;

  constructor(path?: string) {
    const target = resolveDatabasePath(path);
    if (target !== ":memory:") mkdirSync(dirname(target), { recursive: true, mode: 0o700 });
    this.database = new DatabaseSync(target);
    try {
      this.database.exec("PRAGMA busy_timeout = 5000");
      enableWal(this.database);
      this.database.exec(`
        PRAGMA synchronous = FULL;
        CREATE TABLE IF NOT EXISTS civicwise_state (
          namespace TEXT PRIMARY KEY,
          payload TEXT NOT NULL CHECK(json_valid(payload)),
          sequence INTEGER NOT NULL CHECK(sequence >= 0),
          revision INTEGER NOT NULL CHECK(revision >= 0)
        );
      `);
    } catch (error) {
      this.database.close();
      throw error;
    }
  }

  read<T>(namespace: string, initialize: () => T, options: NamespaceOptions<T> = {}): T {
    return this.transaction(namespace, initialize, (state) => state, options);
  }

  transaction<T, R>(
    namespace: string,
    initialize: () => T,
    update: (state: T, transaction: StateTransaction) => R,
    options: NamespaceOptions<T> = {},
  ): R {
    if (!/^[a-z][a-z0-9._-]{0,63}$/.test(namespace)) throw new Error("Invalid state namespace.");
    const initialSequence = options.initialSequence ?? 0;
    if (!Number.isSafeInteger(initialSequence) || initialSequence < 0) {
      throw new Error("Initial sequence must be a non-negative safe integer.");
    }
    this.database.exec("BEGIN IMMEDIATE");
    try {
      const stored = this.database
        .prepare("SELECT payload, sequence, revision FROM civicwise_state WHERE namespace = ?")
        .get(namespace) as StoredState | undefined;
      let sequence = stored?.sequence ?? initialSequence;
      const revision = stored?.revision ?? 0;
      if (
        !Number.isSafeInteger(sequence) ||
        sequence < 0 ||
        !Number.isSafeInteger(revision) ||
        revision < 0
      ) {
        throw new DurableStateCorruptionError(namespace);
      }
      const state = stored
        ? decodeState(namespace, stored.payload, options.validate)
        : demoDataEnabled() && options.sample
          ? options.sample()
          : initialize();
      // Validate initial data before exposing it to the mutator as well.
      encodeState(state, options.validate);
      const result = update(state, {
        revision,
        nextSequence() {
          if (sequence >= Number.MAX_SAFE_INTEGER) throw new Error("Sequence capacity reached.");
          sequence += 1;
          return sequence;
        },
      });
      if (result && typeof result === "object" && "then" in result) {
        throw new Error("Durable state transactions must be synchronous.");
      }
      const payload = encodeState(state, options.validate);
      if (!stored || payload !== stored.payload || sequence !== stored.sequence) {
        if (revision >= Number.MAX_SAFE_INTEGER) throw new Error("Revision capacity reached.");
        this.database
          .prepare(`
          INSERT INTO civicwise_state(namespace, payload, sequence, revision) VALUES (?, ?, ?, ?)
          ON CONFLICT(namespace) DO UPDATE SET payload = excluded.payload,
            sequence = excluded.sequence, revision = excluded.revision
        `)
          .run(namespace, payload, sequence, revision + 1);
      }
      this.database.exec("COMMIT");
      return result;
    } catch (error) {
      this.database.exec("ROLLBACK");
      throw error;
    }
  }

  close(): void {
    this.database.close();
  }
}

const shared = globalThis as typeof globalThis & {
  civicwiseDurableStores?: Map<string, DurableStateStore>;
};

function getStore(): DurableStateStore {
  const path = resolveDatabasePath();
  const stores = (shared.civicwiseDurableStores ??= new Map());
  let store = stores.get(path);
  if (!store) {
    store = new DurableStateStore(path);
    stores.set(path, store);
  }
  return store;
}

export function readDurableState<T>(
  namespace: string,
  initialize: () => T,
  options: NamespaceOptions<T> = {},
): T {
  return getStore().read(namespace, initialize, options);
}

export function withDurableState<T, R>(
  namespace: string,
  initialize: () => T,
  update: (state: T, transaction: StateTransaction) => R,
  options: NamespaceOptions<T> = {},
): R {
  return getStore().transaction(namespace, initialize, update, options);
}
