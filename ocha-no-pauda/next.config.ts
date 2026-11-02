import type { NextConfig } from "next";

// STATIC_EXPORT=1 npm run build → plain static site in ./out (GitHub Pages / static hosting)
// NEXT_PUBLIC_BASE_PATH=/Mm- serves it from a sub-path, e.g. https://<user>.github.io/Mm-/
const staticExport = process.env.STATIC_EXPORT === "1";
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(staticExport ? { output: "export" as const, trailingSlash: true } : {}),
  ...(basePath ? { basePath } : {}),
  images: { unoptimized: staticExport, formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
