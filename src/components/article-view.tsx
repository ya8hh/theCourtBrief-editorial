import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { ArrowLeft, ArrowUpRight, FileText } from "lucide-react";
import { siteUrl } from "@/lib/cms";
import { formatDate, jsonLd } from "@/lib/format";
import { ArticleCard } from "@/components/article-card";
import type { Article } from "@court/shared-types";
export function ArticleView({
  a,
  related = [],
  preview = false,
}: {
  a: Article;
  related?: Article[];
  preview?: boolean;
}) {
  return (
    <div className="wrap article-page">
      <Link className="back-link" href={siteUrl("/")}>
        <ArrowLeft size={15} /> All coverage
      </Link>
      <header className="article-header">
        <div className="eyebrow">
          {a.category}
          <span className="dot">·</span>
          {a.documentType}
        </div>
        <h1>{a.headline}</h1>
        {a.subtitle && <p className="dek">{a.subtitle}</p>}
        <div className="byline">
          <span>By {a.author}</span>
          <time dateTime={a.publishedAt}>
            {formatDate(a.publishedAt, true)} IST
          </time>
          {new Date(a.updatedAt).getTime() >
            new Date(a.publishedAt).getTime() + 60000 && (
            <span>Updated {formatDate(a.updatedAt, true)} IST</span>
          )}
        </div>
      </header>
      <div className="reading-grid">
        <article className="article-prose">
          <p className="standfirst">{a.summary}</p>
          <ReactMarkdown
            skipHtml
            components={{
              a: ({ href, children }) => (
                <a href={href} rel="noopener noreferrer">
                  {children}
                </a>
              ),
              img: () => null,
            }}
          >
            {a.articleBody}
          </ReactMarkdown>
          {!!a.keyHoldings?.length && (
            <section className="holdings">
              <h2>Key findings</h2>
              <ul>
                {a.keyHoldings.map((h, i) => (
                  <li key={i}>{h}</li>
                ))}
              </ul>
            </section>
          )}
          {a.finalOutcome && (
            <section>
              <h2>The outcome</h2>
              <p>{a.finalOutcome}</p>
            </section>
          )}
          {!!a.statutoryProvisions?.length && (
            <section>
              <h2>Statutory references</h2>
              <ul>
                {a.statutoryProvisions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}
          {!!a.importantParagraphReferences?.length && (
            <section>
              <h2>Paragraph references</h2>
              <p>{a.importantParagraphReferences.join(" · ")}</p>
            </section>
          )}
        </article>
        <aside className="case-panel">
          <p className="kicker">THE CASE AT A GLANCE</p>
          <dl>
            {[
              ["Case", a.caseTitle],
              ["Case number", a.caseNumber],
              ["Diary number", a.diaryNumber],
              [
                "Date of decision",
                a.judgmentDate ? formatDate(a.judgmentDate) : null,
              ],
              ["Bench", a.bench],
              ["Judges", a.judges?.join(", ")],
            ]
              .filter(([, value]) => value)
              .map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
          </dl>
          <div className="source-links">
            <h2>Go to the source</h2>
            <a
              href={a.officialSourceUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              Official court source <ArrowUpRight size={16} />
            </a>
            {a.pdfUrl ? (
              <a
                className="button"
                href={preview ? a.pdfUrl : a.officialSourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <FileText size={17} />{" "}
                {preview && a.pdfUrl !== a.officialSourceUrl
                  ? "Open original PDF"
                  : new URL(a.officialSourceUrl).pathname
                        .toLowerCase()
                        .endsWith(".pdf")
                    ? "Open official PDF"
                    : "View court source"}
              </a>
            ) : (
              <p className="unavailable">
                Original PDF unavailable.
                {a.pdfUnavailableReason && ` ${a.pdfUnavailableReason}`}
              </p>
            )}
          </div>
          {!!a.legalTopics?.length && (
            <div className="topics">
              <h2>Legal topics</h2>
              {a.legalTopics.map((topic, i) => (
                <Link
                  key={i}
                  href={`${siteUrl()}/topics/${encodeURIComponent(
                    topic
                      .toLowerCase()
                      .replace(/[^a-z0-9]+/g, "-")
                      .replace(/^-|-$/g, ""),
                  )}`}
                >
                  {topic}
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
      {related.length > 0 && (
        <section className="related">
          <div className="list-heading">
            <h2>Related coverage</h2>
          </div>
          <div className="article-grid">
            {related.map((article) => (
              <ArticleCard key={article.documentId} article={article} />
            ))}
          </div>
        </section>
      )}
      {!preview && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: jsonLd({
              "@context": "https://schema.org",
              "@type": "NewsArticle",
              headline: a.headline,
              description: a.summary,
              datePublished: a.publishedAt,
              dateModified: a.updatedAt,
              author: { "@type": "Person", name: a.author },
              publisher: { "@type": "Organization", name: "The Court Brief" },
              mainEntityOfPage: siteUrl(`/judgments/${a.slug}`),
              isAccessibleForFree: true,
            }),
          }}
        />
      )}
    </div>
  );
}
