"""
Builds the scene assets the site needs from your own copy of the movie.

    python tools/build_scene.py path/to/home-alone.mp4

Writes into public/scene/:
  frames.jpg   sprite sheet of every GIF frame (photo close-up + Kevin's "woof")
  thumbs.png   sprite sheet of Kevin's thumbs (drawn back on top of the new photo)
  scene.json   frame timing, sprite layout, the photo's 4 corners per frame, captions

The movie file itself never goes in the repo. Requires ffmpeg on PATH and
`pip install opencv-python-headless numpy`.
"""
import json, os, shutil, subprocess, sys, tempfile
import cv2
import numpy as np

# ---- Scene settings (times are in the 1990 theatrical cut, 23.976 fps) ----
START = "00:22:56.10"      # a few frames before the cut to the photo close-up
DURATION = 5.2             # seconds to pull from the movie
END_AFTER_WOOF = 23 * 60 + 0.9   # stop just after Kevin says "Woof!"
STEP = 2                   # keep every 2nd frame -> ~12 fps GIF
OUT_W = 480                # output width in px
CROP_TOP, CROP_BOTTOM = 20, 1060   # trim the letterbox bars (1080p source)
SPRITE_COLS = 8
# Photo corners (TL, TR, BR, BL) on the first close-up frame, in 1920x1080 px.
REF_QUAD = np.float32([(461, 184), (1012, 70), (1273, 863), (698, 1057)])
# Areas where Kevin's thumbs can be, on the first close-up frame.
LEFT_HAND = np.float32([(560, 690), (715, 640), (790, 800), (840, 1075), (560, 1075)])
RIGHT_THUMB = np.float32([(1110, 540), (1300, 520), (1300, 720), (1180, 700), (1110, 640)])
CAPTIONS = [  # seconds in the movie (from the audio track)
    {"text": "Buzz, your girlfriend...", "start": 22 * 60 + 58.05, "end": 22 * 60 + 59.75},
    {"text": "WOOF!", "start": 22 * 60 + 59.9, "end": END_AFTER_WOOF},
]

FPS = 24000 / 1001
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "scene")


def t_of(i):  # movie time of extracted frame i (0-based)
    h, m, s = START.split(":")
    return int(h) * 3600 + int(m) * 60 + float(s) + i / FPS


def extract(movie, tmp):
    subprocess.run(["ffmpeg", "-v", "error", "-ss", START, "-i", movie, "-t", str(DURATION),
                    "-an", "-q:v", "2", os.path.join(tmp, "f_%04d.jpg")], check=True)
    files = sorted(f for f in os.listdir(tmp) if f.endswith(".jpg"))
    return [cv2.imread(os.path.join(tmp, f)) for f in files]


def find_cuts(frames):
    small = [cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (160, 90)).astype(float) for f in frames]
    return [i for i in range(1, len(small)) if np.abs(small[i] - small[i - 1]).mean() > 20]


def track(frames):
    """Homography from the first close-up frame to each close-up frame."""
    sift = cv2.SIFT_create(4000)
    ref = cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)
    mask = np.zeros_like(ref)
    cv2.fillConvexPoly(mask, np.int32([(400, 120), (1060, 20), (1330, 880), (700, 1060)]), 255)
    kr, dr = sift.detectAndCompute(ref, mask)
    bf = cv2.BFMatcher()
    hs = []
    for f in frames:
        g = cv2.cvtColor(f, cv2.COLOR_BGR2GRAY)
        k, d = sift.detectAndCompute(g, None)
        good = [a for a, b in bf.knnMatch(dr, d, k=2) if a.distance < 0.7 * b.distance]
        src = np.float32([kr[a.queryIdx].pt for a in good])
        dst = np.float32([k[a.trainIdx].pt for a in good])
        H, _ = cv2.findHomography(src, dst, cv2.RANSAC, 2.0)
        hs.append(H)
    return hs


