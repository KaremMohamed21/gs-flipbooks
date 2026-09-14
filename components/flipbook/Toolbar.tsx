"use client";

import { useRef } from "react";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize,
  Grid2x2,
  Download,
} from "lucide-react";

interface ToolbarProps {
  title: string;
  currentPage: number;
  pageCount: number;
  onPrev: () => void;
  onNext: () => void;
  onJump: (pageIndex: number) => void;
  zoom: number;
  minZoom: number;
  maxZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  showThumbnails: boolean;
  onToggleThumbnails: () => void;
  downloadHref: string;
  downloadSizeLabel: string;
}

export function Toolbar({
  title,
  currentPage,
  pageCount,
  onPrev,
  onNext,
  onJump,
  zoom,
  minZoom,
  maxZoom,
  onZoomIn,
  onZoomOut,
  isFullscreen,
  onToggleFullscreen,
  showThumbnails,
  onToggleThumbnails,
  downloadHref,
  downloadSizeLabel,
}: ToolbarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const commitJump = () => {
    const el = inputRef.current;
    if (!el) return;
    const n = Number(el.value);
    if (Number.isInteger(n) && n >= 1 && n <= pageCount) {
      onJump(n - 1);
    } else {
      el.value = String(currentPage + 1);
    }
  };

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 flex flex-col gap-2 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 text-neutral-200 sm:px-6">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-2 rounded-full bg-neutral-900/90 px-3 py-2 shadow-lg ring-1 ring-white/10 backdrop-blur">
        <span className="hidden max-w-[30%] truncate pl-2 text-xs text-neutral-400 sm:block">
          {title}
        </span>

        <div className="flex items-center gap-1">
          <button
            onClick={onPrev}
            disabled={currentPage <= 0}
            aria-label="Previous page"
            className="rounded-full p-2 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronLeft size={18} />
          </button>

          <div className="flex items-center gap-1 text-sm tabular-nums">
            <input
              key={currentPage}
              ref={inputRef}
              defaultValue={currentPage + 1}
              onBlur={commitJump}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
              className="w-9 rounded bg-white/10 px-1 py-0.5 text-center outline-none focus:ring-1 focus:ring-blue-400"
              inputMode="numeric"
            />
            <span className="text-neutral-500">/ {pageCount}</span>
          </div>

          <button
            onClick={onNext}
            disabled={currentPage >= pageCount - 1}
            aria-label="Next page"
            className="rounded-full p-2 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={onZoomOut}
            disabled={zoom <= minZoom}
            aria-label="Zoom out"
            className="rounded-full p-2 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ZoomOut size={17} />
          </button>
          <button
            onClick={onZoomIn}
            disabled={zoom >= maxZoom}
            aria-label="Zoom in"
            className="rounded-full p-2 hover:bg-white/10 disabled:opacity-30 disabled:hover:bg-transparent"
          >
            <ZoomIn size={17} />
          </button>
          <button
            onClick={onToggleThumbnails}
            aria-label="Toggle thumbnails"
            className={`rounded-full p-2 hover:bg-white/10 ${showThumbnails ? "bg-white/10" : ""}`}
          >
            <Grid2x2 size={17} />
          </button>
          <a
            href={downloadHref}
            download
            target="_blank"
            rel="noopener noreferrer"
            title={downloadSizeLabel ? `Download original PDF (${downloadSizeLabel})` : "Download original PDF"}
            aria-label="Download PDF"
            className="rounded-full p-2 hover:bg-white/10"
          >
            <Download size={17} />
          </a>
          <button
            onClick={onToggleFullscreen}
            aria-label="Toggle fullscreen"
            className="rounded-full p-2 hover:bg-white/10"
          >
            {isFullscreen ? <Minimize size={17} /> : <Maximize size={17} />}
          </button>
        </div>
      </div>
    </div>
  );
}
