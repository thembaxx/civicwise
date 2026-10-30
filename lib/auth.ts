import "server-only";
import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import { accountIdentity, getAuthConfiguration } from "./account-identity.ts";
import { getPostgresPool } from "./postgres.ts";

function createAuth(configuration: NonNullable<ReturnType<typeof getAuthConfiguration>>) {
  return betterAuth({
    appName: "CivicWise",
    database: getPostgresPool(),
    secret: configuration.secret,
    baseURL: configuration.baseURL,
    emailAndPassword: { enabled: false },
    socialProviders: {
      google: {
        clientId: configuration.clientId,
        clientSecret: configuration.clientSecret,
      },
    },
    account: { accountLinking: { enabled: false } },
    // Read authoritative sessions on each protected request, including revocations.
    session: { cookieCache: { enabled: false } },
    rateLimit: { enabled: true, storage: "database" },
    plugins: [nextCookies()],
  });
}

const shared = globalThis as typeof globalThis & {
  civicwiseAuth?: ReturnType<typeof createAuth>;
};

export function getAuth() {
  const configuration = getAuthConfiguration();
  if (!configuration) return null;
  return (shared.civicwiseAuth ??= createAuth(configuration));
}

/** Device cookies and request bodies are never accepted as an account session. */
export async function getVerifiedAccount(headers: Headers) {
  const auth = getAuth();
  if (!auth) return null;
  const session = await auth.api.getSession({
    headers,
    query: { disableCookieCache: true, disableRefresh: true },
  });
  return accountIdentity(session);
}
