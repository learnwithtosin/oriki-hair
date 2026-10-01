#!/usr/bin/env python3
"""
Turn stock hair photos into Oriki product shots.

For every product in scripts/photos.json this script:
  1. downloads the source photo (cached in scripts/.cache/),
  2. removes the background with rembg,
  3. finds the hair with MediaPipe's multiclass selfie segmenter (hair class),
     restricted to rembg's foreground so background never counts as hair,
  4. crops and pads the cut-out to 1200x1500 on a transparent canvas,
  5. recolours only inside the hair mask into the six Oriki colourways by
     setting hue, scaling saturation and remapping value in HSV — the photo's
     own shading and highlights are kept, just moved into the target range,
  6. exports public/wigs/{slug}-{colour}.webp and public/wigs/CREDITS.md.

Set up once:
    python3 -m venv .venv
    .venv/bin/pip install "rembg[cpu]" pillow numpy opencv-python-headless mediapipe

Run:
    .venv/bin/python scripts/process_photos.py               # all products
    .venv/bin/python scripts/process_photos.py ewa folake    # some products
    .venv/bin/python scripts/process_photos.py --sheet out.png   # also a review sheet
"""
from __future__ import annotations

import argparse
import json
import urllib.request
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "scripts" / "photos.json"
CACHE = ROOT / "scripts" / ".cache"
MODELS = ROOT / "scripts" / "models"
OUT = ROOT / "public" / "wigs"
HAIR_MODEL_URL = (
    "https://storage.googleapis.com/mediapipe-models/image_segmenter/"
    "selfie_multiclass_256x256/float32/latest/selfie_multiclass_256x256.tflite"
)
CANVAS = (1200, 1500)
MARGIN = 0.06

# Target colourways.
#   hue    degrees at mid-tones; `shift` moves it from shadows (-) to highlights (+),
#          the way real dyed hair warms towards the ends and cools in the shade
#   sat    saturation at mid-tones
#   lo/hi  value range the hair's own shadows→highlights are remapped into
#   mid    where the hair's median tone should land within lo..hi (gamma is
#          solved per photo, so dark and light sources end up equally bright)
#   keep   how much of the source's own saturation pattern to keep (0 when
#          lightening: near-black hair has no colour worth keeping)
#   detail local strand contrast added back — lightening flat dark hair needs it
COLOURWAYS: dict[str, dict[str, float]] = {
    "natural-black": {"hue": 22, "shift": 4, "sat": 0.26, "lo": 0.03, "hi": 0.30, "mid": 0.35, "keep": 1, "detail": 0.3},
    "dark-brown": {"hue": 22, "shift": 6, "sat": 0.52, "lo": 0.06, "hi": 0.48, "mid": 0.40, "keep": 1, "detail": 0.4},
    "honey-blonde": {"hue": 34, "shift": 9, "sat": 0.60, "lo": 0.28, "hi": 0.93, "mid": 0.55, "keep": 0, "detail": 1.1},
    "burgundy": {"hue": 348, "shift": 6, "sat": 0.66, "lo": 0.06, "hi": 0.52, "mid": 0.42, "keep": 0.5, "detail": 0.5},
    "copper": {"hue": 20, "shift": 8, "sat": 0.70, "lo": 0.16, "hi": 0.84, "mid": 0.50, "keep": 0, "detail": 0.8},
    "ash-grey": {"hue": 34, "shift": 0, "sat": 0.05, "lo": 0.20, "hi": 0.86, "mid": 0.50, "keep": 0, "detail": 0.9},
}


def fetch(url: str, dest: Path) -> Path:
    if not dest.exists():
        dest.parent.mkdir(parents=True, exist_ok=True)
        req = urllib.request.Request(url, headers={"User-Agent": "oriki-photo-pipeline/1.0"})
        with urllib.request.urlopen(req, timeout=60) as r:
            dest.write_bytes(r.read())
    return dest


# --- segmentation -----------------------------------------------------------

_rembg_session = None
_segmenter = None


def foreground_alpha(rgb: np.ndarray, model: str) -> np.ndarray:
    """rembg cut-out alpha in [0, 1]."""
    global _rembg_session
    from rembg import new_session, remove

    if _rembg_session is None or _rembg_session[0] != model:
        _rembg_session = (model, new_session(model))
    cut = remove(Image.fromarray(rgb), session=_rembg_session[1], post_process_mask=True)
    return np.asarray(cut)[..., 3].astype(np.float32) / 255.0


