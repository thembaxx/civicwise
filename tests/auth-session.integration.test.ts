import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import test from "node:test";

// Dedicated database only. Every run creates and removes its own random schema.
const databaseUrl = process.env.AUTH_TEST_DATABASE_URL;

test(
  "real PostgreSQL-backed sessions reject forged devices and revoke account access",
  {
    skip: databaseUrl
      ? false
      : "Set AUTH_TEST_DATABASE_URL and run with --conditions=react-server.",
  },
  async () => {
    const { Pool } = await import("pg");
    const { makeSignature } = await import("better-auth/crypto");
    const { getMigrations } = await import("better-auth/db/migration");
    const schema = `auth_test_${randomUUID().replaceAll("-", "")}`;
    const administration = new Pool({ connectionString: databaseUrl });
    const saved = { ...process.env };
    let accountPool: InstanceType<typeof Pool> | undefined;
    try {
      await administration.query(`CREATE SCHEMA ${schema}`);
      const isolatedUrl = new URL(databaseUrl!);
      isolatedUrl.searchParams.set("options", `-csearch_path=${schema}`);
      process.env.DATABASE_URL = isolatedUrl.toString();
      process.env.BETTER_AUTH_SECRET = "isolated-auth-test-secret-with-32-characters";
      process.env.BETTER_AUTH_URL = "http://localhost:3199";
      process.env.GOOGLE_CLIENT_ID = "fixture-client.apps.googleusercontent.com";
      process.env.GOOGLE_CLIENT_SECRET = "fixture-only-not-a-real-google-secret";
      Object.assign(process.env, { NODE_ENV: "test" });

      const { getAuth, getVerifiedAccount } = await import("../lib/auth.ts");
      const { getPostgresPool } = await import("../lib/postgres.ts");
      const { requireWriteIdentity } = await import("../lib/write-identity.ts");
      accountPool = getPostgresPool();
      const auth = getAuth();
      assert.ok(auth);
      await (await getMigrations(auth.options)).runMigrations();
      const health = await auth.handler(new Request("http://localhost:3199/api/auth/ok"));
      assert.equal(health.status, 200);
      assert.deepEqual(await health.json(), { ok: true });

      const context = await auth.$context;
      // Fixture provisioning tests session enforcement, not Google consent/token exchange.
      const user = await context.internalAdapter.createUser(
        {
          name: "Fictional integration-test user",
          email: "fictional-resident@example.org",
          emailVerified: true,
        },
        { method: "oauth", oauth: { providerId: "google" } },
      );
      const session = await context.internalAdapter.createSession(user.id);
      assert.ok(session);
      const signature = await makeSignature(session.token, process.env.BETTER_AUTH_SECRET);
      const cookie = `${context.authCookies.sessionToken.name}=${encodeURIComponent(`${session.token}.${signature}`)}`;
      const authenticated = new Headers({ cookie });
      assert.deepEqual(await getVerifiedAccount(authenticated), {
        id: `account:${user.id}`,
        email: user.email,
      });
      const writeRequest = () =>
        new Request("http://localhost:3199/api/issues", {
          method: "POST",
          headers: authenticated,
        });
      assert.equal(await requireWriteIdentity(writeRequest(), user.id), `account:${user.id}`);

      for (const cookie of [
        `mat_vid=${user.id}; mat_viewer=${user.id}`,
        `${context.authCookies.sessionToken.name}=${session.token}`,
        `${context.authCookies.sessionToken.name}=${encodeURIComponent(`${session.token}.forged`)}`,
      ]) {
        assert.equal(await getVerifiedAccount(new Headers({ cookie, "x-user-id": user.id })), null);
        const denied = await requireWriteIdentity(
          new Request("http://localhost:3199/api/issues", {
            method: "POST",
            headers: { cookie, "Content-Type": "application/json" },
            body: JSON.stringify({ ownerId: `account:${user.id}`, emailVerified: true }),
          }),
          "d7808286-46e3-414b-b116-ab04592f9af4",
        );
        assert.ok(denied instanceof Response);
        assert.equal(denied.status, 401);
      }

      await accountPool.query('UPDATE "user" SET "emailVerified" = false WHERE id = $1', [user.id]);
      assert.equal(await getVerifiedAccount(authenticated), null);
      const unverifiedWrite = await requireWriteIdentity(writeRequest(), user.id);
      assert.ok(unverifiedWrite instanceof Response);
      assert.equal(unverifiedWrite.status, 401);
      await accountPool.query('UPDATE "user" SET "emailVerified" = true WHERE id = $1', [user.id]);
      assert.ok(await getVerifiedAccount(authenticated));
      await context.internalAdapter.deleteSession(session.token);
      assert.equal(await getVerifiedAccount(authenticated), null);
      const revokedWrite = await requireWriteIdentity(writeRequest(), user.id);
      assert.ok(revokedWrite instanceof Response);
      assert.equal(revokedWrite.status, 401);
      delete process.env.GOOGLE_CLIENT_SECRET;
      const unavailableWrite = await requireWriteIdentity(writeRequest(), user.id);
      assert.ok(unavailableWrite instanceof Response);
      assert.equal(unavailableWrite.status, 503);
    } finally {
      if (accountPool) await accountPool.end();
      await administration.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await administration.end();
      for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
      Object.assign(process.env, saved);
    }
  },
);
