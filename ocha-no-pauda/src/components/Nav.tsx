"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart";
import { scrollToId } from "./SmoothScroll";

const LINKS = [
  { label: "Shop", id: "shop" },
  { label: "Our Story", id: "story" },
  { label: "Matcha Guide", id: "ritual" },
  { label: "Contact", id: "contact" },
];

export default function Nav() {
  const { count, setOpen } = useCart();
  const [hidden, setHidden] = useState(false);
  const [menu, setMenu] = useState(false);

  // no background bar: slide the nav away while scrolling down, bring it back on scroll up
  useEffect(() => {
    let last = window.scrollY;
    const on = () => {
      const y = window.scrollY;
      if (Math.abs(y - last) < 6) return;
      setHidden(y > last && y > 120);
      last = y;
    };
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);

  const go = (id: string) => {
    setMenu(false);
    scrollToId(id);
  };

  return (
    <>
      <motion.header
        initial={{ y: -30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1.9, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none fixed inset-x-0 top-0 z-50 text-white mix-blend-difference"
      >
        <nav className={`pointer-events-auto mx-auto flex h-16 transition-transform duration-700 ease-luxe ${hidden && !menu ? "-translate-y-full" : "translate-y-0"} max-w-[1600px] items-center justify-between px-4 sm:px-8 md:h-20 md:px-12`}>
          <button onClick={() => go("top")} className="group flex items-baseline gap-3" aria-label="Ocha no Pauda — home">
            <span className="font-display text-xl italic tracking-tight text-white sm:text-2xl">Ocha no Pauda</span>
            <span className="hidden font-mincho text-xs tracking-[0.3em] text-white/70 sm:inline">お茶のパウダー</span>
          </button>

          <ul className="hidden items-center gap-10 md:flex">
            {LINKS.map((l) => (
              <li key={l.id}>
                <button
                  onClick={() => go(l.id)}
                  className="group relative text-[11px] font-medium uppercase tracking-[0.28em] text-white/85 transition-colors hover:text-white"
                >
                  {l.label}
                  <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-white transition-transform duration-500 ease-luxe group-hover:scale-x-100" />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setOpen(true)}
              className="group relative flex items-center gap-2.5 rounded-full border border-white/50 px-4 py-2 text-[11px] uppercase tracking-[0.24em] text-white transition-colors duration-500 hover:border-white hover:text-white"
              aria-label={`Open bag, ${count} items`}
            >
              Bag
              <span className="relative grid h-5 min-w-5 place-items-center overflow-hidden rounded-full bg-white px-1 text-[10px] font-semibold tracking-normal text-black">
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={count}
                    initial={{ y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -12, opacity: 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    {count}
                  </motion.span>
                </AnimatePresence>
              </span>
            </button>
            <button
              onClick={() => setMenu((v) => !v)}
              className="relative h-10 w-10 md:hidden"
              aria-label="Menu"
              aria-expanded={menu}
            >
              <span className={`absolute left-2 right-2 h-px bg-white transition-all duration-500 ${menu ? "top-1/2 rotate-45" : "top-[42%]"}`} />
              <span className={`absolute left-2 right-2 h-px bg-white transition-all duration-500 ${menu ? "top-1/2 -rotate-45" : "top-[58%]"}`} />
            </button>
          </div>
        </nav>
      </motion.header>

      <AnimatePresence>
        {menu && (
          <motion.div
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-40 flex flex-col justify-between bg-forest px-6 pb-10 pt-28 md:hidden"
          >
            <ul className="space-y-4">
              {LINKS.map((l, i) => (
                <motion.li
                  key={l.id}
                  initial={{ y: 40, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25 + i * 0.07, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  <button onClick={() => go(l.id)} className="font-display text-5xl font-light italic text-cream">
                    {l.label}
                  </button>
                </motion.li>
              ))}
            </ul>
            <p className="font-mincho text-sm tracking-[0.4em] text-gold">抹茶 · 月光 · 冴みどり</p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
