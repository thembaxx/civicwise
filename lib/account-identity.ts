export interface VerifiedAccount {
  id: string;
  email: string;
}

/** Only pass the result of a server-side session lookup, never client-supplied claims. */
export function accountIdentity(value: unknown, now = Date.now()): VerifiedAccount | null {
  if (!value || typeof value !== "object" || !("user" in value) || !("session" in value))
    return null;
  const { user, session } = value;
  if (!user || typeof user !== "object" || !session || typeof session !== "object") return null;
  if (
    !("id" in user) ||
    typeof user.id !== "string" ||
    !/^[A-Za-z0-9_-]{1,128}$/.test(user.id) ||
    !("emailVerified" in user) ||
    user.emailVerified !== true ||
    !("email" in user) ||
    typeof user.email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email) ||
    !("userId" in session) ||
    session.userId !== user.id ||
    !("expiresAt" in session)
  )
    return null;
  const expiresAt = session.expiresAt;
  const expiration =
    expiresAt instanceof Date
      ? expiresAt.getTime()
      : typeof expiresAt === "string"
        ? Date.parse(expiresAt)
        : NaN;
  if (!Number.isFinite(expiration) || expiration <= now) return null;
  // Accounts and legacy device bearers must never share an ownership namespace.
  return { id: `account:${user.id}`, email: user.email };
}

export function getAuthConfiguration(environment: NodeJS.ProcessEnv = process.env) {
  const databaseUrl = environment.DATABASE_URL;
  const secret = environment.BETTER_AUTH_SECRET;
  const baseURL = environment.BETTER_AUTH_URL;
  const clientId = environment.GOOGLE_CLIENT_ID;
  const clientSecret = environment.GOOGLE_CLIENT_SECRET;
  if (!databaseUrl || !secret || secret.length < 32 || !baseURL || !clientId || !clientSecret)
    return null;
  try {
    const origin = new URL(baseURL);
    const database = new URL(databaseUrl);
    if (!["postgres:", "postgresql:"].includes(database.protocol)) return null;
    if (
      origin.username ||
      origin.password ||
      origin.search ||
      origin.hash ||
      origin.pathname !== "/" ||
      (origin.protocol !== "https:" &&
        !(
          environment.NODE_ENV !== "production" &&
          origin.protocol === "http:" &&
          ["localhost", "127.0.0.1", "[::1]"].includes(origin.hostname)
        ))
    )
      return null;
    return { secret, baseURL: origin.origin, clientId, clientSecret };
  } catch {
    return null;
  }
}
