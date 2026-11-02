import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Cormorant_Upright, Manrope, Shippori_Mincho } from "next/font/google";
import "./globals.css";

const serif = Cormorant_Garamond({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-serif",
  display: "swap",
});

// calligraphic upright serif used for the print on the red Getsukō tin
const tinSerif = Cormorant_Upright({
  subsets: ["latin", "latin-ext"],
  weight: ["500", "600"],
  variable: "--font-tin",
  display: "swap",
});

const sans = Manrope({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "800"],
  variable: "--font-sans",
  display: "swap",
});

const jp = Shippori_Mincho({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-jp",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Ocha no Pauda — Imperial & Ceremonial Matcha",
  description:
    "Ocha no Pauda お茶のパウダー. Getsukō Imperial Grade matcha from Yame, Fukuoka and Saemidori Ceremonial Grade from Kagoshima. Whisks, rituals and the oat milk that loves them.",
};

export const viewport: Viewport = {
  themeColor: "#04110c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${serif.variable} ${tinSerif.variable} ${sans.variable} ${jp.variable}`}>
      <body className="grain">{children}</body>
    </html>
  );
}
