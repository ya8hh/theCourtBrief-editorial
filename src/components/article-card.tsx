import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import type { Article } from "@court/shared-types";
import { formatDate } from "@/lib/format";
export function ArticleCard({
  article,
  featured = false,
}: {
  article: Article;
  featured?: boolean;
}) {
  return (
    <article className={featured ? "feature" : "article-card"}>
      <div className="eyebrow">
        <span>{article.category}</span>
        <span className="dot">·</span>
        {article.documentType}
      </div>
      <h2>
        <Link href={`/judgments/${article.slug}`}>{article.headline}</Link>
      </h2>
      <p className="excerpt">{article.summary}</p>
      {article.caseTitle && <p className="case-line">{article.caseTitle}</p>}
      <div className="article-bottom">
        <time dateTime={article.publishedAt}>
          {formatDate(article.publishedAt, true)} IST
        </time>
        <Link
          href={`/judgments/${article.slug}`}
          aria-label={`Read: ${article.headline}`}
        >
          <ArrowUpRight size={19} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
