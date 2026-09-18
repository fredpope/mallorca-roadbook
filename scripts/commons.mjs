import { readFile } from "node:fs/promises";

export const API = process.env.COMMONS_API ?? "https://commons.wikimedia.org/w/api.php";
const CONTACT = process.env.COMMONS_CONTACT ?? "";
export const USER_AGENT = `MallorcaRoadbook/1.1 (${CONTACT || "no contact set"}) node-fetch`;
export const HAS_CONTACT = CONTACT.length > 0;
export const FULL_WIDTH = 1280;
export const THUMB_WIDTH = 500;

const FREE_LICENSE = /^(cc0|cc[ -]by(-sa)?[ -]\d|public domain|pd\b)/i;
const BOOST = /(road|carretera|ma-10|ma-2210|coll|bike|bici|cycl|cicl|mirador|view|vista|panoram|coast|costa|cliff|far\b|lighthouse|bay|badia|port|village|poble|vineyard|vinya)/i;
export const CYCLING = /(cyclist|cycling|bicycl|bike|biker|peloton|ciclist|ciclism|bicicleta|\bbici\b|radfahr|rennrad|fahrrad|v[ée]lo\b|cycliste|challenge (de )?mallorca|mallorca 312|trofeo)/i;
export const CYCLING_TERMS = ["cyclist", "cycling", "bicycle", "ciclista", "Rennrad"];
const PENALTY = /(map|mapa|plan\b|escut|coat of arms|logo|interior|altar|retaule|plaque|placa|sign|flora|flower|bird|insect|lizard|museum|museu|portrait|retrat|document|stamp|ETH-BIB|\b18\d\d\b|\b19[0-6]\d\b)/i;

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
export const strip = (html) => String(html ?? "").replace(/<[^>]*>/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/\s+/g, " ").trim();
export const readJson = async (path, fallback) => { try { return JSON.parse(await readFile(path, "utf8")); } catch { return fallback; } };

export const PAUSE = Number(process.env.COMMONS_DELAY ?? 1200);

async function request(url, what) {
  let lastStatus = 0;
  for (let attempt = 0; attempt < 6; attempt++) {
    let res;
    try {
      res = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept-Encoding": "gzip" } });
    } catch (err) {
      lastStatus = -1;
      await sleep(3000 * (attempt + 1));
      continue;
    }
    if (res.ok) return res;
    lastStatus = res.status;
    if (res.status !== 429 && res.status < 500) throw new Error(`${what} returned HTTP ${res.status}`);
    const retryAfter = Number(res.headers.get("retry-after"));
    const wait = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 4000 * 2 ** attempt;
    console.warn(`  HTTP ${res.status}, waiting ${Math.round(wait / 1000)}s before retrying`);
    await sleep(Math.min(wait, 90000));
  }
  throw new Error(`${what} kept failing (last status ${lastStatus === -1 ? "network error" : lastStatus})`);
}

export async function getJson(params) {
  const url = `${API}?${new URLSearchParams({ format: "json", formatversion: "2", maxlag: "5", ...params })}`;
  const res = await request(url, "Commons API");
  const data = await res.json();
  if (data.error) throw new Error(`Commons API error ${data.error.code}: ${data.error.info}`);
  return data;
}

export async function queryFiles(generatorParams, maxBatches = 3) {
  const pages = [];
  let cont = {};
  for (let batch = 0; batch < maxBatches; batch++) {
    const data = await getJson({ action: "query", prop: "imageinfo", iiprop: "url|size|mime|extmetadata", iiurlwidth: String(FULL_WIDTH), ...generatorParams, ...cont });
    pages.push(...(data.query?.pages ?? []));
    if (!data.continue) break;
    cont = data.continue;
    await sleep(PAUSE);
  }
  return pages;
}

export function toCandidate(page) {
  const info = page.imageinfo?.[0];
  if (!info || info.mime !== "image/jpeg") return null;
  const meta = info.extmetadata ?? {};
  const license = strip(meta.LicenseShortName?.value);
  if (!FREE_LICENSE.test(license)) return null;
  const aspect = info.width / info.height;
  const title = page.title.replace(/^File:/, "").replace(/\.[a-z]+$/i, "").replace(/_/g, " ");
  const text = `${title} ${strip(meta.ImageDescription?.value)} ${strip(meta.Categories?.value)}`;
  const cycling = CYCLING.test(text);
  if (cycling ? info.width < 1200 || aspect < 0.9 || aspect > 2.6 : info.width < 1600 || aspect < 1.2 || aspect > 2.4) return null;
  let score = Math.min(info.width * info.height, 24e6) / 24e6;
  if (BOOST.test(text)) score += 1;
  if (cycling) score += 3;
  if (PENALTY.test(text)) score -= 2;
  if (/quality images|featured pictures|valued images/i.test(text)) score += 1.5;
  return {
    pageTitle: page.title,
    title,
    author: strip(meta.Artist?.value) || "Unknown author",
    license,
    licenseUrl: strip(meta.LicenseUrl?.value) || info.descriptionurl,
    source: info.descriptionurl,
    full: info.thumburl ?? info.url,
    width: info.thumbwidth ?? info.width,
    height: info.thumbheight ?? info.height,
    cycling,
    score: Number(score.toFixed(3)),
  };
}

export async function thumbUrls(pageTitles) {
  const out = {};
  for (let i = 0; i < pageTitles.length; i += 25) {
    const data = await getJson({ action: "query", prop: "imageinfo", iiprop: "url", iiurlwidth: String(THUMB_WIDTH), titles: pageTitles.slice(i, i + 25).join("|") });
    for (const page of data.query?.pages ?? []) out[page.title] = page.imageinfo?.[0]?.thumburl;
    await sleep(PAUSE);
  }
  return out;
}

export async function download(url) {
  const res = await request(url, "Download");
  return Buffer.from(await res.arrayBuffer());
}
