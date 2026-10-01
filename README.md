# Oriki Hair

A frontend-only e-commerce concept for **Oriki**, a fictional luxury wig atelier in Lagos. Every wig is drawn procedurally in SVG and configured live: length, texture, colour and cap size. Checkout hands off to WhatsApp, which is how many Nigerian boutiques actually sell.

Built with Next.js (App Router), TypeScript, Tailwind CSS v4, Framer Motion and Zustand. There's no backend, database or paid service.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
```

Production build:

```bash
npm run build
npm start
```

## Environment variable

| Variable | Default | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_WHATSAPP_NUMBER` | `2340000000000` | Number the "Order on WhatsApp" link opens. International format, digits only (e.g. `2348012345678`). Spaces and `+` are stripped. |

Create `.env.local` locally, or set it in your Vercel project settings:

```bash
NEXT_PUBLIC_WHATSAPP_NUMBER=2348012345678
```

The link is built as `https://wa.me/<number>?text=<message>`. The message is URL-encoded and lists each item, its options, the quantity, the line totals and the order total in naira.

## Demo mode (for screen recordings)

Press **D** anywhere on the page, or click the faint `demo` text at the bottom right of the footer. The loop:

1. hides the cursor and scrolls to the collection;
2. opens **Adunni**, which flies from its stand into the configurator;
3. changes length 24 → 30 → 16 → 20 inches;
4. changes texture to body wave → deep wave → curly;
5. changes colour to burgundy → copper → honey blonde, then cap size to large. The price rolls on every change that affects it;
6. adds to cart, opens the cart drawer, closes it, and returns the wig to its stand.

One loop takes about 21 seconds and then repeats. Press **Esc** (or **D**) to stop. Your real cart is restored afterwards.

Recording tips: use a browser window at 1440×900 for desktop, or device emulation at 390×844 for TikTok/Reels. Start recording, then press D.

## Swapping in real product photos

All product data lives in [`data/products.ts`](data/products.ts). To use photography for a unit:

1. Put the image in `public/products/`. A transparent PNG or WebP framed at roughly 400×446 works best.
2. Add an `image` field to that product:

   ```ts
   {
     id: "adunni",
     name: "Adunni",
     image: "/products/adunni.png",
     // ...
   }
   ```

That's all. [`components/ProductVisual.tsx`](components/ProductVisual.tsx) is the only place that decides how a wig is shown. It renders the photo with `next/image` when `image` is set and falls back to the procedural `<WigArt>` otherwise. The photo is used everywhere: collection, configurator and cart. It won't restyle itself when options change, so you may want one photo per colour later.

Pricing is also in the data file: `basePrice` per product plus `addOn` per length and per texture (`priceFor()`).

## Deploy to Vercel

1. Push this repository to GitHub.
2. In Vercel, choose **Add New → Project** and import the repo. The framework preset (Next.js) is detected automatically. No build settings need changing.
3. Under **Environment Variables**, add `NEXT_PUBLIC_WHATSAPP_NUMBER`.
4. Deploy. The site is fully static and runs on the free tier.

Or from the CLI: `npx vercel` then `npx vercel --prod`.

## Project structure

```
app/            layout (fonts, metadata), page, global styles, icon
components/     one concern per file (Hero, HairField, Collection, StandCard,
                ProductFigure, ProductVisual, WigArt, Configurator, OptionGroup,
                RollingPrice, AddToCartButton, CartDrawer, CartLine, Care,
                Footer, Nav, DemoMode, MagneticButton, RevealText, Providers)
data/           products, options and pricing
lib/            wig geometry, seeded random, formatting, WhatsApp link, motion
store/          Zustand stores: cart (persisted to localStorage) and shop UI state
```

## How the wigs are drawn

`WigArt` draws a faceless head form and 182 strands of hair: nape, back and front layers. Each strand comes from a seeded random generator, so every product looks different but identical on every render. Each strand has an arc over the dome from the parting, then a fall from the side of the head where texture is applied. Body wave and deep wave are coherent sine waves of different wavelengths. Curly adds a vertical coil, so strands loop back on themselves, and curls shrink and gain volume.

Every strand has the same number of points in every configuration, so changing length or texture interpolates the point arrays in one `requestAnimationFrame` loop (650ms, house easing). React never re-renders mid-morph. Colours cross-fade through animated gradient stops, root darker to tip lighter.

## Decisions made along the way

- **Fictional brand, real voice.** Product names are Yoruba given names, which fits the oriki ("praise name") concept. The footer states clearly that it's a design concept.
- **Pricing** applies add-ons for length and texture only, as briefed. Colour and cap size are free to change.
- **"Cart" vs "Bag".** Desktop says "Cart". The nav says "Bag" on narrow screens to save space.
- **Hover labels.** On desktop, stand names and prices reveal on hover or keyboard focus. On touch screens they're always visible.
- **Cart persistence.** The cart is saved to `localStorage` and rehydrated after mount to avoid hydration mismatches.
- **Performance.** The grain overlay is static and unblended, and the highlight sweep only runs on the configurator's wig. Idle pages hold 60fps in headless Chromium.
- **Accessibility.** Options are real radio groups with roving focus (arrow keys, Home/End). Swatches have labels. The price is announced through a polite live region. The cart drawer traps focus and closes on Escape. Focus returns to the stand you opened. Focus rings use the gold accent. `prefers-reduced-motion` turns off layout flights, morphs, the hair field animation and the sweep.
