import { Suspense } from "react";
import type { PdfFileEntry } from "@/lib/pdf-library";
import { BookCard } from "./BookCard";
import { BookCardSkeleton } from "./BookCardSkeleton";

export function Bookshelf({ files }: { files: PdfFileEntry[] }) {
  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-24 text-center text-neutral-500 dark:text-neutral-400">
        <p className="text-lg font-medium">No books yet</p>
        <p className="text-sm">Drop a PDF into the public folder to see it here.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {files.map((file) => (
        <Suspense key={file.slug} fallback={<BookCardSkeleton />}>
          <BookCard file={file} />
        </Suspense>
      ))}
    </div>
  );
}
