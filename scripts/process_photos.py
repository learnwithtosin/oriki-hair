#!/usr/bin/env python3
"""
Turn the six mannequin studio shots into a matched Oriki catalogue set.

Sources live in source-images/{style}.png, outside public/ so they are never
deployed: a natural-black wig on an ivory mannequin head and espresso pole,
front-on, on a flat cream background.

For each source this script:
  1. cuts it out — rembg gives the primary matte (the ivory mannequin is
     almost the same colour as the cream backdrop, so colour distance alone
     would eat the head). Because the backdrop is one flat, known colour, a
     luminance matte recovers fine dark strands rembg drops near its edge;
  2. de-fringes semi-transparent edges by unmixing the known backdrop colour
     (I = aF + (1-a)B  ->  F = (I - (1-a)B) / a), so no cream halo remains;
  3. normalises framing: every wig-and-stand is scaled to the same height,
     centred on the pole and set on the same baseline in a 1200x1500 frame
     (premultiplied Lanczos resampling, so edges don't darken);
  4. builds a hair-only mask: dark, neutral pixels — excluding the ivory
     head, neck and lace, and the warm-brown pole and base;
  5. recolours with a luminosity gradient map: hair luminance is contrast-
     stretched, then mapped shadows -> highlights through a per-colour ramp,
     keeping strand detail, specular highlights and root darkness, with a
     soft root shadow for the lighter shades;
  6. writes public/wigs/{slug}-{colour}.webp with real transparency.

Natural black is the normalised original, untouched.

    python3 -m venv .venv && .venv/bin/pip install -r scripts/requirements.txt
    .venv/bin/python scripts/process_photos.py                 # everything
    .venv/bin/python scripts/process_photos.py adunni          # one product
    .venv/bin/python scripts/process_photos.py --sheet s.png   # + review sheet
"""
from __future__ import annotations

import argparse
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SOURCES = ROOT / "source-images"
OUT = ROOT / "public" / "wigs"

# product slug -> source style
PRODUCTS = {
    "ayomide": "blunt-bob",
    "ewa": "body-wave",
    "adunni": "bone-straight",
    "morenike": "deep-wave",
    "titilayo": "water-wave",
    "folake": "kinky-curly",
}

CANVAS_W, CANVAS_H = 1200, 1500
TOP, BOTTOM = 0.07, 0.045  # margins as a fraction of canvas height

# Gradient maps: luminance 0 -> 1 through these sRGB stops (position, hex).
# Shadows stay deep so roots read as roots; the top stop is the specular sheen.
RAMPS: dict[str, list[tuple[float, str]]] = {
    "dark-brown": [(0.0, "#0d0806"), (0.28, "#2a170e"), (0.55, "#4d2d1b"), (0.8, "#7a4e33"), (1.0, "#b58a6a")],
    "honey-blonde": [(0.0, "#3a2410"), (0.14, "#6d4720"), (0.36, "#a97b3c"), (0.6, "#d4a85f"), (0.82, "#ecca8b"), (1.0, "#faecc9")],
    "burgundy": [(0.0, "#140409"), (0.22, "#3f0b19"), (0.48, "#701a2c"), (0.74, "#a02f45"), (0.9, "#c4566a"), (1.0, "#e8a3ad")],
    "copper": [(0.0, "#1e0b04"), (0.22, "#4d1f0c"), (0.48, "#8c3f19"), (0.74, "#c26a30"), (0.9, "#e0965a"), (1.0, "#f6c99a")],
    "ash-grey": [(0.0, "#2c2b2a"), (0.14, "#57554f"), (0.34, "#8b8882"), (0.58, "#b9b5ae"), (0.8, "#dad6cf"), (1.0, "#f6f4f0")],
}
# How far each shade lifts the black source: stretch exponent (lower = lighter
# mid-tones), how much strand detail (high-pass luminance) is added back, and
# how strong the root shadow is.
TONE = {
    "dark-brown": {"gamma": 0.95, "detail": 0.35, "root": 0.0},
    "honey-blonde": {"gamma": 0.52, "detail": 0.6, "root": 0.24},
    "burgundy": {"gamma": 0.75, "detail": 0.4, "root": 0.1},
    "copper": {"gamma": 0.72, "detail": 0.5, "root": 0.18},
    "ash-grey": {"gamma": 0.5, "detail": 0.55, "root": 0.22},
}

