import "server-only";
import { mkdir, readFile, writeFile } from "fs/promises";
import os from "os";
import path from "path";
import { versionKey, type PdfFileEntry } from "./pdf-library";
import { getPdfDocument } from "./pdf-doc-cache";

// os.tmpdir() rather than a project-relative path: on Vercel (and other
// serverless platforms) only /tmp is writable, the deployment directory
// itself is read-only. This resolves to the OS temp dir locally too, so
// the same code works unmodified in both environments.
const CACHE_ROOT = path.join(os.tmpdir(), "gs-flipbooks-cache", "pdf-meta");

export interface PdfMeta {
  numPages: number;
  pageWidth: number;
  pageHeight: number;
}

function metaCachePath(entry: PdfFileEntry): string {
  return path.join(CACHE_ROOT, entry.slug, `${versionKey(entry)}.json`);
}

/**
 * Page count + nominal page size (from page 1) for a book. Disk-cached so
 * it survives dev-server restarts and never re-parses a 100+ MB file just
 * to answer "how many pages does this have".
 */
export async function getPdfMeta(entry: PdfFileEntry): Promise<PdfMeta> {
  const cachePath = metaCachePath(entry);

  try {
    const cached = await readFile(cachePath, "utf8");
    return JSON.parse(cached) as PdfMeta;
  } catch {
    // not cached yet, fall through
  }

  const doc = await getPdfDocument(entry);
  const page = await doc.getPage(1);
  const viewport = page.getViewport({ scale: 1 });

  const meta: PdfMeta = {
    numPages: doc.numPages,
    pageWidth: viewport.width,
    pageHeight: viewport.height,
  };

  await mkdir(path.dirname(cachePath), { recursive: true });
  await writeFile(cachePath, JSON.stringify(meta), "utf8");

  return meta;
}
