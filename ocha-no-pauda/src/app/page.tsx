import { CartProvider } from "@/lib/cart";
import SmoothScroll from "@/components/SmoothScroll";
import Preloader from "@/components/Preloader";
import Nav from "@/components/Nav";
import CartDrawer from "@/components/CartDrawer";
import Toast from "@/components/Toast";
import Stage from "@/components/sections/Stage";
import Origin from "@/components/sections/Origin";
import Ritual from "@/components/sections/Ritual";
import Story from "@/components/sections/Story";
import Shop from "@/components/sections/Shop";
import Contact from "@/components/sections/Contact";
import { Bolt } from "@/components/Bolt";

export default function Home() {
  return (
    <CartProvider>
      <SmoothScroll />
      <Preloader />
      <Nav />
      <main>
        <Stage />
        <Marquee />
        <Origin />
        <Ritual />
        <Story />
        <Shop />
      </main>
      <Contact />
      <CartDrawer />
      <Toast />
    </CartProvider>
  );
}

function Marquee() {
  const items = ["Imperial Grade", "月光", "Yame, Fukuoka", "Ceremonial Grade", "冴みどり", "Kagoshima", "Powered by matcha", "抹茶"];
  return (
    <div className="relative z-10 overflow-hidden border-y border-gold/15 bg-abyss py-6" aria-hidden>
      <div className="marquee flex w-max gap-12 whitespace-nowrap">
        {[...items, ...items, ...items, ...items].map((t, i) => (
          <span key={i} className="flex items-center gap-12 font-display text-3xl italic text-cream/80 md:text-4xl">
            {t}
            <Bolt className="h-4 w-4 text-gold" />
          </span>
        ))}
      </div>
    </div>
  );
}
