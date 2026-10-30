import assert from "node:assert/strict";
import test from "node:test";
import { accountIdentity, getAuthConfiguration } from "../lib/account-identity.ts";

const now = Date.parse("2026-10-29T12:00:00Z");
const verified = () => ({
  user: { id: "user_123", email: "resident@example.org", emailVerified: true },
  session: { userId: "user_123", expiresAt: new Date(now + 60_000) },
});

test("verified authoritative sessions use account ownership, distinct from device bearers", () => {
  assert.deepEqual(accountIdentity(verified(), now), {
    id: "account:user_123",
    email: "resident@example.org",
  });
});

test("missing, expired, mismatched and unverified sessions cannot authorize writes", () => {
  const unverified = verified();
  unverified.user.emailVerified = false;
  const expired = verified();
  expired.session.expiresAt = new Date(now);
  const mismatch = verified();
  mismatch.session.userId = "another_user";
  for (const value of [null, {}, unverified, expired, mismatch, { user: verified().user }])
    assert.equal(accountIdentity(value, now), null);
  assert.equal(
    accountIdentity(
      { user: verified().user, session: { userId: "user_123", expiresAt: "invalid" } },
      now,
    ),
    null,
  );
});

test("legacy device IDs and forged request claims are not account sessions", () => {
  const device = "d7808286-46e3-414b-b116-ab04592f9af4";
  for (const value of [
    device,
    { mat_vid: device, mat_viewer: device },
    { userId: "user_123", emailVerified: true },
    new Headers({ "x-user-id": "user_123" }),
  ])
    assert.equal(accountIdentity(value, now), null);
});

const configuration = (): NodeJS.ProcessEnv => ({
  DATABASE_URL: "postgresql://localhost/civicwise_test",
  BETTER_AUTH_SECRET: "test-configuration-secret-32-characters",
  BETTER_AUTH_URL: "https://civicwise.example.org",
  GOOGLE_CLIENT_ID: "test-client.apps.googleusercontent.com",
  GOOGLE_CLIENT_SECRET: "test-client-secret",
  NODE_ENV: "production",
});

test("Google sign-in stays unavailable until every server-side prerequisite is configured", () => {
  for (const key of [
    "DATABASE_URL",
    "BETTER_AUTH_SECRET",
    "BETTER_AUTH_URL",
    "GOOGLE_CLIENT_ID",
    "GOOGLE_CLIENT_SECRET",
  ]) {
    const environment = configuration();
    delete environment[key];
    assert.equal(getAuthConfiguration(environment), null);
  }
  assert.ok(getAuthConfiguration(configuration()));
  assert.equal(getAuthConfiguration({ ...configuration(), BETTER_AUTH_SECRET: "short" }), null);
});

test("auth requires PostgreSQL and a trusted secure origin in production", () => {
  for (const baseURL of [
    "http://civicwise.example.org",
    "https://example.org/account",
    "https://example.org?next=evil",
    "https://user:password@example.org",
    "invalid",
  ])
    assert.equal(getAuthConfiguration({ ...configuration(), BETTER_AUTH_URL: baseURL }), null);
  assert.equal(
    getAuthConfiguration({ ...configuration(), DATABASE_URL: "sqlite:///tmp/data" }),
    null,
  );
  assert.equal(
    getAuthConfiguration({ ...configuration(), BETTER_AUTH_URL: "http://localhost:3000" }),
    null,
  );
  assert.ok(
    getAuthConfiguration({
      ...configuration(),
      NODE_ENV: "development",
      BETTER_AUTH_URL: "http://localhost:3000",
    }),
  );
});
