import * as THREE from "three";
import type { TinVariant } from "@/lib/products";
import { asset } from "@/lib/asset";

/**
 * All tin artwork is drawn procedurally onto canvases so the 3D model
 * stays sharp at any size and needs no external texture downloads.
 * Each body canvas matches that tin's circumference : height ratio,
 * so type is never stretched.
 */

/** Proportions taken from the product photos. */
export const TIN_DIMS: Record<TinVariant, { r: number; h: number; lid: number }> = {
  // Saemidori: measured from the product photo — about as tall as it is wide
  silver: { r: 0.8, h: 1.32, lid: 0.42 },
  // Getsukō: slightly squatter red lacquer tin with a shorter lid
  red: { r: 0.8, h: 1.45, lid: 0.4 },
};

export const BODY_W = 3072;
const bodyH = (v: TinVariant) => Math.round((BODY_W * TIN_DIMS[v].h) / (Math.PI * 2 * TIN_DIMS[v].r));
const pxPerUnit = (v: TinVariant) => BODY_W / (Math.PI * 2 * TIN_DIMS[v].r);

let SERIF = '"Times New Roman", serif';
let SANS = '"Helvetica Neue", Arial, sans-serif';
let JP = '"Hiragino Mincho ProN", "Yu Mincho", serif';
let TIN = SERIF;

/** artwork cut straight from the product photos (label unwrapped from the curved tin) */
const IMAGES: { label?: HTMLImageElement; sticker?: HTMLImageElement; redSticker?: HTMLImageElement } = {};
function loadImage(src: string) {
  return new Promise<HTMLImageElement | undefined>((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(undefined);
    img.src = src;
  });
}

/** paint `img` onto ctx as a solid colour, using the image's alpha as the shape */
function stamp(ctx: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, color: string) {
  const [t, tc] = canvas(Math.ceil(w), Math.ceil(h));
  tc.drawImage(img, 0, 0, w, h);
  tc.globalCompositeOperation = "source-in";
  tc.fillStyle = color;
  tc.fillRect(0, 0, w, h);
  ctx.drawImage(t, x, y);
}

