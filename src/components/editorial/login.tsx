"use client";
import { useState } from "react";
export function Login() {
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [retryAt, setRetryAt] = useState(0);
  return (
    <form
      className="editor-form"
      onSubmit={async (e) => {
        e.preventDefault();
        if (Date.now() < retryAt) {
          setError(
            "Too many sign-in attempts. Wait 5 minutes after the last attempt before trying again.",
          );
          return;
        }
        setBusy(true);
        setError("");
        const data = new FormData(e.currentTarget);
        try {
          const r = await fetch("/api/editorial/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(Object.fromEntries(data)),
          });
          const b = await r.json();
          if (r.status === 429)
            setRetryAt(Date.now() + (b.retryAfter || 300) * 1000);
          if (!r.ok) throw new Error(b.error);
          window.location.assign("/editorial");
        } catch (e) {
          setError(e instanceof Error ? e.message : "Sign-in failed.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <label>
        Email
        <input name="email" type="email" autoComplete="username" required />
      </label>
      <label>
        Password
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </label>
      <button className="button" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </button>
      {error && <p role="alert">{error}</p>}
    </form>
  );
}
