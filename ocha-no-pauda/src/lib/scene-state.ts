import type { TinVariant } from "./products";

/**
 * Mutable, render-loop friendly state shared between GSAP ScrollTriggers
 * (writers) and React Three Fiber useFrame callbacks (readers).
 * Kept outside React to avoid re-rendering on every scroll tick.
 */
export const stage = {
  hero: 0, // 0 → 1 as the hero scrolls out
  manifesto: 0, // 0 → 1 through the manifesto section
  collection: 0, // 0 → 1 as the collection scrolls into place
  pointerX: 0,
  pointerY: 0,
};

export const ritual = {
  progress: 0, // 0 → 1 across the pinned ritual sequence
};

type Listener = (v: TinVariant) => void;
let current: TinVariant = "red";
const listeners = new Set<Listener>();

export const variantStore = {
  get: () => current,
  set: (v: TinVariant) => {
    if (v === current) return;
    current = v;
    listeners.forEach((l) => l(v));
  },
  subscribe: (l: Listener) => {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