def hair_confidence(rgb: np.ndarray) -> np.ndarray:
    """MediaPipe hair-class confidence in [0, 1], at full resolution."""
    global _segmenter
    import mediapipe as mp
    from mediapipe.tasks.python import BaseOptions, vision

    if _segmenter is None:
        model = fetch(HAIR_MODEL_URL, MODELS / "selfie_multiclass_256x256.tflite")
        _segmenter = vision.ImageSegmenter.create_from_options(
            vision.ImageSegmenterOptions(
                base_options=BaseOptions(model_asset_path=str(model)),
                output_confidence_masks=True,
            )
        )
    result = _segmenter.segment(mp.Image(image_format=mp.ImageFormat.SRGB, data=np.ascontiguousarray(rgb)))
    hair = result.confidence_masks[1].numpy_view().astype(np.float32)
    return cv2.resize(hair, (rgb.shape[1], rgb.shape[0]), interpolation=cv2.INTER_LINEAR)


def hair_mask(rgb: np.ndarray, alpha: np.ndarray, conf: np.ndarray, threshold: float) -> np.ndarray:
    """Soft hair mask: confident hair, inside the cut-out, edges feathered."""
    m = np.clip((conf - threshold) / 0.3, 0, 1)
    m = cv2.GaussianBlur(m, (0, 0), 2.0)
    return np.clip(m * alpha, 0, 1)


# --- framing ----------------------------------------------------------------

def frame(rgba: np.ndarray, hair: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """Crop to the subject and pad onto a 1200x1500 transparent canvas.
    A subject cut off by the bottom of the photo is anchored to the bottom edge."""
    a = rgba[..., 3]
    ys, xs = np.where(a > 12)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    crop, hcrop = rgba[y0:y1, x0:x1], hair[y0:y1, x0:x1]
    touches_bottom = y1 >= rgba.shape[0] - 2

    cw, ch = CANVAS
    inner_w, inner_h = cw * (1 - 2 * MARGIN), ch * (1 - (MARGIN if touches_bottom else 2 * MARGIN))
    scale = min(inner_w / crop.shape[1], inner_h / crop.shape[0])
    w, h = max(1, round(crop.shape[1] * scale)), max(1, round(crop.shape[0] * scale))
    crop = cv2.resize(crop, (w, h), interpolation=cv2.INTER_AREA if scale < 1 else cv2.INTER_CUBIC)
    hcrop = cv2.resize(hcrop, (w, h), interpolation=cv2.INTER_LINEAR)

    canvas = np.zeros((ch, cw, 4), np.uint8)
    hcanvas = np.zeros((ch, cw), np.float32)
    x = (cw - w) // 2
    y = ch - h if touches_bottom else (ch - h) // 2
    canvas[y : y + h, x : x + w] = crop
    hcanvas[y : y + h, x : x + w] = hcrop
    return canvas, hcanvas


# --- recolouring --------------------------------------------------------------

def recolour(rgba: np.ndarray, hair: np.ndarray, target: dict[str, float]) -> np.ndarray:
    rgb = rgba[..., :3].astype(np.float32) / 255.0
    hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)  # H 0-360, S/V 0-1
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    core = hair > 0.5
    if core.sum() < 500:
        return rgba

    # Normalise the hair's own value range so dark and light sources behave alike.
    lo_v, hi_v = np.percentile(v[core], [1.5, 99.2])
    vn = np.clip((v - lo_v) / max(hi_v - lo_v, 1e-3), 0, 1)
    # Put back strand-scale contrast that the remap would otherwise flatten.
    vn = np.clip(vn + target["detail"] * (vn - cv2.GaussianBlur(vn, (0, 0), 2.5)), 0, 1)
    median = float(np.clip(np.median(vn[core]), 0.05, 0.95))
    gamma = float(np.clip(np.log(target["mid"]) / np.log(median), 0.35, 2.5))
    new_v = target["lo"] + (target["hi"] - target["lo"]) * np.power(vn, gamma)

    # Keep a little of the source's hue variation — but only where the source
    # actually had colour; near-black pixels have meaningless hue (green noise).
    h_med = np.median(h[core])
    dh = ((h - h_med + 180) % 360) - 180
    trust = np.clip(s / 0.35, 0, 1) * np.clip(v / 0.25, 0, 1)
    new_h = (target["hue"] + target["shift"] * (vn - 0.5) * 2 + dh * 0.2 * trust) % 360

    # Saturation: target at mid-tones, easing off into highlights and deep shadow.
    s_rel = 1 + target["keep"] * (np.clip(s / max(np.median(s[core]), 1e-3), 0.6, 1.4) - 1)
    vt = np.power(vn, gamma)
    new_s = target["sat"] * s_rel * (1 - 0.45 * vt**3) * np.clip(vt * 4 + 0.35, 0, 1)
    new_s = np.clip(new_s, 0, 1)

    out = cv2.cvtColor(np.dstack([new_h, new_s, new_v]).astype(np.float32), cv2.COLOR_HSV2RGB)
    m = hair[..., None]
    blended = rgb * (1 - m) + out * m
    result = rgba.copy()
    result[..., :3] = np.clip(blended * 255 + 0.5, 0, 255).astype(np.uint8)
    return result


