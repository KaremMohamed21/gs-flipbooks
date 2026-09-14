export default function BookLoading() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-4 bg-neutral-950 text-neutral-300">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-neutral-700 border-t-neutral-200" />
      <p className="text-sm">Preparing your book…</p>
    </div>
  );
}
