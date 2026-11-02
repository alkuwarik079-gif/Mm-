"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { stage } from "@/lib/scene-state";
import { ensureFonts } from "../three/textures";
import Hero from "./Hero";
import Manifesto from "./Manifesto";
import Collection from "./Collection";

const HeroScene = dynamic(() => import("../three/HeroScene"), { ssr: false });

gsap.registerPlugin(ScrollTrigger);

/**
 * The hero, manifesto and collection share one sticky WebGL canvas, so the tin
 * glides between them as a single continuous shot.
 */
export default function Stage() {
  const root = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    let alive = true;
    ensureFonts().then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const bind = (trigger: string, key: "hero" | "manifesto" | "collection", start: string, end: string) =>
        ScrollTrigger.create({
          trigger,
          start,
          end,
          scrub: true,
          onUpdate: (s) => {
            stage[key] = s.progress;
          },
        });
      bind("#hero", "hero", "top top", "bottom top");
      bind("#manifesto", "manifesto", "top bottom", "bottom bottom");
      bind("#collection", "collection", "top bottom", "top top");
    }, root);
    return () => ctx.revert();
  }, []);

  // pause rendering entirely once the stage is off-screen
  useEffect(() => {
    if (!root.current) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "200px" });
    io.observe(root.current);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={root} className="stage-bg relative" id="top">
      <div className="pointer-events-none sticky top-0 z-0 -mb-[100svh] h-[100svh] w-full">
        <div className={`h-full w-full transition-opacity duration-[1500ms] ${ready ? "opacity-100" : "opacity-0"}`}>
          {ready && visible && <HeroScene />}
        </div>
      </div>
      <Hero />
      <Manifesto />
      <Collection />
    </div>
  );
}
