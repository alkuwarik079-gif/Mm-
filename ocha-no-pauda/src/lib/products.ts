import { asset } from "./asset";

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

export const MATCHAS: Matcha[] = [
  {
    id: "getsuko",
    variant: "red",
    name: "Getsukō",
    kanji: "月光",
    grade: "Imperial Grade",
    origin: "Yame, Fukuoka",
    cultivar: "Okumidori · Yabukita",
    weight: "30 g",
    price: 185,
    tagline: "She's creamy. She's nutty. She's velvety.",
    description:
      "A full-bodied, nutty umami beast, with a hint of dark chocolate bitterness, layered complexity, and a lingering velvety finish.",
    notes: ["Deep umami", "Roasted nut", "Dark chocolate finish", "Velvet body"],
    flavor: { umami: 5, sweetness: 3, bitterness: 1, aroma: 5, creaminess: 4 },
    image: asset("/img/red-tin.jpg"),
    accent: "#b3221d",
  },
  {
    id: "saemidori",
    variant: "silver",
    name: "Saemidori",
    kanji: "冴みどり",
    grade: "Ceremonial Grade",
    origin: "Kagoshima",
    cultivar: "Saemidori",
    weight: "30 g",
    price: 145,
    tagline: "Soft vanilla. Creamy, buttery. Quietly sweet.",
    description:
      "A soft vanilla aroma and a creamy, buttery texture. Nutty, with toasted pistachio nuances, medium umami, natural sweetness and very low bitterness.",
    notes: ["Soft vanilla", "Toasted pistachio", "Buttery texture", "Natural sweetness"],
    flavor: { umami: 3, sweetness: 4, bitterness: 1, aroma: 4, creaminess: 5 },
    image: asset("/img/silver-tin.jpg"),
    accent: "#e9dc8c",
  },
];

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
};

export const PRODUCTS: Product[] = [
  {
    id: "getsuko",
    name: "Getsukō",
    subtitle: "Imperial Grade · Yame, Fukuoka · 30 g",
    price: 185,
    image: asset("/img/red-tin.jpg"),
    category: "Matcha",
    badge: "New drop",
    light: true,
  },
  {
    id: "saemidori",
    name: "Saemidori",
    subtitle: "Ceremonial Grade · Kagoshima · 30 g",
    price: 145,
    image: asset("/img/silver-tin.jpg"),
    category: "Matcha",
    light: true,
  },
  {
    id: "chasen",
    name: "Chasen with Star Charm",
    subtitle: "Hand-cut bamboo whisk, gold star charm",
    price: 95,
    image: asset("/img/whisk.jpg"),
    category: "Ritual",
    light: true,
  },
  {
    id: "shaker",
    name: "Matcha Shaker",
    subtitle: "お茶のパウダー · frosted travel shaker",
    price: 45,
    image: asset("/img/cup.jpg"),
    category: "Ritual",
  },
  {
    id: "syrup",
    name: "Brown Sugar Syrup",
    subtitle: "Okinawa, Japan · honey-bear bottle",
    price: 45,
    image: asset("/img/syrup.jpg"),
    category: "Syrup",
    badge: "New",
    note: "Deep, caramel-like kokuto sweetness — made for matcha lattes.",
    light: true,
  },
  {
    id: "oatside",
    name: "Oatside Barista Blend",
    subtitle: "Oat milk · 1 L · no added sugar",
    price: 28,
    image: asset("/img/oatside.jpg"),
    category: "Oat Milk",
    badge: "كمية محدودة",
    note: "افضل حليب شوفان عالمياً مع الماتشا — متوفر بس عندنا",
    noteDir: "rtl",
    light: true,
  },
  {
    id: "nomoo",
    name: "No Moo Oat",
    subtitle: "Rich & creamy · barista friendly · 1 L",
    price: 24,
    image: asset("/img/nomoo.jpg"),
    category: "Oat Milk",
    light: true,
  },
];

export const productById = (id: string) => PRODUCTS.find((p) => p.id === id);

export const formatQAR = (n: number) => `${n.toLocaleString("en-US")} QAR`;
