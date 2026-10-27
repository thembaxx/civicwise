# CivicWise

A municipal-information interface combining resident issue records with public-finance context.

[Browse the source](https://github.com/thembaxx/civicwise)

## Engineering highlights

The home route composes municipal profiles, personal report history, community issue lists and a finance snapshot. Submission delivery to municipalities is not verified.

## Technology

Declared in [package.json](package.json): Next.js `16.4.2` · React `^19` · TypeScript `7.0.2` · Tailwind CSS `^4.3.3`.


## Durable issue and report storage

Both record families use transactional SQLite with per-namespace stable references and owner-scoped changes. Set `CIVICWISE_DATABASE_PATH` to a persistent shared-on-disk SQLite file when running multiple processes. The default development path is `.data/civicwise.sqlite`. A Vercel deployment requires an explicit persistent path and is not a durable storage solution by itself; use a host with a persistent volume or a shared database adapter. `CIVICWISE_DEMO_DATA=true` explicitly seeds fictional records in new namespaces; it is off by default.

Existing per-device issue and report cookies retain their independent ownership values. These are device bearer identities, not verified resident accounts. A resident's entered municipal reference is self-reported and does not prove delivery or municipal acknowledgement. Back up the SQLite database with an SQLite-aware backup while respecting its WAL.
