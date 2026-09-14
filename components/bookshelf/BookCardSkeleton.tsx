export function BookCardSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="aspect-[3/4] w-full animate-pulse rounded-sm bg-neutral-200 shadow-md dark:bg-neutral-800" />
      <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
      <div className="h-3 w-1/3 animate-pulse rounded bg-neutral-200 dark:bg-neutral-800" />
    </div>
  );
}
