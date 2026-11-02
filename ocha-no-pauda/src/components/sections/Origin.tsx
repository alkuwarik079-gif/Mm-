"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const ORIGINS = [
  {
    jp: "八女",
    place: "Yame, Fukuoka",
    coords: "33.21° N · 130.56° E",
    tea: "Getsukō",
    grade: "Imperial Grade",
    cultivar: "Okumidori · Yabukita",
    body: "Misty river valleys and cool nights give Yame leaves their famous depth: a full-bodied, nutty umami with a whisper of dark chocolate.",
    image: "/img/red-tin.jpg",
    tone: "bg-[#fcf4df]",
  },
  {
    jp: "鹿児島",
    place: "Kagoshima",
    coords: "31.60° N · 130.56° E",
    tea: "Saemidori",
    grade: "Ceremonial Grade",
    cultivar: "Saemidori",
    body: "Volcanic soil and southern sun at the tip of Kyūshū. The Saemidori cultivar is prized for its vivid colour, natural sweetness and buttery texture.",
    image: "/img/silver-tin.jpg",
    tone: "bg-[#fdfdfd]",
  },
];

const HIGHLIGHTS = [
  { k: "01", jp: "覆", t: "Shade-grown", d: "Tea bushes are covered before harvest, deepening chlorophyll and L-theanine for colour and umami." },
  { k: "02", jp: "碾", t: "Finely milled", d: "Leaves are de-stemmed and slowly milled to a silk-fine powder that whisks into a dense, velvet foam." },
  { k: "03", jp: "純", t: "100% tencha", d: "Nothing added. No sugar, no fillers, no flavourings — just pure Japanese green tea leaf." },
  { k: "04", jp: "産", t: "Single origin", d: "Each tin is traceable to one region of Kyūshū, so every cup tastes of exactly where it grew." },
];

export default function Origin() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
        gsap.fromTo(
          el,
          { y: 60, opacity: 0 },
          { y: 0, opacity: 1, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } },
        );
      });
      gsap.utils.toArray<HTMLElement>("[data-mask]").forEach((el) => {
        gsap.fromTo(
          el,
          { clipPath: "inset(18% 12% 18% 12%)" },
          { clipPath: "inset(0% 0% 0% 0%)", ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "center center", scrub: true } },
        );
        const img = el.querySelector("img");
        if (img) gsap.fromTo(img, { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } });
      });
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="origin" className="relative z-10 bg-cream px-4 py-28 text-forest sm:px-8 md:px-12 md:py-40">
      <div className="mx-auto max-w-[1600px]">
        <div className="grid gap-10 md:grid-cols-12" data-reveal>
          <p className="text-[10px] uppercase tracking-[0.42em] text-jade md:col-span-3">Origin · 産地</p>
          <h2 className="font-display text-5xl font-light leading-[0.95] tracking-tight sm:text-6xl md:col-span-9 md:text-[6.5vw]">
            Two corners of <em className="text-jade">Kyūshū.</em>
            <br />
            Two very different <em>characters.</em>
          </h2>
        </div>

        <div className="mt-20 grid gap-16 md:mt-28 md:grid-cols-2 md:gap-10">
          {ORIGINS.map((o, i) => (
            <article key={o.place} className={i === 1 ? "md:mt-40" : ""}>
              <div data-mask className={`relative aspect-[4/5] overflow-hidden ${o.tone}`}>
                <Image src={o.image} alt={`${o.tea} tin`} fill sizes="(min-width: 768px) 45vw, 100vw" className="object-contain p-[14%]" />
                <span className="absolute left-5 top-5 font-mincho text-5xl text-forest/80 vertical-jp">{o.jp}</span>
                <span className="absolute bottom-5 right-5 text-[10px] uppercase tracking-[0.32em] text-forest/60">{o.coords}</span>
              </div>
              <div data-reveal className="mt-8 grid grid-cols-[1fr_auto] gap-6">
                <div>
                  <p className="text-[10px] uppercase tracking-[0.36em] text-jade">{o.grade}</p>
                  <h3 className="mt-2 font-display text-4xl italic md:text-5xl">{o.place}</h3>
                  <p className="mt-4 max-w-md text-sm leading-relaxed text-forest/70">{o.body}</p>
                </div>
                <dl className="text-right">
                  <dt className="text-[9px] uppercase tracking-[0.3em] text-forest/45">Tea</dt>
                  <dd className="font-display text-xl">{o.tea}</dd>
                  <dt className="mt-3 text-[9px] uppercase tracking-[0.3em] text-forest/45">Cultivar</dt>
                  <dd className="font-display text-xl">{o.cultivar}</dd>
                </dl>
              </div>
            </article>
          ))}
        </div>

        <div className="mt-28 grid gap-px overflow-hidden border border-forest/10 bg-forest/10 sm:grid-cols-2 lg:grid-cols-4 md:mt-40">
          {HIGHLIGHTS.map((h) => (
            <div key={h.k} data-reveal className="group relative bg-cream p-8 transition-colors duration-700 hover:bg-forest hover:text-cream">
              <div className="flex items-start justify-between">
                <span className="text-[10px] tracking-[0.3em] text-jade transition-colors group-hover:text-gold">{h.k}</span>
                <span className="font-mincho text-4xl text-forest/15 transition-colors duration-700 group-hover:text-gold/60">{h.jp}</span>
              </div>
              <h4 className="mt-16 font-display text-3xl italic">{h.t}</h4>
              <p className="mt-3 text-sm leading-relaxed opacity-70">{h.d}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
