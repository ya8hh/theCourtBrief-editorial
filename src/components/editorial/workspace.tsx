"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { categories, documentTypes } from "@court/shared-types";
async function api(path: string, body?: unknown, method = "POST") {
  const r = await fetch("/api/editorial/" + path, {
    method,
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const b = await r.json();
  if (r.status === 401) {
    throw new Error(
      "Your session has expired. Sign in again in another tab, then retry. Your unsaved work remains here.",
    );
  }
  if (!r.ok)
    throw new Error(
      typeof b.error === "string"
        ? b.error
        : b.error?.message || "The request failed.",
    );
  return b.data;
}
function message(e: unknown) {
  return e instanceof Error ? e.message : "The operation failed.";
}
export function Logout() {
  return (
    <button
      className="text-link"
      onClick={async () => {
        await api("logout", {}).catch(() => {});
        window.location.assign("/editorial/login");
      }}
    >
      Sign out
    </button>
  );
}
export function Upload({ maxBytes }: { maxBytes: number }) {
  const [mode, setMode] = useState<"link" | "file">("link");
  const [duplicate, setDuplicate] = useState("");
  const [progress, setProgress] = useState(0),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <form
      className="editor-form editor-narrow"
      onSubmit={async (e) => {
        e.preventDefault();
        const form = new FormData(e.currentTarget);
        setBusy(true);
        setError("");
        try {
          if (mode === "link") {
            const metadata = Object.fromEntries(form);
            const s = await api("documents", {
              ...metadata,
              officialSourceUrl: metadata.pdfUrl,
              judgmentDate: metadata.judgmentDate || null,
              generateArticle: true,
            });
            window.location.assign("/editorial/documents/" + s.documentId);
            return;
          }
          const file = form.get("files") as File;
          if (file.size > maxBytes)
            throw new Error(
              "Maximum file size is " +
                Math.round(maxBytes / 1024 / 1024) +
                " MiB.",
            );
          const files = new FormData();
          files.set("files", file);
          const uploaded: any = await new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/api/editorial/upload");
            xhr.upload.onprogress = (e) => {
              if (e.lengthComputable)
                setProgress(Math.round((e.loaded / e.total) * 100));
            };
            xhr.onerror = () => reject(new Error("Upload connection failed."));
            xhr.onload = () => {
              try {
                const b = JSON.parse(xhr.responseText);
                if (xhr.status === 401)
                  reject(
                    new Error(
                      "Your session has expired. Sign in again in another tab, then retry uploading this PDF.",
                    ),
                  );
                else if (xhr.status >= 400)
                  reject(
                    new Error(b.error?.message || b.error || "Upload failed."),
                  );
                else resolve(b);
              } catch {
                reject(new Error("Upload failed."));
              }
            };
            xhr.send(files);
          });
          const metadata = Object.fromEntries(form);
          delete metadata.files;
          const s = await api("documents", {
            ...metadata,
            judgmentDate: metadata.judgmentDate || null,
            fileId: uploaded[0].id,
            generateArticle: true,
          });
          window.location.assign("/editorial/documents/" + s.documentId);
        } catch (e) {
          setError(message(e));
          setDuplicate(
            message(e).match(/existing record ([a-z0-9]+)/)?.[1] || "",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="desk-actions">
        <button
          type="button"
          aria-pressed={mode === "link"}
          onClick={() => setMode("link")}
        >
          Paste PDF link
        </button>
        <button
          type="button"
          aria-pressed={mode === "file"}
          onClick={() => setMode("file")}
        >
          Upload PDF file
        </button>
      </div>
      {mode === "link" ? (
        <label>
          Direct official PDF download link
          <input
            name="pdfUrl"
            type="url"
            placeholder="https://api.sci.gov.in/…/order.pdf"
            required
          />
          <small>
            Paste the PDF URL from the official Supreme Court website. We read
            it automatically and keep the downloaded file only until
            publication.
          </small>
        </label>
      ) : (
        <>
          <label>
            Original PDF
            <input
              name="files"
              type="file"
              accept="application/pdf,.pdf"
              required
            />
          </label>
        </>
      )}
      <label>
        Document title
        <input name="title" required maxLength={250} />
      </label>
      {mode === "file" && (
        <label>
          Official Supreme Court source URL
          <input
            name="officialSourceUrl"
            type="url"
            required
            placeholder="https://www.sci.gov.in/…"
          />
        </label>
      )}
      <label>
        Document type
        <select name="documentType">
          {documentTypes.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label>
        Decision date (optional)
        <input name="judgmentDate" type="date" />
      </label>
      <label>
        Diary number (optional)
        <input name="diaryNumber" />
      </label>
      <label>
        Private editorial notes
        <textarea name="editorialNotes" rows={3} />
      </label>
      <div className="editor-fields">
        <label>
          Case title (optional)
          <input name="caseTitle" />
        </label>
        <label>
          Case number (optional)
          <input name="caseNumber" />
        </label>
      </div>
      <button className="button" disabled={busy}>
        {busy
          ? `Uploading / registering… ${progress}%`
          : mode === "link"
            ? "Read PDF link & generate article"
            : "Upload & generate article"}
      </button>
      {busy && (
        <progress value={progress} max={100} aria-label="Upload progress" />
      )}
      {duplicate && (
        <Link href={"/editorial/documents/" + duplicate}>
          Open existing source document
        </Link>
      )}
      {error && (
        <p className="error-note" role="alert">
          {error}
          {error.includes("session has expired") && (
            <>
              {" "}
              <a
                href="/editorial/login"
                target="_blank"
                rel="noopener noreferrer"
              >
                Sign in again
              </a>
            </>
          )}
        </p>
      )}
    </form>
  );
}
export function SourceWorkspace({ initial }: { initial: any }) {
  const [s, setSource] = useState(initial),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  async function refresh() {
    const row = await api("documents/" + s.documentId, undefined, "GET");
    if (row.originalPdf?.url?.startsWith("/"))
      row.originalPdf.url = new URL(
        row.originalPdf.url,
        s.originalPdf.url,
      ).toString();
    setSource(row);
  }
  useEffect(() => {
    if (!s.jobs.some((j: any) => ["queued", "running"].includes(j.state)))
      return;
    const timer = setInterval(() => {
      refresh().catch((e) => setError(message(e)));
    }, 4000);
    return () => clearInterval(timer);
  }, [s.documentId, s.jobs]);
  async function act(path: string, body: unknown) {
    setBusy(true);
    setError("");
    try {
      await api(path, body);
      await refresh();
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p className="kicker">SOURCE DOCUMENT</p>
      <h1>{s.title}</h1>
      <p>
        Uploaded by {s.uploadedBy || "CMS editor"} · {s.createdAt}
      </p>
      <p>
        {s.originalFilename} · {s.pageCount ?? "Unknown"} pages ·{" "}
        <strong>{s.processingStatus}</strong>
      </p>
      <p>
        <a href={s.officialSourceUrl} target="_blank" rel="noreferrer">
          Official source ↗
        </a>
        {s.originalPdf?.url && (
          <>
            {" "}
            ·{" "}
            <a
              href={
                (s.originalPdf.url.startsWith("/")
                  ? process.env.NEXT_PUBLIC_CMS_URL || "http://localhost:1337"
                  : "") + s.originalPdf.url
              }
              target="_blank"
              rel="noreferrer"
            >
              Original PDF ↗
            </a>
          </>
        )}
      </p>
      <details>
        <summary>Document integrity</summary>
        <code>{s.documentSha256}</code>
      </details>
      {s.processingError && (
        <p role="alert" className="error-note">
          {s.processingError}
        </p>
      )}
      {error && (
        <p role="alert" className="error-note">
          {error}
        </p>
      )}
      <p>
        We read your PDF and prepare a concise article automatically. Review the
        draft below before publishing.
      </p>
      <details>
        <summary>Processing options</summary>
        <div className="desk-actions">
          <button
            disabled={busy || !s.originalPdf}
            onClick={() =>
              act("documents/" + s.documentId + "/jobs", { kind: "extract" })
            }
          >
            Retry reading PDF
          </button>
          <button
            disabled={
              busy || s.ocrRequired || !s.extractedText || s.textReviewed
            }
            onClick={() => act("documents/" + s.documentId + "/review", {})}
          >
            {s.textReviewed
              ? "Text review confirmed"
              : "I have verified the extracted text"}
          </button>
          <button
            className="button"
            disabled={busy || !s.extractedText || s.ocrRequired}
            onClick={() =>
              act("documents/" + s.documentId + "/jobs", { kind: "generate" })
            }
          >
            Generate article
          </button>
          <button
            disabled={busy || !s.extractedText || s.ocrRequired}
            onClick={() => {
              if (
                window.confirm(
                  "Generate a fresh full proposal? This makes new provider calls; existing drafts remain unchanged.",
                )
              )
                act("documents/" + s.documentId + "/jobs", {
                  kind: "generate",
                  force: true,
                });
            }}
          >
            Regenerate full proposal
          </button>
          <Link href={"/editorial/new?source=" + s.documentId}>
            Write manually
          </Link>
        </div>
      </details>
      {s.ocrRequired && (
        <p className="error-note">
          Some pages could not be read. Upload a PDF with selectable text, or
          ask your administrator to enable scanned-document reading.
        </p>
      )}
      <details>
        <summary>View text read from the original PDF</summary>
        <p>
          Compare all pages with the PDF, especially case details, paragraph
          numbers and the operative order.
        </p>
        <pre className="source-text">
          {s.extractedText || "Extraction has not completed."}
        </pre>
      </details>
      <h2>Article drafts</h2>
      {s.jobs.map((j: any) => (
        <section className="job-card" key={j.id}>
          <h3>
            {j.kind} · {j.state}
          </h3>
          <p>
            Attempt {j.attempts} · {j.created_at}
          </p>
          {j.error && <p role="alert">{j.error}</p>}
          {j.state === "failed" && (
            <button
              disabled={busy}
              onClick={() => act("jobs/" + j.id + "/retry", {})}
            >
              Retry as a new job
            </button>
          )}
          {j.result?.draft && (
            <>
              <p>
                Model: {j.result.usage?.model} · prompt {j.result.promptVersion}
              </p>
              <ul>
                {[
                  ...(j.result.accuracyWarnings || []),
                  ...(j.result.draft.uncertainties || []),
                  ...(j.result.draft.verificationChecklist || []),
                ].map((w: string, i: number) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
              <h2>{j.result.draft.headline}</h2>
              <p className="standfirst">{j.result.draft.summary}</p>
              <div className="article-prose">
                <ReactMarkdown skipHtml>
                  {j.result.draft.articleBody}
                </ReactMarkdown>
              </div>
              <details>
                <summary>Case details and generation metadata</summary>
                <pre className="source-text">
                  {JSON.stringify(j.result.draft, null, 2)}
                </pre>
              </details>
              {j.article_id ? (
                <Link href={"/editorial/articles/" + j.article_id}>
                  Open applied draft
                </Link>
              ) : (
                <button
                  className="button"
                  disabled={busy}
                  onClick={async () => {
                    if (
                      !window.confirm(
                        "Apply this proposal to an unpublished draft? Review every claim against the source before approval.",
                      )
                    )
                      return;
                    setBusy(true);
                    try {
                      const a = await api("jobs/" + j.id + "/apply", {
                        confirm: true,
                      });
                      window.location.assign(
                        "/editorial/articles/" + a.documentId,
                      );
                    } catch (e) {
                      setError(message(e));
                      setBusy(false);
                    }
                  }}
                >
                  Review and edit article
                </button>
              )}
            </>
          )}
        </section>
      ))}
    </>
  );
}
const arrays = [
  "judges",
  "legalIssues",
  "legalTopics",
  "statutoryProvisions",
  "keyHoldings",
  "importantParagraphReferences",
];
const texts = [
  "headline",
  "slug",
  "subtitle",
  "summary",
  "articleBody",
  "author",
  "caseTitle",
  "caseNumber",
  "diaryNumber",
  "judgmentDate",
  "bench",
  "finalOutcome",
  "officialSourceUrl",
  "pdfUnavailableReason",
  "seoTitle",
  "seoDescription",
  "editorialNotes",
];
const labels: Record<string, string> = {
  articleBody: "Article body (Markdown)",
  officialSourceUrl: "Official court source URL",
  pdfUnavailableReason: "Reason original PDF is unavailable",
  originalPdf: "Original PDF media ID",
  sourceDocument: "Source document ID",
  seoTitle: "SEO title",
  seoDescription: "SEO description",
};
function label(k: string) {
  return (
    labels[k] ||
    k.replace(/([A-Z])/g, " $1").replace(/^./, (v) => v.toUpperCase())
  );
}
export function ArticleEditor({ initial }: { initial: any }) {
  const [a, setArticle] = useState<any>(initial),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [busy, setBusy] = useState(false),
    [instruction, setInstruction] = useState(""),
    [mode, setMode] = useState("full"),
    [selectedText, setSelectedText] = useState("");
  async function refresh() {
    const row = await api("articles/" + a.documentId, undefined, "GET");
    setArticle(row);
    return row;
  }
  async function action(action: string, versionId?: number) {
    if (
      ["publish", "unpublish", "restore"].includes(action) &&
      !window.confirm(`Confirm ${action}? Unsaved edits are not included.`)
    )
      return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await api("articles/" + a.documentId + "/action", {
        action,
        expectedUpdatedAt: a.updatedAt,
        versionId,
      });
      await refresh();
      setNotice("Action completed: " + action);
    } catch (e) {
      setError(message(e));
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <p className="kicker">ARTICLE WORKSPACE</p>
      <h1>{a.documentId ? "Edit the report" : "Write a new report"}</h1>
      {a.documentId && (
        <>
          <p>Publication date: {a.publicationDate || "Not yet published"}</p>
          <p>
            Review: <strong>{a.reviewStatus}</strong> · {a.workflowState} · Last
            saved {a.updatedAt}
          </p>
        </>
      )}
      {error && (
        <p className="error-note" role="alert">
          {error}
        </p>
      )}
      {notice && <p role="status">{notice}</p>}
      <form
        className="editor-form"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          setNotice("");
          try {
            const f = new FormData(e.currentTarget),
              data: any = Object.fromEntries(f);
            for (const k of arrays) {
              data[k] = JSON.parse(String(f.get(k) || "[]"));
              if (
                !Array.isArray(data[k]) ||
                data[k].some((x: any) => typeof x !== "string")
              )
                throw new Error(label(k) + " must be a JSON array of strings.");
            }
            data.originalPdf = data.originalPdf
              ? Number(data.originalPdf)
              : null;
            data.sourceDocument = data.sourceDocument || null;
            data.judgmentDate = data.judgmentDate || null;
            const result = await api(
              a.documentId ? "articles/" + a.documentId : "articles",
              a.documentId ? { expectedUpdatedAt: a.updatedAt, data } : data,
              a.documentId ? "PUT" : "POST",
            );
            if (!a.documentId) {
              window.location.assign(
                "/editorial/articles/" + result.documentId,
              );
              return;
            }
            await refresh();
            setNotice("Saved. Material changes require fresh approval.");
          } catch (e) {
            setError(message(e));
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="editor-fields">
          {texts.map((k) => (
            <label key={k}>
              {label(k)}
              {k === "articleBody" ? (
                <MarkdownField key={a.updatedAt + k} initial={a[k] || ""} />
              ) : ["summary", "finalOutcome", "editorialNotes"].includes(k) ? (
                <textarea
                  name={k}
                  key={a.updatedAt + k}
                  defaultValue={a[k] || ""}
                  rows={k === "articleBody" ? 22 : 4}
                  required={["articleBody", "summary"].includes(k)}
                />
              ) : (
                <input
                  name={k}
                  key={a.updatedAt + k}
                  defaultValue={a[k] || ""}
                  type={
                    k === "judgmentDate"
                      ? "date"
                      : k === "officialSourceUrl"
                        ? "url"
                        : "text"
                  }
                  required={[
                    "headline",
                    "slug",
                    "author",
                    "officialSourceUrl",
                  ].includes(k)}
                />
              )}
            </label>
          ))}
          <label>
            Category
            <select name="category" defaultValue={a.category}>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Document type
            <select name="documentType" defaultValue={a.documentType}>
              {documentTypes.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </label>
          <label>
            Original PDF media ID
            <input
              name="originalPdf"
              type="number"
              key={a.updatedAt + "pdf"}
              defaultValue={a.originalPdf?.id || ""}
            />
          </label>
          <label>
            Source document ID
            <input
              name="sourceDocument"
              key={a.updatedAt + "source"}
              defaultValue={a.sourceDocument?.documentId || ""}
            />
          </label>
        </div>
        <details>
          <summary>Structured case details (JSON arrays)</summary>
          <div className="editor-fields">
            {arrays.map((k) => (
              <label key={k}>
                {label(k)}
                <textarea
                  name={k}
                  key={a.updatedAt + k}
                  defaultValue={JSON.stringify(a[k] || [], null, 2)}
                  rows={5}
                />
              </label>
            ))}
          </div>
        </details>
        <button className="button" disabled={busy}>
          {busy ? "Working…" : "Save draft"}
        </button>
      </form>
      {a.documentId && (
        <>
          <div className="desk-actions">
            <Link
              className="button secondary"
              href={"/editorial/articles/" + a.documentId + "/preview"}
              target="_blank"
            >
              Preview saved draft
            </Link>
            <button disabled={busy} onClick={() => action("submit")}>
              Submit for review
            </button>
            {a.canPublish && (
              <>
                <button
                  disabled={busy || a.reviewStatus !== "review"}
                  onClick={() => action("approve")}
                >
                  Approve saved draft
                </button>
                <button
                  className="button"
                  disabled={busy || a.reviewStatus !== "approved"}
                  onClick={() => action("publish")}
                >
                  Publish approved draft
                </button>
                <button disabled={busy} onClick={() => action("unpublish")}>
                  Unpublish
                </button>
              </>
            )}
          </div>
          {!!(
            a.accuracyWarnings?.length ||
            a.uncertainties?.length ||
            a.verificationChecklist?.length
          ) && (
            <section className="job-card">
              <h2>Required editorial verification</h2>
              <ul>
                {[
                  ...(a.accuracyWarnings || []),
                  ...(a.uncertainties || []),
                  ...(a.verificationChecklist || []),
                ].map((s: string, i: number) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
              <p>
                Warnings remain visible for review. Approval records the
                publisher’s decision.
              </p>
            </section>
          )}
          {a.sourceDocument && (
            <section className="job-card">
              <h2>Propose an AI revision</h2>
              <p>
                The saved draft stays intact. Review and apply the proposal from
                the source workspace.
              </p>
              <label>
                Revision action
                <select
                  value={mode}
                  onChange={(e) => {
                    setMode(e.target.value);
                    setInstruction(
                      (
                        {
                          headline: "Regenerate the headline.",
                          summary: "Regenerate the summary.",
                          section: "Rewrite the selected section clearly.",
                          simpler:
                            "Make language simpler while retaining legal qualifications.",
                          shorter:
                            "Make the body shorter while preserving material findings.",
                          grammar: "Improve grammar without changing meaning.",
                          full: "Regenerate the full draft grounded in the source.",
                        } as Record<string, string>
                      )[e.target.value],
                    );
                  }}
                >
                  <option value="full">Full draft / custom instruction</option>
                  <option value="headline">Regenerate headline</option>
                  <option value="summary">Regenerate summary</option>
                  <option value="section">Rewrite selected section</option>
                  <option value="simpler">Simplify language</option>
                  <option value="shorter">Make shorter</option>
                  <option value="grammar">Improve grammar</option>
                </select>
              </label>
              {mode === "section" && (
                <label>
                  Exact passage from saved article body
                  <textarea
                    value={selectedText}
                    onChange={(e) => setSelectedText(e.target.value)}
                    rows={4}
                    maxLength={5000}
                  />
                </label>
              )}
              <label>
                Revision instruction / selected section
                <textarea
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  rows={3}
                  maxLength={2000}
                />
              </label>
              <button
                disabled={busy || !instruction.trim()}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await api(
                      "documents/" + a.sourceDocument.documentId + "/jobs",
                      {
                        kind: "revise",
                        articleId: a.documentId,
                        expectedUpdatedAt: a.updatedAt,
                        instruction,
                        mode,
                        selectedText,
                      },
                    );
                    window.location.assign(
                      "/editorial/documents/" + a.sourceDocument.documentId,
                    );
                  } catch (e) {
                    setError(message(e));
                    setBusy(false);
                  }
                }}
              >
                Request revision proposal
              </button>
              <p>
                <Link
                  href={"/editorial/documents/" + a.sourceDocument.documentId}
                >
                  Open source & extracted text
                </Link>
              </p>
            </section>
          )}
          <section className="job-card">
            <h2>Replace the source PDF</h2>
            <p>
              Upload a new source document, verify extraction, then select its
              media and source IDs above. Saving clears approval.
            </p>
            <Link href="/editorial/upload">Upload replacement PDF</Link>
          </section>
          <h2>Saved versions</h2>
          <p>
            Restore creates a new draft version and clears approval. Publication
            is a separate action.
          </p>
          {a.versions?.map((v: any) => (
            <div className="version" key={v.id}>
              <span>
                {v.created_at} · actor {v.actor_id} · {v.snapshot.headline}
              </span>
              {a.canPublish && (
                <button disabled={busy} onClick={() => action("restore", v.id)}>
                  Restore
                </button>
              )}
            </div>
          ))}
        </>
      )}
    </>
  );
}

function MarkdownField({ initial }: { initial: string }) {
  const field = useRef<HTMLTextAreaElement>(null),
    [value, setValue] = useState(initial),
    [preview, setPreview] = useState(false);
  function insert(before: string, after = "") {
    const el = field.current;
    if (!el) return;
    const start = el.selectionStart,
      end = el.selectionEnd;
    el.setRangeText(
      before + el.value.slice(start, end) + after,
      start,
      end,
      "select",
    );
    setValue(el.value);
    el.focus();
  }
  return (
    <div className="markdown-editor">
      <div
        className="desk-actions"
        role="toolbar"
        aria-label="Article formatting"
      >
        <button type="button" onClick={() => insert("**", "**")}>
          Bold
        </button>
        <button type="button" onClick={() => insert("*", "*")}>
          Italic
        </button>
        <button type="button" onClick={() => insert("\n## ")}>
          Heading
        </button>
        <button type="button" onClick={() => insert("\n- ")}>
          List
        </button>
        <button type="button" onClick={() => insert("\n> ")}>
          Quote
        </button>
        <button type="button" onClick={() => setPreview(!preview)}>
          {preview ? "Hide reading preview" : "Show reading preview"}
        </button>
      </div>
      <textarea
        ref={field}
        name="articleBody"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={22}
        required
      />
      {preview && (
        <div className="article-prose job-card">
          <ReactMarkdown skipHtml components={{ img: () => null }}>
            {value}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
