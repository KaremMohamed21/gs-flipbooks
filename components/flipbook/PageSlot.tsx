"use client";

import { forwardRef } from "react";

interface PageSlotProps {
  pageNumber: number;
  totalPages: number;
  loaded: boolean;
  src?: string;
  isCover?: boolean;
}

export const PageSlot = forwardRef<HTMLDivElement, PageSlotProps>(
  ({ pageNumber, totalPages, loaded, src, isCover }, ref) => {
    return (
      <div
        ref={ref}
        className="page relative overflow-hidden bg-white"
        data-density={isCover ? "hard" : undefined}
      >
        {loaded && src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={`Page ${pageNumber} of ${totalPages}`}
            className="absolute inset-0 h-full w-full object-contain"
            draggable={false}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-400" />
          </div>
        )}
        <div className="pointer-events-none absolute bottom-2 right-3 text-[10px] text-neutral-400">
          {pageNumber}
        </div>
      </div>
    );
  }
);
PageSlot.displayName = "PageSlot";
