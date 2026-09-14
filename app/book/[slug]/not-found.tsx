import Link from "next/link";

export default function BookNotFound() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-neutral-950 text-neutral-300">
      <p className="text-lg font-medium">Book not found</p>
      <p className="text-sm text-neutral-500">
        It may have been removed from the public folder.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-full bg-neutral-800 px-4 py-2 text-sm text-neutral-100 transition-colors hover:bg-neutral-700"
      >
        Back to bookcase
      </Link>
    </div>
  );
}
