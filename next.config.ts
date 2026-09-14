import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdfjs-dist", "@napi-rs/canvas"],
  // @napi-rs/canvas's native binary is loaded via a dynamic require() deep
  // inside pdfjs-dist, so Next's automatic file-tracing (which decides what
  // ships in each serverless function on Vercel) can't always see that
  // dependency statically. Force it to be included as a safety net.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/@napi-rs/canvas/**/*",
      "./node_modules/@napi-rs/canvas-*/**/*",
      "./node_modules/pdfjs-dist/**/*",
    ],
  },
};

export default nextConfig;
