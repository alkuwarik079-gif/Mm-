"use client";

import { motion } from "framer-motion";
import { useVariant } from "@/lib/useVariant";
import { variantStore } from "@/lib/scene-state";
import { scrollToId } from "../SmoothScroll";

const EASE = [0.22, 1, 0.36, 1] as const;
const D = 1.7; // after the preloader lifts

function Line({ children, delay, className = "" }: { children: React.ReactNode; delay: number; className?: string }) {
  return (
    <span className="block overflow-hidden pb-[0.08em]">
      <motion.span
        className={`block ${className}`}
        initial={{ y: "110%", rotate: 3 }}
        animate={{ y: "0%", rotate: 0 }}
        transition={{ delay: D + delay, duration: 1.4, ease: EASE }}
      >
        {children}
      </motion.span>
    </span>
  );
}

export default function Hero() {
  const variant = useVariant();

  return (
    <section id="hero" className="relative z-10 flex min-h-[100svh] flex-col justify-end overflow-hidden px-4 pb-8 pt-24 sm:px-8 md:justify-center md:px-12 md:pb-12">
      {/* vertical Japanese wordmark */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: D + 0.8, duration: 1.6 }}
        className="vertical-jp absolute right-4 top-28 hidden font-mincho text-sm text-gold/70 sm:block md:right-12"
      >
        お茶のパウダー
      </motion.p>

      <div className="relative mx-auto w-full max-w-[1600px]">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: D + 0.2, duration: 1, ease: EASE }}
          className="mb-6 flex items-center gap-4 text-[10px] uppercase tracking-[0.42em] text-gold md:mb-10"
        >
          <span className="h-px w-10 bg-gold/60" />
          Imperial &amp; Ceremonial Matcha · Kyūshū, Japan
        </motion.p>

        <h1 className="font-display font-light leading-[0.86] tracking-[-0.02em] text-cream">
          <Line delay={0} className="text-[19vw] md:text-[11.5vw]">
            Ocha
          </Line>
          <Line delay={0.12} className="text-[19vw] italic md:pl-[8vw] md:text-[11.5vw]">
            no <span className="gold-text not-italic">Pauda</span>
          </Line>
        </h1>

        <div className="mt-8 grid gap-8 md:mt-14 md:max-w-xl md:grid-cols-[1fr_auto] md:items-end">
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: D + 0.6, duration: 1.2, ease: EASE }}
            className="max-w-sm text-sm leading-relaxed text-cream/65 md:text-[15px]"
          >
            Two matchas. One obsession. Getsukō, an imperial grade from Yame, Fukuoka — and Saemidori, a ceremonial grade from
            Kagoshima. Shade-grown, vivid, impossibly smooth.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: D + 0.8, duration: 1.2, ease: EASE }}
          className="mt-8 flex flex-wrap items-center gap-3 md:mt-10"
        >
          <button
            onClick={() => scrollToId("collection")}
            className="group relative overflow-hidden rounded-full bg-cream px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-abyss"
          >
            <span className="relative z-10">Discover the tins</span>
            <span className="absolute inset-0 translate-y-full bg-gold transition-transform duration-700 ease-luxe group-hover:translate-y-0" />
          </button>
          <button
            onClick={() => scrollToId("shop")}
            className="rounded-full border border-cream/25 px-7 py-4 text-[11px] uppercase tracking-[0.3em] text-cream transition-colors duration-500 hover:border-gold hover:text-gold-soft"
          >
            Shop now
          </button>
        </motion.div>

        {/* tin switch */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: D + 1.1, duration: 1.2 }}
          className="mt-10 flex items-center gap-5 md:absolute md:bottom-0 md:right-0 md:mt-0"
        >
          <span className="text-[10px] uppercase tracking-[0.36em] text-cream/45">Choose your tin</span>
          {(
            [
              { v: "red", label: "Getsukō", jp: "月光", swatch: "bg-[radial-gradient(circle_at_30%_30%,#e2564f,#8e1410)]" },
              { v: "silver", label: "Saemidori", jp: "冴", swatch: "bg-[radial-gradient(circle_at_30%_30%,#f4f4f6,#8d8f94)]" },
            ] as const
          ).map((o) => (
            <button
              key={o.v}
              onClick={() => variantStore.set(o.v)}
              className={`group flex items-center gap-2.5 rounded-full border py-1.5 pl-1.5 pr-4 transition-all duration-500 ${
                variant === o.v ? "border-gold/70 bg-cream/5" : "border-cream/10 hover:border-cream/30"
              }`}
              aria-pressed={variant === o.v}
            >
              <span className={`h-7 w-7 rounded-full shadow-inner ${o.swatch}`} />
              <span className="text-left leading-none">
                <span className="block font-display text-base">{o.label}</span>
                <span className="block font-mincho text-[10px] text-gold/70">{o.jp}</span>
              </span>
            </button>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: D + 1.4, duration: 1 }}
        className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 md:flex"
      >
        <span className="text-[9px] uppercase tracking-[0.5em] text-cream/40">Scroll</span>
        <span className="relative h-12 w-px overflow-hidden bg-cream/10">
          <span className="absolute inset-x-0 top-0 h-1/2 animate-[scrollcue_2.2s_ease-in-out_infinite] bg-gold" />
        </span>
      </motion.div>
    </section>
  );
}
