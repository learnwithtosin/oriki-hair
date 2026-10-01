# Oriki Hair

A frontend-only e-commerce concept for **Oriki**, a fictional luxury wig atelier in Lagos. Six units are shown as a matched studio set (a wig on an ivory mannequin and espresso stand), each recoloured into six shades and configured live: length, texture, colour and cap size. A procedurally drawn SVG wig stands in for any product or colour without a photo. Checkout hands off to WhatsApp, which is how many Nigerian boutiques actually sell.

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

Copy the example and fill in your number. `.env.local` is git-ignored, so the number never gets committed:

```bash
cp .env.example .env.local
# then edit: NEXT_PUBLIC_WHATSAPP_NUMBER=2348012345678
```

On Vercel, set it under **Project → Settings → Environment Variables**. It's read at build time, so redeploy after changing it.

The link is built as `https://wa.me/<number>?text=<message>`. The message is assembled with `\n` line breaks and URL-encoded once. Each item gets its own lines for name, length, texture, colour, cap size, quantity and line total. The message ends with the order total and "Please confirm availability and delivery cost."

## Demo mode (for screen recordings)

Press **D** anywhere on the page, or click the faint `demo` text at the bottom right of the footer. The loop:

1. hides the cursor and scrolls to the collection;
2. opens **Adunni**, which flies from its card into the configurator;
3. changes length 24 → 30 → 16 → 20 inches;
4. changes texture to body wave → deep wave → curly;
5. changes colour to burgundy → copper → honey blonde, then cap size to large. The price rolls on every change that affects it;
6. adds to cart, opens the cart drawer, closes it, and returns the wig to its stand.

One loop takes about 21 seconds and then repeats. Press **Esc** (or **D**) to stop. Your real cart is restored afterwards.

Recording tips: use a browser window at 1440×900 for desktop, or device emulation at 390×844 for TikTok/Reels. Start recording, then press D.

## Product photos

Six concept studio images (AI-generated, one per style) live in `public/wigs/source/{style}.png`: blunt bob, body wave, bone straight, deep wave, water wave and kinky curly. Each shows the wig in natural black on an ivory mannequin and espresso stand. From them, every product gets six colourways in `public/wigs/{product}-{colour}.webp`. They're wired up in [`data/products.ts`](data/products.ts) through the `images` map (colour → path):

```ts
{
  id: "adunni",
  images: {
    "natural-black": "/wigs/adunni-natural-black.webp",
    // … one per colour; photoSet("adunni") fills all six
  },
  photoTexture: "straight", // what the photo actually shows
}
```

[`components/ProductVisual.tsx`](components/ProductVisual.tsx) is the only place that decides how a wig is shown. If the selected colour has a photo, it shows it on a cream panel, cross-fading between colours. Otherwise it falls back to the procedural `<WigArt>` on its stand. Photos are used on collection cards and cart thumbnails (cropped in on the wig) and in the configurator (the whole mannequin and stand). When a card flies into the configurator, the crop eases out over the same 0.9s as the layout flight, so nothing jumps.

The photos are honest about what they show:
- **Colour** is a real recoloured photo.
- **Length** gives a subtle scale (anchored at the bottom) plus the price change.
- **Texture** changes the price and label only. If it differs from the photographed texture, a caption under the photo says so, e.g. "Pictured in straight — yours is made in kinky curly."

### Regenerating the photos

[`scripts/process_photos.py`](scripts/process_photos.py) builds all 36 images from the six sources:

```bash
python3 -m venv .venv
.venv/bin/pip install -r scripts/requirements.txt
.venv/bin/python scripts/process_photos.py --sheet review.png   # all six
.venv/bin/python scripts/process_photos.py adunni               # just one
```

