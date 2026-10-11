import Link from "next/link";
import { editorialRequest } from "@/lib/editorial";
export default async function Page() {
  const data = await editorialRequest("/editorial/overview");
  return (
    <>
      <p className="kicker">EDITORIAL OPERATIONS</p>
      <h1>The newsroom</h1>
      <p>
        Upload an official document, verify its extracted text, then write or
        generate a draft. A publisher approves and publishes separately.
      </p>
      <div className="desk-stats">
        <div>
          <strong>{data.counts.published}</strong> published articles
        </div>
        <div>
          <strong>{data.counts.draft}</strong> drafts · {data.counts.review}{" "}
          awaiting review
        </div>
        <div>
          <strong>{data.counts.failed}</strong> failed processing jobs
        </div>
      </div>
      <h2>Articles</h2>
      <div className="desk-list">
        {data.articles.map((a: any) => (
          <Link key={a.documentId} href={"/editorial/articles/" + a.documentId}>
            <strong>{a.headline}</strong>
            <span>
              {a.workflowState} · {a.reviewStatus} · {a.updatedAt}
            </span>
          </Link>
        ))}
        {!data.articles.length && (
          <p>
            No drafts yet.{" "}
            <Link href="/editorial/new">Write the first article</Link>.
          </p>
        )}
      </div>
      <h2>Source documents</h2>
      <div className="desk-list">
        {data.sources.map((s: any) => (
          <Link
            key={s.documentId}
            href={"/editorial/documents/" + s.documentId}
          >
            <strong>{s.title}</strong>
            <span>
              {s.processingStatus} · {s.originalFilename}
            </span>
          </Link>
        ))}
        {!data.sources.length && <p>No source documents uploaded.</p>}
      </div>
      <h2>Processing & usage</h2>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>Job</th>
              <th>Status</th>
              <th>Attempts</th>
              <th>Model / tokens / estimated cost</th>
            </tr>
          </thead>
          <tbody>
            {data.jobs.map((j: any) => (
              <tr key={j.id}>
                <td>
                  <Link href={"/editorial/documents/" + j.source_id}>
                    {j.kind}
                  </Link>
                </td>
                <td>
                  {j.state}
                  {j.error && <p role="alert">{j.error}</p>}
                </td>
                <td>{j.attempts}</td>
                <td>
                  {j.result?.usage ? (
                    <>
                      {j.result.usage.model} ·{" "}
                      {j.result.usage.inputTokens ?? "unknown"} in /{" "}
                      {j.result.usage.outputTokens ?? "unknown"} out ·{" "}
                      {j.result.usage.estimatedCost ?? "unpriced"}{" "}
                      {j.result.usage.currency}
                    </>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2>Recent audit events</h2>
      <div className="desk-list">
        {data.events.slice(0, 30).map((e: any) => (
          <p key={e.id}>
            {e.action} · actor {e.actor_id} · {e.occurred_at}
          </p>
        ))}
      </div>
    </>
  );
}