def thumb_mask(img, H):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV).astype(int)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB).astype(int)
    skin = ((hsv[..., 2] > 90) & (lab[..., 1] >= 142) & ((hsv[..., 0] <= 8) | (hsv[..., 0] >= 170)))
    bright = hsv[..., 2] > 80

    def zone(poly):
        z = np.zeros(img.shape[:2], np.uint8)
        cv2.fillPoly(z, [np.int32(cv2.perspectiveTransform(poly[None], H)[0])], 255)
        return z > 0

    m = ((bright & zone(LEFT_HAND)) | (skin & zone(RIGHT_THUMB))).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
    n, lab_, st, _ = cv2.connectedComponentsWithStats(m)
    keep = np.zeros_like(m)
    for i in range(1, n):
        if st[i, 4] > 1500:
            keep[lab_ == i] = 255
    cnts, _ = cv2.findContours(keep, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    filled = np.zeros_like(keep)
    cv2.drawContours(filled, cnts, -1, 255, -1)
    return cv2.GaussianBlur(filled, (7, 7), 0)   # soft edge


def main():
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    movie = sys.argv[1]
    tmp = tempfile.mkdtemp(prefix="woof_")
    try:
        frames = extract(movie, tmp)
    finally:
        shutil.rmtree(tmp, ignore_errors=True)
    cuts = find_cuts(frames)
    assert len(cuts) >= 2, f"expected two shot cuts, found {cuts}"
    c0, c1 = cuts[0], cuts[1]           # close-up is frames[c0:c1]
    print(f"close-up: {t_of(c0):.2f}s - {t_of(c1):.2f}s ({c1 - c0} frames)")
    hs = track(frames[c0:c1])

    scale = OUT_W / 1920
    out_h = round((CROP_BOTTOM - CROP_TOP) * scale)
    keep = [i for i in range(c0, len(frames), STEP) if t_of(i) <= END_AFTER_WOOF]

    tiles, thumbs, meta = [], [], []
    for i in keep:
        img = frames[i]
        small = cv2.resize(img[CROP_TOP:CROP_BOTTOM], (OUT_W, out_h), interpolation=cv2.INTER_AREA)
        tiles.append(small)
        entry = {"t": round(t_of(i), 3)}
        if i < c1:
            H = hs[i - c0]
            q = cv2.perspectiveTransform(REF_QUAD[None], H)[0]
            entry["quad"] = [[round(float(x) * scale, 2), round((float(y) - CROP_TOP) * scale, 2)] for x, y in q]
            m = thumb_mask(img, H)[CROP_TOP:CROP_BOTTOM]
            m = cv2.resize(m, (OUT_W, out_h), interpolation=cv2.INTER_AREA)
            rgba = np.dstack([small, m])
            rgba[m == 0] = 0
            thumbs.append(rgba)
            entry["thumbs"] = len(thumbs) - 1
        meta.append(entry)

    def sheet(imgs, ch):
        rows = -(-len(imgs) // SPRITE_COLS)
        s = np.zeros((rows * out_h, SPRITE_COLS * OUT_W, ch), np.uint8)
        for k, im in enumerate(imgs):
            r, c = divmod(k, SPRITE_COLS)
            s[r * out_h:(r + 1) * out_h, c * OUT_W:(c + 1) * OUT_W] = im
        return s

    os.makedirs(OUT, exist_ok=True)
    cv2.imwrite(os.path.join(OUT, "frames.jpg"), sheet(tiles, 3), [cv2.IMWRITE_JPEG_QUALITY, 88])
    cv2.imwrite(os.path.join(OUT, "thumbs.png"), sheet(thumbs, 4), [cv2.IMWRITE_PNG_COMPRESSION, 9])

    # Frame delays in GIF centiseconds, alternated so the total matches real time.
    delays, acc = [], 0.0
    for k in range(len(keep)):
        acc += STEP / FPS * 100
        d = round(acc) - sum(delays)
        delays.append(d)
    t0 = meta[0]["t"]
    for e, d in zip(meta, delays):
        e["delay"] = d
    scene = {
        "width": OUT_W, "height": out_h, "cols": SPRITE_COLS,
        "photoAspect": 0.63,
        "frames": meta,
        "captions": [{"text": c["text"], "start": round(c["start"] - t0, 3), "end": round(c["end"] - t0, 3)}
                     for c in CAPTIONS],
    }
    for e in meta:
        e["t"] = round(e["t"] - t0, 3)
    with open(os.path.join(OUT, "scene.json"), "w") as f:
        json.dump(scene, f, separators=(",", ":"))
    print(f"wrote {len(meta)} frames ({len(thumbs)} close-up) to {os.path.abspath(OUT)}")


if __name__ == "__main__":
    main()
