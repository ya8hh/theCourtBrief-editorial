"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
type Credential = {
  id: string;
  provider: string;
  label: string;
  model: string;
  key_hint: string;
  enabled: boolean;
  priority: number;
  input_price: string | null;
  output_price: string | null;
  cooldown_until: string | null;
};
export function AiSettings({
  initial,
}: {
  initial: { managed: boolean; credentials: Credential[] };
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const [editing, setEditing] = useState<Credential | null>(null);
  const [provider, setProvider] = useState("groq");
  const providerNames: Record<string, string> = {
    groq: "Groq",
    gemini: "Google Gemini",
    openrouter: "OpenRouter",
  };
  const defaults: Record<string, string> = {
    groq: "openai/gpt-oss-120b",
    gemini: "gemini-3.8-flash",
    openrouter: "openrouter/free",
  };
  const act = async (path: string, data: unknown) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/editorial/ai/" + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await response.json();
      if (!response.ok)
        throw new Error(
          typeof body.error === "string"
            ? body.error
            : body.error?.message || "The settings could not be saved.",
        );
      router.refresh();
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The settings could not be saved.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  };
  return (
    <>
      <h1>AI providers</h1>
      <p>
        Save multiple keys for any provider—for example, Groq paid 1, Groq paid
        2 and Gemini backup. Each key has its own entry and priority. Keys in
        the same provider organization may share quota.
      </p>
      <p>
        Add provider keys here. Keys are encrypted in the CMS database and never
        returned to this page after saving. Smaller priority numbers run first.
      </p>
      {!initial.managed && (
        <p role="status">
          The worker currently uses its AWS environment keys. Adding your first
          key switches processing to this list only. Add each existing key you
          want to retain.
        </p>
      )}
      {initial.managed && (
        <p role="status">
          This list controls processing. Disabled or deleted keys are not
          replaced with old AWS environment keys. New keys also wake jobs
          waiting for quota.
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <h2>{editing ? "Edit credential" : "Add credential"}</h2>
      <form
        key={editing?.id || provider}
        className="editor-form"
        onSubmit={async (event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const fields = Object.fromEntries(new FormData(form));
          const saved = await act(
            "credentials" + (editing ? "/" + editing.id : ""),
            {
              ...fields,
              priority: Number(fields.priority),
              enabled: editing?.enabled ?? true,
            },
          );
          if (saved) {
            form.reset();
            setEditing(null);
            setNotice(
              "Saved. The worker will refresh its credentials automatically.",
            );
          }
        }}
      >
        <div className="editor-fields">
          <label>
            Provider
            <select
              name="provider"
              value={editing?.provider || provider}
              disabled={Boolean(editing)}
              onChange={(e) => setProvider(e.target.value)}
            >
              <option value="groq">Groq</option>
              <option value="gemini">Google Gemini</option>
              <option value="openrouter">OpenRouter</option>
            </select>
          </label>
          <label>
            Label
            <input
              name="label"
              maxLength={80}
              required
              defaultValue={editing?.label || ""}
              placeholder="Paid Groq account"
            />
          </label>
          <label>
            Model
            <input
              name="model"
              required
              defaultValue={editing?.model || defaults[provider]}
            />
          </label>
          <label>
            Priority
            <input
              name="priority"
              type="number"
              min={0}
              max={1000}
              required
              defaultValue={editing?.priority ?? 10}
            />
          </label>
          <label>
            API key
            <input
              name="apiKey"
              type="password"
              autoComplete="new-password"
              required={!editing}
              placeholder={
                editing
                  ? "Leave blank to keep the saved key"
                  : "Paste key privately"
              }
            />
          </label>
          <label>
            Input price per million tokens (USD)
            <input
              name="input_price"
              type="number"
              min={0}
              step="any"
              defaultValue={editing?.input_price ?? ""}
              placeholder="Optional; unknown if blank"
            />
          </label>
          <label>
            Output price per million tokens (USD)
            <input
              name="output_price"
              type="number"
              min={0}
              step="any"
              defaultValue={editing?.output_price ?? ""}
              placeholder="Optional; unknown if blank"
            />
          </label>
        </div>
        <p>
          Check your provider dashboard for the model identifier, quota, pricing
          and data-use rules. OpenRouter is restricted to free models. This form
          saves the key; the next processing request verifies it with the
          provider.
        </p>
        <button disabled={busy} type="submit">
          {busy ? "Saving…" : "Save credential"}
        </button>
        {editing && (
          <button
            type="button"
            disabled={busy}
            onClick={() => setEditing(null)}
          >
            Cancel editing
          </button>
        )}
      </form>
      <h2>Saved credentials</h2>
      {initial.credentials.length === 0 && (
        <p>
          No credentials saved.{" "}
          {initial.managed
            ? "Processing will wait until an enabled key is added."
            : "Add keys to manage them here."}
        </p>
      )}
      {initial.credentials.map((c) => (
        <section className="job-card" key={c.id}>
          <h3>{c.label}</h3>
          <p>
            <strong>Provider: {providerNames[c.provider] || c.provider}</strong>{" "}
            · {c.model} · {c.key_hint} · priority {c.priority} ·{" "}
            {c.enabled ? "Enabled" : "Disabled"}
          </p>
          {c.cooldown_until &&
            new Date(c.cooldown_until).getTime() > Date.now() && (
              <p>
                Waiting for provider quota until{" "}
                {new Date(c.cooldown_until).toLocaleString()}.
              </p>
            )}
          <div className="actions">
            <button
              disabled={busy}
              onClick={() => {
                setEditing(c);
                setProvider(c.provider);
              }}
            >
              Edit / replace key
            </button>
            <button
              disabled={busy}
              onClick={() =>
                act("credentials/" + c.id, { enabled: !c.enabled })
              }
            >
              {c.enabled ? "Disable" : "Enable"}
            </button>
            <button
              disabled={busy}
              onClick={() => {
                if (
                  window.confirm(
                    "Delete this saved credential? Its full key cannot be recovered here.",
                  )
                )
                  void act("credentials/" + c.id + "/delete", {});
              }}
            >
              Delete
            </button>
          </div>
        </section>
      ))}
    </>
  );
}
