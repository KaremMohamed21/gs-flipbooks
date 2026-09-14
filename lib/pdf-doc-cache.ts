import "server-only";
import { pathToFileURL } from "url";
import { getDocument, type PDFDocumentProxy, type PDFDocumentLoadingTask } from "pdfjs-dist/legacy/build/pdf.mjs";

const MAX_OPEN_DOCS = 2;

interface CacheEntry {
  loadingTask: PDFDocumentLoadingTask;
  docPromise: Promise<PDFDocumentProxy>;
  lastUsed: number;
  ready: boolean;
}

const cache = new Map<string, CacheEntry>();

function docKey(slug: string, mtimeMs: number, size: number): string {
  return `${slug}:${mtimeMs}:${size}`;
}

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
 * Returns a cached, open pdfjs document for this file, opening it via a
 * file:// URL (range reads) rather than loading the whole file into memory.
 * Keeps at most MAX_OPEN_DOCS documents open at once (LRU eviction) since
 * these source PDFs are 100+ MB each.
 */
export async function getPdfDocument(entry: {
  slug: string;
  absolutePath: string;
  mtimeMs: number;
  size: number;
}): Promise<PDFDocumentProxy> {
  const key = docKey(entry.slug, entry.mtimeMs, entry.size);
  const cached = cache.get(key);
  if (cached) {
    cached.lastUsed = Date.now();
    return cached.docPromise;
  }

  const fileUrl = pathToFileURL(entry.absolutePath).href;
  const loadingTask = getDocument({ url: fileUrl });
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