/** next/font hashes family names, so read the real stacks from CSS variables */
function resolveFonts() {
  const cs = getComputedStyle(document.documentElement);
  const v = (name: string, fb: string) => cs.getPropertyValue(name).trim() || fb;
  SERIF = v("--font-serif", SERIF);
  SANS = v("--font-sans", SANS);
  JP = v("--font-jp", JP);
  TIN = v("--font-tin", SERIF);
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return [c, c.getContext("2d")!] as const;
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


/** fine satin grain, like the bead-blasted finish on the silver tin */
function grain(ctx: CanvasRenderingContext2D, w: number, h: number, base: [number, number, number], amount: number) {
  const img = ctx.createImageData(w, h);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const n = (Math.random() - 0.5) * amount;
    d[i] = base[0] + n;
    d[i + 1] = base[1] + n;
    d[i + 2] = base[2] + n;
    d[i + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
}

/** the little cream character sticker on the Saemidori lid */
function drawSticker(ctx: CanvasRenderingContext2D, cx: number, cy: number, s: number) {
  const pink = "#dc8fb2";
  const cream = "#f7f0d8";
  const shapes: [number, number, number, number, number][] = [
    // x, y, rx, ry, rotation  (head, body, arm, legs)
    [-0.18, -0.2, 0.36, 0.3, -0.15],
    [0.02, 0.12, 0.5, 0.3, 0.05],
    [0.34, 0.2, 0.2, 0.16, 0.3],
    [-0.38, 0.22, 0.16, 0.14, 0],
  ];
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(s, s);
  // pink outline: stroke every blob thickly, then fill them all in cream
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 0.13;
  for (const [x, y, rx, ry, r] of shapes) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.strokeStyle = pink;
  ctx.lineWidth = 0.05;
  for (const [x, y, rx, ry, r] of shapes) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = cream;
  for (const [x, y, rx, ry, r] of shapes) {
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // green matcha cup held in front
  ctx.fillStyle = "#6fae4f";
  ctx.strokeStyle = pink;
  ctx.lineWidth = 0.025;
  ctx.beginPath();
  ctx.roundRect(-0.08, -0.02, 0.2, 0.2, 0.04);
  ctx.fill();
  ctx.stroke();
  // hands around the cup
  ctx.fillStyle = cream;
  for (const hx of [-0.12, 0.14]) {
    ctx.beginPath();
    ctx.ellipse(hx, 0.1, 0.07, 0.06, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  // sleepy face
  ctx.strokeStyle = pink;
  ctx.lineWidth = 0.022;
  ctx.lineCap = "round";
  for (const ex of [-0.3, -0.12]) {
    ctx.beginPath();
    ctx.arc(ex, -0.24, 0.035, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  ctx.restore();
}

export type TinTextures = {
  map: THREE.Texture;
  mask: THREE.Texture; // G = roughness, B = metalness
  lidTop: THREE.Texture;
  lidInner: THREE.Texture;
};

export function makeTinTextures(variant: TinVariant): TinTextures {
  resolveFonts();
  const BODY_H = bodyH(variant);
  const PX = pxPerUnit(variant);
  const [c, ctx] = canvas(BODY_W, BODY_H);
  const [m, mctx] = canvas(BODY_W, BODY_H);
  const cx = BODY_W / 2;

  if (variant === "silver") {
    // ── matte satin silver body ────────────────────────────
    grain(ctx, BODY_W, BODY_H, [196, 197, 199], 30);
    // soft vertical tonal banding so the light reads as a satin finish
    const band = ctx.createLinearGradient(0, 0, 0, BODY_H);
    band.addColorStop(0, "rgba(255,255,255,0.06)");
    band.addColorStop(0.5, "rgba(0,0,0,0.03)");
    band.addColorStop(1, "rgba(0,0,0,0.08)");
    ctx.fillStyle = band;
    ctx.fillRect(0, 0, BODY_W, BODY_H);
    grain(mctx, BODY_W, BODY_H, [0, 125, 150], 30);
    // keep the blue (metal) channel steady after grain
    const md = mctx.getImageData(0, 0, BODY_W, BODY_H);
    for (let i = 0; i < md.data.length; i += 4) {
      md.data[i] = 0;
      md.data[i + 2] = 150;
    }
    mctx.putImageData(md, 0, 0);

    if (IMAGES.label) {
      // the real label, unwrapped from the photo; sized from the tin height so it
      // keeps the same place and proportions as on the real tin
      const H = TIN_DIMS.silver.h;
      const lh = 0.49 * H * PX;
      const lw = lh * (0.98 / 0.78);
      const lx = cx - lw / 2;
      const ly = 0.385 * H * PX;
      ctx.drawImage(IMAGES.label, lx, ly, lw, lh);
      stamp(mctx, IMAGES.label, lx, ly, lw, lh, "rgb(0,225,0)");
    } else {
      // ── pale yellow scalloped label, sitting low on the body ──
      const lw = 1.08 * PX;
      const lh = 0.74 * PX;
      const lx = cx - lw / 2;
      const ly = BODY_H * 0.64 - lh / 2;
      scallopPath(ctx, lx, ly, lw, lh, 8);
      ctx.fillStyle = "#ece08f";
      ctx.fill();
      // faint paper texture
      ctx.save();
      ctx.clip();
      for (let i = 0; i < 900; i++) {
        ctx.fillStyle = `rgba(120,100,20,${Math.random() * 0.05})`;
        ctx.fillRect(lx + Math.random() * lw, ly + Math.random() * lh, 2, 2);
      }
      ctx.restore();
      scallopPath(mctx, lx, ly, lw, lh, 8);
      mctx.fillStyle = "rgb(0,225,0)";
      mctx.fill();

      const L = (f: number) => lx + lw * f;
      const T = (f: number) => ly + lh * f;
      ctx.fillStyle = "#111008";
      ctx.textBaseline = "alphabetic";
      ctx.textAlign = "left";
      ctx.font = `600 19px ${JP}`;
      ctx.fillText("お茶のパウダー", L(0.07), T(0.15));
      ctx.font = `bold 30px Georgia, "Bookman Old Style", ${SERIF}`;
      ctx.fillText("茶", L(0.07), T(0.24));
      ctx.textAlign = "right";
      ctx.font = `800 19px ${SERIF}`;
      ctx.fillText("MATCHA", L(0.92), T(0.15));
      ctx.font = `600 16px ${JP}`;
      ctx.fillText("抹茶", L(0.92), T(0.4));
      ctx.textAlign = "left";
      ctx.font = `italic 800 70px ${SANS}`;
      ctx.fillText("OCHA NO PAUDA", L(0.05), T(0.36));
      ctx.textAlign = "center";
      ctx.font = `bold 44px Georgia, "Bookman Old Style", ${SERIF}`;
      ctx.fillText("Grade Ceremonial", L(0.5), T(0.52));
      ctx.textAlign = "left";
      ctx.font = `bold 42px Georgia, "Bookman Old Style", ${SERIF}`;
      ctx.fillText("Origin", L(0.07), T(0.66));
      ctx.fillText("Cultivar", L(0.07), T(0.79));
      ctx.textAlign = "right";
      ctx.fillText("Kagoshima", L(0.93), T(0.66));
      ctx.fillText("Saemidori", L(0.93), T(0.79));
      ctx.textAlign = "center";
      ctx.font = `700 20px ${SERIF}`;
      ctx.fillText("30g", L(0.5), T(0.93));
    }
  } else {
    // ── glossy red lacquer body ────────────────────────────
    const g = ctx.createLinearGradient(0, 0, 0, BODY_H);
    g.addColorStop(0, "#b4211a");
    g.addColorStop(0.55, "#c62c20");
    g.addColorStop(1, "#a91d16");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, BODY_W, BODY_H);
    // subtle orange-peel in the lacquer
    for (let i = 0; i < 40000; i++) {
      ctx.fillStyle = `rgba(${Math.random() > 0.5 ? "255,255,255" : "0,0,0"},0.025)`;
      ctx.fillRect(Math.random() * BODY_W, Math.random() * BODY_H, 2, 2);
    }
    mctx.fillStyle = "rgb(0,40,60)";
    mctx.fillRect(0, 0, BODY_W, BODY_H);

    // white print in a calligraphic upright serif, positioned like the real tin
    for (const [k, isMask] of [
      [ctx, false],
      [mctx, true],
    ] as const) {
      // printed ink: not metallic, slightly satin
      k.fillStyle = isMask ? "rgb(0,105,0)" : "#f4efe6";
      k.textAlign = "center";
      k.textBaseline = "alphabetic";
      k.font = `500 ${Math.round(0.21 * PX)}px ${TIN}`;
      k.fillText("Ocha no Pauda", cx, BODY_H * 0.57);
      k.font = `500 ${Math.round(0.075 * PX)}px ${TIN}`;
      const sub = "GETSUKŌ";
      const spacing = 0.012 * PX;
      const widths = [...sub].map((ch) => k.measureText(ch).width);
      const total = widths.reduce((a, b) => a + b, 0) + spacing * (sub.length - 1);
      let x = cx - total / 2;
      k.textAlign = "left";
      [...sub].forEach((ch, i) => {
        k.fillText(ch, x, BODY_H * 0.69);
        x += widths[i] + spacing;
      });
      k.textAlign = "center";
      k.font = `500 ${Math.round(0.075 * PX)}px ${TIN}`;
      k.fillText("30 g", cx, BODY_H * 0.79);

      // side print
      k.font = `500 ${Math.round(0.05 * PX)}px ${TIN}`;
      k.fillText("Imperial Grade Matcha", BODY_W * 0.17, BODY_H * 0.55);
      k.fillText("Okumidori · Yabukita", BODY_W * 0.17, BODY_H * 0.62);
      k.fillText("Yame, Fukuoka · Japan", BODY_W * 0.17, BODY_H * 0.69);
    }
  }

  // ── lid top ─────────────────────────────────────────────
  // 2048px so the stickers stay crisp; drawing coordinates stay in a 1024 space
  const [t, tctx] = canvas(2048, 2048);
  if (variant === "silver") {
    grain(tctx, 2048, 2048, [196, 197, 199], 28);
    tctx.scale(2, 2);
    if (IMAGES.sticker) {
      const w = 480;
      const h = (w * IMAGES.sticker.height) / IMAGES.sticker.width;
      tctx.drawImage(IMAGES.sticker, 512 - w / 2, 505 - h / 2, w, h);
    } else drawSticker(tctx, 512, 500, 420);
  } else {
    tctx.scale(2, 2);
    tctx.fillStyle = "#c22a1f";
    tctx.fillRect(0, 0, 1024, 1024);
    // pressed ring near the edge of the lid
    tctx.strokeStyle = "rgba(0,0,0,0.18)";
    tctx.lineWidth = 6;
    tctx.beginPath();
    tctx.arc(512, 512, 470, 0, Math.PI * 2);
    tctx.stroke();
    tctx.strokeStyle = "rgba(255,255,255,0.08)";
    tctx.lineWidth = 3;
    tctx.beginPath();
    tctx.arc(512, 512, 462, 0, Math.PI * 2);
    tctx.stroke();
    // the sticker on the real Getsukō lid, turned right side up
    if (IMAGES.redSticker) {
      const w = 560;
      const h = (w * IMAGES.redSticker.height) / IMAGES.redSticker.width;
      tctx.drawImage(IMAGES.redSticker, 512 - w / 2, 512 - h / 2, w, h);
    }
  }

  // ── lid underside ("Powered by matcha") ────────────────
  const [u, uctx] = canvas(1024, 1024);
  const ug = uctx.createRadialGradient(512, 512, 40, 512, 512, 620);
  ug.addColorStop(0, variant === "red" ? "#ece2c4" : "#e2e3e6");
  ug.addColorStop(1, variant === "red" ? "#bba478" : "#a9abb0");
  uctx.fillStyle = ug;
  uctx.fillRect(0, 0, 1024, 1024);
  uctx.fillStyle = "#e0b43a";
  bolt(uctx, 512, 420, 150);
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
  const imgs = Promise.all([
    loadImage(asset("/img/tin/silver-label.png")).then((i) => (IMAGES.label = i)),
    loadImage(asset("/img/tin/silver-sticker.png")).then((i) => (IMAGES.sticker = i)),
    loadImage(asset("/img/tin/red-sticker.png")).then((i) => (IMAGES.redSticker = i)),
  ]);
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load(`500 40px ${SERIF}`, sample),
        document.fonts.load(`600 40px ${SERIF}`, sample),
        document.fonts.load(`italic 800 40px ${SANS}`, sample),
        document.fonts.load(`500 40px ${JP}`, sample),
        document.fonts.load(`500 40px ${TIN}`, sample),
        document.fonts.load(`600 40px ${JP}`, sample),
      ]),
      new Promise((r) => setTimeout(r, 2500)),
    ]);
    await Promise.race([imgs, new Promise((r) => setTimeout(r, 4000))]);
  } catch {}
}
