"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { scrollToId } from "../SmoothScroll";

export default function Contact() {
  const [sent, setSent] = useState(false);

  return (
    <footer id="contact" className="relative z-10 overflow-hidden bg-abyss px-4 pb-10 pt-28 sm:px-8 md:px-12 md:pt-40">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-16 md:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.42em] text-gold">Contact · お問い合わせ</p>
            <h2 className="mt-6 font-display text-5xl font-light leading-[0.95] md:text-7xl">
              Be first for <em className="gold-text">the next drop.</em>
            </h2>
            <p className="mt-6 max-w-md text-sm leading-relaxed text-cream/60">
              Our tins arrive in small batches and leave quickly. Leave your details and we&apos;ll let you know the moment she&apos;s back —
              or write to us about wholesale, cafés and gifting.
            </p>
          </div>

          <div className="md:pt-14">
            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.form
                  key="form"
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={(e) => {
                    e.preventDefault();
                    setSent(true);
                  }}
                  className="space-y-8"
                >
                  <div className="grid gap-8 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.3em] text-cream/45">Name</span>
                      <input required name="name" autoComplete="name" className="mt-2 w-full border-b border-cream/20 bg-transparent pb-2 font-display text-2xl outline-none transition-colors focus:border-gold" />
                    </label>
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-[0.3em] text-cream/45">Email</span>
                      <input required type="email" name="email" autoComplete="email" className="mt-2 w-full border-b border-cream/20 bg-transparent pb-2 font-display text-2xl outline-none transition-colors focus:border-gold" />
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-[10px] uppercase tracking-[0.3em] text-cream/45">Message (optional)</span>
                    <textarea name="message" rows={2} className="mt-2 w-full resize-none border-b border-cream/20 bg-transparent pb-2 font-display text-2xl outline-none transition-colors focus:border-gold" />
                  </label>
                  <button className="group relative overflow-hidden rounded-full bg-gold px-10 py-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-abyss">
                    <span className="relative z-10">Send</span>
                    <span className="absolute inset-0 translate-y-full bg-cream transition-transform duration-700 ease-luxe group-hover:translate-y-0" />
                  </button>
                </motion.form>
              ) : (
                <motion.div key="thanks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="py-10">
                  <p className="font-mincho text-4xl text-gold">ありがとう</p>
                  <p className="mt-4 font-display text-3xl italic">You&apos;re on the list.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="hairline mt-28" />

        <div className="mt-10 grid gap-8 text-sm text-cream/55 sm:grid-cols-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-cream/35">Explore</p>
            <ul className="mt-3 space-y-1.5">
              {[
                ["Shop", "shop"],
                ["Our Story", "story"],
                ["Matcha Guide", "ritual"],
                ["Origin", "origin"],
              ].map(([l, id]) => (
                <li key={id}>
                  <button onClick={() => scrollToId(id)} className="transition-colors hover:text-gold-soft">
                    {l}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-cream/35">Follow</p>
            <ul className="mt-3 space-y-1.5">
              <li>
                <a href="https://www.instagram.com/" target="_blank" rel="noreferrer" className="transition-colors hover:text-gold-soft">
                  Instagram
                </a>
              </li>
            </ul>
          </div>
          <div className="sm:text-right">
            <p className="text-[10px] uppercase tracking-[0.3em] text-cream/35">Powered by matcha</p>
            <p className="mt-3 font-mincho tracking-[0.3em] text-gold/80">抹茶 · 月光 · 冴みどり</p>
          </div>
        </div>

        <p className="mt-20 select-none whitespace-nowrap text-center font-sans text-[13.5vw] font-extrabold italic leading-none tracking-tight text-outline">
          OCHA NO PAUDA
        </p>
        <p className="mt-6 text-center text-[10px] uppercase tracking-[0.3em] text-cream/30">© {new Date().getFullYear()} Ocha no Pauda · お茶のパウダー</p>
      </div>
    </footer>
  );
}
