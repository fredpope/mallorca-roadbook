import { mkdir, writeFile } from "node:fs/promises";
import { CYCLING_TERMS, HAS_CONTACT, PAUSE, queryFiles, readJson, sleep, thumbUrls, toCandidate } from "./commons.mjs";

const spots = await readJson(new URL("./photo-spots.json", import.meta.url), {});
const outDir = new URL("../photos-review/", import.meta.url);
const arg = (name, fallback) => Number(process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1] ?? fallback);
const PER_DAY = arg("per-day", 0);
const PER_EXTRA = arg("per-extra", 0);
for (const [key, page] of Object.entries(spots)) {
  if (key !== "week" && PER_DAY && !key.includes("extra")) page.want = PER_DAY;
  if (PER_EXTRA && key.includes("extra")) page.want = PER_EXTRA;
}
const limitFor = (page) => Math.max(24, Math.ceil(page.want * 2.4));
const batchesFor = (page) => (page.want > 10 ? 4 : 2);
const used = new Set();
const cachePath = new URL("cache-v3.json", outDir);
const cache = process.argv.includes("--fresh") ? {} : await readJson(cachePath, {});
const result = {};

if (!HAS_CONTACT) console.warn("Tip: set COMMONS_CONTACT to your email or repo URL. Wikimedia throttles clients that do not identify themselves.\n");
await mkdir(outDir, { recursive: true });


for (const [key, page] of Object.entries(spots)) {
  if (cache[key] && cache[key].want === page.want) {
    result[key] = cache[key];
    cache[key].candidates.slice(0, page.want).forEach((c) => used.add(c.pageTitle));
    console.log(`${key.padEnd(18)} ${String(cache[key].candidates.length).padStart(2)} candidates  ${page.title} (cached)`);
    continue;
  }
  let failures = 0;
  const found = new Map();
  const add = (pages) => { for (const p of pages) { const c = toCandidate(p); if (c && !used.has(c.pageTitle) && !found.has(c.pageTitle)) found.set(c.pageTitle, c); } };
  for (const spot of page.spots) {
    try {
      add(await queryFiles({ generator: "geosearch", ggscoord: `${spot.lat}|${spot.lon}`, ggsradius: String(page.radius), ggsnamespace: "6", ggslimit: "25" }, batchesFor(page)));
    } catch (err) { failures++; console.warn(`  geosearch failed near ${spot.name}: ${err.message}`); }
    await sleep(PAUSE);
  }
  for (const category of page.categories ?? []) {
    try {
      add(await queryFiles({ generator: "categorymembers", gcmtitle: `Category:${category}`, gcmtype: "file", gcmlimit: "25" }, batchesFor(page)));
    } catch (err) { failures++; console.warn(`  category "${category}" failed: ${err.message}`); }
    await sleep(PAUSE);
  }
  for (const place of page.cyclingPlaces ?? []) {
    for (const term of key === "week" ? CYCLING_TERMS : CYCLING_TERMS.slice(0, key.includes("extra") ? 2 : 4)) {
      try {
        add(await queryFiles({ generator: "search", gsrsearch: `filetype:bitmap "${place}" ${term}`, gsrnamespace: "6", gsrlimit: "20" }, 1));
      } catch (err) { failures++; console.warn(`  search "${place} ${term}" failed: ${err.message}`); }
      await sleep(PAUSE);
    }
  }
  const ranked = [...found.values()].sort((a, b) => b.score - a.score).slice(0, limitFor(page));
  ranked.slice(0, page.want).forEach((c) => used.add(c.pageTitle));
  result[key] = { title: page.title, want: page.want, candidates: ranked };
  if (failures === 0) {
    cache[key] = result[key];
    await writeFile(cachePath, JSON.stringify(cache));
  }
  console.log(`${key.padEnd(18)} ${String(ranked.length).padStart(2)} candidates  ${page.title}`);
}

const needThumbs = Object.values(result).flatMap((r) => r.candidates.filter((c) => !c.thumb).map((c) => c.pageTitle));
const thumbs = await thumbUrls(needThumbs);
for (const r of Object.values(result)) for (const c of r.candidates) c.thumb = c.thumb ?? thumbs[c.pageTitle] ?? c.full;

await writeFile(cachePath, JSON.stringify(cache));
await writeFile(new URL("candidates.json", outDir), JSON.stringify(result, null, 2));

const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[ch]));
const html = `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Choose photos</title>
<style>body{font:15px/1.4 system-ui,sans-serif;margin:0 auto;max-width:1300px;padding:20px;background:#f2f4f1;color:#14222b}
h1{margin:0 0 4px}h2{margin:34px 0 6px;position:sticky;top:0;background:#f2f4f1;padding:8px 0;z-index:1}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:10px}
label{display:block;background:#fff;border:3px solid transparent;border-radius:6px;overflow:hidden;cursor:pointer}
label:has(input:checked){border-color:#1a7f94}img{display:block;width:100%;aspect-ratio:4/3;object-fit:cover}
.cap{padding:6px 8px;font-size:12px;color:#55656f}.cap b{color:#14222b;display:block;font-size:13px}.tag{background:#f2c230;color:#14222b;border-radius:3px;padding:0 5px;font-weight:600}
button{position:fixed;right:20px;bottom:20px;font:600 16px system-ui;padding:12px 18px;border-radius:6px;border:0;background:#14222b;color:#fff;cursor:pointer}</style></head><body>
<h1>Choose photos</h1><p>Ticked photos are the automatic picks. The first ticked photo on each page becomes its banner. Change the ticks, press Save selection, move the downloaded <code>selection.json</code> into the <code>photos-review</code> folder, then run <code>npm run photos:fetch</code>.</p>
${Object.entries(result).map(([key, r]) => `<h2>${esc(r.title)} <small>(${esc(key)}, aim for ${r.want})</small></h2><div class="grid">${r.candidates.map((c, i) => `<label><input type="checkbox" data-key="${esc(key)}" data-title="${esc(c.pageTitle)}" ${i < r.want ? "checked" : ""}><img loading="lazy" src="${esc(c.thumb)}" alt=""><div class="cap"><b>${esc(c.title)}</b>${c.cycling ? '<span class="tag">cycling</span> ' : ""}${esc(c.author)}, ${esc(c.license)} <a href="${esc(c.source)}" target="_blank">original</a></div></label>`).join("")}</div>`).join("")}
<button id="save">Save selection</button>
<script>document.getElementById("save").onclick=()=>{const sel={};document.querySelectorAll("input:checked").forEach(i=>{(sel[i.dataset.key]??=[]).push(i.dataset.title)});const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify(sel,null,2)],{type:"application/json"}));a.download="selection.json";a.click()}</script>
</body></html>`;
await writeFile(new URL("index.html", outDir), html);
console.log("\nOpen photos-review/index.html in a browser to review, or run npm run photos:fetch to accept the automatic picks.");
