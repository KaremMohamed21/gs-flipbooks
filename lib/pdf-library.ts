import "server-only";
import { readdir, stat } from "fs/promises";
import path from "path";
import { createHash } from "crypto";
import { toSlug } from "./slug";
import { REMOTE_BOOKS } from "./remote-books";

export const PUBLIC_DIR = path.join(process.cwd(), "public");

export type PdfSource = { kind: "local"; absolutePath: string } | { kind: "remote"; url: string };

export interface PdfFileEntry {
  slug: string;
  filename: string;
  title: string;
  source: PdfSource;
  /** 0 for remote sources — versionKey() is the real cache-busting key. */
  mtimeMs: number;
  /** 0 for remote sources until a HEAD request resolves it. */
  size: number;
}

const remoteSizeCache = new Map<string, number>();

async function getRemoteSize(url: string): Promise<number> {
  const cached = remoteSizeCache.get(url);
  if (cached !== undefined) return cached;
  try {
    const res = await fetch(url, { method: "HEAD", redirect: "follow" });
    const size = Number(res.headers.get("content-length") ?? 0);
    remoteSizeCache.set(url, size);
    return size;
  } catch {
    return 0;
  }
}

/**
 * Scans public/ for *.pdf files. Cheap (readdir + stat only, no PDF
 * parsing), so it's safe to call on every request — this is what makes
 * dropping a new PDF into public/ "just work" with no build step in dev.
 * Returns [] (not a throw) if public/ has no PDFs or isn't readable, since
 * a production deployment may have none at all.
 */
async function listLocalFiles(): Promise<PdfFileEntry[]> {
  let names: string[];
  try {
    names = await readdir(PUBLIC_DIR);
  } catch {
    return [];
  }
  const pdfNames = names.filter((name) => /\.pdf$/i.test(name));

  return Promise.all(
    pdfNames.map(async (filename) => {
      const absolutePath = path.join(PUBLIC_DIR, filename);
      const stats = await stat(absolutePath);
      return {
        slug: toSlug(filename),
        filename,
        title: filename.replace(/\.pdf$/i, ""),
        source: { kind: "local", absolutePath } as const,
        mtimeMs: stats.mtimeMs,
        size: stats.size,
      };
    })
  );
}

async function listRemoteFiles(): Promise<PdfFileEntry[]> {
  return Promise.all(
    REMOTE_BOOKS.map(async (book) => ({
      slug: toSlug(book.filename),
      filename: book.filename,
      title: book.title,
      source: { kind: "remote", url: book.url } as const,
      mtimeMs: 0,
      size: await getRemoteSize(book.url),
    }))
  );
}

/**
 * Lists every book: local public/*.pdf (dev convenience, auto-detected)
 * plus anything configured in remote-books.ts (needed in production).
 * Slugs are deterministic from filename, so a local file and a remote
 * config entry for "the same" book naturally collide onto one slug —
 * local wins, letting you override a hosted book with a local copy in dev.
 */
export async function listPdfFiles(): Promise<PdfFileEntry[]> {
  const [local, remote] = await Promise.all([listLocalFiles(), listRemoteFiles()]);

  const bySlug = new Map<string, PdfFileEntry>();
  for (const entry of [...remote, ...local]) {
    bySlug.set(entry.slug, entry);
  }

  const entries = [...bySlug.values()];
  entries.sort((a, b) => a.title.localeCompare(b.title));
  return entries;
}

export async function resolveSlug(slug: string): Promise<PdfFileEntry | undefined> {
  const files = await listPdfFiles();
  return files.find((f) => f.slug === slug);
}

/** Stable per-file version key used to compose cache paths/keys. */
export function versionKey(entry: PdfFileEntry): string {
  if (entry.source.kind === "local") return `${entry.mtimeMs}-${entry.size}`;
  return createHash("sha1").update(entry.source.url).digest("hex").slice(0, 16);
}
