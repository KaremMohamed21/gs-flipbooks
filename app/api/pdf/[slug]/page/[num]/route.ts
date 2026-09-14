import { type NextRequest } from "next/server";
import { resolveSlug } from "@/lib/pdf-library";
import { renderPdfPage, PageOutOfRangeError } from "@/lib/pdf-render";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; num: string }> }
) {
  const { slug, num } = await params;

  const entry = await resolveSlug(slug);
  if (!entry) {
    return new Response("Book not found", { status: 404 });
  }

  const pageNumber = Number(num);
  if (!Number.isInteger(pageNumber) || pageNumber < 1) {
    return new Response("Invalid page number", { status: 400 });
  }

  const widthParam = request.nextUrl.searchParams.get("w");
  const requestedWidth = widthParam ? Number(widthParam) : 600;

  try {
    const { buffer, contentType } = await renderPdfPage(entry, pageNumber, requestedWidth);
    return new Response(new Uint8Array(buffer), {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    if (err instanceof PageOutOfRangeError) {
      return new Response(err.message, { status: 404 });
    }
    console.error(`Failed to render ${slug} page ${pageNumber}:`, err);
    return new Response("Failed to render page", { status: 500 });
  }
}
