# WoofMaker

**Buzz, your girlfriend… WOOF!** Put anyone in Buzz's picture frame from *Home Alone* and get a shareable GIF in seconds.

Live at **[woofmaker.org](https://www.woofmaker.org)**. A fan-made revival of the original woofmaker.com (2013), rebuilt for phones.

## How it works

- Everything happens in the visitor's browser. Their photo is never uploaded, and the server only serves static files.
- The one thing the server stores is the count of GIFs made, shown at the bottom of the page as "X Woofs Created", kept as a single number in a JSON file (`counter.js`), no database. On Railway the file lives on a Volume attached to the service (Railway sets `RAILWAY_VOLUME_MOUNT_PATH`), so it survives restarts and redeploys. `GET /api/count` reads it; the page sends `POST /api/count` each time a GIF is made.
- `public/scene/` holds the pre-built scene (22:54 to 23:00.9 of the film, 12 fps, 480 px wide): a few small sprite sheets of the GIF frames, sprite sheets of Kevin's thumbs, and `scene.json` with the photo's four corners in every frame.
- `public/js/render.js` warps the visitor's photo into those corners (a perspective transform per frame), puts the thumbs back on top, adds film-style color and grain, and draws the captions.
- `public/js/gif-worker.js` encodes the GIF in a Web Worker with [gifenc](https://github.com/mattdesl/gifenc). The GIF is encoded once, at 360 px wide and 12 fps, and is usually a little over 1 MB because unchanged pixels are skipped between frames. The settings are the constants at the top of the file.

## Languages

The site is available in 13 languages. For English, Spanish, Portuguese, Chinese (Simplified and Traditional) and Korean, the GIF captions come from the film's own subtitle tracks. French, German, Italian, Dutch, Polish, Russian and Japanese are translated by hand, captions included.

- All text lives in `public/js/strings.js`. `public/index.html` is a template: the server fills `{{key}}` placeholders with that language's text, so each language is real HTML that search engines can read.
- English is served at `/`, the others at `/<slug>/` (`/es/`, `/fr/`, `/ja/` and so on), each with `hreflang` links to the rest. `/sitemap.xml` is generated from the same list.
- A visitor to `/` is sent to their browser's preferred language. Picking a language in the footer sets a `lang` cookie that overrides that.
- To add a language, add an entry to `strings.js`. Nothing else needs to change.

## AI assistants

`public/llms.txt` is a plain-text summary of the site for AI assistants and their crawlers: what it makes, the steps a person follows, and the fact that there is no GIF API (the GIF is built in the visitor's browser). `robots.txt` allows all crawlers. Update `llms.txt` if the steps or the output change.

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

The repo deploys as-is: Railway runs `npm install` and then `node server.js`. The health check is `/healthz`.

The main address is `www.woofmaker.org` (a CNAME to Railway). The bare `woofmaker.org` is forwarded there by Squarespace, because Squarespace allows no CNAME on the bare domain and no ALIAS while DNSSEC is on. If a request for the bare domain does reach the server, it redirects to www. Set `CANONICAL_HOST` to change the main address.

## Legal

Fan-made and non-commercial. *Home Alone* © 20th Century Studios. This project is not affiliated with or endorsed by the studio. Code is MIT licensed. The movie frames in `public/scene/` and `public/og.jpg` are not covered by that license.
