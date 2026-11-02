import type { NextConfig } from "next";

// STATIC_EXPORT=1 npm run build → plain static site in ./out (for previews / static hosting)
const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  ...(staticExport ? { output: "export" as const } : {}),
  images: { unoptimized: staticExport, formats: ["image/avif", "image/webp"] },
};

export default nextConfig;