LUMA = np.array([0.2126, 0.7152, 0.0722], np.float32)


def srgb_to_linear(c: np.ndarray) -> np.ndarray:
    return np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)


def linear_to_srgb(c: np.ndarray) -> np.ndarray:
    c = np.clip(c, 0, 1)
    return np.where(c <= 0.0031308, c * 12.92, 1.055 * c ** (1 / 2.4) - 0.055)


def hex_rgb(h: str) -> np.ndarray:
    return np.array([int(h[i : i + 2], 16) for i in (1, 3, 5)], np.float32) / 255


# --- cut-out ------------------------------------------------------------------

_session = None


def rembg_alpha(rgb: np.ndarray) -> np.ndarray:
    global _session
    from rembg import new_session, remove

    if _session is None:
        _session = new_session("isnet-general-use")
    out = remove(Image.fromarray(rgb), session=_session)
    return np.asarray(out)[..., 3].astype(np.float32) / 255


def backdrop_colour(rgb8: np.ndarray) -> np.ndarray:
    h, w, _ = rgb8.shape
    k = int(min(h, w) * 0.06)
    corners = [rgb8[:k, :k], rgb8[:k, -k:], rgb8[-k:, :k], rgb8[-k:, -k:]]
    return np.median(np.concatenate([c.reshape(-1, 3) for c in corners]), axis=0).astype(np.float32) / 255


