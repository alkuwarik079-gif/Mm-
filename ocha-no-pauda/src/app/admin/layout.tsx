import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Owner menu — Ocha no Pauda",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}
