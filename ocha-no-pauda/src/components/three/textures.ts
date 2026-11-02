import * as THREE from "three";
import type { TinVariant } from "@/lib/products";

/**
 * All tin artwork is drawn procedurally onto canvases so the 3D model
 * stays sharp at any size and needs no external texture downloads.
 *
 * Body canvas matches the body's circumference : height ratio,
 * so type is never stretched.
 */
export const TIN_R = 0.8;
export const TIN_H = 1.85;
export const BODY_W = 3072;
export const BODY_H = Math.round((BODY_W * TIN_H) / (Math.PI * 2 * TIN_R));
const PX = BODY_W / (Math.PI * 2 * TIN_R); // pixels per world unit

let SERIF = '"Times New Roman", serif';
let SANS = '"Helvetica Neue", Arial, sans-serif';
let JP = '"Hiragino Mincho ProN", "Yu Mincho", serif';

/** next/font hashes family names, so read the real stacks from CSS variables */
function resolveFonts() {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
  SERIF = v("--font-serif", SERIF);
  SANS = v("--font-sans", SANS);
  JP = v("--font-jp", JP);
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
}

function noise(ctx: CanvasRenderingContext2D, w: number, h: number, amount: number, vertical = true) {
  // fine brushed-metal streaks
  for (let i = 0; i < (vertical ? w : h) * 1.2; i++) {
    const a = Math.random() * amount;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    if (vertical) ctx.fillRect(Math.random() * w, 0, 1 + Math.random() * 2, h);
    else ctx.fillRect(0, Math.random() * h, w, 1);
  }
}

function scallopPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  // a postage-stamp style wavy edge, like the label on the silver tin
  const stepsX = Math.round(w / (r * 2.2));
  const stepsY = Math.round(h / (r * 2.2));
  const sx = w / stepsX;
  const sy = h / stepsY;
  ctx.beginPath();
  ctx.moveTo(x, y);
  for (let i = 0; i < stepsX; i++) ctx.quadraticCurveTo(x + sx * (i + 0.5), y - r, x + sx * (i + 1), y);
  for (let i = 0; i < stepsY; i++) ctx.quadraticCurveTo(x + w + r, y + sy * (i + 0.5), x + w, y + sy * (i + 1));
  for (let i = 0; i < stepsX; i++) ctx.quadraticCurveTo(x + w - sx * (i + 0.5), y + h + r, x + w - sx * (i + 1), y + h);
  for (let i = 0; i < stepsY; i++) ctx.quadraticCurveTo(x - r, y + h - sy * (i + 0.5), x, y + h - sy * (i + 1));
  ctx.closePath();
}

function bolt(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  ctx.beginPath();
  ctx.moveTo(cx + 0.18 * s, cy - 0.5 * s);
  ctx.lineTo(cx - 0.28 * s, cy + 0.06 * s);
  ctx.lineTo(cx - 0.02 * s, cy + 0.06 * s);
  ctx.lineTo(cx - 0.18 * s, cy + 0.5 * s);
  ctx.lineTo(cx + 0.28 * s, cy - 0.08 * s);
  ctx.lineTo(cx + 0.02 * s, cy - 0.08 * s);
  ctx.closePath();
}

