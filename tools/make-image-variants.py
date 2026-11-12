#!/usr/bin/env python3
"""Create small WebP copies of every photo in assets/images.

The storefront asks for  <photo>.jpg.w500.webp  (cards, thumbnails) and
<photo>.jpg.w1000.webp (product page), and falls back to the original file
if a copy is missing. Run this after adding photos to assets/images:

    pip install pillow
    python3 tools/make-image-variants.py

Originals are never changed. Existing copies are skipped.
"""
import pathlib, sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent.parent / "assets" / "images"
TIERS = (500, 1000, 1600)
made = skipped = 0
for src in sorted(ROOT.rglob("*")):
    if src.suffix.lower() not in (".jpg", ".jpeg", ".png"):
        continue
    im = None
    for i, tier in enumerate(TIERS):
        out = src.with_name(f"{src.name}.w{tier}.webp")
        if out.exists():
            skipped += 1
            continue
        if im is None:
            im = Image.open(src).convert("RGB")
        # only make the 1600 copy for photos that are actually wider than 1000
        if i > 0 and im.width <= TIERS[i - 1] and tier == 1600:
            continue
        w = min(tier, im.width)
        copy = im if w == im.width else im.resize((w, round(im.height * w / im.width)), Image.LANCZOS)
        copy.save(out, "WEBP", quality=78, method=6)
        made += 1
print(f"made {made} copies, skipped {skipped} that already existed")
