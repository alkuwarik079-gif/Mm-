"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MATCHAS, ALL_PRODUCTS, formatQAR, type Flavor } from "@/lib/products";
import { useVariant } from "@/lib/useVariant";
import { variantStore } from "@/lib/scene-state";
import { useCart } from "@/lib/cart";
import { Bolt } from "../Bolt";

const EASE = [0.22, 1, 0.36, 1] as const;
const FLAVOR_KEYS: (keyof Flavor)[] = ["umami", "sweetness", "bitterness", "aroma", "creaminess"];

const CRAVINGS = [
  { id: "umami", label: "Deep umami", pick: "red" },
  { id: "choc", label: "Dark chocolate", pick: "red" },
  { id: "vanilla", label: "Soft vanilla", pick: "silver" },
  { id: "pistachio", label: "Toasted pistachio", pick: "silver" },
  { id: "creamy", label: "Creamy & buttery", pick: "silver" },
  { id: "bold", label: "Bold & full-bodied", pick: "red" },
] as const;

export default function Collection() {
  const variant = useVariant();
  const m = useMemo(() => MATCHAS.find((x) => x.variant === variant)!, [variant]);
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [craving, setCraving] = useState<string | null>(null);

  const soldOut = !!ALL_PRODUCTS.find((p) => p.id === m.id)?.soldOut;
  const addToBag = () => {
    if (soldOut) return;
    add(m.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <section id="collection" className="relative z-10 min-h-[100svh] px-4 pb-24 pt-[46svh] sm:px-8 md:px-12 md:pt-28">
      <div className="mx-auto grid max-w-[1600px] md:grid-cols-2">
        {/* left column is intentionally empty — the 3D tin lives there */}
        <div className="hidden md:block" />

        <div className="relative rounded-t-3xl bg-forest/85 p-5 pt-8 backdrop-blur-xl md:rounded-none md:bg-transparent md:p-0 md:py-10 md:pl-8 md:backdrop-blur-none lg:pl-16">
          <p className="mb-6 flex items-center gap-4 text-[10px] uppercase tracking-[0.42em] text-gold">
            <span className="h-px w-10 bg-gold/60" />
            The Collection · 二つの抹茶
          </p>

          {/* selector */}
          <div className="mb-10 flex gap-2 rounded-full border border-cream/10 bg-abyss/30 p-1 backdrop-blur-md">
            {MATCHAS.map((x) => (
              <button
                key={x.id}
                onClick={() => variantStore.set(x.variant)}
                className="relative flex-1 rounded-full px-4 py-3 text-[11px] uppercase tracking-[0.28em]"
                aria-pressed={variant === x.variant}
              >
                {variant === x.variant && (
                  <motion.span layoutId="tin-pill" className="absolute inset-0 rounded-full bg-cream" transition={{ duration: 0.6, ease: EASE }} />
                )}
                <span className={`relative z-10 transition-colors duration-500 ${variant === x.variant ? "text-abyss" : "text-cream/70"}`}>
                  {x.name} <span className="hidden sm:inline">· {x.variant === "red" ? "Red" : "Silver"}</span>
                </span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -16, filter: "blur(8px)" }}
              transition={{ duration: 0.7, ease: EASE }}
            >
              <div className="flex items-end justify-between gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.36em] text-cream/50">{m.grade}</p>
                  <h3 className="mt-2 font-display text-6xl font-light italic leading-none text-cream sm:text-7xl lg:text-8xl">{m.name}</h3>
                </div>
                <span className="font-mincho text-5xl text-gold/80 sm:text-6xl">{m.kanji}</span>
              </div>

              <p className="mt-6 font-display text-2xl italic text-gold-soft">{m.tagline}</p>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-cream/65">{m.description}</p>

              <dl className="mt-8 grid grid-cols-3 gap-4 border-y border-cream/10 py-5">
                {[
                  ["Origin", m.origin],
                  ["Cultivar", m.cultivar],
                  ["Weight", m.weight],
                ].map(([k, v]) => (
                  <div key={k}>
                    <dt className="text-[9px] uppercase tracking-[0.32em] text-cream/40">{k}</dt>
                    <dd className="mt-1.5 font-display text-lg leading-tight text-cream">{v}</dd>
                  </div>
                ))}
              </dl>

              {/* flavor profile, drawn with the brand's lightning bolts */}
              <div className="mt-8 space-y-3.5">
                {FLAVOR_KEYS.map((k, i) => (
                  <div key={k} className="grid grid-cols-[110px_1fr] items-center sm:grid-cols-[140px_1fr]">
                    <span className="font-display text-lg capitalize text-cream/80">{k}</span>
                    <div className="flex gap-2">
                      {Array.from({ length: 5 }).map((_, j) => (
                        <motion.span
                          key={j}
                          initial={{ opacity: 0, scale: 0.4, rotate: -20 }}
                          animate={{ opacity: 1, scale: 1, rotate: 0 }}
                          transition={{ delay: 0.15 + i * 0.06 + j * 0.04, duration: 0.5, ease: EASE }}
                        >
                          <Bolt className={`h-5 w-5 ${j < m.flavor[k] ? "text-gold" : "text-cream/10"}`} filled={j < m.flavor[k]} />
                        </motion.span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <ul className="mt-8 flex flex-wrap gap-2">
                {m.notes.map((n) => (
                  <li key={n} className="rounded-full border border-gold/25 px-3.5 py-1.5 text-[11px] tracking-wide text-gold-soft">
                    {n}
                  </li>
                ))}
              </ul>

              <div className="mt-10 flex flex-wrap items-center gap-4">
                <span className="font-display text-4xl text-cream">{formatQAR(m.price)}</span>
                <div className="flex items-center rounded-full border border-cream/15">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="h-12 w-11 text-cream/70 hover:text-cream" aria-label="Decrease quantity">
                    −
                  </button>
                  <span className="w-6 text-center tabular-nums">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(20, q + 1))} className="h-12 w-11 text-cream/70 hover:text-cream" aria-label="Increase quantity">
                    +
                  </button>
                </div>
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={addToBag}
                  disabled={soldOut}
                  className="group relative h-12 flex-1 overflow-hidden rounded-full bg-gold px-8 text-[11px] font-semibold uppercase tracking-[0.3em] text-abyss sm:flex-none"
                >
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.span
                      key={added ? "y" : "n"}
                      initial={{ y: 16, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -16, opacity: 0 }}
                      className="relative z-10 block"
                    >
                      {soldOut ? "Sold out" : added ? "Added ✓" : "Add to bag"}
                    </motion.span>
                  </AnimatePresence>
                  <span className="absolute inset-0 -translate-x-full bg-gold-soft transition-transform duration-700 ease-luxe group-hover:translate-x-0" />
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* flavor finder */}
          <div className="mt-14 rounded-sm border border-cream/10 bg-abyss/25 p-6 backdrop-blur-md">
            <p className="text-[10px] uppercase tracking-[0.36em] text-gold">Flavor finder</p>
            <p className="mt-2 font-display text-2xl italic text-cream">What are you craving?</p>
            <div className="mt-5 flex flex-wrap gap-2">
              {CRAVINGS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => {
                    setCraving(c.id);
                    variantStore.set(c.pick);
                  }}
                  className={`rounded-full border px-4 py-2 text-xs transition-all duration-500 ${
                    craving === c.id ? "border-gold bg-gold text-abyss" : "border-cream/15 text-cream/75 hover:border-gold/50 hover:text-cream"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <AnimatePresence>
              {craving && (
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-4 text-sm text-cream/60"
                >
                  Your match: <span className="font-display text-lg italic text-gold-soft">{m.name}</span> — the{" "}
                  {m.variant === "red" ? "red lacquer" : "silver"} tin.
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
