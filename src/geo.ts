import coast from "./data/coast.json";
import { P } from "./data/points";
import type { Addon, Day, LatLon, RideOption } from "./data/types";

const KX = 770.5;
const KY = 1000;
const LON0 = 2.28;
const LAT0 = 40.0;

export type XY = [number, number];
export type Box = [number, number, number, number];

export const proj = ([lat, lon]: LatLon): XY => [(lon - LON0) * KX, (LAT0 - lat) * KY];

export function smoothPath(pts: XY[], closed = false): string {
  if (pts.length < 3 && !closed) return "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(",")).join("L");
  const n = pts.length;
  const at = (i: number) => (closed ? pts[(i + n) % n] : pts[Math.max(0, Math.min(n - 1, i))]);
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  const last = closed ? n : n - 1;
  const t = 6;
  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2);
    d += `C${(p1[0] + (p2[0] - p0[0]) / t).toFixed(1)},${(p1[1] + (p2[1] - p0[1]) / t).toFixed(1)} ${(p2[0] - (p3[0] - p1[0]) / t).toFixed(1)},${(p2[1] - (p3[1] - p1[1]) / t).toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d + (closed ? "Z" : "");
}

export const COAST_PATHS: string[] = (coast as number[][][]).map((ring) =>
  smoothPath(ring.slice(0, -1).map(([lon, lat]) => proj([lat, lon])), true)
);

export const segPath = (seg: string[], offset = 0): string =>
  smoothPath(seg.map((k) => { const [x, y] = proj(P[k]); return [x + offset, y + offset] as XY; }));

function fitBox(keys: string[]): Box {
  const pts = keys.map((k) => proj(P[k]));
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  let x0 = Math.min(...xs), y0 = Math.min(...ys);
  let w = Math.max(...xs) - x0, h = Math.max(...ys) - y0;
  const pad = Math.max(w, h) * 0.22 + 25;
  x0 -= pad; y0 -= pad; w += 2 * pad; h += 2 * pad;
  const aspect = 1.45;
  if (w / h < aspect) { const nw = h * aspect; x0 -= (nw - w) / 2; w = nw; }
  else { const nh = w / aspect; y0 -= (nh - h) / 2; h = nh; }
  return [x0, y0, w, h];
}

export const ISLAND_BOX: Box = [-70, -25, 1080, 810];
export const dayBox = (d: Day): Box => fitBox([...d.segs.flat(), ...d.addons.flatMap((a) => a.seg), ...d.labels.map((l) => l[1])]);
export const addonBox = (a: Addon): Box => fitBox([...a.seg, ...a.labels.map((l) => l[1])]);

export const hoursFor = (o: Pick<RideOption, "km" | "m">): number => o.km / 26 + o.m / 800;

export function fmtH(h: number): string {
  const q = Math.round(h * 4) / 4;
  const H = Math.floor(q);
  const M = Math.round((q - H) * 60);
  return H ? `${H}h${M ? String(M).padStart(2, "0") : ""}` : `${M} min`;
}

export const round10 = (v: number): number => Math.round(v / 10) * 10;
export const num = (v: number): string => v.toLocaleString("en-GB");

export function elevAt(pts: [number, number][], k: number): number {
  for (let i = 1; i < pts.length; i++) {
    if (k <= pts[i][0]) {
      const a = pts[i - 1], b = pts[i];
      return a[1] + ((b[1] - a[1]) * (k - a[0])) / (b[0] - a[0] || 1);
    }
  }
  return pts[pts.length - 1][1];
}
