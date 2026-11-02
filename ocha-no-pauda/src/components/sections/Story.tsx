"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { asset } from "@/lib/asset";

gsap.registerPlugin(ScrollTrigger);

export default function Story() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>("[data-speed]").forEach((el) => {
        const sp = parseFloat(el.dataset.speed || "0");
        gsap.fromTo(el, { yPercent: sp * 30 }, { yPercent: -sp * 30, ease: "none", scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true } });
      });
      gsap.fromTo(
        "[data-ichigo] span",
        { yPercent: 110 },
        { yPercent: 0, stagger: 0.08, duration: 1.4, ease: "expo.out", scrollTrigger: { trigger: "[data-ichigo]", start: "top 80%" } },
      );
      gsap.utils.toArray<HTMLElement>("[data-fade]").forEach((el) =>
        gsap.fromTo(el, { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 1.2, ease: "expo.out", scrollTrigger: { trigger: el, start: "top 85%" } }),
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section ref={root} id="story" className="relative z-10 overflow-hidden bg-abyss px-4 py-28 sm:px-8 md:px-12 md:py-44">
      <span className="text-outline pointer-events-none absolute -right-[6vw] top-10 select-none font-mincho text-[40vw] leading-none opacity-60 md:text-[26vw]" data-speed="0.6" aria-hidden>
        一期一会
      </span>

      <div className="relative mx-auto max-w-[1600px]">
        <p className="text-[10px] uppercase tracking-[0.42em] text-gold">Our Story · 物語</p>
        <h2 data-ichigo className="mt-6 font-display text-[15vw] font-light leading-[0.86] md:text-[9vw]">
          <span className="block overflow-hidden"><span className="block">Ichigo</span></span>
          <span className="block overflow-hidden"><span className="block italic text-gold-soft md:pl-[10vw]">ichie.</span></span>
        </h2>
        <p data-fade className="mt-6 max-w-sm font-display text-2xl italic text-cream/70">
          一期一会 — &ldquo;one time, one meeting.&rdquo; Every bowl is a moment that will never happen quite the same way again.
        </p>

        <div className="mt-24 grid gap-6 md:mt-32 md:grid-cols-12 md:gap-8">
          <figure className="relative aspect-[3/4] overflow-hidden rounded-sm md:col-span-5 md:row-span-2" data-fade>
            <div className="absolute -inset-y-[15%] inset-x-0" data-speed="0.25">
              <Image src={asset("/img/whisks-dark.jpg")} alt="Chasen whisks with star charms in their cases" fill sizes="(min-width: 768px) 40vw, 100vw" className="object-cover" />
            </div>
            <figcaption className="absolute bottom-4 left-4 text-[9px] uppercase tracking-[0.3em] text-cream/70">茶筅 · Chasen</figcaption>
          </figure>

          <div className="flex flex-col justify-center md:col-span-6 md:col-start-7" data-fade>
            <p className="font-mincho text-sm tracking-[0.4em] text-gold">茶の湯</p>
            <h3 className="mt-4 font-display text-4xl font-light leading-tight md:text-5xl">
              For centuries, <em>chanoyu</em> — the way of tea — has turned the simplest act into something sacred.
            </h3>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-cream/65">
              Warm the bowl. Sift the powder. Listen to the whisk. Japanese tea culture asks you to slow down and pay attention: to the
              colour, the foam, the first sip. Ocha no Pauda — literally &ldquo;tea powder&rdquo; — brings that ritual to your counter
              without the ceremony being a barrier. Imperial and ceremonial matcha, an honest bamboo whisk, and the oat milk that makes it
              sing.
            </p>
            <div className="mt-10 grid grid-cols-2 gap-6 border-t sm:grid-cols-4 border-cream/10 pt-8">
              {[
                ["和", "Wa", "Harmony"],
                ["敬", "Kei", "Respect"],
                ["清", "Sei", "Purity"],
                ["寂", "Jaku", "Tranquility"],
              ].map(([k, r, e]) => (
                <div key={r}>
                  <p className="font-mincho text-3xl text-gold">{k}</p>
                  <p className="mt-2 font-display text-xl italic">{r}</p>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-cream/45">{e}</p>
                </div>
              ))}
            </div>
          </div>

          <figure className="relative aspect-[16/10] overflow-hidden rounded-sm md:col-span-6 md:col-start-7" data-fade>
            <div className="absolute -inset-y-[15%] inset-x-0" data-speed="0.2">
              <Image src={asset("/img/shelf.jpg")} alt="Shakers, silver tins and whisks on the Ocha no Pauda shelf" fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover object-[50%_40%]" />
            </div>
            <figcaption className="absolute bottom-4 left-4 text-[9px] uppercase tracking-[0.3em] text-cream/70">The shelf · 棚</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