function toTex(c: HTMLCanvasElement, srgb: boolean) {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

export type TinTextures = {
  map: THREE.Texture;
  mask: THREE.Texture; // G = roughness, B = metalness
  lidTop: THREE.Texture;
  lidInner: THREE.Texture;
};

export function makeTinTextures(variant: TinVariant): TinTextures {
  resolveFonts();
  const [c, ctx] = canvas(BODY_W, BODY_H);
  const [m, mctx] = canvas(BODY_W, BODY_H);
  const cx = BODY_W / 2;

  if (variant === "silver") {
    // ── brushed silver body ───────────────────────────────
    ctx.fillStyle = "#c9cacd";
    ctx.fillRect(0, 0, BODY_W, BODY_H);
    noise(ctx, BODY_W, BODY_H, 0.05, false);

    mctx.fillStyle = "rgb(0,80,255)";
    mctx.fillRect(0, 0, BODY_W, BODY_H);
    for (let i = 0; i < BODY_H; i += 1) {
      const g = 70 + Math.random() * 30;
      mctx.fillStyle = `rgb(0,${g},255)`;
      mctx.fillRect(0, i, BODY_W, 1);
    }

    // ── pale yellow scalloped label ───────────────────────
    const lw = 1.22 * PX;
    const lh = 0.56 * PX;
    const lx = cx - lw / 2;
    const ly = BODY_H * 0.6 - lh / 2;
    scallopPath(ctx, lx, ly, lw, lh, 9);
    ctx.fillStyle = "#efe6a2";
    ctx.fill();
    scallopPath(mctx, lx, ly, lw, lh, 9);
    mctx.fillStyle = "rgb(0,215,0)";
    mctx.fill();

    ctx.fillStyle = "#26231c";
    ctx.textBaseline = "alphabetic";
    ctx.font = `500 20px ${JP}`;
    ctx.textAlign = "left";
    ctx.fillText("お茶のパウダー", lx + 36, ly + 52);
    ctx.textAlign = "right";
    ctx.font = `600 18px ${SERIF}`;
    ctx.fillText("MATCHA", lx + lw - 36, ly + 52);
    ctx.textAlign = "left";
    ctx.font = `italic 800 62px ${SANS}`;
    ctx.fillText("OCHA NO PAUDA", lx + 34, ly + 112);
    ctx.font = `600 34px ${SERIF}`;
    ctx.fillText("Grade Ceremonial", lx + 110, ly + 160);
    ctx.font = `600 30px ${SERIF}`;
    ctx.fillText("Origin", lx + 36, ly + 200);
    ctx.fillText("Cultivar", lx + 36, ly + 236);
    ctx.textAlign = "right";
    ctx.fillText("Kagoshima", lx + lw - 40, ly + 200);
    ctx.fillText("Saemidori", lx + lw - 40, ly + 236);
    ctx.textAlign = "center";
    ctx.font = `600 22px ${SERIF}`;
    ctx.fillText("30g", cx, ly + 276);
  } else {
    // ── glossy red lacquer body ───────────────────────────
    const g = ctx.createLinearGradient(0, 0, 0, BODY_H);
    g.addColorStop(0, "#9c1612");
    g.addColorStop(0.5, "#b3221d");
    g.addColorStop(1, "#8e1410");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, BODY_W, BODY_H);
    mctx.fillStyle = "rgb(0,48,80)";
    mctx.fillRect(0, 0, BODY_W, BODY_H);

    const gold = (c2: CanvasRenderingContext2D, isMask: boolean) => {
      if (isMask) {
        c2.fillStyle = "rgb(0,95,150)";
        return;
      }
      const gg = c2.createLinearGradient(0, BODY_H * 0.3, 0, BODY_H * 0.8);
      gg.addColorStop(0, "#f2dfa6");
      gg.addColorStop(0.5, "#d4b06a");
      gg.addColorStop(1, "#b88f48");
      c2.fillStyle = gg;
    };

    for (const [k, isMask] of [
      [ctx, false],
      [mctx, true],
    ] as const) {
      gold(k, isMask);
      k.textAlign = "center";
      k.textBaseline = "alphabetic";
      k.font = `500 112px ${SERIF}`;
      k.fillText("Ocha no Pauda", cx, BODY_H * 0.53);
      k.font = `600 40px ${SERIF}`;
      // letter-spaced subtitle
      const sub = "GETSUKŌ";
      const spacing = 10;
      const widths = [...sub].map((ch) => k.measureText(ch).width);
      const total = widths.reduce((a, b) => a + b, 0) + spacing * (sub.length - 1);
      let x = cx - total / 2;
      k.textAlign = "left";
      [...sub].forEach((ch, i) => {
        k.fillText(ch, x, BODY_H * 0.65);
        x += widths[i] + spacing;
      });
      k.textAlign = "center";
      k.font = `500 38px ${SERIF}`;
      k.fillText("30 g", cx, BODY_H * 0.75);

      // side copy
      k.font = `500 30px ${SERIF}`;
      k.fillText("Imperial Grade Matcha", BODY_W * 0.16, BODY_H * 0.5);
      k.fillText("Okumidori · Yabukita", BODY_W * 0.16, BODY_H * 0.56);
      k.fillText("Yame, Fukuoka · Japan", BODY_W * 0.16, BODY_H * 0.62);
      k.font = `500 30px ${JP}`;
      k.fillText("月光 · 抹茶", BODY_W * 0.84, BODY_H * 0.56);
    }
  }

  // ── lid top emblem ──────────────────────────────────────
  const [t, tctx] = canvas(1024, 1024);
  if (variant === "silver") {
    // soft cream sticker with 茶 and a pink outline
    tctx.fillStyle = "#c9cacd";
    tctx.fillRect(0, 0, 1024, 1024);
    noise(tctx, 1024, 1024, 0.04);
    tctx.save();
    tctx.translate(512, 470);
    tctx.fillStyle = "#f5efd3";
    tctx.strokeStyle = "#d99ab8";
    tctx.lineWidth = 12;
    tctx.beginPath();
    tctx.ellipse(0, 0, 260, 190, -0.08, 0, Math.PI * 2);
    tctx.fill();
    tctx.stroke();
    tctx.fillStyle = "#7f9f3b";
    tctx.font = `600 220px ${JP}`;
    tctx.textAlign = "center";
    tctx.textBaseline = "middle";
    tctx.fillText("茶", 0, 10);
    tctx.restore();
  } else {
    tctx.fillStyle = "#ad1e19";
    tctx.fillRect(0, 0, 1024, 1024);
    tctx.strokeStyle = "rgba(226,196,128,0.75)";
    tctx.lineWidth = 4;
    tctx.beginPath();
    tctx.arc(512, 512, 330, 0, Math.PI * 2);
    tctx.stroke();
    tctx.fillStyle = "#e2c480";
    bolt(tctx, 512, 512, 300);
    tctx.fill();
  }

  // ── lid underside ("Powered by matcha") ────────────────
  const [u, uctx] = canvas(1024, 1024);
  const ug = uctx.createRadialGradient(512, 512, 40, 512, 512, 620);
  ug.addColorStop(0, variant === "red" ? "#e9dcb8" : "#e2e3e6");
  ug.addColorStop(1, variant === "red" ? "#b89f6c" : "#a9abb0");
  uctx.fillStyle = ug;
  uctx.fillRect(0, 0, 1024, 1024);
  uctx.fillStyle = "#e0b43a";
  bolt(uctx, 512, 430, 150);
  uctx.fill();
  uctx.fillStyle = "#3c3528";
  uctx.font = `500 54px ${SERIF}`;
  uctx.textAlign = "center";
  uctx.fillText("POWERED BY MATCHA", 512, 600);

  return {
    map: toTex(c, true),
    mask: toTex(m, false),
    lidTop: toTex(t, true),
    lidInner: toTex(u, true),
  };
}

/** a soft round sprite used for powder particles */
export function makeDotTexture() {
  const [c, ctx] = canvas(64, 64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.35, "rgba(255,255,255,0.6)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return toTex(c, false);
}

/** make sure the web fonts (incl. Japanese glyph ranges) are ready before drawing labels */
export async function ensureFonts() {
  if (typeof document === "undefined" || !document.fonts) return;
  resolveFonts();
  const sample = "Ocha no Pauda GETSUKŌ お茶のパウダー茶月光抹茶 30g";
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`500 40px ${SERIF}`, sample),
        document.fonts.load(`600 40px ${SERIF}`, sample),
        document.fonts.load(`italic 800 40px ${SANS}`, sample),
        document.fonts.load(`500 40px ${JP}`, sample),
        document.fonts.load(`600 40px ${JP}`, sample),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
  } catch {}
}
