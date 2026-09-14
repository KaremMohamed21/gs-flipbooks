import "server-only";
import { mkdir, readFile, rename, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { createCanvas } from "@napi-rs/canvas";
import { versionKey, type PdfFileEntry } from "./pdf-library";
import { getPdfDocument } from "./pdf-doc-cache";

// os.tmpdir() rather than a project-relative path: on Vercel (and other
// serverless platforms) only /tmp is writable, the deployment directory
// itself is read-only. This resolves to the OS temp dir locally too, so
// the same code works unmodified in both environments.
const CACHE_ROOT = path.join(os.tmpdir(), "gs-flipbooks-cache", "pdf-pages");
const ALLOWED_WIDTHS = [150, 300, 600, 1000, 1600];

export class PageOutOfRangeError extends Error {
  constructor(pageNumber: number, numPages: number) {
    super(`Page ${pageNumber} is out of range (book has ${numPages} pages)`);
    this.name = "PageOutOfRangeError";
  }
}

export function clampWidth(requested: number): number {
  if (!Number.isFinite(requested) || requested <= 0) return ALLOWED_WIDTHS[2];
  let closest = ALLOWED_WIDTHS[0];
  let closestDiff = Infinity;
  for (const w of ALLOWED_WIDTHS) {
    const diff = Math.abs(w - requested);
    if (diff < closestDiff) {
      closestDiff = diff;
      closest = w;
    }
  }
  return closest;
}

interface RenderResult {
  buffer: Buffer;
  contentType: string;
}

const inFlight = new Map<string, Promise<RenderResult>>();

function pageCachePath(entry: PdfFileEntry, pageNumber: number, width: number): string {
  return path.join(CACHE_ROOT, entry.slug, versionKey(entry), `p${pageNumber}-w${width}.webp`);
}

/**
 * Renders one PDF page to a WebP image, disk-cached forever (the cache key
 * bakes in the source file's version, so a given URL's bytes never change
 * once written). Note: on serverless platforms this cache lives in /tmp,
 * which is ephemeral per instance — Vercel's own CDN cache (via the
 * Cache-Control header on the API response) is what actually makes repeat
 * requests fast in production, this is a same-instance bonus on top.
 */
export async function renderPdfPage(
  entry: PdfFileEntry,
  pageNumber: number,
  requestedWidth: number
): Promise<RenderResult> {
  const width = clampWidth(requestedWidth);
  const cachePath = pageCachePath(entry, pageNumber, width);

  try {
    const buffer = await readFile(cachePath);
    return { buffer, contentType: "image/webp" };
  } catch {
    // not cached yet
  }

  const existing = inFlight.get(cachePath);
  if (existing) return existing;

  const renderPromise = (async (): Promise<RenderResult> => {
    const doc = await getPdfDocument(entry);
    if (pageNumber < 1 || pageNumber > doc.numPages) {
      throw new PageOutOfRangeError(pageNumber, doc.numPages);
    }

    const page = await doc.getPage(pageNumber);
    const baseViewport = page.getViewport({ scale: 1 });
    const scale = width / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const canvasWidth = Math.max(1, Math.round(viewport.width));
    const canvasHeight = Math.max(1, Math.round(viewport.height));
    const canvas = createCanvas(canvasWidth, canvasHeight);

    await page.render({
      canvas: canvas as unknown as HTMLCanvasElement,
      viewport,
    }).promise;

    const buffer = await canvas.encode("webp");

    await mkdir(path.dirname(cachePath), { recursive: true });
    const tmpPath = `${cachePath}.${process.pid}.${Date.now()}.tmp`;
    await writeFile(tmpPath, buffer);
    await rename(tmpPath, cachePath);

    return { buffer, contentType: "image/webp" };
  })();

  inFlight.set(cachePath, renderPromise);
  try {
    return await renderPromise;
  } finally {
    inFlight.delete(cachePath);
  }
}
