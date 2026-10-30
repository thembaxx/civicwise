# CivicWise

A municipal-information interface combining resident issue records with public-finance context.

[Browse the source](https://github.com/thembaxx/civicwise)

## Engineering highlights

The home route composes municipal profiles, personal report history, community issue lists and a finance snapshot. Submission delivery to municipalities is not verified.

## Technology

Declared in [package.json](package.json): Next.js `16.4.2` · React `^19` · TypeScript `7.0.2` · Tailwind CSS `^4.3.3`.


## Shared storage and verified accounts

Set `DATABASE_URL` to a shared PostgreSQL database on every app instance. Issues and reports use row-locked transactions with stable references and revisions; a failed PostgreSQL connection never falls back to SQLite. Account sign-in uses Better Auth with Google, database-backed sessions and verified email checks. Live create/update/confirm APIs require a valid verified account; request bodies and device cookies cannot authorize them. Signing in does not verify residency or municipal acknowledgement.

Copy `.env.example` to `.env.local`, configure the database and Google OAuth callback, then run `pnpm db:migrate` before starting the app. [Deployment, migration and rollback instructions](docs/shared-storage.md) include the exact prerequisites, a dry-run SQLite importer and local verification evidence. No production migration is performed by builds or normal requests.

Without `DATABASE_URL`, SQLite remains available for local development and reading earlier records at `.data/civicwise.sqlite`. Explicit `CIVICWISE_DEMO_DATA=true` permits fictional local demo changes; this device-cookie path is disabled when PostgreSQL or Vercel is in use. Every Vercel production SQLite path is rejected, including `/tmp` and apparently persistent paths.

Earlier issue/report device cookies and ownership values remain separate and are not reassigned to a signed-in account. Export or back up legacy records before cutover. A resident's entered municipal reference remains self-reported: CivicWise does not send reports to municipalities. Offline navigation uses a public fallback; account HTML and API responses are never stored by the service worker.

## Verification

Use Node 24 and the package manager declared in `package.json`.

```sh
pnpm install --frozen-lockfile
pnpm typecheck
pnpm test
pnpm lint
pnpm build
```

Optional database integration checks require a **disposable test PostgreSQL database**, never production. Each check creates and removes its own random schema:

```sh
TEST_DATABASE_URL=... pnpm test:postgres
AUTH_TEST_DATABASE_URL=... node --conditions=react-server --experimental-strip-types --test tests/auth-session.integration.test.ts
HTTP_TEST_DATABASE_URL=... pnpm test:http
```

The HTTP check starts an isolated Next server and verifies both report families through authentication, shared storage and a server restart. Set `CIVICWISE_PLAYWRIGHT_MODULE` to an installed `@playwright/test` module path to also run its optional desktop/mobile account and report checks. CI runs the database, session and HTTP checks against an ephemeral PostgreSQL service. Live Google consent and physical-device acceptance still require configured provider credentials and operator verification.
