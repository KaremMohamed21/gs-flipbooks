"use client";

import { X } from "lucide-react";

interface ThumbnailsPanelProps {
  slug: string;
  pageCount: number;
  currentPage: number;
  onSelect: (pageIndex: number) => void;
  onClose: () => void;
}

export function ThumbnailsPanel({
  slug,
  pageCount,
  currentPage,
  onSelect,
  onClose,
}: ThumbnailsPanelProps) {
  return (
    <div className="absolute inset-y-0 right-0 z-30 flex w-64 flex-col border-l border-white/10 bg-neutral-900/95 backdrop-blur sm:w-72">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <span className="text-sm font-medium text-neutral-200">Pages</span>
        <button
          onClick={onClose}
          aria-label="Close thumbnails"
          className="rounded p-1 text-neutral-400 hover:bg-white/10 hover:text-neutral-100"
        >
          <X size={16} />
        </button>
      </div>
      <div className="grid flex-1 grid-cols-2 gap-3 overflow-y-auto p-3">
        {Array.from({ length: pageCount }, (_, i) => i).map((index) => (
          <button
            key={index}
            onClick={() => onSelect(index)}
            className={`group flex flex-col gap-1 rounded-sm p-1 text-left transition-colors ${
              index === currentPage ? "bg-white/10" : "hover:bg-white/5"
            }`}
          >
            <div
              className={`aspect-[3/4] w-full overflow-hidden rounded-sm bg-neutral-800 ring-1 ${
                index === currentPage ? "ring-blue-400" : "ring-white/10"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/pdf/${slug}/page/${index + 1}?w=150`}
                alt={`Page ${index + 1}`}
                className="h-full w-full object-cover"
                loading="lazy"
              />
            </div>
            <span className="text-center text-[11px] text-neutral-400">{index + 1}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
