# Mallorca roadbook

A seven-day cycling roadbook for Mallorca, 26 September to 2 October: an island map with every route, a page per day with elevation profile, climbs, pacing and fuel plan, and a page for each of the fourteen optional extra rides.

Built with Vite, React and TypeScript. It is a static site with hash-based routing, so it deploys to any static host with no rewrite rules.

## Run it locally

```
npm install
npm run dev
```

## Add photos

Photos come from Wikimedia Commons under free licences. Two scripts find them by the coordinates of each road, let you choose, then download them and write the credits.

```
COMMONS_CONTACT="you@example.com" npm run photos:find
```

Set `COMMONS_CONTACT` to your email or the repository URL. Wikimedia asks automated clients to identify themselves and throttles those that do not. The script paces its requests, waits when the API asks it to, and saves progress to `photos-review/cache.json`, so if a run is interrupted or a page reports failures, run the same command again and it picks up where it left off. Add `-- --fresh` to ignore the cache.

This queries the Commons API around every place in the roadbook and writes `photos-review/index.html`. Open that file in a browser. It aims for 25 photos per day, 5 per extra ride and 12 on the week page, and shows roughly 60 candidates per day with the automatic picks ticked. Change the targets with `npm run photos:find -- --per-day=15 --per-extra=3`. A full run makes several hundred paced API calls and takes 15 to 25 minutes; it is resumable. The first ticked photo on a page becomes its banner. Change the ticks, press **Save selection**, and move the downloaded `selection.json` into the `photos-review` folder.

```
npm run photos:fetch
```

This downloads the chosen photos (1280 px wide, plus a 500 px thumbnail) into `public/photos/` and writes `src/data/photos.json` with title, author, licence and a link to the original for each one. If there is no `selection.json` it uses the automatic picks.

Commit `public/photos/` and `src/data/photos.json`. The site shows a banner and gallery on every page that has photos, and lists every credit at `#/credits`.

### Cycling photos

The finder also runs text searches on Commons for each place combined with cycling terms (cyclist, cycling, bicycle, ciclista, Rennrad), and searches the island as a whole for a gallery on the week page. Matches get a yellow **cycling** tag on the review page and are ranked first. Commons is thin on cycling shots for some roads, so expect a handful per day, not dozens. The places searched are the `cyclingPlaces` lists in `scripts/photo-spots.json`.

### Your own photos

The best from-the-saddle photos will be yours, the group's or the tour operator's. Put them in folders named after the page, for example `photos-inbox/day-2/` or `photos-inbox/day-2-extra-1/` (use `week` for the front page), then run:

```
PHOTO_AUTHOR="Your name" npm run photos:add
```

This resizes them, and lists them first on the page, so your first photo becomes the banner. For per-photo titles or credits, add a `credits.json` in the folder: `{ "IMG_1234.jpg": { "title": "Top of Sa Calobra", "author": "Rider name" } }`. Re-running `photos:fetch` later keeps your own photos in place. Get permission before publishing anyone else's photos, including the operator's.

To swap a photo later, re-run `photos:find`, change the ticks and re-run `photos:fetch`. To use your own photos, put the files in `public/photos/` and add entries to `src/data/photos.json` by hand using the same fields.

The search areas and categories are in `scripts/photo-spots.json`. The licence filter, size limits and ranking keywords are at the top of `scripts/commons.mjs`.

## Deploy to Cloudflare Pages

1. Push this repository to GitHub.
2. In the Cloudflare dashboard open **Workers & Pages**, choose **Create**, then **Pages**, then **Connect to Git**, and select the repository.
3. Build settings: framework preset **Vite**, build command `npm run build`, output directory `dist`. The `.nvmrc` file pins Node 20.
4. After the first deploy, open the project's **Custom domains** tab and add your domain. If the domain's DNS is already on Cloudflare the record is created for you; otherwise add the CNAME it shows at your DNS provider.

Every push to the main branch redeploys. Pull requests get their own preview URL.

## Where things live

| Path | Contents |
| --- | --- |
| `src/data/days.ts` | The seven days: options, profiles, climbs, pacing, fuel notes |
| `src/data/addons.ts` | The fourteen extra rides |
| `src/data/points.ts` | Latitude and longitude of every named place |
| `src/data/coast.json` | Mallorca coastline, derived from the es-atlas dataset (IGN Spain) |
| `src/components/` | Map, elevation profile, gallery and small shared pieces |
| `src/pages/` | Week, day, extra ride and credits pages |
| `scripts/` | Photo finder and fetcher |

## Accuracy

Route lines and elevation profiles are schematic. They are drawn through known towns and passes from the tour itinerary and are not GPS tracks. Headline distance and climbing for each day are the tour operator's own figures.
