import { ArticleEditor } from "@/components/editorial/workspace";
import { editorialRequest } from "@/lib/editorial";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ source?: string }>;
}) {
  const { source } = await searchParams;
  const s = source
    ? await editorialRequest(
        "/editorial/documents/" + encodeURIComponent(source),
      )
    : null;
  return (
    <ArticleEditor
      initial={{
        headline: "",
        slug: "",
        summary: "",
        articleBody: "",
        author: "",
        category: "Other",
        documentType: s?.documentType || "Judgment",
        officialSourceUrl: s?.officialSourceUrl || "",
        sourceDocument: s ? { documentId: s.documentId } : null,
        originalPdf: s?.originalPdf,
        caseTitle: s?.caseTitle,
        caseNumber: s?.caseNumber,
        diaryNumber: s?.diaryNumber,
        judgmentDate: s?.judgmentDate,
        reviewStatus: "draft",
      }}
    />
  );
}
