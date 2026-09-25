export type LatLon = [number, number];
export type Anchor = "start" | "end" | "middle";
export type PlaceLabel = [name: string, point: string, anchor: Anchor, dx: number, dy: number];
export type ProfilePoint = [km: number, elevation: number];
export type ProfileMark = [km: number, name: string];
export type ClimbRow = [name: string, length: string, average: string, gain: string];
export type BandKey = "hard" | "steady" | "opener" | "easy";

export interface Band {
  word: string;
  carb: [number, number];
  fluid: [number, number];
}

export interface RideOption {
  km: number;
  m: number;
  label: string;
}

export interface Addon {
  name: string;
  type: string;
  km: number;
  m: number;
  from: string;
  seg: string[];
  labels: PlaceLabel[];
  profile: ProfilePoint[];
  marks: ProfileMark[];
  climb: ClimbRow | null;
  blurb: string;
  suits: string;
  watch: string;
  fit: string;
}

export interface DayBase {
  n: number;
  date: string;
  title: string;
  base: string;
  color: string;
  band: BandKey;
  pips: number;
  start: string;
  lunch: string;
  dinner: string;
  long: RideOption;
  short: RideOption | null;
  summary: string;
  gpx?: { file: string; description: string };
  segs: string[][];
  labels: PlaceLabel[];
  profile: ProfilePoint[];
  marks: ProfileMark[];
  shortMark?: number;
  climbs: ClimbRow[];
  pacing: string[];
  fuel: string[];
  photo: string;
}

export interface Day extends DayBase {
  addons: Addon[];
}

export interface Photo {
  file: string;
  thumb: string;
  width: number;
  height: number;
  title: string;
  author: string;
  license: string;
  licenseUrl: string;
  source: string;
  local?: boolean;
}

export type Route =
  | { view: "week" }
  | { view: "credits" }
  | { view: "day"; n: number }
  | { view: "addon"; n: number; i: number };

export type Go = (route: Route) => void;
export type OptKey = "long" | "short";
