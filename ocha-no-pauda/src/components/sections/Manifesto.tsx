"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

const LINES = [
  { text: "She's creamy.", italic: false },
  { text: "She's nutty.", italic: true },
  { text: "She's velvety.", italic: false },
  { text: "With a dark chocolate finish.", italic: true, small: true },
];

export default function Manifesto() {
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const words = gsap.utils.toArray<HTMLElement>("[data-word]");
      gsap.fromTo(
        words,
        { opacity: 0.08, filter: "blur(6px)", y: 20 },
        {
          opacity: 1,
          filter: "blur(0px)",
          y: 0,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top 60%", end: "bottom bottom", scrub: 0.6 },
        },
      );
      gsap.fromTo(
        "[data-kanji]",
        { yPercent: 20, opacity: 0 },
        {
          yPercent: -20,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: root.current, start: "top bottom", end: "bottom top", scrub: true },
        },
      );
      // fade the words away as the section leaves, so they never slide across the tin
      gsap.to("[data-manifesto-copy]", {
        opacity: 0,
        y: -40,
        ease: "none",
        scrollTrigger: { trigger: root.current, start: "bottom bottom", end: "bottom 55%", scrub: true },
      });
      gsap.fromTo(
        "[data-kicker]",
        { opacity: 0 },
        { opacity: 1, scrollTrigger: { trigger: root.current, start: "top 40%", end: "top 10%", scrub: true } },
      );
    }, root);
    return () => ctx.revert();
  }, []);

  return (
    <section id="manifesto" ref={root} className="relative z-10 h-[260svh]">
      <div className="sticky top-0 flex h-[100svh] items-end justify-center overflow-hidden px-4 pb-16 sm:px-8 md:items-center md:justify-start md:px-12 md:pb-0">
        <span
          data-kanji
          className="text-outline pointer-events-none absolute select-none font-mincho md:right-[4vw] text-[62vw] leading-none md:text-[36vw]"
          aria-hidden
        >
          月光
        </span>
        <div data-manifesto-copy className="relative mx-auto w-full max-w-[1600px] text-center md:text-left">
          <p data-kicker className="mb-8 text-[10px] uppercase tracking-[0.5em] text-gold">Getsukō · Imperial Grade</p>
          <h2 className="font-display font-light leading-[0.98] text-cream">
            {LINES.map((l, i) => (
              <span
                key={i}
                className={`block ${l.italic ? "italic" : ""} ${
                  l.small ? "mt-6 text-[7vw] text-gold-soft md:text-[3.4vw]" : "text-[12vw] md:text-[6.6vw]"
                }`}
              >
                {l.text.split(" ").map((w, j) => (
                  <span key={j} data-word className="inline-block will-change-transform">
                    {w}&nbsp;
                  </span>
                ))}
              </span>
            ))}
          </h2>
          <p data-word className="mx-auto mt-10 max-w-md text-sm md:mx-0 leading-relaxed text-cream/60">
            Imperial grade matcha, straight from Fukuoka, Japan. And she&apos;s here.
          </p>
        </div>
      </div>
    </section>
  );
}
