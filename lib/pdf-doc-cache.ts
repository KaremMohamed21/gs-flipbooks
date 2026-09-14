import "server-only";
import { pathToFileURL } from "url";
import { getDocument, type PDFDocumentProxy, type PDFDocumentLoadingTask } from "pdfjs-dist/legacy/build/pdf.mjs";
import { createCanvas, type Canvas, type SKRSContext2D } from "@napi-rs/canvas";
import { versionKey, type PdfFileEntry } from "./pdf-library";

const MAX_OPEN_DOCS = 2;

interface CanvasAndContext {
  canvas: Canvas | null;
  context: SKRSContext2D | null;
}

/**
 * pdfjs's own Node canvas factory loads @napi-rs/canvas via
 * `process.getBuiltinModule("module").createRequire(...)` internally, with
 * no error handling around that specific call in the render path — it
 * throws on any Node runtime older than 22.3 (process.getBuiltinModule
 * didn't exist before that), which silently crashes only page rendering
 * (metadata reads never touch canvas at all, so they still work fine,
 * making this a confusing "titles work, images 500" failure). Supplying
 * our own factory, built on the static top-level import already used
 * elsewhere in this codebase, sidesteps that internal detail entirely.
 */
class StaticNodeCanvasFactory {
  create(width: number, height: number): CanvasAndContext {
    if (width <= 0 || height <= 0) {
      throw new Error("Invalid canvas size");
    }
    const canvas = createCanvas(width, height);
    return { canvas, context: canvas.getContext("2d") };
  }

  reset(canvasAndContext: CanvasAndContext, width: number, height: number): void {
    if (!canvasAndContext.canvas) {
      throw new Error("Canvas is not specified");
    }
    if (width <= 0 || height <= 0) {
      throw new Error("Invalid canvas size");
    }
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: CanvasAndContext): void {
    if (!canvasAndContext.canvas) {
      throw new Error("Canvas is not specified");
    }
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
    canvasAndContext.canvas = null;
    canvasAndContext.context = null;
  }
}

interface CacheEntry {
  loadingTask: PDFDocumentLoadingTask;
  docPromise: Promise<PDFDocumentProxy>;
  lastUsed: number;
  ready: boolean;
}

const cache = new Map<string, CacheEntry>();

async function evictExcess(): Promise<void> {
  while (cache.size > MAX_OPEN_DOCS) {
    // Only ever evict documents that have finished loading — destroying a
    // still-in-flight PDFDocumentLoadingTask throws "Loading aborted" in
    // whichever request is awaiting it. If everything currently open is
    // still loading, just let the cache temporarily exceed the cap; it
    // self-corrects on the next call once something settles.
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, entry] of cache) {
      if (entry.ready && entry.lastUsed < oldestTime) {
        oldestTime = entry.lastUsed;
        oldestKey = key;
      }
    }
    if (!oldestKey) break;
    const entry = cache.get(oldestKey);
    cache.delete(oldestKey);
    try {
      await entry?.loadingTask.destroy();
    } catch {
      // already failed or destroyed; nothing to clean up
    }
  }
}

/**
 * Returns a cached, open pdfjs document for this file. Local files open via
 * a file:// URL (range reads against disk); remote files open via their
 * https:// URL (range reads via HTTP, since GitHub's release CDN supports
 * Accept-Ranges). Keeps at most MAX_OPEN_DOCS documents open at once (LRU
 * eviction) since these source PDFs are large.
 */
export async function getPdfDocument(entry: PdfFileEntry): Promise<PDFDocumentProxy> {
  const key = `${entry.slug}:${versionKey(entry)}`;
  const cached = cache.get(key);
  if (cached) {
    cached.lastUsed = Date.now();
    return cached.docPromise;
  }

  const url = entry.source.kind === "local" ? pathToFileURL(entry.source.absolutePath).href : entry.source.url;
  const loadingTask = getDocument({ url, CanvasFactory: StaticNodeCanvasFactory });
  const docPromise = loadingTask.promise;

  const cacheEntry: CacheEntry = { loadingTask, docPromise, lastUsed: Date.now(), ready: false };
  docPromise.then(
    () => {
      cacheEntry.ready = true;
    },
    () => cache.delete(key)
  );

  cache.set(key, cacheEntry);
  await evictExcess();

  return docPromise;
}
