"""
Generate all PWA icons and splash screens from INFI_Logo.png
"""
from PIL import Image, ImageOps, ImageDraw
import os, sys

SOURCE = 'public/INFI_Logo.png'

if not os.path.exists(SOURCE):
    print(f"ERROR: Source file not found: {SOURCE}")
    sys.exit(1)

source = Image.open(SOURCE).convert('RGBA')
print(f"Source loaded: {source.size} mode={source.mode}")

# ─── helpers ─────────────────────────────────────────────────────────────────

def make_icon_white_bg(src, size, padding_pct=0.15):
    """Logo centered on white background (keeps logo colours as-is)"""
    pad = int(size * padding_pct)
    inner = size - 2 * pad
    sw, sh = src.size
    ratio = min(inner / sw, inner / sh)
    nw, nh = int(sw * ratio), int(sh * ratio)
    resized = src.resize((nw, nh), Image.LANCZOS)

    bg = Image.new('RGBA', (size, size), (255, 255, 255, 255))
    x, y = (size - nw) // 2, (size - nh) // 2
    bg.paste(resized, (x, y), resized)
    return bg.convert('RGB')


def make_splash(src, width, height, logo_pct=0.32):
    """Logo (inverted to white) centred on dark navy background"""
    bg_color = (15, 10, 46)          # #0f0a2e
    bg = Image.new('RGB', (width, height), bg_color)

    inner = int(min(width, height) * logo_pct)
    sw, sh = src.size
    ratio = min(inner / sw, inner / sh)
    nw, nh = int(sw * ratio), int(sh * ratio)

    # Invert the black logo → white logo for dark background
    rgb = src.convert('RGB')
    inverted = ImageOps.invert(rgb)
    # Restore alpha from original
    inverted_rgba = inverted.convert('RGBA')
    r, g, b, _ = inverted_rgba.split()
    _, _, _, a = src.split()
    white_logo = Image.merge('RGBA', (r, g, b, a))
    resized = white_logo.resize((nw, nh), Image.LANCZOS)

    x, y = (width - nw) // 2, (height - nh) // 2
    bg.paste(resized, (x, y), resized)
    return bg


# ─── 1. PWA icons (white background) ────────────────────────────────────────

os.makedirs('public/icons', exist_ok=True)

icon_sizes = [72, 96, 128, 144, 152, 192, 384, 512]
for sz in icon_sizes:
    img = make_icon_white_bg(source, sz)
    path = f'public/icons/icon-{sz}x{sz}.png'
    img.save(path, 'PNG', optimize=True)
    print(f'✓ {path}')

# apple-touch-icon  (180×180 — used by iOS "Add to Home Screen")
atc = make_icon_white_bg(source, 180)
atc.save('public/icons/apple-touch-icon.png', 'PNG', optimize=True)
print('✓ public/icons/apple-touch-icon.png')

# Static icon files in app directory (override the tsx generators)
atc.save('src/app/apple-icon.png', 'PNG', optimize=True)
print('✓ src/app/apple-icon.png')

fav32 = make_icon_white_bg(source, 32)
fav32.save('src/app/icon.png', 'PNG', optimize=True)
print('✓ src/app/icon.png')

# ─── 2. logo.png  (used in sidebar / header / login) ────────────────────────
logo = make_icon_white_bg(source, 512, padding_pct=0.10)
logo.save('public/logo.png', 'PNG', optimize=True)
print('✓ public/logo.png')

# ─── 3. iOS Splash Screens ───────────────────────────────────────────────────

os.makedirs('public/splash', exist_ok=True)

splashes = [
    (640,  1136),   # iPhone SE (1st gen)
    (750,  1334),   # iPhone 6/7/8
    (828,  1792),   # iPhone XR / 11
    (1125, 2436),   # iPhone X / XS
    (1170, 2532),   # iPhone 12 / 13
    (1179, 2556),   # iPhone 14 Pro
    (1242, 2208),   # iPhone 8 Plus
    (1284, 2778),   # iPhone 12/13 Pro Max
    (1290, 2796),   # iPhone 14 Pro Max
    (1488, 2266),   # iPad Mini
    (1640, 2360),   # iPad Air
    (2048, 2732),   # iPad Pro 12.9"
]

for w, h in splashes:
    img = make_splash(source, w, h)
    path = f'public/splash/splash-{w}x{h}.png'
    img.save(path, 'PNG', optimize=True)
    print(f'✓ {path}')

print('\n✅ All icons and splash screens generated successfully!')
