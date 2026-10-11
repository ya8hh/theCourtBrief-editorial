import { Upload } from "@/components/editorial/workspace";
import { editorialRequest } from "@/lib/editorial";
export default async function Page() {
  const config = await editorialRequest("/editorial/config");
  return (
    <>
      <h1>Add a court document</h1>
      <p>
        Paste a direct official PDF link or upload a file, up to{" "}
        {Math.round(config.maxUploadBytes / 1024 / 1024)} MiB. Your document is
        private during review and deleted after publication; readers use the
        official court link.
      </p>
      <Upload maxBytes={config.maxUploadBytes} />
    </>
  );
}
