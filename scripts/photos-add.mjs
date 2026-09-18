import { mkdir, readdir, writeFile } from "node:fs/promises";
import { basename, extname } from "node:path";
import sharp from "sharp";
import { readJson } from "./commons.mjs";

const inbox = new URL("../photos-inbox/", import.meta.url);
const photoDir = new URL("../public/photos/", import.meta.url);
const manifestPath = new URL("../src/data/photos.json", import.meta.url);
const spots = await readJson(new URL("./photo-spots.json", import.meta.url), {});
const defaultAuthor = process.env.PHOTO_AUTHOR ?? "Tour group";

await mkdir(photoDir, { recursive: true });
const manifest = await readJson(manifestPath, {});
let folders = [];
try { folders = (await readdir(inbox, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name); } catch {}
if (folders.length === 0) {
  console.log("Nothing to add. Create folders such as photos-inbox/day-2 or photos-inbox/day-2-extra-1 and put image files in them.");
  console.log(`Valid folder names: ${Object.keys(spots).join(", ")}`);
  process.exit(0);
}

let count = 0;
for (const key of folders) {
  if (!spots[key]) { console.warn(`Skipping "${key}": not a page key.`); continue; }
  const folder = new URL(`${key}/`, inbox);
  const credits = await readJson(new URL("credits.json", folder), {});
  const files = (await readdir(folder)).filter((f) => /\.(jpe?g|png|webp|heic|tiff?)$/i.test(f)).sort();
  const existing = (manifest[key] ?? []).filter((p) => !p.local);
  const local = [];
  for (const [i, name] of files.entries()) {
    const stem = `${key}-own-${i + 1}`;
    const source = new URL(name, folder);
    const full = await sharp(source.pathname).rotate().resize({ width: 1600, withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(new URL(`${stem}.jpg`, photoDir).pathname);
    await sharp(source.pathname).rotate().resize({ width: 500 }).jpeg({ quality: 78 }).toFile(new URL(`${stem}-thumb.jpg`, photoDir).pathname);
    const info = credits[name] ?? {};
    local.push({ file: `${stem}.jpg`, thumb: `${stem}-thumb.jpg`, width: full.width, height: full.height, title: info.title ?? basename(name, extname(name)).replace(/[-_]+/g, " "), author: info.author ?? defaultAuthor, license: info.license ?? "All rights reserved, used with permission", licenseUrl: "", source: "", local: true });
    count++;
    console.log(`  ${key}: ${name}`);
  }
  manifest[key] = [...local, ...existing];
}

await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`\nAdded ${count} of your own photos. They appear first on each page, so the first one becomes the banner.`);
