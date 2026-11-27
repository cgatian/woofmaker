# WoofMaker

**Buzz, your girlfriend… WOOF!** Put anyone in Buzz's picture frame from *Home Alone* and get a shareable GIF in seconds.

Live at **[woofmaker.org](https://www.woofmaker.org)**. A fan-made revival of the original woofmaker.com (2013), rebuilt for phones.

## How it works

- Everything happens in the visitor's browser. Their photo is never uploaded.
- The site is plain files on Cloudflare Pages. `npm run build` writes them to `dist/`: the page once per language, the sitemap and Cloudflare's header and redirect files. `site.js` holds the page rendering, sitemap, security headers and language choice.
- Two small Cloudflare Pages functions in `functions/` do the only work that happens on a server: `index.js` sends a visitor to `/` on to their own language, and `api/count.js` is the counter.
- The counter is the one thing stored: the number of GIFs made, shown at the bottom of the page as "X Woofs Created". It is one row in a Cloudflare D1 database. `GET /api/count` reads it; the page sends `POST /api/count` each time a GIF is made.
- `public/scene/` holds the pre-built scene (22:54 to 23:00.9 of the film, 12 fps, 480 px wide): a few small sprite sheets of the GIF frames, sprite sheets of Kevin's thumbs, and `scene.json` with the photo's four corners in every frame.
- `public/js/render.js` warps the visitor's photo into those corners (a perspective transform per frame), puts the thumbs back on top, adds film-style color and grain, and draws the captions.
- `public/js/gif-worker.js` encodes the GIF in a Web Worker with [gifenc](https://github.com/mattdesl/gifenc). The GIF is encoded once, at 360 px wide and 12 fps, and is usually a little over 1 MB because unchanged pixels are skipped between frames. The settings are the constants at the top of the file.

## Languages

The site is available in 13 languages. For English, Spanish, Portuguese, Chinese (Simplified and Traditional) and Korean, the GIF captions come from the film's own subtitle tracks. French, German, Italian, Dutch, Polish, Russian and Japanese are translated by hand, captions included.

- All text lives in `public/js/strings.js`. `public/index.html` is a template: the build fills `{{key}}` placeholders with that language's text, so each language is real HTML that search engines can read.
- English is served at `/`, the others at `/<slug>/` (`/es/`, `/fr/`, `/ja/` and so on), each with `hreflang` links to the rest. `/sitemap.xml` is generated from the same list.
- A visitor to `/` is sent to their browser's preferred language. Picking a language in the footer sets a `lang` cookie that overrides that.
- To add a language, add an entry to `strings.js`. Nothing else needs to change.

## AI assistants

`public/llms.txt` is a plain-text summary of the site for AI assistants and their crawlers: what it makes, the steps a person follows, and the fact that there is no GIF API (the GIF is built in the visitor's browser). `robots.txt` allows all crawlers. Update `llms.txt` if the steps or the output change.

## Run locally

```sh
npm install
npm start          # builds the site, then serves it at http://localhost:8788
```

This runs Cloudflare's local emulator (`wrangler pages dev`) with a throwaway local database for the counter, so it behaves like the live site.

## Rebuild the scene from your own copy of the movie

The movie isn't in this repo. To regenerate the scene assets (for example to change the clip timing in `tools/build_scene.py`):

```sh
pip install opencv-python-headless numpy pillow
python tools/build_scene.py path/to/home-alone.mp4   # frames, thumbs, photo tracking
python tools/make_og.py path/to/home-alone.mp4       # link-preview image + app icon
```

`build_scene.py` finds the photo close-up by its shot cuts, tracks the photo through every frame with SIFT feature matching, and cuts out Kevin's thumbs.

## Deploy (Cloudflare Pages)

Cloudflare Pages builds and deploys every push to `main`.

One-time setup in the Cloudflare dashboard:

1. **Workers & Pages → Create → Pages → Connect to Git**, and pick this repo. Build command `npm run build`, build output directory `dist`.
2. **Storage & Databases → D1 → Create** a database (any name, for example `woofmaker`).
3. In the Pages project, **Settings → Bindings → Add → D1 database**: variable name `DB`, pointing at that database. The function creates its tables on first use.
4. Optional: to start the count from a number other than zero, add a variable `COUNTER_START` under **Settings → Variables and Secrets** before the first visit.
5. **Settings → Runtime → Fail open / closed**: choose **Fail open**, so that if the free daily functions allowance (100,000 requests) ever runs out, the pages keep being served and only the counter and the language redirect pause.
6. Redeploy so the binding and variable take effect, then check `https://<project>.pages.dev/` and `/api/count`.
7. **Custom domains → Set up a domain**: `www.woofmaker.org`. Then point the `www` CNAME at the DNS provider to `<project>.pages.dev`.

The main address is `www.woofmaker.org`. The bare `woofmaker.org` is forwarded there by Squarespace, where the domain's DNS lives, because Squarespace allows no CNAME on the bare domain and no ALIAS while DNSSEC is on.

Free-plan limits that matter here: 100,000 function requests a day (only `/` and `/api/count` count), and 100,000 database rows written a day (each GIF writes two or three).

## Legal

Fan-made and non-commercial. *Home Alone* © 20th Century Studios. This project is not affiliated with or endorsed by the studio. Code is MIT licensed. The movie frames in `public/scene/` and `public/og.jpg` are not covered by that license.
