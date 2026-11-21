# WoofMaker

**Buzz, your girlfriend… WOOF!** Put anyone in Buzz's picture frame from *Home Alone* and get a shareable GIF in seconds.

Live at **[woofmaker.org](https://woofmaker.org)**. A fan-made revival of the original woofmaker.com (2013), rebuilt for phones.

## How it works

- Everything happens in the visitor's browser. Their photo is never uploaded, and the server only serves static files.
- `public/scene/` holds the pre-built scene: a sprite sheet of the GIF frames, a sprite sheet of Kevin's thumbs, and `scene.json` with the photo's four corners in every frame.
- `public/js/render.js` warps the visitor's photo into those corners (a perspective transform per frame), puts the thumbs back on top, adds film-style color and grain, and draws the captions.
- `public/js/gif-worker.js` encodes the GIF in a Web Worker with [gifenc](https://github.com/mattdesl/gifenc).

## Run locally

```sh
npm install
npm start          # http://localhost:3000  (set PORT to change)
```

## Rebuild the scene from your own copy of the movie

The movie isn't in this repo. To regenerate the scene assets (for example to change the clip timing in `tools/build_scene.py`):

```sh
pip install opencv-python-headless numpy pillow
python tools/build_scene.py path/to/home-alone.mp4   # frames, thumbs, photo tracking
python tools/make_og.py path/to/home-alone.mp4       # link-preview image + app icon
```

`build_scene.py` finds the photo close-up by its shot cuts, tracks the photo through every frame with SIFT feature matching, and cuts out Kevin's thumbs.

## Deploy (Railway)

The repo deploys as-is: Railway runs `npm install` and then `node server.js` (see `railway.json`). The health check is `/healthz`. Set `CANONICAL_HOST` if the site moves off `woofmaker.org`. Requests to `www.` are redirected there.

## Legal

Fan-made and non-commercial. *Home Alone* © 20th Century Studios. This project is not affiliated with or endorsed by the studio. Code is MIT licensed. The movie frames in `public/scene/` and `public/og.jpg` are not covered by that license.
