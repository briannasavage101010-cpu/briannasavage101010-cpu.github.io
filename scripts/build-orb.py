#!/usr/bin/env python3
"""
Rebuild the small blue-tinted images used by the hero sphere.

The sphere shows cards about 120px wide. Serving 1400px photos into them is
wasteful, and applying a CSS filter to 26 images at once makes the rotation
stutter. So we bake the duotone once, at the size actually needed.

    python3 scripts/build-orb.py

Reads every .jpg in assets/img/ and writes a 400x500 duotone copy to
assets/img/orb/. Needs Pillow:  python3 -m pip install Pillow
"""
from PIL import Image, ImageEnhance
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "assets" / "img"
OUT = SRC / "orb"
OUT.mkdir(parents=True, exist_ok=True)

SHADOW = (22, 40, 78)      # deep navy, matches --bg-2
HIGHLIGHT = (205, 226, 255)  # pale blue
W, H = 400, 500            # 4:5, the card aspect ratio

ramp = bytearray()
for channel in range(3):
    for i in range(256):
        t = i / 255.0
        ramp.append(int(round(SHADOW[channel] + (HIGHLIGHT[channel] - SHADOW[channel]) * t)))

for path in sorted(SRC.glob("*.jpg")):
    im = Image.open(path).convert("RGB")
    target = W / H
    actual = im.width / im.height
    if actual > target:                       # too wide: trim the sides
        nw = int(im.height * target)
        im = im.crop(((im.width - nw) // 2, 0, (im.width + nw) // 2, im.height))
    else:                                     # too tall: trim top and bottom
        nh = int(im.width / target)
        im = im.crop((0, (im.height - nh) // 2, im.width, (im.height + nh) // 2))
    im = im.resize((W, H), Image.LANCZOS)
    grey = ImageEnhance.Contrast(im.convert("L")).enhance(1.22)
    Image.merge("RGB", [grey] * 3).point(ramp).save(
        OUT / path.name, "JPEG", quality=78, optimize=True)
    print(f"  {path.name} -> orb/{path.name}")

print("done — add any new filenames to data-sphere in index.html")
