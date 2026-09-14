import Link from "next/link";
import type { PdfFileEntry } from "@/lib/pdf-library";
import { getPdfMeta } from "@/lib/pdf-meta";

export async function BookCard({ file }: { file: PdfFileEntry }) {
  const meta = await getPdfMeta(file);

  return (
    <Link href={`/book/${file.slug}`} className="group flex flex-col gap-3">
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-sm bg-neutral-100 shadow-[0_10px_25px_-10px_rgba(0,0,0,0.4)] ring-1 ring-black/5 transition-transform duration-300 ease-out group-hover:-translate-y-1 group-hover:shadow-[0_18px_35px_-12px_rgba(0,0,0,0.5)] dark:bg-neutral-900 dark:ring-white/10">
        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-2 bg-gradient-to-r from-black/25 to-transparent" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/pdf/${file.slug}/page/1?w=600`}
          alt={file.title}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="line-clamp-2 text-sm font-medium text-neutral-900 dark:text-neutral-100">
          {file.title}
        </span>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {meta.numPages} pages
        </span>
      </div>
    </Link>
  );
}
