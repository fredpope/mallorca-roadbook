import manifest from "./data/photos.json";
import type { Photo } from "./data/types";

const PHOTOS = manifest as Record<string, Photo[]>;

export const dayKey = (n: number) => `day-${n}`;
export const addonKey = (n: number, i: number) => `day-${n}-extra-${i + 1}`;
export const photosFor = (key: string): Photo[] => PHOTOS[key] ?? [];
export const allPhotos = (): [string, Photo][] => Object.entries(PHOTOS).flatMap(([key, list]) => list.map((p) => [key, p] as [string, Photo]));
export const WEEK_KEY = "week";
export const creditLine = (p: Photo) => (p.local ? `Photo: ${p.author}` : `${p.author}, ${p.license}, via Wikimedia Commons`);
