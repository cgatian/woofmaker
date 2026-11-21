"""
Makes the link-preview image (public/og.jpg, 1200x630) and the home-screen
icon (public/apple-touch-icon.png) from your own copy of the movie.

    python tools/make_og.py path/to/home-alone.mp4

Needs ffmpeg and `pip install pillow`. Uses Impact / Segoe UI Bold from Windows.
"""
import os, subprocess, sys, tempfile
from PIL import Image, ImageDraw, ImageFont, ImageFilter

PHOTO_TIME = "00:22:56.30"   # the photo close-up
PHOTO_CROP = (360, 40, 1400, 1032)   # the framed photo in Kevin's hands (1920x1080 px)
ROOT = os.path.join(os.path.dirname(__file__), "..", "public")
FONTS = "C:/Windows/Fonts/"


def font(name, size):
    return ImageFont.truetype(FONTS + name, size)


def outlined(draw, xy, text, f, fill="#fff", stroke="#000", width=8, anchor="mm"):
    draw.text(xy, text, font=f, fill=fill, stroke_width=width, stroke_fill=stroke, anchor=anchor)


def og(movie):
    """Close-up of Buzz's girlfriend's photo on the right, the punchline on the left."""
    tmp = os.path.join(tempfile.mkdtemp(), "f.png")
    subprocess.run(["ffmpeg", "-v", "error", "-ss", PHOTO_TIME, "-i", movie, "-frames:v", "1", tmp], check=True)
    frame = Image.open(tmp).convert("RGB")
    photo = frame.crop(PHOTO_CROP).resize((660, 630), Image.LANCZOS)

    img = Image.new("RGB", (1200, 630), "#0e1830")
    # soft blend from the dark panel into the photo
    fade = Image.new("L", (660, 630), 255)
    fd = ImageDraw.Draw(fade)
    for x in range(90):
        fd.line([(x, 0), (x, 630)], fill=int(255 * x / 90))
    img.paste(photo, (540, 0), fade)

    d = ImageDraw.Draw(img)
    outlined(d, (300, 150), "Buzz, your", font("segoeuib.ttf", 58), width=5)
    outlined(d, (300, 222), "girlfriend…", font("segoeuib.ttf", 58), width=5)
    outlined(d, (300, 365), "WOOF!", font("impact.ttf", 170), fill="#ffffff", width=10)
    d.rounded_rectangle([60, 478, 540, 548], radius=35, fill="#d7263d")
    d.text((300, 513), "woofmaker.org", font=font("segoeuib.ttf", 40), fill="#ffffff", anchor="mm")
    img.save(os.path.join(ROOT, "og.jpg"), quality=88, optimize=True, progressive=True)


def icon():
    s = 180
    im = Image.new("RGB", (s, s), "#d7263d")
    d = ImageDraw.Draw(im)
    k = s / 64
    r = lambda x0, y0, x1, y1: [x0 * k, y0 * k, x1 * k, y1 * k]
    d.rounded_rectangle(r(16, 9, 48, 55), radius=3 * k, fill="#d9d7d0")
    d.rectangle(r(20, 13, 44, 51), fill="#0e1830")
    d.ellipse(r(24, 20, 40, 36), fill="#f2c14e")
    d.pieslice(r(18, 38, 46, 64), 180, 360, fill="#f2c14e")
    d.rectangle(r(20, 51, 44, 55), fill="#d9d7d0")
    im.save(os.path.join(ROOT, "apple-touch-icon.png"), optimize=True)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    og(sys.argv[1])
    icon()
    print("wrote public/og.jpg and public/apple-touch-icon.png")
