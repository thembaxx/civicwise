"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import type { VerifiedAccount } from "@/lib/account-identity";

export function AccountSignIn({
  configured,
  account,
}: {
  configured: boolean;
  account: VerifiedAccount | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function signIn() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signIn.social({
        provider: "google",
        callbackURL: "/account",
      });
      if (result.error) throw new Error("Sign-in failed");
    } catch {
      setError("Sign-in could not start. Please try again when you are online.");
    } finally {
      setPending(false);
    }
  }

  async function signOut() {
    setPending(true);
    setError("");
    try {
      const result = await authClient.signOut();
      if (result.error) throw new Error("Sign-out failed");
      router.refresh();
    } catch {
      setError("Sign-out failed. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section
      aria-labelledby="identity-heading"
      className="panel flex flex-col gap-3 border border-border bg-card p-6"
    >
      <h2 id="identity-heading" className="text-base font-bold">
        Your account
      </h2>
      {account ? (
        <>
          <p className="text-sm">Signed in as {account.email}.</p>
          <button className="button-outline self-start" disabled={pending} onClick={signOut}>
            {pending ? "Signing out…" : "Sign out"}
          </button>
        </>
      ) : configured ? (
        <>
          <p className="text-sm text-muted-foreground">
            Sign in to keep new reports attached to your account across devices.
          </p>
          <button className="button-primary self-start" disabled={pending} onClick={signIn}>
            {pending ? "Opening sign-in…" : "Continue with Google"}
          </button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          Account sign-in is not available yet. Live report changes are unavailable until secure
          accounts and shared storage are configured.
        </p>
      )}
      <p className="text-sm text-muted-foreground">
        Sign-in verifies your account email, not your address or residency. Earlier device records
        remain separate; signing in does not transfer their ownership. CivicWise does not send
        reports to a municipality.
      </p>
      {error && (
        <p role="alert" className="text-sm">
          {error}
        </p>
      )}
    </section>
  );
}
