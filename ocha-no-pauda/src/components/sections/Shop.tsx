"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { PRODUCTS, formatQAR, type Product } from "@/lib/products";
import { useCart } from "@/lib/cart";

const FILTERS = ["All", "Matcha", "Ritual", "Syrup", "Oat Milk"] as const;
const EASE = [0.22, 1, 0.36, 1] as const;

function Card({ p, i }: { p: Product; i: number }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.8, delay: i * 0.05, ease: EASE }}
      className="group relative flex flex-col"
    >
      <div className={`relative aspect-[4/5] overflow-hidden rounded-sm ${p.light ? "bg-paper" : "bg-[#120c08]"}`}>
        <Image
          src={p.image}
          alt={p.name}
          fill
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 100vw"
          className={`transition-transform duration-[1400ms] ease-luxe group-hover:scale-[1.06] ${p.light ? "object-contain p-8 mix-blend-multiply" : "object-cover"}`}
        />
        {/* hover light sweep */}
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-[1400ms] ease-luxe group-hover:translate-x-full" />
        {p.badge && (
          <span
            dir="auto"
            className="absolute left-4 top-4 rounded-full bg-forest px-3 py-1.5 text-[10px] uppercase tracking-[0.24em] text-cream"
          >
            {p.badge}
          </span>
        )}
        <span className="absolute right-4 top-4 text-[10px] uppercase tracking-[0.28em] text-forest/50">{p.category}</span>

        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            add(p.id);
            setAdded(true);
            setTimeout(() => setAdded(false), 1500);
          }}
          className="absolute inset-x-4 bottom-4 translate-y-0 overflow-hidden rounded-full bg-forest py-3.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-cream opacity-100 transition-all duration-700 ease-luxe hover:bg-gold hover:text-abyss md:translate-y-[140%] md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100"
          aria-label={`Add ${p.name} to bag`}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span key={added ? "a" : "b"} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} className="block">
              {added ? "Added ✓" : "Add to bag"}
            </motion.span>
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-2xl leading-tight text-cream">{p.name}</h3>
          <p className="mt-1 text-xs text-cream/50">{p.subtitle}</p>
          {p.note && (
            <p dir={p.noteDir} className="mt-2 text-sm text-gold-soft">
              {p.note}
            </p>
          )}
        </div>
        <p className="whitespace-nowrap font-display text-xl text-gold-soft">{formatQAR(p.price)}</p>
      </div>
    </motion.article>
  );
}

export default function Shop() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const list = PRODUCTS.filter((p) => filter === "All" || p.category === filter);

  return (
    <section id="shop" className="relative z-10 bg-emerald px-4 py-28 sm:px-8 md:px-12 md:py-40">
      <div className="absolute inset-0 bg-[radial-gradient(70%_50%_at_50%_0%,rgba(201,169,97,0.12),transparent_70%)]" />
      <div className="relative mx-auto max-w-[1600px]">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="flex items-center gap-4 text-[10px] uppercase tracking-[0.42em] text-gold">
              <span className="h-px w-10 bg-gold/60" />
              Shop · お店
            </p>
            <h2 className="mt-5 font-display text-6xl font-light leading-[0.9] md:text-8xl">
              The <em>full</em> ritual.
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className="relative rounded-full px-5 py-2.5 text-[11px] uppercase tracking-[0.26em]"
                aria-pressed={filter === f}
              >
                {filter === f && <motion.span layoutId="shop-filter" className="absolute inset-0 rounded-full bg-cream" transition={{ duration: 0.6, ease: EASE }} />}
                <span className={`relative z-10 ${filter === f ? "text-abyss" : "text-cream/70 hover:text-cream"}`}>{f}</span>
              </button>
            ))}
          </div>
        </div>

        <motion.div layout className="mt-16 grid gap-x-6 gap-y-16 sm:grid-cols-2 lg:grid-cols-3 md:mt-24">
          <AnimatePresence mode="popLayout">
            {list.map((p, i) => (
              <Card key={p.id} p={p} i={i} />
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
