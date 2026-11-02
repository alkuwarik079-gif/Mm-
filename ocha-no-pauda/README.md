# Ocha no Pauda — お茶のパウダー

Luxury matcha storefront built with **Next.js 15 · Tailwind CSS 4 · React Three Fiber · GSAP · Framer Motion · Lenis**.

```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## What's inside

| Section | Tech |
| --- | --- |
| Full-screen hero with a procedural 3D tin (red lacquer *Getsukō* / brushed silver *Saemidori*), metallic reflections, floating matcha particles, steam | R3F + drei, custom shaders |
| One sticky WebGL stage across Hero → Manifesto → Collection: the tin glides, the lid lifts off, steam rises | GSAP ScrollTrigger → shared scene state |
| Interactive collection: tin switcher, ⚡ flavor profile, flavor finder, qty + add to bag | Framer Motion |
| Origin: Yame, Fukuoka & Kagoshima, ingredient highlights | GSAP clip-path reveals |
| Matcha guide: pinned 3D ritual (sift → pour → whisk → oat milk) with chawan, chasen, pouring stream | R3F |
| Our Story (Ichigo ichie, chanoyu), parallax photography | GSAP |
| Shop with filters, product cards, bag drawer, checkout, order confirmation, persisted bag | Framer Motion + localStorage |

Edit products and prices in `src/lib/products.ts`. Tin artwork is drawn in code in `src/components/three/textures.ts`.
Product photos in `public/img/` are cropped from the brand's Instagram stories.
