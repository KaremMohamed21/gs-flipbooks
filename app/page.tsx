import { listPdfFiles } from "@/lib/pdf-library";
import { Bookshelf } from "@/components/bookshelf/Bookshelf";

export default async function Home() {
  const files = await listPdfFiles();

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-6 py-12 sm:px-10">
      <header className="mb-10 flex flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-white drop-shadow-sm">
          Generation Solutions Flip Book
        </h1>
        <p className="text-sm font-medium text-white/80 drop-shadow-sm">
          {files.length} {files.length === 1 ? "book" : "books"}
        </p>
      </header>
      <Bookshelf files={files} />
    </div>
  );
}
