# Shared storage and account cutover

## What the code provides

`DATABASE_URL` selects PostgreSQL for both issue and legacy report namespaces. All instances must use the same database. Per-namespace row locks protect read-modify-write transactions, sequence allocation and revisions. Mutator errors roll back the payload and counter together. The configured pool has bounded connections and timeouts, and idle errors are logged without upstream messages or connection details. Failed PostgreSQL operations do not fall back to a local database.

Google-only Better Auth sign-in uses PostgreSQL sessions. Protected writes read the authoritative, unexpired server session and require `emailVerified === true`; revocation takes effect on the next write. Account ownership uses a separate `account:` namespace. The app does not offer unverified password registration. Account verification establishes control of an email address, not residency, issue accuracy or municipal receipt.

Legacy device cookies remain readable and keep their independent issue/report ownership. They cannot authorize live changes. Signing in does not claim a device's earlier records. Personal legacy CSV export remains available while signed out on the original device; the report export contains only that device/account's records. Public community projections remain public. A later ownership transfer needs an explicit reviewed recovery mechanism; this release does not silently create one.

The service worker caches static assets and a public offline page. It does not save server-rendered account/report pages, API responses or RSC navigation responses. Its new cache version deletes earlier app caches when activated.

## Configure a staging installation first

1. Provision a shared PostgreSQL database and set `DATABASE_URL` using the provider's verified TLS configuration. Supply this same URL to all app instances. Do not use production as the integration-test database.
2. Set a random `BETTER_AUTH_SECRET` of at least 32 characters and the canonical HTTPS origin in `BETTER_AUTH_URL`, with no path, credentials, query or fragment. Local development accepts an HTTP loopback origin. Put real configuration in environment variables or `.env.local`, never source control.
3. Register a Google Web application OAuth client. Its authorized callback must be exactly `<BETTER_AUTH_URL>/api/auth/callback/google`. Configure `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`; follow Google's consent-screen/test-user requirements.
4. Run `pnpm db:migrate` in the configured environment. The state schema is additive and preserves existing rows; Better Auth runs its declared account migrations. Normal requests never run migrations. The CLI reads inherited environment variables: load `.env.local` securely before invoking it if the shell does not already provide them.
5. Verify `/api/auth/ok`, then complete a real Google consent/sign-in at `/account`. Verify signed-out and unverified requests cannot save a report, and a second account cannot update the first account's record. Test sign-out and session revocation. Do not enter real resident data until staging acceptance and operator policies are complete.

Without all account prerequisites, the UI explains that sign-in/live changes are unavailable and the write APIs return 503. With configured auth but no verified session, writes return 401. Public municipal information remains browsable. `CIVICWISE_DEMO_DATA=true` allows only explicitly fictional, local SQLite demo changes; neither a configured PostgreSQL installation nor Vercel accepts that device-cookie write path.

## Preserve existing SQLite data

1. Stop legacy writers. Export personal history and make an SQLite-aware backup (the backup API or SQLite `.backup`), including WAL state correctly. Keep an untouched original and verify the backup before any cutover.
2. Migrate an empty staging target schema. Run `pnpm db:import-sqlite --source=/absolute/path/to/backup.sqlite`. This is a dry run: it validates JSON, the actual issue/report schemas, namespaces, sequences and revisions without writing a target. Unknown namespaces and malformed records fail closed.
3. Review the namespace counts and then add `--apply`. Import is one transaction, refuses every nonempty target, preserves the exact payload, references, revisions and ownership, and never modifies the SQLite source. No import runs automatically on deployment. Repeat the drill against another empty target before a production cutover.
4. Pause production writes, take fresh verified backups, migrate/import the intended production target and compare counts, sequences and sample records privately. Point all instances at the same `DATABASE_URL`, configure accounts and perform the staged acceptance journey before reopening writes. Do not assume a filesystem path is durable on Vercel.

## Rollback

Keep the SQLite backup and the prior deployment while staging. Before reopening writes, rollback can disable the new deployment and restore the known-good application/database snapshot. Once PostgreSQL accepts new changes, the old SQLite backup is stale: pause writes and back up PostgreSQL before any rollback. Restore a database and application version that understand the same state/schema. Never silently switch to SQLite or overwrite a nonempty PostgreSQL target; reconcile post-cutover records explicitly. Existing device records must not be reassigned based only on an email or request body.

## Observed verification and limits

Local verification uses a real, disposable PostgreSQL 18 instance. Independent pools concurrently allocate unique sequences without lost updates. Tests cover transaction rollback, schema-invalid persisted state preservation, separate namespaces, dry-run/apply import rejection, byte-for-byte preservation of the source backup and refusal to overwrite a populated target. Actual Better Auth sessions are provisioned as fictional fixtures to test signed cookies, forged/device-cookie rejection, verified-email revocation and session deletion. These fixtures do not test Google's token exchange or prove a real person's identity.

Type checking, existing SQLite/unit tests and the production build passed during implementation. The production build reports the existing dynamic SQLite path tracing warning. Changed source files are formatted; unrelated pre-existing formatting was left untouched. Database integration checks are also wired into CI. This work does not provision a production database, deploy a migration, complete Google consent, verify physical devices or send a report to a municipality.

The repeatable `HTTP_TEST_DATABASE_URL=... pnpm test:http` test also passed on the branch including the current main's optional vision preview. It exercises both API record families through real server sessions and PostgreSQL: signed-out and forged requests return 401, a wrong Origin returns 403, other accounts cannot perform owner-only changes, repeated confirmations count once, CSV exports retain ownership boundaries, and data/references survive a full Next process restart. Optional Chromium checks passed at 390px and 1440px for the signed-out report gate and signed-in account/report screens. The configured canonical origin is used for mutation checks because Next can normalize loopback hosts or run behind a TLS proxy. No real Google request is made by this fixture-based test.
