import { z } from "zod";
export const categories = [
  "Constitutional Law",
  "Civil Law",
  "Criminal Law",
  "Commercial Law",
  "Public Interest",
  "Other",
] as const;
export const documentTypes = [
  "Judgment",
  "Daily Order",
  "Interim Order",
  "Notice",
  "Other",
] as const;
const optionalText = z.string().nullable();
export const articleSchema = z.object({
  documentId: z.string(),
  headline: z.string(),
  slug: z.string(),
  subtitle: optionalText,
  summary: z.string(),
  articleBody: z.string(),
  documentType: z.enum(documentTypes),
  category: z.enum(categories),
  caseTitle: optionalText,
  caseNumber: optionalText,
  diaryNumber: optionalText,
  judgmentDate: optionalText,
  bench: optionalText,
  judges: z.array(z.string()).nullable(),
  legalIssues: z.array(z.string()).nullable(),
  legalTopics: z.array(z.string()).nullable(),
  statutoryProvisions: z.array(z.string()).nullable(),
  keyHoldings: z.array(z.string()).nullable(),
  finalOutcome: optionalText,
  importantParagraphReferences: z.array(z.string()).nullable(),
  officialSourceUrl: z.string().url(),
  pdfUnavailableReason: optionalText,
  author: z.string(),
  seoTitle: optionalText,
  seoDescription: optionalText,
  publishedAt: z.string(),
  updatedAt: z.string(),
  pdfUrl: optionalText,
});
export type Article = z.infer<typeof articleSchema>;
export const listSchema = z.object({
  data: z.array(articleSchema),
  meta: z.object({
    pagination: z.object({
      page: z.number(),
      pageSize: z.number(),
      total: z.number(),
      pageCount: z.number(),
    }),
  }),
});
export type ArticleList = z.infer<typeof listSchema>;
