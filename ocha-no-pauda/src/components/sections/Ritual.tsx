"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ritual } from "@/lib/scene-state";
import { asset } from "@/lib/asset";

const RitualScene = dynamic(() => import("../three/RitualScene"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

const STEPS = [
  { n: "一", jp: "篩", t: "Sift", m: "2 g", d: "Two bamboo scoops of matcha, sifted into a warmed chawan so not a single lump survives." },
  { n: "二", jp: "湯", t: "Pour", m: "70 ml · 75–80 °C", d: "Hot — never boiling — water. Too hot and you lose the sweetness; this is where umami lives." },
  { n: "三", jp: "点", t: "Whisk", m: "15–20 s", d: "Quick M-shaped strokes from the wrist with the chasen, until a fine, velvety micro-foam rises." },
  { n: "四", jp: "乳", t: "Finish", m: "Over ice", d: "Savour it straight, or pour over ice with Oatside Barista or No Moo oat milk and a drizzle of Okinawa brown sugar syrup." },
];

export default function Ritual() {
  const root = useRef<HTMLElement>(null);
  const [step, setStep] = useState(0);
  const [near, setNear] = useState(false);
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      ScrollTrigger.create({
        trigger: root.current,
        start: "top top",
        end: "bottom bottom",
        scrub: true,
        onUpdate: (s) => {
          ritual.progress = s.progress;
          setStep(Math.min(3, Math.floor(s.progress * 4)));
          if (bar.current) bar.current.style.transform = `scaleY(${s.progress})`;
        },
      });
    }, root);
    return () => ctx.revert();
  }, []);

  useEffect(() => {
    if (!root.current) return;
    const io = new IntersectionObserver(([e]) => setNear(e.isIntersecting), { rootMargin: "300px" });
    io.observe(root.current);
    return () => io.disconnect();
  }, []);

  const s = STEPS[step];

  return (
    <section ref={root} id="ritual" className="relative z-10 h-[420svh] bg-forest">
      <div className="sticky top-0 h-[100svh] overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(55%_60%_at_68%_55%,rgba(29,107,79,0.6),transparent_70%)]" />
        <div className="absolute inset-0 md:left-[35%]">{near && <RitualScene />}</div>

        <div className="relative mx-auto flex h-full max-w-[1600px] flex-col justify-between px-4 pb-8 pt-24 sm:px-8 md:justify-center md:px-12">
          <div className="md:max-w-md">
            <p className="flex items-center gap-4 text-[10px] uppercase tracking-[0.42em] text-gold">
              <span className="h-px w-10 bg-gold/60" />
              Matcha Guide · 点前
            </p>
            <h2 className="mt-5 font-display text-5xl font-light leading-[0.95] sm:text-6xl md:text-7xl">
              The <em className="gold-text">ritual,</em>
              <br />
              in four movements.
            </h2>
          </div>

          <div className="relative md:mt-16 md:max-w-md">
            <div className="flex gap-6">
              {/* progress rail */}
              <div className="relative hidden w-px bg-cream/10 md:block">
                <div ref={bar} className="absolute inset-0 origin-top scale-y-0 bg-gold" />
              </div>
              <div className="min-h-[220px] flex-1 rounded-2xl bg-abyss/40 p-5 backdrop-blur-md md:bg-transparent md:p-0 md:backdrop-blur-none">
                <div className="mb-5 flex gap-3">
                  {STEPS.map((x, i) => (
                    <span
                      key={x.n}
                      className={`grid h-9 w-9 place-items-center rounded-full border font-mincho text-sm transition-all duration-700 ${
                        i === step ? "border-gold bg-gold text-abyss" : i < step ? "border-gold/40 text-gold" : "border-cream/15 text-cream/40"
                      }`}
                    >
                      {x.n}
                    </span>
                  ))}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -14, filter: "blur(6px)" }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <div className="flex items-baseline gap-4">
                      <h3 className="font-display text-4xl italic md:text-5xl">{s.t}</h3>
                      <span className="font-mincho text-2xl text-gold/70">{s.jp}</span>
                    </div>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.3em] text-gold-soft">{s.m}</p>
                    <p className="mt-4 text-sm leading-relaxed text-cream/70">{s.d}</p>
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>

        {/* the real whisk, as a print in the corner */}
        <div className="absolute bottom-8 right-8 hidden h-56 w-40 overflow-hidden rounded-sm bg-paper shadow-2xl lg:block">
          <Image src={asset("/img/whisk.jpg")} alt="Ocha no Pauda chasen with gold star charm" fill sizes="160px" className="object-contain p-3 mix-blend-multiply" />
          <span className="absolute inset-x-0 bottom-0 bg-forest/90 px-3 py-2 text-[9px] uppercase tracking-[0.28em] text-cream">Chasen · star charm</span>
        </div>
      </div>
    </section>
  );
}
