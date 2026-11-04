"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Flavor, Matcha, Product } from "@/lib/products";
import { resolveImage } from "@/lib/products";
import { asset } from "@/lib/asset";
import {
  APP_DIR,
  REPO,
  STORE_PATH,
  checkToken,
  latestPublish,
  photoToJpegBase64,
  readJson,
  writeFile,
  writeJson,
  type RunState,
} from "@/lib/github";
import { MAX_TRIES, WrongPin, forgetKey, hasLockedKey, lockKey, takeLegacyKey, unlockKey } from "@/lib/pinlock";

type StoreMatcha = Omit<Matcha, "price">;
type Store = { matchas: StoreMatcha[]; products: Product[] };

const CATEGORIES: Product["category"][] = ["Matcha", "Ritual", "Syrup", "Oat Milk"];
const FLAVORS: (keyof Flavor)[] = ["umami", "sweetness", "bitterness", "aroma", "creaminess"];

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40) || "item";

/* ─────────────────────────────── small UI bits ─────────────────────────────── */

const field =
  "mt-1.5 w-full rounded-lg border border-cream/15 bg-abyss/60 px-3 py-2.5 text-[15px] text-cream outline-none transition-colors placeholder:text-cream/25 focus:border-gold";

function Label({ title, children, hint }: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="text-[11px] uppercase tracking-[0.2em] text-cream/55">{title}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-cream/40">{hint}</span>}
    </label>
  );
}

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className="flex items-center gap-3 rounded-full border border-cream/15 py-1.5 pl-1.5 pr-4 text-sm"
      aria-pressed={on}
    >
      <span className={`relative h-6 w-10 rounded-full transition-colors ${on ? "bg-gold" : "bg-cream/15"}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream transition-all ${on ? "left-[18px]" : "left-0.5"}`} />
      </span>
      {label}
    </button>
  );
}

/* ──────────────────────────────── sign-in ──────────────────────────────── */

function SignIn({ onSignedIn, notice }: { onSignedIn: (t: string) => void; notice?: string }) {
  const [key, setKey] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      await checkToken(key.trim());
      onSignedIn(key.trim());
    } catch (e) {
      setErr(e instanceof Error ? e.message : "That key didn't work.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <p className="font-mincho text-sm tracking-[0.4em] text-gold">管理</p>
      <h1 className="mt-3 font-display text-5xl font-light italic">Owner menu</h1>
      <p className="mt-4 text-sm leading-relaxed text-cream/65">
        First time on this phone: paste your GitHub key once. Next you’ll choose a PIN, and after that you only need the PIN. Changes you save update the live website in about 2 minutes.
      </p>

      {notice && <p className="mt-6 rounded-lg bg-lacquer/20 px-3 py-2 text-sm text-cream">{notice}</p>}
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Label title="GitHub key">
          <input
            className={field}
            type="password"
            autoComplete="off"
            placeholder="github_pat_…"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            required
          />
        </Label>
        {err && <p className="rounded-lg bg-lacquer/20 px-3 py-2 text-sm text-cream">{err}</p>}
        <button disabled={busy} className="w-full rounded-full bg-gold py-3.5 text-xs font-semibold uppercase tracking-[0.25em] text-abyss disabled:opacity-60">
          {busy ? "Checking…" : "Sign in"}
        </button>
      </form>

      <details className="mt-10 rounded-xl border border-cream/10 bg-abyss/40 p-5 text-sm leading-relaxed text-cream/70">
        <summary className="cursor-pointer font-medium text-cream">How do I get a key? (one time, ~1 minute)</summary>
        <ol className="mt-4 list-decimal space-y-2 pl-5">
          <li>
            In a browser, open{" "}
            <a className="text-gold underline" href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer">
              github.com/settings/personal-access-tokens/new
            </a>{" "}
            (signed in as {REPO.split("/")[0]}).
          </li>
          <li>Name it “Website owner menu”. Set Expiration to the longest option.</li>
          <li>
            Repository access → <b>Only select repositories</b> → choose <b>{REPO.split("/")[1]}</b>.
          </li>
          <li>
            Permissions → Repository permissions → <b>Contents: Read and write</b> and <b>Actions: Read-only</b>.
          </li>
          <li>Press Generate token, copy it, and paste it above.</li>
        </ol>
      </details>
    </div>
  );
}

