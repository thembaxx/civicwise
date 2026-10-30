import { Pool } from "pg";

const shared = globalThis as typeof globalThis & { civicwisePostgresPool?: Pool };

/** One bounded pool per process; DATABASE_URL must point to the same database on every instance. */
export function getPostgresPool(): Pool {
  if (!process.env.DATABASE_URL) throw new Error("Configure DATABASE_URL for shared storage.");
  if (shared.civicwisePostgresPool) return shared.civicwisePostgresPool;
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
    connectionTimeoutMillis: 5000,
    idleTimeoutMillis: 30000,
    // TLS is selected by the connection string. Certificate verification stays enabled.
  });
  // pg removes the idle client before emitting this event. Keep the process
  // alive for recovery and never log upstream messages or connection details.
  pool.on("error", () => console.error("CivicWise shared database connection interrupted."));
  shared.civicwisePostgresPool = pool;
  return pool;
}
