"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart";
import { productById } from "@/lib/products";

export default function Toast() {
  const { lastAdded, setOpen, open } = useCart();
  const [show, setShow] = useState<typeof lastAdded>(null);

  useEffect(() => {
    if (!lastAdded || open) return;
    setShow(lastAdded);
    const t = setTimeout(() => setShow(null), 3200);
    return () => clearTimeout(t);
  }, [lastAdded, open]);

  const p = show ? productById(show.id) : null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-5 z-[65] flex justify-center px-4">
    <AnimatePresence>
      {p && (
        <motion.button
          key={show!.at}
          onClick={() => {
            setShow(null);
            setOpen(true);
          }}
          initial={{ y: 40, opacity: 0, filter: "blur(8px)" }}
          animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
          exit={{ y: 20, opacity: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-auto flex w-full max-w-sm items-center gap-4 rounded-full border border-gold/25 bg-forest/90 py-2 pl-2 pr-6 text-left shadow-2xl backdrop-blur-xl"
        >
          <span className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full ${p.light ? "bg-paper" : "bg-abyss"}`}>
            <Image src={p.image} alt="" fill sizes="48px" className={`object-contain p-1 ${p.light ? "mix-blend-multiply" : ""}`} />
          </span>
          <span className="flex-1">
            <span className="block text-[10px] uppercase tracking-[0.28em] text-gold">Added to bag</span>
            <span className="block font-display text-lg leading-tight">{p.name}</span>
          </span>
          <span className="text-[10px] uppercase tracking-[0.24em] text-cream/60">View</span>
        </motion.button>
      )}
    </AnimatePresence>
    </div>
  );
}
