import "server-only";

export interface RemoteBookConfig {
  title: string;
  filename: string;
  url: string;
}

/**
 * Books served from external hosting (GitHub Release assets) rather than
 * public/. Needed because these PDFs are far too large to ship inside a
 * Vercel deployment — serverless functions there also have a read-only
 * filesystem, so local public/ files aren't usable in production anyway.
 *
 * Adding a new book for production: upload the PDF as an asset on a GitHub
 * release, then add an entry here with its stable download URL.
 */
export const REMOTE_BOOKS: RemoteBookConfig[] = [
  {
    title: "Life Skills Booklet 1",
    filename: "Life Skills Booklet 1.pdf",
    url: "https://github.com/KaremMohamed21/gs-flipbooks/releases/download/pdfs/Life.Skills.Booklet.1.pdf",
  },
  {
    title: "Life Skills Booklet 2",
    filename: "Life Skills Booklet 2.pdf",
    url: "https://github.com/KaremMohamed21/gs-flipbooks/releases/download/pdfs/Life.Skills.Booklet.2.pdf",
  },
  {
    title: "Life Skills Booklet 3",
    filename: "Life Skills Booklet 3.pdf",
    url: "https://github.com/KaremMohamed21/gs-flipbooks/releases/download/pdfs/Life.Skills.Booklet.3.pdf",
  },
  {
    title: "Life Skills Booklet 4",
    filename: "Life Skills Booklet 4.pdf",
    url: "https://github.com/KaremMohamed21/gs-flipbooks/releases/download/pdfss/Life.Skills.Booklet.4.pdf",
  },
  {
    title: "Life Skills Booklet 5",
    filename: "Life Skills Booklet 5.pdf",
    url: "https://github.com/KaremMohamed21/gs-flipbooks/releases/download/pdfss/Life.Skills.Booklet.5.pdf",
  },
  {
    title: "Life Skills Booklet 6",
    filename: "Life Skills Booklet 6.pdf",
    url: "https://github.com/KaremMohamed21/gs-flipbooks/releases/download/pdfss/Life.Skills.Booklet.6.pdf",
  },
  {
    title: "Life Skills Booklet 7",
    filename: "Life Skills Booklet 7.pdf",
    url: "https://github.com/KaremMohamed21/gs-flipbooks/releases/download/pdfss/Life.Skills.Booklet.7.pdf",
  },
  {
    title: "Life Skills Booklet 8",
    filename: "Life Skills Booklet 8.pdf",
    url: "https://github.com/KaremMohamed21/gs-flipbooks/releases/download/pdfss/Life.Skills.Booklet.8.pdf",
  },
  {
    title: "Life Skills Booklet 9",
    filename: "Life Skills Booklet 9.pdf",
    url: "https://github.com/KaremMohamed21/gs-flipbooks/releases/download/pdfss/Life.Skills.Booklet.9.pdf",
  },
];
