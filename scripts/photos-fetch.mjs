import { mkdir, writeFile } from "node:fs/promises";
import { download, readJson, sleep } from "./commons.mjs";

const reviewDir = new URL("../photos-review/", import.meta.url);
const photoDir = new URL("../public/photos/", import.meta.url);
const manifestPath = new URL("../src/data/photos.json", import.meta.url);

const candidates = await readJson(new URL("candidates.json", reviewDir), null);
if (!candidates) { console.error("Run npm run photos:find first."); process.exit(1); }
const selection = await readJson(new URL("selection.json", reviewDir), null);
console.log(selection ? "Using your selection.json" : "No selection.json found, using the automatic picks");

await mkdir(photoDir, { recursive: true });
const previous = await readJson(manifestPath, {});
const manifest = {};
let count = 0;

for (const [key, page] of Object.entries(candidates)) {
  const byTitle = new Map(page.candidates.map((c) => [c.pageTitle, c]));
  const chosen = selection ? (selection[key] ?? []).map((t) => byTitle.get(t)).filter(Boolean) : page.candidates.slice(0, page.want);
  manifest[key] = (previous[key] ?? []).filter((p) => p.local);
  for (const [i, c] of chosen.entries()) {
    const file = `${key}-${i + 1}.jpg`;
    const thumb = `${key}-${i + 1}-thumb.jpg`;
    try {
      await writeFile(new URL(file, photoDir), await download(c.full));
      await sleep(300);
      await writeFile(new URL(thumb, photoDir), await download(c.thumb));
      await sleep(300);
      manifest[key].push({ file, thumb, width: c.width, height: c.height, title: c.title, author: c.author, license: c.license, licenseUrl: c.licenseUrl, source: c.source });
      count++;
      console.log(`  ${file}  ${c.title}`);
    } catch (err) { console.warn(`  skipped ${c.title}: ${err.message}`); }
  }
}

for (const [key, list] of Object.entries(previous)) if (!manifest[key]) manifest[key] = list.filter((p) => p.local);
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nSaved ${count} photos to public/photos and wrote src/data/photos.json. Commit both.`);