/* ───────────────────────────── product editor ───────────────────────────── */

function PhotoPicker({
  value,
  preview,
  onPick,
  busy,
}: {
  value: string;
  preview?: string;
  onPick: (f: File) => void;
  busy: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="flex items-center gap-4">
      <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg bg-paper">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {(preview || value) && <img src={preview || resolveImage(value)} alt="" className="h-full w-full object-contain" />}
      </div>
      <div>
        <button
          type="button"
          onClick={() => input.current?.click()}
          disabled={busy}
          className="rounded-full border border-cream/20 px-4 py-2 text-xs uppercase tracking-[0.2em] hover:border-gold disabled:opacity-50"
        >
          {busy ? "Uploading…" : "Change photo"}
        </button>
        <p className="mt-1.5 text-xs text-cream/40">JPG or PNG from your phone.</p>
      </div>
      <input
        ref={input}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

function ProductCard({
  p,
  i,
  count,
  preview,
  uploading,
  update,
  move,
  remove,
  pickPhoto,
}: {
  p: Product;
  i: number;
  count: number;
  preview?: string;
  uploading: boolean;
  update: (patch: Partial<Product>) => void;
  move: (dir: -1 | 1) => void;
  remove: () => void;
  pickPhoto: (f: File) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li className={`rounded-2xl border bg-forest/70 ${p.hidden ? "border-cream/5 opacity-60" : "border-cream/10"}`}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 p-4 text-left">
        <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-md bg-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview || resolveImage(p.image)} alt="" className="h-full w-full object-contain" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-display text-xl">{p.name || "New product"}</span>
          <span className="block text-xs text-cream/50">
            {p.price} QAR · {p.category}
            {p.soldOut && " · SOLD OUT"}
            {p.hidden && " · hidden"}
          </span>
        </span>
        <span className="text-cream/40">{open ? "▲" : "▼"}</span>
      </button>

      {open && (
        <div className="space-y-4 border-t border-cream/10 p-4">
          <div className="flex flex-wrap gap-2">
            <Toggle on={!!p.soldOut} onChange={(v) => update({ soldOut: v })} label="Sold out" />
            <Toggle on={!p.hidden} onChange={(v) => update({ hidden: !v })} label="Show in shop" />
          </div>
          <Label title="Name">
            <input className={field} value={p.name} onChange={(e) => update({ name: e.target.value })} />
          </Label>
          <div className="grid grid-cols-2 gap-3">
            <Label title="Price (QAR)">
              <input
                className={field}
                type="number"
                inputMode="decimal"
                min={0}
                value={p.price}
                onChange={(e) => update({ price: Number(e.target.value) || 0 })}
              />
            </Label>
            <Label title="Category">
              <select className={field} value={p.category} onChange={(e) => update({ category: e.target.value as Product["category"] })}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </Label>
          </div>
          <Label title="Short description">
            <input className={field} value={p.subtitle} onChange={(e) => update({ subtitle: e.target.value })} />
          </Label>
          <Label title="Badge" hint="Small tag on the photo, e.g. New, كمية محدودة. Leave empty for none.">
            <input className={field} dir="auto" value={p.badge || ""} onChange={(e) => update({ badge: e.target.value || undefined })} />
          </Label>
          <Label title="Extra note" hint="Optional line under the name (English or Arabic).">
            <input
              className={field}
              dir="auto"
              value={p.note || ""}
              onChange={(e) => {
                const v = e.target.value;
                update({ note: v || undefined, noteDir: /[؀-ۿ]/.test(v) ? "rtl" : undefined });
              }}
            />
          </Label>
          <PhotoPicker value={p.image} preview={preview} busy={uploading} onPick={pickPhoto} />
          <Toggle on={!!p.light} onChange={(v) => update({ light: v })} label="Photo has a white background" />

          <div className="flex flex-wrap gap-2 border-t border-cream/10 pt-4">
            <button type="button" disabled={i === 0} onClick={() => move(-1)} className="rounded-full border border-cream/15 px-4 py-2 text-xs disabled:opacity-30">
              ↑ Move up
            </button>
            <button type="button" disabled={i === count - 1} onClick={() => move(1)} className="rounded-full border border-cream/15 px-4 py-2 text-xs disabled:opacity-30">
              ↓ Move down
            </button>
            <button
              type="button"
              onClick={() => confirm(`Delete “${p.name}” from the shop?`) && remove()}
              className="ml-auto rounded-full border border-lacquer/60 px-4 py-2 text-xs text-[#ff9b93]"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

function MatchaCard({ m, update }: { m: StoreMatcha; update: (patch: Partial<StoreMatcha>) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-2xl border border-cream/10 bg-forest/70">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-4 p-4 text-left">
        <span className={`h-10 w-10 shrink-0 rounded-full ${m.variant === "red" ? "bg-[radial-gradient(circle_at_30%_30%,#e2564f,#8e1410)]" : "bg-[radial-gradient(circle_at_30%_30%,#f4f4f6,#8d8f94)]"}`} />
        <span className="flex-1">
          <span className="block font-display text-xl">{m.name}</span>
          <span className="block text-xs text-cream/50">{m.grade} · tasting notes & flavour</span>
        </span>
        <span className="text-cream/40">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="space-y-4 border-t border-cream/10 p-4">
          <p className="text-xs text-cream/45">The price of this tin is set in Products below.</p>
          <div className="grid grid-cols-2 gap-3">
            <Label title="Grade">
              <input className={field} value={m.grade} onChange={(e) => update({ grade: e.target.value })} />
            </Label>
            <Label title="Weight">
              <input className={field} value={m.weight} onChange={(e) => update({ weight: e.target.value })} />
            </Label>
            <Label title="Origin">
              <input className={field} value={m.origin} onChange={(e) => update({ origin: e.target.value })} />
            </Label>
            <Label title="Cultivar">
              <input className={field} value={m.cultivar} onChange={(e) => update({ cultivar: e.target.value })} />
            </Label>
          </div>
          <Label title="Headline">
            <input className={field} value={m.tagline} onChange={(e) => update({ tagline: e.target.value })} />
          </Label>
          <Label title="Description">
            <textarea className={`${field} min-h-28`} value={m.description} onChange={(e) => update({ description: e.target.value })} />
          </Label>
          <Label title="Tasting notes" hint="Separate with commas.">
            <input
              className={field}
              value={m.notes.join(", ")}
              onChange={(e) => update({ notes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })}
            />
          </Label>
          <div>
            <span className="text-[11px] uppercase tracking-[0.2em] text-cream/55">Flavour (⚡ 1–5)</span>
            <div className="mt-2 space-y-2">
              {FLAVORS.map((k) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <span className="text-sm capitalize">{k}</span>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        type="button"
                        onClick={() => update({ flavor: { ...m.flavor, [k]: n } })}
                        className={`h-9 w-9 rounded-full text-sm ${n <= m.flavor[k] ? "bg-gold text-abyss" : "bg-cream/10 text-cream/40"}`}
                        aria-label={`${k} ${n}`}
                      >
                        ⚡
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </li>
  );
}

/* ──────────────────────────────── the menu ──────────────────────────────── */

type Status = { kind: "idle" | "busy" | "ok" | "error"; text: string };

function OwnerMenu({ token, signOut }: { token: string; signOut: () => void }) {
  const [store, setStore] = useState<Store | null>(null);
  const [saved, setSaved] = useState<string>("");
  const [sha, setSha] = useState<string>("");
  const [status, setStatus] = useState<Status>({ kind: "idle", text: "" });
  const [publish, setPublish] = useState<RunState | null>(null);
  // photo previews by image path, so a fresh upload still shows before the site has republished
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<number | null>(null);

  const dirty = useMemo(() => !!store && JSON.stringify(store) !== saved, [store, saved]);

  const load = useCallback(async () => {
    setStatus({ kind: "busy", text: "Loading your shop…" });
    try {
      const { data, sha } = await readJson<Store>(token, STORE_PATH);
      setStore(data);
      setSaved(JSON.stringify(data));
      setSha(sha);
      setStatus({ kind: "idle", text: "" });
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Couldn't load the shop." });
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // keep an eye on the latest publish so the owner knows when changes are live
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const r = await latestPublish(token);
        if (alive) setPublish(r);
      } catch {}
    };
    tick();
    const id = setInterval(tick, 15000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, [token]);

  // warn before leaving with unsaved edits
  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  const setProducts = (fn: (ps: Product[]) => Product[]) => setStore((s) => (s ? { ...s, products: fn(s.products) } : s));

  const pickPhoto = async (index: number, file: File) => {
    if (!store) return;
    setUploading(index);
    try {
      const { b64, preview } = await photoToJpegBase64(file);
      const name = `${Date.now()}-${slug(store.products[index].name || "photo")}.jpg`;
      await writeFile(token, `${APP_DIR}/public/img/uploads/${name}`, b64, `Owner menu: upload photo ${name}`);
      setPreviews((p) => ({ ...p, [`/img/uploads/${name}`]: preview }));
      setProducts((ps) => ps.map((p, j) => (j === index ? { ...p, image: `/img/uploads/${name}` } : p)));
      setStatus({ kind: "idle", text: "Photo uploaded — press Save to use it." });
    } catch (e) {
      setStatus({ kind: "error", text: e instanceof Error ? e.message : "Upload failed." });
    } finally {
      setUploading(null);
    }
  };

  const addProduct = () => {
    if (!store) return;
    const base = "new-product";
    let id = base;
    let n = 2;
    while (store.products.some((p) => p.id === id)) id = `${base}-${n++}`;
    const p: Product = {
      id,
      name: "",
      subtitle: "",
      price: 0,
      image: "/img/cup.jpg",
      category: "Ritual",
      light: true,
      soldOut: false,
      hidden: true,
    };
    setProducts((ps) => [...ps, p]);
    setStatus({ kind: "idle", text: "New product added at the bottom (hidden until you switch on “Show in shop”)." });
  };

  const save = async () => {
    if (!store) return;
    // give brand-new products a proper id from their name
    const ids = new Set<string>();
    const products = store.products.map((p) => {
      let id = p.id.startsWith("new-product") && p.name ? slug(p.name) : p.id;
      let n = 2;
      while (ids.has(id)) id = `${slug(p.name)}-${n++}`;
      ids.add(id);
      return { ...p, id };
    });
    const bad = products.find((p) => !p.name.trim());
    if (bad) {
      setStatus({ kind: "error", text: "Every product needs a name before saving." });
      return;
    }
    const next = { ...store, products };
    setStatus({ kind: "busy", text: "Saving…" });
    try {
      const newSha = await writeJson(token, STORE_PATH, next, "Owner menu: update shop", sha);
      setSha(newSha);
      setStore(next);
      setSaved(JSON.stringify(next));
      setStatus({ kind: "ok", text: "Saved. The website is updating — it will be live in about 2 minutes." });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Save failed.";
      setStatus({
        kind: "error",
        text: /sha|does not match/i.test(msg) ? "The shop was changed somewhere else. Reload, then make your change again." : msg,
      });
    }
  };

  const publishLabel = (() => {
    if (!publish) return null;
    if (publish.status !== "completed") return { tone: "text-gold", text: "Website updating…" };
    if (publish.conclusion === "success") return { tone: "text-[#9bd8a6]", text: "Website is live and up to date" };
    return { tone: "text-[#ff9b93]", text: "Last update failed — press Save again to retry" };
  })();

  return (
    <div className="mx-auto max-w-2xl px-4 pb-40 pt-8">
      <header className="flex items-center justify-between gap-4">
        <div>
          <p className="font-mincho text-xs tracking-[0.4em] text-gold">管理 · Owner</p>
          <h1 className="font-display text-4xl font-light italic">Your shop</h1>
        </div>
        <div className="flex items-center gap-2">
          <a href={asset("/")} target="_blank" rel="noreferrer" className="rounded-full border border-cream/15 px-4 py-2 text-xs">
            View site
          </a>
          <button
            onClick={() => {
              if (dirty && !confirm("You have unsaved changes. Lock anyway?")) return;
              signOut();
            }}
            className="rounded-full border border-cream/15 px-4 py-2 text-xs"
          >
            Lock
          </button>
        </div>
      </header>

      {publishLabel && <p className={`mt-3 text-sm ${publishLabel.tone}`}>● {publishLabel.text}</p>}

      {!store ? (
        <p className="mt-10 text-cream/60">{status.text || "Loading…"}</p>
      ) : (
        <>
          <section className="mt-8">
            <h2 className="mb-3 text-[11px] uppercase tracking-[0.3em] text-cream/50">Matcha tins</h2>
            <ul className="space-y-3">
              {store.matchas.map((m, i) => (
                <MatchaCard
                  key={m.id}
                  m={m}
                  update={(patch) => setStore((s) => (s ? { ...s, matchas: s.matchas.map((x, j) => (j === i ? { ...x, ...patch } : x)) } : s))}
                />
              ))}
            </ul>
          </section>

          <section className="mt-10">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-[11px] uppercase tracking-[0.3em] text-cream/50">Products · {store.products.length}</h2>
              <button onClick={addProduct} className="rounded-full bg-cream px-4 py-2 text-xs font-semibold text-abyss">
                + Add product
              </button>
            </div>
            <ul className="space-y-3">
              {store.products.map((p, i) => (
                <ProductCard
                  key={`${p.id}-${i}`}
                  p={p}
                  i={i}
                  count={store.products.length}
                  preview={previews[p.image]}
                  uploading={uploading === i}
                  update={(patch) => setProducts((ps) => ps.map((x, j) => (j === i ? { ...x, ...patch } : x)))}
                  move={(dir) =>
                    setProducts((ps) => {
                      const a = [...ps];
                      const [x] = a.splice(i, 1);
                      a.splice(i + dir, 0, x);
                      return a;
                    })
                  }
                  remove={() => setProducts((ps) => ps.filter((_, j) => j !== i))}
                  pickPhoto={(f) => pickPhoto(i, f)}
                />
              ))}
            </ul>
          </section>
        </>
      )}

      {/* sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-cream/10 bg-abyss px-4 pb-[max(16px,env(safe-area-inset-bottom))] pt-3">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <p
            className={`min-w-0 flex-1 text-sm ${
              status.kind === "error" ? "text-[#ff9b93]" : status.kind === "ok" ? "text-[#9bd8a6]" : "text-cream/60"
            }`}
          >
            {status.text || (dirty ? "You have unsaved changes." : "All changes saved.")}
          </p>
          {status.kind === "error" && (
            <button onClick={load} className="rounded-full border border-cream/20 px-4 py-3 text-xs">
              Reload
            </button>
          )}
          <button
            onClick={save}
            disabled={!dirty || status.kind === "busy"}
            className="rounded-full bg-gold px-7 py-3 text-xs font-semibold uppercase tracking-[0.25em] text-abyss disabled:opacity-40"
          >
            {status.kind === "busy" ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────── PIN screens ────────────────────────────── */

const pinField = `${field} text-center text-2xl tracking-[0.6em]`;
const onlyDigits = (v: string) => v.replace(/\D/g, "").slice(0, 8);

function SetPin({ token, onDone }: { token: string; onDone: () => void }) {
  const [pin, setPin] = useState("");
  const [again, setAgain] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4) return setErr("Use at least 4 numbers.");
    if (pin !== again) return setErr("The two PINs don’t match.");
    setBusy(true);
    try {
      await lockKey(token, pin);
      onDone();
    } catch {
      setErr("Couldn’t save the PIN on this phone. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <p className="font-mincho text-sm tracking-[0.4em] text-gold">暗証番号</p>
      <h1 className="mt-3 font-display text-5xl font-light italic">Choose a PIN</h1>
      <p className="mt-4 text-sm leading-relaxed text-cream/65">
        From now on you’ll open the owner menu on this phone with this PIN. It never leaves this phone.
      </p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Label title="New PIN (4–8 numbers)">
          <input className={pinField} type="password" inputMode="numeric" autoComplete="new-password" value={pin} onChange={(e) => setPin(onlyDigits(e.target.value))} required />
        </Label>
        <Label title="Type it again">
          <input className={pinField} type="password" inputMode="numeric" autoComplete="new-password" value={again} onChange={(e) => setAgain(onlyDigits(e.target.value))} required />
        </Label>
        {err && <p className="rounded-lg bg-lacquer/20 px-3 py-2 text-sm text-cream">{err}</p>}
        <button disabled={busy} className="w-full rounded-full bg-gold py-3.5 text-xs font-semibold uppercase tracking-[0.25em] text-abyss disabled:opacity-60">
          {busy ? "Saving…" : "Save PIN"}
        </button>
      </form>
    </div>
  );
}

function Unlock({ onUnlocked, onForget }: { onUnlocked: (t: string) => void; onForget: (msg?: string) => void }) {
  const [pin, setPin] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      onUnlocked(await unlockKey(pin));
    } catch (e) {
      setPin("");
      if (e instanceof WrongPin && e.triesLeft === 0) onForget(`Too many wrong PINs (${MAX_TRIES}), so this phone forgot your key. Paste your GitHub key again.`);
      else setErr(e instanceof Error ? e.message : "Wrong PIN.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-sm px-5 py-16">
      <p className="font-mincho text-sm tracking-[0.4em] text-gold">管理</p>
      <h1 className="mt-3 font-display text-5xl font-light italic">Owner menu</h1>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <Label title="Enter your PIN">
          <input className={pinField} type="password" inputMode="numeric" autoComplete="current-password" autoFocus value={pin} onChange={(e) => setPin(onlyDigits(e.target.value))} required />
        </Label>
        {err && <p className="rounded-lg bg-lacquer/20 px-3 py-2 text-sm text-cream">{err}</p>}
        <button disabled={busy || pin.length < 4} className="w-full rounded-full bg-gold py-3.5 text-xs font-semibold uppercase tracking-[0.25em] text-abyss disabled:opacity-60">
          {busy ? "Opening…" : "Open"}
        </button>
      </form>
      <button
        onClick={() => confirm("Forget the key on this phone? You’ll need to paste your GitHub key again.") && onForget()}
        className="mt-8 text-xs text-cream/45 underline"
      >
        Forgot PIN? Use my GitHub key instead
      </button>
    </div>
  );
}

type Phase =
  | { at: "loading" }
  | { at: "key"; notice?: string }
  | { at: "set-pin"; token: string }
  | { at: "pin" }
  | { at: "menu"; token: string };

export default function AdminPage() {
  const [phase, setPhase] = useState<Phase>({ at: "loading" });

  useEffect(() => {
    const legacy = takeLegacyKey();
    if (legacy) setPhase({ at: "set-pin", token: legacy });
    else setPhase(hasLockedKey() ? { at: "pin" } : { at: "key" });
  }, []);

  const forget = (notice?: string) => {
    forgetKey();
    setPhase({ at: "key", notice });
  };

  return (
    <main className="min-h-[100svh] bg-abyss text-cream">
      {phase.at === "key" && <SignIn notice={phase.notice} onSignedIn={(token) => setPhase({ at: "set-pin", token })} />}
      {phase.at === "set-pin" && <SetPin token={phase.token} onDone={() => setPhase({ at: "menu", token: phase.token })} />}
      {phase.at === "pin" && <Unlock onUnlocked={(token) => setPhase({ at: "menu", token })} onForget={forget} />}
      {phase.at === "menu" && <OwnerMenu token={phase.token} signOut={() => setPhase(hasLockedKey() ? { at: "pin" } : { at: "key" })} />}
    </main>
  );
}
