"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useCart } from "@/lib/cart";
import { SETTINGS, formatQAR, productById } from "@/lib/products";
import { autoWhatsapp, emailOrder, newOrderId, orderText, smsLink, whatsappLink, type Order } from "@/lib/orders";
import { lenis } from "./SmoothScroll";

type Step = "bag" | "details" | "done";

export default function CartDrawer() {
  const { open, setOpen, lines, subtotal, count, setQty, remove, clear } = useCart();
  const [step, setStep] = useState<Step>("bag");
  const [order, setOrder] = useState<{ id: string; wa: string | null; sms: string | null } | null>(null);
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (open) {
      lenis?.stop();
      document.documentElement.style.overflow = "hidden";
    } else {
      lenis?.start();
      document.documentElement.style.overflow = "";
      const t = setTimeout(() => setStep((s) => (s === "done" ? "bag" : s)), 600);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const placeOrder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const get = (k: string) => String(f.get(k) || "").trim();
    const o: Order = {
      id: newOrderId(),
      lines: lines.map((l) => {
        const p = productById(l.id)!;
        return { name: p.name, qty: l.qty, price: p.price };
      }),
      subtotal,
      customer: { name: get("name"), phone: get("phone"), email: get("email"), address: get("address") },
    };
    setPlacing(true);
    // email the owner straight away (if set up in the owner menu)
    if (SETTINGS.emailKey) await emailOrder(SETTINGS.emailKey, o);
    // automatic WhatsApp to the owner (CallMeBot) — the customer doesn't send anything
    const auto = !!(SETTINGS.whatsapp && SETTINGS.autoWhatsappKey);
    if (auto) await autoWhatsapp(SETTINGS.whatsapp, SETTINGS.autoWhatsappKey, orderText(o));
    // otherwise hand the order to the customer's WhatsApp / Messages, addressed to the owner
    const wa = SETTINGS.whatsapp && !auto ? whatsappLink(SETTINGS.whatsapp, orderText(o)) : null;
    const sms = SETTINGS.whatsapp && !auto ? smsLink(SETTINGS.whatsapp, orderText(o)) : null;
    setOrder({ id: o.id, wa, sms });
    clear();
    setPlacing(false);
    setStep("done");
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="scrim"
            className="fixed inset-0 z-[70] bg-abyss/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            onClick={() => setOpen(false)}
          />
          <motion.aside
            key="drawer"
            role="dialog"
            aria-label="Shopping bag"
            className="fixed inset-y-0 right-0 z-[80] flex w-full max-w-[480px] flex-col border-l border-gold/15 bg-forest text-cream shadow-2xl"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
            data-lenis-prevent
          >
            <header className="flex items-center justify-between border-b border-cream/10 px-6 py-6 sm:px-8">
              <div>
                <p className="font-mincho text-xs tracking-[0.4em] text-gold">お買い物</p>
                <h2 className="font-display text-3xl font-light italic">
                  {step === "done" ? "Thank you" : step === "details" ? "Delivery" : "Your bag"}
                </h2>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="grid h-10 w-10 place-items-center rounded-full border border-cream/15 transition-colors hover:border-gold"
                aria-label="Close bag"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" stroke="currentColor" strokeWidth="1.2">
                  <path d="M1 1l12 12M13 1L1 13" />
                </svg>
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6 sm:px-8">
              <AnimatePresence mode="wait">
                {step === "bag" && (
                  <motion.div key="bag" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                    {lines.length === 0 ? (
                      <div className="flex h-[50vh] flex-col items-center justify-center text-center">
                        <p className="font-mincho text-6xl text-gold/40">空</p>
                        <p className="mt-6 font-display text-2xl italic text-cream/80">Your bag is waiting.</p>
                        <p className="mt-2 text-sm text-cream/50">Getsukō and Saemidori are ready when you are.</p>
                      </div>
                    ) : (
                      <ul className="space-y-5">
                        <AnimatePresence initial={false}>
                          {lines.map((l) => {
                            const p = productById(l.id)!;
                            return (
                              <motion.li
                                key={l.id}
                                layout
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 40, height: 0, marginTop: 0 }}
                                className="flex gap-4"
                              >
                                <div className={`relative h-24 w-20 shrink-0 overflow-hidden rounded-sm ${p.light ? "bg-paper" : "bg-abyss"}`}>
                                  <Image src={p.image} alt={p.name} fill sizes="80px" className={`object-contain p-1.5 ${p.light ? "mix-blend-multiply" : ""}`} />
                                </div>
                                <div className="flex flex-1 flex-col justify-between">
                                  <div className="flex justify-between gap-3">
                                    <div>
                                      <p className="font-display text-xl leading-tight">{p.name}</p>
                                      <p className="mt-0.5 text-xs text-cream/50">{p.subtitle}</p>
                                    </div>
                                    <p className="whitespace-nowrap text-sm text-gold-soft">{formatQAR(p.price * l.qty)}</p>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center rounded-full border border-cream/15">
                                      <button onClick={() => setQty(l.id, l.qty - 1)} className="h-8 w-8 text-cream/70 hover:text-cream" aria-label="Decrease">
                                        −
                                      </button>
                                      <span className="w-6 text-center text-sm tabular-nums">{l.qty}</span>
                                      <button onClick={() => setQty(l.id, l.qty + 1)} className="h-8 w-8 text-cream/70 hover:text-cream" aria-label="Increase">
                                        +
                                      </button>
                                    </div>
                                    <button onClick={() => remove(l.id)} className="text-[10px] uppercase tracking-[0.24em] text-cream/40 hover:text-cream">
                                      Remove
                                    </button>
                                  </div>
                                </div>
                              </motion.li>
                            );
                          })}
                        </AnimatePresence>
                      </ul>
                    )}
                  </motion.div>
                )}

                {step === "details" && (
                  <motion.form
                    key="details"
                    id="checkout"
                    onSubmit={placeOrder}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-5"
                  >
                    {[
                      { n: "name", l: "Full name", t: "text", a: "name" },
                      { n: "phone", l: "Phone", t: "tel", a: "tel" },
                      { n: "email", l: "Email", t: "email", a: "email" },
                      { n: "address", l: "Delivery address", t: "text", a: "street-address" },
                    ].map((f) => (
                      <label key={f.n} className="block">
                        <span className="text-[10px] uppercase tracking-[0.28em] text-cream/50">{f.l}</span>
                        <input
                          required
                          name={f.n}
                          type={f.t}
                          autoComplete={f.a}
                          className="mt-2 w-full border-b border-cream/20 bg-transparent pb-2 font-display text-xl text-cream outline-none transition-colors placeholder:text-cream/20 focus:border-gold"
                        />
                      </label>
                    ))}
                    <p className="pt-2 text-xs leading-relaxed text-cream/45">
                      Payment is collected on delivery. We&apos;ll confirm your order by phone.
                    </p>
                  </motion.form>
                )}

                {step === "done" && (
                  <motion.div
                    key="done"
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex h-[55vh] flex-col items-center justify-center text-center"
                  >
                    <motion.svg width="84" height="84" viewBox="0 0 84 84" className="text-gold">
                      <motion.circle cx="42" cy="42" r="40" fill="none" stroke="currentColor" strokeWidth="1" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 1.2 }} />
                      <motion.path d="M27 43l10 10 20-22" fill="none" stroke="currentColor" strokeWidth="1.5" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8, duration: 0.6 }} />
                    </motion.svg>
                    {order?.wa ? (
                      <>
                        <p className="mt-8 font-display text-3xl italic">One last step.</p>
                        <p className="mt-3 max-w-xs text-sm text-cream/60">
                          Send order {order.id} to us — it&apos;s all filled in, just tap Send.
                        </p>
                        <a
                          href={order.wa}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-6 inline-flex items-center gap-3 rounded-full bg-[#25D366] px-7 py-4 text-[11px] font-semibold uppercase tracking-[0.25em] text-[#062b16]"
                        >
                          Send on WhatsApp
                        </a>
                        {order.sms && (
                          <a href={order.sms} className="mt-4 text-xs uppercase tracking-[0.2em] text-cream/70 underline underline-offset-4">
                            or send by text message
                          </a>
                        )}
                      </>
                    ) : (
                      <>
                        <p className="mt-8 font-display text-3xl italic">She&apos;s on her way.</p>
                        <p className="mt-3 text-sm text-cream/60">Order {order?.id} is confirmed.</p>
                      </>
                    )}
                    <p className="mt-1 font-mincho text-sm tracking-[0.3em] text-gold/80">ありがとうございます</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {step !== "done" && (
              <footer className="border-t border-cream/10 px-6 py-6 sm:px-8">
                <div className="mb-1 flex justify-between text-sm text-cream/60">
                  <span>
                    {count} item{count === 1 ? "" : "s"}
                  </span>
                  <span>Delivery calculated at confirmation</span>
                </div>
                <div className="mb-5 flex items-baseline justify-between">
                  <span className="text-[11px] uppercase tracking-[0.28em]">Subtotal</span>
                  <span className="font-display text-3xl text-gold-soft">{formatQAR(subtotal)}</span>
                </div>
                {step === "bag" ? (
                  <button
                    disabled={!lines.length}
                    onClick={() => setStep("details")}
                    className="group relative w-full overflow-hidden rounded-full bg-gold py-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-abyss transition-opacity disabled:opacity-30"
                  >
                    <span className="relative z-10">Checkout</span>
                    <span className="absolute inset-0 -translate-x-full bg-gold-soft transition-transform duration-700 ease-luxe group-hover:translate-x-0" />
                  </button>
                ) : (
                  <div className="flex gap-3">
                    <button onClick={() => setStep("bag")} className="rounded-full border border-cream/20 px-6 text-[11px] uppercase tracking-[0.24em] hover:border-gold">
                      Back
                    </button>
                    <button
                      form="checkout"
                      type="submit"
                      disabled={placing}
                      className="flex-1 rounded-full bg-gold py-4 text-[11px] font-semibold uppercase tracking-[0.3em] text-abyss transition-opacity disabled:opacity-60"
                    >
                      {placing ? "Placing order…" : "Place order"}
                    </button>
                  </div>
                )}
              </footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
