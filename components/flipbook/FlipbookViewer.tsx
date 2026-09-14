"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import type HTMLFlipBookType from "react-pageflip";
import { PageSlot } from "./PageSlot";
import { Toolbar } from "./Toolbar";
import { ThumbnailsPanel } from "./ThumbnailsPanel";
import { useFullscreen } from "./useFullscreen";

const HTMLFlipBook = dynamic(() => import("react-pageflip"), {
  ssr: false,
}) as unknown as typeof HTMLFlipBookType;

interface FlipBookHandle {
  pageFlip: () => {
    turnToPage: (n: number) => void;
    flipNext: () => void;
    flipPrev: () => void;
    getCurrentPageIndex: () => number;
    getPageCount: () => number;
  };
}

interface FlipbookViewerProps {
  slug: string;
  filename: string;
  title: string;
  fileSize: number;
  pageCount: number;
  pageWidth: number;
  pageHeight: number;
}

const BUFFER = 4;
const MAIN_WIDTH = 1000;
const MIN_ZOOM = 1;
const MAX_ZOOM = 4;
const DEFAULT_ZOOM = 2;

export function FlipbookViewer({
  slug,
  filename,
  title,
  fileSize,
  pageCount,
  pageWidth,
  pageHeight,
}: FlipbookViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const flipBookRef = useRef<FlipBookHandle>(null);

  const [currentPage, setCurrentPage] = useState(0);
  const [everLoaded, setEverLoaded] = useState<Set<number>>(
    () => new Set(Array.from({ length: Math.min(pageCount, BUFFER * 2 + 1) }, (_, i) => i))
  );
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [showThumbnails, setShowThumbnails] = useState(false);

  const { isFullscreen, toggleFullscreen } = useFullscreen(containerRef);

  const expandWindow = useCallback(
    (center: number) => {
      setEverLoaded((prev) => {
        const start = Math.max(0, center - BUFFER);
        const end = Math.min(pageCount - 1, center + BUFFER);
        let changed = false;
        const next = new Set(prev);
        for (let i = start; i <= end; i++) {
          if (!next.has(i)) {
            next.add(i);
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    },
    [pageCount]
  );

  const handleFlip = useCallback(
    (e: { data: unknown }) => {
      const index = e.data as number;
      setCurrentPage(index);
      expandWindow(index);
    },
    [expandWindow]
  );

  const jumpTo = useCallback(
    (index: number) => {
      const clamped = Math.max(0, Math.min(pageCount - 1, index));
      expandWindow(clamped);
      flipBookRef.current?.pageFlip()?.turnToPage(clamped);
    },
    [expandWindow, pageCount]
  );

  const goPrev = useCallback(() => flipBookRef.current?.pageFlip()?.flipPrev(), []);
  const goNext = useCallback(() => flipBookRef.current?.pageFlip()?.flipNext(), []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "Escape" && showThumbnails) setShowThumbnails(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goPrev, goNext, showThumbnails]);

  const aspect = pageWidth && pageHeight ? pageWidth / pageHeight : 3 / 4;
  const baseHeight = 900;
  const baseWidth = Math.round(baseHeight * aspect);
  const minWidth = 250;
  const maxWidth = 1200;

  const flipSettings = useMemo(
    () => ({
      startPage: 0,
      size: "stretch" as const,
      width: baseWidth,
      height: baseHeight,
      minWidth,
      maxWidth,
      minHeight: Math.round(minWidth / aspect),
      maxHeight: Math.round(maxWidth / aspect),
      drawShadow: true,
      flippingTime: 700,
      usePortrait: false,
      startZIndex: 30,
      autoSize: true,
      maxShadowOpacity: 0.5,
      showCover: true,
      mobileScrollSupport: false,
      clickEventForward: true,
      useMouseEvents: true,
      swipeDistance: 30,
      showPageCorners: true,
      disableFlipByClick: false,
    }),
    [baseWidth, aspect]
  );

  const downloadHref = `/${encodeURIComponent(filename)}`;
  const downloadSizeLabel = `${(fileSize / (1024 * 1024)).toFixed(0)} MB`;

  return (
    <div
      ref={containerRef}
      className="relative flex h-screen w-full flex-col overflow-hidden bg-neutral-700"
    >
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 py-3 sm:px-6">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-full px-3 py-1.5 text-sm text-neutral-300 hover:bg-white/10 hover:text-neutral-100"
        >
          <ArrowLeft size={16} />
          Generation Solutions
        </Link>
        <span className="truncate text-sm text-neutral-300 sm:hidden">{title}</span>
      </div>

      <div
        className="flex flex-1 items-center justify-center p-6"
        style={{ overflow: zoom > MIN_ZOOM ? "auto" : "hidden" }}
      >
        <div
          style={{
            transform: `scale(${zoom}) translateX(${
              currentPage === 0 ? -25 : currentPage === pageCount - 1 ? 25 : 0
            }%)`,
            transformOrigin: "center",
          }}
          className="transition-transform duration-200 ease-out"
        >
          <HTMLFlipBook
            {...flipSettings}
            ref={flipBookRef}
            className="flipbook"
            style={{}}
            onFlip={handleFlip}
          >
            {Array.from({ length: pageCount }, (_, index) => (
              <PageSlot
                key={index}
                pageNumber={index + 1}
                totalPages={pageCount}
                isCover={index === 0 || index === pageCount - 1}
                loaded={everLoaded.has(index)}
                src={
                  everLoaded.has(index)
                    ? `/api/pdf/${slug}/page/${index + 1}?w=${MAIN_WIDTH}`
                    : undefined
                }
              />
            ))}
          </HTMLFlipBook>
        </div>
      </div>

      {showThumbnails && (
        <ThumbnailsPanel
          slug={slug}
          pageCount={pageCount}
          currentPage={currentPage}
          onSelect={(index) => {
            jumpTo(index);
            setShowThumbnails(false);
          }}
          onClose={() => setShowThumbnails(false)}
        />
      )}

      <Toolbar
        title={title}
        currentPage={currentPage}
        pageCount={pageCount}
        onPrev={goPrev}
        onNext={goNext}
        onJump={jumpTo}
        zoom={zoom}
        minZoom={MIN_ZOOM}
        maxZoom={MAX_ZOOM}
        onZoomIn={() => setZoom((z) => Math.min(MAX_ZOOM, z + 0.25))}
        onZoomOut={() => setZoom((z) => Math.max(MIN_ZOOM, z - 0.25))}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        showThumbnails={showThumbnails}
        onToggleThumbnails={() => setShowThumbnails((v) => !v)}
        downloadHref={downloadHref}
        downloadSizeLabel={downloadSizeLabel}
      />
    </div>
  );
}
