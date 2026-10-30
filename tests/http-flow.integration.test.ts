import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { randomUUID } from "node:crypto";
import { createRequire } from "node:module";
import { once } from "node:events";
import { resolve } from "node:path";
import test from "node:test";

const databaseUrl = process.env.HTTP_TEST_DATABASE_URL;
const port = Number(process.env.HTTP_TEST_PORT ?? 3199);
const origin = `http://127.0.0.1:${port}`;
const pause = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

test(
  "HTTP routes enforce account ownership and persist shared records across server restarts",
  {
    skip: databaseUrl
      ? false
      : "Set HTTP_TEST_DATABASE_URL and run with --conditions=react-server.",
    timeout: 240_000,
  },
  async () => {
    const { Pool } = await import("pg");
    const { makeSignature } = await import("better-auth/crypto");
    const { getMigrations } = await import("better-auth/db/migration");
    const { POSTGRES_STATE_SCHEMA } = await import("../lib/durable-state.ts");
    const schema = `http_test_${randomUUID().replaceAll("-", "")}`;
    const administration = new Pool({ connectionString: databaseUrl });
    const saved = { ...process.env };
    let server: ChildProcess | undefined;
    let accountPool: InstanceType<typeof Pool> | undefined;
    let serverOutput = "";

    async function stopServer() {
      if (!server || server.exitCode !== null) return;
      const processToStop = server;
      const completion = once(processToStop, "exit");
      if (processToStop.pid) process.kill(-processToStop.pid, "SIGTERM");
      await Promise.race([completion, pause(3000)]);
      if (processToStop.exitCode === null && processToStop.pid) {
        process.kill(-processToStop.pid, "SIGKILL");
        await completion;
      }
      server = undefined;
    }

    async function startServer() {
      server = spawn(
        process.execPath,
        [
          resolve("node_modules/next/dist/bin/next"),
          "dev",
          "--hostname",
          "127.0.0.1",
          "--port",
          String(port),
        ],
        {
          cwd: process.cwd(),
          env: { ...process.env, NODE_ENV: "development", NEXT_TELEMETRY_DISABLED: "1" },
          detached: true,
          stdio: ["ignore", "pipe", "pipe"],
        },
      );
      for (const stream of [server.stdout, server.stderr])
        stream?.on("data", (data: Buffer) => {
          serverOutput = (serverOutput + data.toString()).slice(-30_000);
        });
      const deadline = Date.now() + 60_000;
      while (Date.now() < deadline) {
        if (server.exitCode !== null)
          throw new Error(`Temporary Next server exited (${server.exitCode}).`);
        try {
          const response = await fetch(`${origin}/api/auth/ok`, {
            signal: AbortSignal.timeout(3000),
          });
          if (response.status === 200) return;
        } catch {
          /* Wait for this temporary server's first route compilation. */
        }
        await pause(300);
      }
      throw new Error("Temporary Next server did not become ready within 60 seconds.");
    }

    async function request(path: string, cookie = "", body?: unknown, expected = 200) {
      const response = await fetch(`${origin}${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: { cookie, origin, "Content-Type": "application/json" },
        body: body === undefined ? undefined : JSON.stringify(body),
        redirect: "manual",
        signal: AbortSignal.timeout(30_000),
      });
      assert.equal(
        response.status,
        expected,
        `${path} returned HTTP ${response.status}, expected ${expected}.`,
      );
      return response;
    }

    try {
      await administration.query(`CREATE SCHEMA ${schema}`);
      const isolatedUrl = new URL(databaseUrl!);
      isolatedUrl.searchParams.set("options", `-csearch_path=${schema}`);
      Object.assign(process.env, {
        DATABASE_URL: isolatedUrl.toString(),
        BETTER_AUTH_SECRET: "isolated-http-test-secret-with-32-characters",
        BETTER_AUTH_URL: origin,
        GOOGLE_CLIENT_ID: "fixture-client.apps.googleusercontent.com",
        GOOGLE_CLIENT_SECRET: "fixture-only-not-a-real-google-secret",
        CIVICWISE_DEMO_DATA: "false",
        NODE_ENV: "test",
      });
      delete process.env.VERCEL;
      const { getAuth } = await import("../lib/auth.ts");
      const { getPostgresPool } = await import("../lib/postgres.ts");
      accountPool = getPostgresPool();
      await accountPool.query(POSTGRES_STATE_SCHEMA);
      const auth = getAuth();
      assert.ok(auth);
      await (await getMigrations(auth.options)).runMigrations();
      const context = await auth.$context;
      const fixtures = [];
      for (const name of ["Alice", "Bongi"]) {
        const user = await context.internalAdapter.createUser(
          {
            name: `Fictional ${name}`,
            email: `${name.toLowerCase()}@example.org`,
            emailVerified: true,
          },
          { method: "oauth", oauth: { providerId: "google" } },
        );
        const session = await context.internalAdapter.createSession(user.id);
        assert.ok(session);
        const signature = await makeSignature(session.token, process.env.BETTER_AUTH_SECRET!);
        fixtures.push({
          user,
          session,
          cookie: `${context.authCookies.sessionToken.name}=${encodeURIComponent(`${session.token}.${signature}`)}`,
        });
      }
      const [alice, bongi] = fixtures;
      await startServer();

      const issueInput = {
        municipalityCode: "CPT",
        municipalityName: "Cape Town",
        category: "pothole",
        title: "Fictional Alice issue",
        description: "Test fixture only",
        location: "Test road",
      };
      const reportInput = {
        municipality: "CPT",
        category: "streetlight",
        title: "Fictional Alice report",
        description: "Test fixture only",
        location: "Test street",
      };
      const crossOrigin = await fetch(`${origin}/api/issues`, {
        method: "POST",
        headers: {
          cookie: alice.cookie,
          origin: "https://other-origin.example.org",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(issueInput),
      });
      assert.equal(crossOrigin.status, 403);
      await request("/api/issues", "", issueInput, 401);
      await request("/api/reports", "", reportInput, 401);
      const forgedDevice = `mat_vid=${randomUUID()}; mat_viewer=${randomUUID()}`;
      await request(
        "/api/issues",
        forgedDevice,
        { ...issueInput, ownerId: `account:${alice.user.id}`, emailVerified: true },
        401,
      );
      const aliceIssue = await (await request("/api/issues", alice.cookie, issueInput, 201)).json();
      const aliceReport = (
        await (await request("/api/reports", alice.cookie, reportInput, 201)).json()
      ).report;
      const bongiIssue = await (
        await request(
          "/api/issues",
          bongi.cookie,
          { ...issueInput, title: "Fictional Bongi issue" },
          201,
        )
      ).json();
      const bongiReport = (
        await (
          await request(
            "/api/reports",
            bongi.cookie,
            { ...reportInput, title: "Fictional Bongi report" },
            201,
          )
        ).json()
      ).report;
      assert.equal(aliceIssue.isMine, true);
      assert.equal(aliceReport.isMine, true);

      for (const [path, body] of [
        [`/api/issues/${aliceIssue.id}`, { type: "resident_reports_fixed" }],
        [`/api/reports/${aliceReport.id}`, { action: "resolved" }],
      ] as const)
        await request(path, bongi.cookie, body, 404);
      await request(`/api/issues/${aliceIssue.id}`, bongi.cookie, { type: "confirm" });
      const confirmedIssue = await (
        await request(`/api/issues/${aliceIssue.id}`, bongi.cookie, { type: "confirm" })
      ).json();
      assert.equal(confirmedIssue.confirmations, 1);
      await request(`/api/reports/${aliceReport.id}`, bongi.cookie, { action: "confirm" });
      const confirmedReport = (
        await (
          await request(`/api/reports/${aliceReport.id}`, bongi.cookie, { action: "confirm" })
        ).json()
      ).report;
      assert.equal(confirmedReport.confirmations, 1);
      await request(`/api/issues/${aliceIssue.id}`, alice.cookie, {
        type: "municipal_reference",
        reference: "TEST-123",
      });
      await request(`/api/reports/${aliceReport.id}`, alice.cookie, {
        action: "municipal_ref",
        value: "TEST-456",
      });

      const reportCsv = await (await request("/api/reports/export?m=CPT", alice.cookie)).text();
      assert.ok(reportCsv.includes(aliceReport.title));
      assert.ok(!reportCsv.includes(bongiReport.title));
      const issueCsv = await (await request("/api/issues/export", alice.cookie)).text();
      assert.ok(issueCsv.includes(aliceIssue.title));
      assert.ok(!issueCsv.includes(bongiIssue.title));
      const anonymousCsv = await (await request("/api/reports/export?m=CPT")).text();
      assert.ok(!anonymousCsv.includes(aliceReport.title));

      // A completely independent connection must see committed state without a shared JS cache.
      const independent = new Pool({ connectionString: isolatedUrl.toString() });
      try {
        const stored = await independent.query(
          "SELECT namespace,payload FROM civicwise_state ORDER BY namespace",
        );
        assert.equal(stored.rows.length, 2);
        assert.ok(
          stored.rows.some((row: { payload: string }) => row.payload.includes(aliceIssue.id)),
        );
        assert.ok(
          stored.rows.some((row: { payload: string }) => row.payload.includes(aliceReport.id)),
        );
      } finally {
        await independent.end();
      }
      await stopServer();
      await startServer();
      const persistedIssue = await (
        await request(`/api/issues/${aliceIssue.id}`, alice.cookie)
      ).json();
      const persistedReport = (
        await (await request(`/api/reports/${aliceReport.id}`, alice.cookie)).json()
      ).report;
      assert.equal(persistedIssue.municipalReference, "TEST-123");
      assert.equal(persistedReport.municipalRef, "TEST-456");
      assert.equal(persistedIssue.confirmations, 1);
      assert.equal(persistedReport.confirmations, 1);

      // Optional browser checks reuse an explicitly supplied Playwright installation.
      // CI can add @playwright/test locally, or point to another installed package.
      if (process.env.CIVICWISE_PLAYWRIGHT_MODULE) {
        const { chromium } = createRequire(import.meta.url)(
          process.env.CIVICWISE_PLAYWRIGHT_MODULE,
        );
        const browser = await chromium.launch({
          executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || "/usr/bin/chromium",
          args: ["--no-sandbox"],
        });
        try {
          for (const viewport of [
            { width: 390, height: 844 },
            { width: 1440, height: 1000 },
          ]) {
            const anonymous = await browser.newContext({ viewport });
            const page = await anonymous.newPage();
            await page.goto(`${origin}/report`, { waitUntil: "domcontentloaded" });
            await page.getByRole("button", { name: "Continue with Google" }).waitFor();
            assert.equal(await page.locator("input[name=title]").count(), 0);
            assert.ok(
              await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            );
            await anonymous.close();
            const signedIn = await browser.newContext({ viewport });
            const separator = alice.cookie.indexOf("=");
            await signedIn.addCookies([
              {
                name: alice.cookie.slice(0, separator),
                value: alice.cookie.slice(separator + 1),
                url: origin,
              },
            ]);
            const signedInPage = await signedIn.newPage();
            await signedInPage.goto(`${origin}/account`, { waitUntil: "domcontentloaded" });
            await signedInPage.getByText("Signed in as alice@example.org.").waitFor();
            await signedInPage.goto(`${origin}/report`, { waitUntil: "domcontentloaded" });
            await signedInPage.locator("input[name=title]").waitFor();
            assert.ok(
              await signedInPage.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
            );
            await signedIn.close();
          }
        } finally {
          await browser.close();
        }
      }
      await request("/api/auth/sign-out", alice.cookie, {});
      await request("/api/issues", alice.cookie, issueInput, 401);
      await request("/api/reports", alice.cookie, reportInput, 401);
    } catch (error) {
      // Server output stays private; tests report the failing assertion, never credentials/cookies.
      if (process.env.HTTP_TEST_DIAGNOSTICS === "1") console.error(serverOutput);
      throw error;
    } finally {
      await stopServer();
      if (accountPool) await accountPool.end();
      await administration.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
      await administration.end();
      for (const key of Object.keys(process.env)) if (!(key in saved)) delete process.env[key];
      Object.assign(process.env, saved);
    }
  },
);
