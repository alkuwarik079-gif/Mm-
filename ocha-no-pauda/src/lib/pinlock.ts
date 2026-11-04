/**
 * Keeps the owner's GitHub key on *their* device only, locked with a PIN they choose.
 * The key is encrypted with AES-GCM using a key derived from the PIN (PBKDF2-SHA-256),
 * so nothing secret — not the key, not the PIN — is ever part of the public website.
 * After MAX_TRIES wrong PINs the stored key is erased.
 */

const STORE = "onp-owner-lock-v1";
const LEGACY_PLAIN = "onp-owner-key"; // earlier versions kept the key unencrypted
export const MAX_TRIES = 5;
const ITERATIONS = 310_000;

type Locked = { salt: string; iv: string; ct: string; fails: number };

const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string): Uint8Array<ArrayBuffer> => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

function read(): Locked | null {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? (JSON.parse(raw) as Locked) : null;
  } catch {
    return null;
  }
}
function write(v: Locked | null) {
  try {
    if (v) localStorage.setItem(STORE, JSON.stringify(v));
    else localStorage.removeItem(STORE);
  } catch {}
}

async function deriveKey(pin: string, salt: Uint8Array<ArrayBuffer>) {
  const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(pin), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: ITERATIONS, hash: "SHA-256" },
    base,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export const hasLockedKey = () => !!read();

/** a key saved in plain text by an older version of the owner menu, if any */
export function takeLegacyKey(): string {
  try {
    const t = localStorage.getItem(LEGACY_PLAIN) || "";
    localStorage.removeItem(LEGACY_PLAIN);
    return t;
  } catch {
    return "";
  }
}

export async function lockKey(token: string, pin: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(pin, salt);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(token)));
  write({ salt: b64(salt), iv: b64(iv), ct: b64(ct), fails: 0 });
}

export class WrongPin extends Error {
  constructor(public triesLeft: number) {
    super(triesLeft > 0 ? `Wrong PIN. ${triesLeft} ${triesLeft === 1 ? "try" : "tries"} left.` : "Too many wrong PINs.");
  }
}

/** returns the GitHub key, or throws WrongPin (and erases the key after MAX_TRIES) */
export async function unlockKey(pin: string): Promise<string> {
  const v = read();
  if (!v) throw new WrongPin(0);
  try {
    const key = await deriveKey(pin, unb64(v.salt));
    const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(v.iv) }, key, unb64(v.ct));
    write({ ...v, fails: 0 });
    return new TextDecoder().decode(pt);
  } catch {
    const fails = v.fails + 1;
    if (fails >= MAX_TRIES) {
      write(null);
      throw new WrongPin(0);
    }
    write({ ...v, fails });
    throw new WrongPin(MAX_TRIES - fails);
  }
}

export const forgetKey = () => write(null);
