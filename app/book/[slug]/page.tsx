import { notFound } from "next/navigation";
import { resolveSlug } from "@/lib/pdf-library";
import { getPdfMeta } from "@/lib/pdf-meta";
import { FlipbookViewer } from "@/components/flipbook/FlipbookViewer";

export default async function BookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const entry = await resolveSlug(slug);
  if (!entry) notFound();

  const meta = await getPdfMeta(entry);
  const downloadHref =
    entry.source.kind === "remote" ? entry.source.url : `/${encodeURIComponent(entry.filename)}`;

  return (
    <FlipbookViewer
      slug={entry.slug}
      downloadHref={downloadHref}
      title={entry.title}
      fileSize={entry.size}
      pageCount={meta.numPages}
      pageWidth={meta.pageWidth}
      pageHeight={meta.pageHeight}
    />
  );
}
