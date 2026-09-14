import "server-only";
import { readdir, stat } from "fs/promises";
import path from "path";
import { toSlug } from "./slug";

export const PUBLIC_DIR = path.join(process.cwd(), "public");

export interface PdfFileEntry {
  slug: string;
  filename: string;
  title: string;
  absolutePath: string;
  mtimeMs: number;
  size: number;
}

/**
 * Scans public/ for *.pdf files. Cheap (readdir + stat only, no PDF
 * parsing), so it's safe to call on every request — this is what makes
 * dropping a new PDF into public/ "just work" with no build step.
 */
export async function listPdfFiles(): Promise<PdfFileEntry[]> {
  const names = await readdir(PUBLIC_DIR);
  const pdfNames = names.filter((name) => /\.pdf$/i.test(name));

  const entries = await Promise.all(
    pdfNames.map(async (filename) => {
      const absolutePath = path.join(PUBLIC_DIR, filename);
      const stats = await stat(absolutePath);
      return {
        slug: toSlug(filename),
        filename,
        title: filename.replace(/\.pdf$/i, ""),
        absolutePath,
        mtimeMs: stats.mtimeMs,
        size: stats.size,
      };
    })
  );

  entries.sort((a, b) => a.title.localeCompare(b.title));
  return entries;
}

export async function resolveSlug(slug: string): Promise<PdfFileEntry | undefined> {
  const files = await listPdfFiles();
  return files.find((f) => f.slug === slug);
}