# --- main -------------------------------------------------------------------

def process(product: dict, sheet_rows: list) -> None:
    slug = product["slug"]
    src = fetch(product["download"], CACHE / f"{product['site'].lower()}-{product['id']}.jpg")
    rgb = np.asarray(Image.open(src).convert("RGB"))
    alpha = foreground_alpha(rgb, product.get("rembg_model", "isnet-general-use"))
    conf = hair_confidence(rgb)
    hair = hair_mask(rgb, alpha, conf, product.get("hair_threshold", 0.35))
    rgba = np.dstack([rgb, (alpha * 255).astype(np.uint8)])
    rgba, hair = frame(rgba, hair)

    row = []
    for colour, base in COLOURWAYS.items():
        target = {**base, **product.get("tune", {}).get(colour, {})}
        img = rgba if colour == product.get("native") else recolour(rgba, hair, target)
        Image.fromarray(img, "RGBA").save(OUT / f"{slug}-{colour}.webp", "WEBP", quality=84, method=6)
        row.append(img)
    sheet_rows.append((slug, row, hair))
    print(f"  {slug}: hair covers {100 * (hair > 0.5).mean():.1f}% of frame")


def write_credits(products: list[dict]) -> None:
    lines = [
        "# Photo credits",
        "",
        "Product photos are derived from free stock photographs, used under the",
        "[Pexels License](https://www.pexels.com/license/) (free for commercial use, no attribution required — credited here anyway).",
        "Backgrounds were removed and hair was digitally recoloured to produce each colourway.",
        "",
        "| Product | Photo | Photographer |",
        "| --- | --- | --- |",
    ]
    for p in products:
        lines.append(f"| {p['slug']} | [{p['site']} {p['id']}]({p['page']}) | [{p['photographer']}]({p['profile']}) |")
    (OUT / "CREDITS.md").write_text("\n".join(lines) + "\n")


def save_sheet(rows: list, path: Path) -> None:
    cell_w, cell_h = 240, 300
    cream = np.array([236, 230, 220], np.float32)
    sheet = np.full((cell_h * len(rows), cell_w * 7, 3), 255, np.uint8)
    for r, (slug, imgs, hair) in enumerate(rows):
        for c, img in enumerate(imgs):
            small = cv2.resize(img, (cell_w, cell_h), interpolation=cv2.INTER_AREA).astype(np.float32)
            a = small[..., 3:4] / 255
            sheet[r * cell_h : (r + 1) * cell_h, c * cell_w : (c + 1) * cell_w] = (
                small[..., :3] * a + cream * (1 - a)
            ).astype(np.uint8)
        hm = cv2.resize((hair * 255).astype(np.uint8), (cell_w, cell_h))
        sheet[r * cell_h : (r + 1) * cell_h, 6 * cell_w :] = hm[..., None]
    Image.fromarray(sheet).save(path)
    print(f"review sheet: {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("slugs", nargs="*", help="only process these products")
    parser.add_argument("--sheet", type=Path, help="write a review contact sheet (6 colourways + hair mask per row)")
    args = parser.parse_args()

    products = json.loads(MANIFEST.read_text())["products"]
    OUT.mkdir(parents=True, exist_ok=True)
    rows: list = []
    for product in products:
        if args.slugs and product["slug"] not in args.slugs:
            continue
        print(f"processing {product['slug']} ({product['site']} {product['id']})")
        process(product, rows)
    write_credits(products)
    if args.sheet:
        save_sheet(rows, args.sheet)


if __name__ == "__main__":
    main()