For each source it:
1. **Cuts it out with rembg** as the primary matte. The ivory mannequin is almost the same colour as the cream backdrop, so colour distance alone would eat the head. Because the backdrop is one flat colour, a luminance matte rescues dark strands rembg drops; on its own, rembg lost half of the kinky-curly wig.
2. **De-fringes the edges** by unmixing the known backdrop colour out of semi-transparent pixels, so no cream halo remains on any background.
3. **Normalises framing.** Every wig-and-stand gets the same height, baseline and centre on a 1200×1500 canvas, using premultiplied Lanczos resampling so edges don't darken.
4. **Builds a hair-only mask** of dark, neutral pixels. That excludes the ivory head, neck and lace, the whole base, and the warm-brown pole (below the neck only, so the parting stays hair).
5. **Recolours with a luminosity gradient map.** It contrast-stretches the hair's luminance, then maps shadows to highlights through a per-colour ramp, keeping strand detail, speculars and root darkness. A soft root shadow goes on the lighter shades. Baby hairs painted over the lace count as part hair, part ivory, so they don't turn gold or pink.

Natural black is the normalised original, untouched. Ramps and tone settings are in `RAMPS` and `TONE` at the top of the script. `--sheet` writes a contact sheet of every colourway plus the hair mask, for review.

## Shareable URLs

The open wig lives in the URL: `/?wig=adunni`.
- **Refresh and shared links** open straight into the configurator.
- **Every way out** (Back to collection, the nav's Collection link, the logo, Escape, the browser's Back button) goes through one `closeWig()` in [`lib/navigation.ts`](lib/navigation.ts). It steps back through history when the site created the entry, so browser Back and Forward behave like the on-page controls.
- **Escape** closes the innermost layer first: cart drawer, then configurator.

Pricing is in the data file too: `basePrice` per product plus `addOn` per length and per texture (`priceFor()`).

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
                ProductFigure, ProductVisual, ProductPhoto, WigArt, Configurator,
                OptionGroup, RollingPrice, AddToCartButton, CartDrawer, CartLine,
                Care, Footer, Nav, DemoMode, RouteSync, MagneticButton,
                RevealText, Providers)
data/           products, options, photos and pricing
lib/            navigation (URL ⇄ open wig), wig geometry, seeded random,
                formatting, WhatsApp link, motion
public/wigs/    36 product images (6 products × 6 colours); source/ holds the 6 originals
scripts/        photo pipeline: process_photos.py, requirements.txt
store/          Zustand stores: cart (persisted to localStorage) and shop UI state
```

## How the wigs are drawn

`WigArt` draws a faceless head form and 182 strands of hair: nape, back and front layers. Each strand comes from a seeded random generator, so every product looks different but identical on every render. Each strand has an arc over the dome from the parting, then a fall from the side of the head where texture is applied. Body wave and deep wave are coherent sine waves of different wavelengths. Curly adds a vertical coil, so strands loop back on themselves, and curls shrink and gain volume.

Every strand has the same number of points in every configuration, so changing length or texture interpolates the point arrays in one `requestAnimationFrame` loop (650ms, house easing). React never re-renders mid-morph. Colours cross-fade through animated gradient stops, root darker to tip lighter.

## Decisions made along the way

- **Fictional brand, real voice.** Product names are Yoruba given names, which fits the oriki ("praise name") concept. The footer says "Concept imagery" and "Concept design"; the studio images are AI-generated.
- **Pricing** applies add-ons for length and texture only, as briefed. Colour and cap size are free to change. Lengths run 12–30" (including 22", 26" and 28" so each unit's natural length is an option), and textures are straight, body wave, deep wave, water wave and kinky curly.
- **Phones.** Option rows with many choices scroll sideways on one line instead of wrapping, so the photo, every control and Add to cart fit on a 390×844 screen.
- **"Cart" vs "Bag".** Desktop says "Cart". The nav says "Bag" on narrow screens to save space.
- **Hover labels.** On desktop, stand names and prices reveal on hover or keyboard focus. On touch screens they're always visible.
- **Cart persistence.** The cart is saved to `localStorage` and rehydrated after mount to avoid hydration mismatches.
- **Performance.** The grain overlay is static and unblended, and the highlight sweep only runs on the configurator's wig. Idle pages hold 60fps in headless Chromium.
- **Accessibility.** Options are real radio groups with roving focus (arrow keys, Home/End). Swatches have labels. The price is announced through a polite live region. The cart drawer traps focus and closes on Escape. Focus returns to the stand you opened. Focus rings use the gold accent. `prefers-reduced-motion` turns off layout flights, morphs, the hair field animation and the sweep.