def cut_out(rgb8: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Returns (foreground colour F in 0-1, alpha)."""
    rgb = rgb8.astype(np.float32) / 255
    bg = backdrop_colour(rgb8)
    a_rembg = rembg_alpha(rgb8)

    # Luminance matte for dark strands against the flat backdrop: a pixel that
    # is x% of the way from backdrop to hair-black is x% hair.
    lum = rgb @ LUMA
    bg_l = float(bg @ LUMA)
    a_lum = np.clip((bg_l - lum) / (bg_l - 0.06), 0, 1)
    # The backdrop is flat, so this is trustworthy across the whole frame — it
    # rescues hair rembg drops entirely. Only isolated specks are discarded.
    a_lum[a_lum < 0.06] = 0
    n, labels, stats, _ = cv2.connectedComponentsWithStats((a_lum > 0.15).astype(np.uint8), connectivity=8)
    keep = np.zeros(n, bool)
    keep[1:] = stats[1:, cv2.CC_STAT_AREA] >= 400
    a_lum = a_lum * cv2.dilate(keep[labels].astype(np.uint8), np.ones((5, 5), np.uint8))
    alpha = np.maximum(a_rembg, a_lum)

    # Unmix the backdrop out of semi-transparent edge pixels (no cream halo).
    a3 = np.clip(alpha, 1e-3, 1)[..., None]
    fg = np.clip((rgb - (1 - a3) * bg) / a3, 0, 1)
    fg = np.where(alpha[..., None] > 0.02, fg, rgb)
    return fg, alpha


# --- masks --------------------------------------------------------------------

def stand_rows(alpha: np.ndarray) -> tuple[int, int, int]:
    """(base_top_row, pole_left, pole_right) from the silhouette's width profile."""
    solid = alpha > 0.5
    ys = np.where(solid.any(1))[0]
    y0, y1 = ys.min(), ys.max()
    span = y1 - y0
    widths = np.array([np.ptp(np.where(r)[0]) if r.any() else 0 for r in solid])
    # Just above the base only the pole is present: that's the pole's width.
    pole_zone = range(int(y1 - span * 0.2), int(y1 - span * 0.12))
    pole_w = float(np.median([widths[y] for y in pole_zone]))
    # The base is every row near the bottom clearly wider than the pole.
    zone = np.arange(int(y1 - span * 0.12), y1 + 1)
    wide = zone[widths[zone] > pole_w * 2]
    base_top = int(wide.min()) if len(wide) else int(y1 - span * 0.05)
    cols = np.where(solid[int(y1 - span * 0.15)])[0]
    return base_top, int(cols.min()), int(cols.max())


def stand_mask(fg: np.ndarray, alpha: np.ndarray) -> np.ndarray:
    """The base entirely, plus warm-brown pixels in the pole's column — so hair
    hanging in front of the pole is still hair."""
    hsv = cv2.cvtColor((fg * 255).astype(np.uint8), cv2.COLOR_RGB2HSV_FULL).astype(np.float32)
    hue, sat, val = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255
    warm = (sat > 0.2) & (val > 0.15) & (hue > 4) & (hue < 45)

    base_top, left, right = stand_rows(alpha)
    m = np.zeros(alpha.shape, bool)
    m[base_top - 2 :, :] = True
    # The pole only exists below the neck — above it, that column is the
    # parting, whose warm-toned hair must stay hair.
    ys = np.where(alpha.max(1) > 0.5)[0]
    neck = int(ys.min() + (ys.max() - ys.min()) * 0.45)
    column = np.zeros_like(m)
    column[neck:, max(left - 3, 0) : right + 4] = True
    m |= warm & column
    return cv2.dilate(m.astype(np.uint8), np.ones((3, 3), np.uint8)).astype(np.float32)


def hair_mask(fg: np.ndarray, alpha: np.ndarray, stand: np.ndarray) -> np.ndarray:
    """Dark, neutral pixels: hair. Ivory head/neck/lace and the stand are out."""
    val = fg.max(axis=2)
    dark = np.clip((0.62 - val) / (0.62 - 0.45), 0, 1)
    m = dark * np.clip(alpha * 1.5, 0, 1) * (1 - stand)
    return cv2.GaussianBlur(m, (0, 0), 0.8)


# --- framing ------------------------------------------------------------------

def normalise(layers: list[np.ndarray], alpha: np.ndarray) -> tuple[list[np.ndarray], np.ndarray]:
    """Scale so wig+stand height matches, centre on the stand, shared baseline."""
    ys, _ = np.where(alpha > 0.5)
    y0, y1 = ys.min(), ys.max()
    bx = np.where((alpha[y1 - 4 : y1 + 1] > 0.5).any(0))[0]
    cx = (bx.min() + bx.max()) / 2

    s = CANVAS_H * (1 - TOP - BOTTOM) / (y1 - y0 + 1)
    M = np.array([[s, 0, CANVAS_W / 2 - cx * s], [0, s, CANVAS_H * TOP - y0 * s]], np.float32)

    def warp(img: np.ndarray) -> np.ndarray:
        return cv2.warpAffine(img, M, (CANVAS_W, CANVAS_H), flags=cv2.INTER_LANCZOS4, borderValue=0)

    a = np.clip(warp(alpha), 0, 1)
    out = []
    for layer in layers:
        three = layer.ndim == 3
        w = warp(layer * (alpha[..., None] if three else alpha))
        out.append(np.clip(w / np.clip(a[..., None] if three else a, 1e-4, 1), 0, 1))
    return out, a


# --- recolour -------------------------------------------------------------------

def ramp_lookup(stops: list[tuple[float, str]]) -> np.ndarray:
    """1024-entry linear-light lookup table for a gradient map."""
    pos = np.array([p for p, _ in stops])
    cols = srgb_to_linear(np.stack([hex_rgb(c) for _, c in stops]))
    x = np.linspace(0, 1, 1024)
    return np.stack([np.interp(x, pos, cols[:, i]) for i in range(3)], axis=1)


def recolour(fg: np.ndarray, hair: np.ndarray, alpha: np.ndarray, colour: str) -> np.ndarray:
    tone = TONE[colour]
    lin = srgb_to_linear(fg)
    lum = lin @ LUMA
    core = (hair > 0.6) & (alpha > 0.6)

    # Hair coverage. Baby hairs along the lace are painted over the ivory, so
    # those pixels are part hair, part ivory: estimate how much is hair from
    # where the luminance sits between real strands and the mannequin.
    strand_hi = float(np.percentile(lum[core], 92))
    ivory = alpha > 0.9
    ivory &= (fg.max(axis=2) > 0.8) & (hair < 0.05)
    ivory_lin = np.median(lin[ivory], axis=0) if ivory.sum() > 500 else np.array([0.84, 0.77, 0.69], np.float32)
    ivory_l = float(ivory_lin @ LUMA)
    cover = np.clip((ivory_l - lum) / max(ivory_l - strand_hi, 1e-3), 0, 1) * hair

    # Contrast-stretch the hair's own (very compressed) luminance range.
    lo, hi = np.percentile(lum[core], [0.5, 99.7])
    t = np.clip((lum - lo) / max(hi - lo, 1e-4), 0, 1) ** tone["gamma"]
    # Add back strand-scale detail that the stretch flattens.
    t = np.clip(t + tone["detail"] * (t - cv2.GaussianBlur(t, (0, 0), 2.0)), 0, 1)
    # Mixed hairline pixels are bright because of the ivory, not the hair:
    # map them as a typical strand instead of a highlight.
    t_mid = float(np.median(t[core]))
    partial = np.clip((1 - cover) * 3, 0, 1)
    t = t * (1 - partial) + np.minimum(t, t_mid) * partial

    # Root shadow: lighter shades deepen gently towards the crown.
    if tone["root"] > 0:
        ys = np.where(core.any(1))[0]
        top, span = ys.min(), ys.max() - ys.min()
        y = np.arange(fg.shape[0], dtype=np.float32)[:, None]
        root = np.clip(1 - (y - top) / (span * 0.3), 0, 1)
        root = root * root * (3 - 2 * root)  # smoothstep — no visible band
        t = t * (1 - tone["root"] * root)

    lut = ramp_lookup(RAMPS[colour])
    mapped = lut[np.clip((t * 1023).astype(np.int32), 0, 1023)]
    # Where coverage is partial, blend the new hair colour with the ivory it
    # sits on — never with the old black.
    c = cover[..., None]
    h = hair[..., None]
    recoloured = mapped * c + ivory_lin * (1 - c)
    out = lin * (1 - h) + recoloured * h
    # Pixels at the outer silhouette (against transparency) are pure hair.
    edge = (alpha < 0.98)[..., None] & (h > 0.05)
    out = np.where(edge, lin * (1 - h) + mapped * h, out)
    return linear_to_srgb(out)


# --- main -------------------------------------------------------------------

def export(rgb: np.ndarray, alpha: np.ndarray, path: Path) -> np.ndarray:
    img = (np.clip(np.dstack([rgb, alpha]), 0, 1) * 255 + 0.5).astype(np.uint8)
    Image.fromarray(img, "RGBA").save(path, "WEBP", quality=90, alpha_quality=100, method=6)
    return img


def process(slug: str, style: str, sheet: list) -> None:
    rgb8 = np.asarray(Image.open(SOURCES / f"{style}.png").convert("RGB"))
    fg, alpha = cut_out(rgb8)
    stand = stand_mask(fg, alpha)
    hair = hair_mask(fg, alpha, stand)
    (fg_n, hair_n, stand_n), a_n = normalise([fg, hair, stand], alpha)
    hair_n = hair_n * (1 - stand_n)

    row = [export(fg_n, a_n, OUT / f"{slug}-natural-black.webp")]
    for colour in RAMPS:
        row.append(export(recolour(fg_n, hair_n, a_n, colour), a_n, OUT / f"{slug}-{colour}.webp"))
    sheet.append((slug, row, hair_n))
    print(f"  {slug:9} <- {style:14} hair {100 * (hair_n > 0.5).mean():4.1f}% of frame")


def save_sheet(rows: list, path: Path) -> None:
    cw, ch = 240, 300
    cream = np.array([236, 228, 216], np.float32)
    sheet = np.full((ch * len(rows), cw * 7, 3), 255, np.uint8)
    for r, (_, imgs, hair) in enumerate(rows):
        for c, img in enumerate(imgs):
            small = cv2.resize(img, (cw, ch), interpolation=cv2.INTER_AREA).astype(np.float32)
            a = small[..., 3:4] / 255
            sheet[r * ch : (r + 1) * ch, c * cw : (c + 1) * cw] = (small[..., :3] * a + cream * (1 - a)).astype(np.uint8)
        sheet[r * ch : (r + 1) * ch, 6 * cw :] = cv2.resize((hair * 255).astype(np.uint8), (cw, ch))[..., None]
    Image.fromarray(sheet).save(path)
    print(f"review sheet: {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("slugs", nargs="*", help="only these products")
    parser.add_argument("--sheet", type=Path, help="write a review sheet (6 colourways + hair mask per row)")
    args = parser.parse_args()
    rows: list = []
    for slug, style in PRODUCTS.items():
        if args.slugs and slug not in args.slugs:
            continue
        process(slug, style, rows)
    if args.sheet:
        save_sheet(rows, args.sheet)


if __name__ == "__main__":
    main()
