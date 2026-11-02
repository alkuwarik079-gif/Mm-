import { asset } from "./asset";
import store from "@/data/store.json";

/** images are stored as "/img/…" paths (or full URLs) and prefixed with the deploy base path */
export const resolveImage = (src: string) => (/^https?:\/\//.test(src) ? src : asset(src));

export type TinVariant = "silver" | "red";

export type Flavor = {
  umami: number;
  sweetness: number;
  bitterness: number;
  aroma: number;
  creaminess: number;
};

export type Matcha = {
  id: string;
  variant: TinVariant;
  name: string;
  kanji: string;
  grade: string;
  origin: string;
  cultivar: string;
  weight: string;
  price: number;
  tagline: string;
  description: string;
  notes: string[];
  flavor: Flavor;
  image: string;
  accent: string;
};

// The shop data lives in src/data/store.json so the owner menu (/admin) can edit it.
const matchaPrice = (id: string) => (store.products as StoreProduct[]).find((p) => p.id === id)?.price ?? 0;

export const MATCHAS: Matcha[] = (store.matchas as Omit<Matcha, "price">[]).map((m) => ({
  ...m,
  price: matchaPrice(m.id),
  image: resolveImage(m.image),
}));

export type Product = {
  id: string;
  name: string;
  subtitle: string;
  price: number;
  image: string;
  category: "Matcha" | "Ritual" | "Syrup" | "Oat Milk";
  badge?: string;
  note?: string;
  noteDir?: "rtl";
  /** whether the photo sits on a light studio background */
  light?: boolean;
  soldOut?: boolean;
  hidden?: boolean;
};

type StoreProduct = Product;

/** every product, including hidden ones (the cart uses this to look items up) */
export const ALL_PRODUCTS: Product[] = (store.products as StoreProduct[]).map((p) => ({ ...p, image: resolveImage(p.image) }));

/** what customers see in the shop */
export const PRODUCTS: Product[] = ALL_PRODUCTS.filter((p) => !p.hidden);

export const productById = (id: string) => ALL_PRODUCTS.find((p) => p.id === id && !p.hidden);

export const formatQAR = (n: number) => `${n.toLocaleString("en-US")} QAR`;
