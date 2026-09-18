import { DAYS } from "../data/days";
import { P, PEAKS } from "../data/points";
import type { Addon, Anchor, PlaceLabel as PlaceLabelData } from "../data/types";
import { COAST_PATHS, proj, segPath, type Box } from "../geo";
import { useWidth } from "../useWidth";

type OverviewLabel = [...PlaceLabelData, base: boolean, light: boolean];

const OVERVIEW_LABELS: OverviewLabel[] = [
  ["Port de Pollença", "pp", "start", 9, -7, true, false],
  ["Cap de Formentor", "cap", "end", -4, -10, false, true],
  ["Alcúdia", "alc", "start", 9, 12, false, false],
  ["Sa Calobra", "calobra", "end", -9, -7, false, true],
  ["Sóller", "soller", "start", 9, 14, false, false],
  ["Deià", "deia", "end", -9, -5, true, true],
  ["Andratx", "andr", "start", 9, -7, false, false],
  ["Sineu", "sineu", "start", 9, 5, false, false],
  ["Consell", "cons", "start", 4, 18, false, false],
  ["Palma", "palma", "start", 9, 14, true, false],
];

interface LabelProps { x: number; y: number; u: number; name: string; anchor: Anchor; dx: number; dy: number; light?: boolean }

function PlaceLabel({ x, y, u, name, anchor, dx, dy, light }: LabelProps) {
  return (
    <text x={x + dx * u} y={y + dy * u} fontSize={13 * u} fontWeight={600} textAnchor={anchor} fontFamily="var(--body)"
      fill={light ? "#F2F4F1" : "var(--ink)"} stroke={light ? "none" : "var(--land)"} strokeWidth={3.5 * u} paintOrder="stroke" strokeLinejoin="round">
      {name}
    </text>
  );
}

interface Props {
  vb: Box;
  label: string;
  focus?: number;
  addon?: Addon;
  hot?: number | null;
  onHot?: (n: number | null) => void;
  onPick?: (n: number) => void;
  onPickAddon?: (i: number) => void;
}

export function IslandMap({ vb, label, focus, addon, hot, onHot, onPick, onPickAddon }: Props) {
  const [ref, px] = useWidth<HTMLDivElement>();
  const u = px ? vb[2] / px : 1;
  const day = focus ? DAYS[focus - 1] : null;
  const labels = addon ? addon.labels : day ? day.labels : [];

  return (
    <div className="mapbox" ref={ref}>
      {px > 0 && (
        <svg viewBox={vb.map((v) => v.toFixed(1)).join(" ")} role="img" aria-label={label}>
          <rect x={vb[0]} y={vb[1]} width={vb[2]} height={vb[3]} fill="var(--sea)" />
          {[3, 2, 1].map((i) => COAST_PATHS.map((d, j) => (
            <path key={`${i}-${j}`} d={d} fill="none" stroke="var(--sea-2)" strokeWidth={10 * i * u} strokeLinejoin="round" opacity={0.5 / i} />
          )))}
          {COAST_PATHS.map((d, j) => (
            <path key={j} d={d} fill="var(--land)" stroke="var(--land-edge)" strokeWidth={1.5 * u} strokeLinejoin="round" />
          ))}
          {PEAKS.map(([name, lat, lon]) => {
            const [x, y] = proj([lat, lon]);
            const r = 5 * u;
            return (
              <g key={name}>
                <path d={`M${x - r},${y + r}L${x},${y - r}L${x + r},${y + r}Z`} fill="var(--muted)" opacity={0.55} />
                {focus && px > 500 && <text x={x} y={y + r + 10 * u} fontSize={10 * u} textAnchor="middle" fill="var(--muted)" fontFamily="var(--body)">{name}</text>}
              </g>
            );
          })}
          {DAYS.map((d, i) => {
            const isFocus = focus === d.n;
            const dim = !!focus && !isFocus;
            const offset = focus ? 0 : ((i % 3) - 1) * 2.2;
            const faded = !focus && !!hot && hot !== d.n;
            return d.segs.map((seg, j) => {
              const path = segPath(seg, offset);
              return (
                <g key={`${d.n}-${j}`}>
                  {!dim && <path d={path} fill="none" stroke="var(--land-edge)" strokeWidth={(isFocus ? 8 : 6.5) * u} strokeLinecap="round" strokeLinejoin="round" opacity={addon ? 0.5 : 1} />}
                  <path d={path} fill="none" stroke={d.color} strokeWidth={(isFocus ? (addon ? 3.2 : 4.5) : dim ? 2 : 3.6) * u} strokeLinecap="round" strokeLinejoin="round"
                    opacity={dim ? 0.35 : faded ? 0.25 : addon ? 0.7 : 1} style={{ cursor: "pointer" }}
                    onClick={() => onPick?.(d.n)} onPointerEnter={() => onHot?.(d.n)} onPointerLeave={() => onHot?.(null)} />
                </g>
              );
            });
          })}
          {day && !addon && day.addons.map((a, i) => (
            <g key={i} style={{ cursor: "pointer" }} onClick={() => onPickAddon?.(i)}>
              <path d={segPath(a.seg)} fill="none" stroke="transparent" strokeWidth={16 * u} />
              <path d={segPath(a.seg)} fill="none" stroke="var(--ink)" strokeWidth={3 * u} strokeDasharray={`${3 * u} ${6 * u}`} strokeLinecap="round" />
            </g>
          ))}
          {addon && (
            <g>
              <path d={segPath(addon.seg)} fill="none" stroke="var(--road-paint)" strokeWidth={9 * u} strokeLinecap="round" strokeLinejoin="round" />
              <path d={segPath(addon.seg)} fill="none" stroke="#14222B" strokeWidth={4 * u} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          )}
          {labels.map(([name, k, anchor, dx, dy]) => {
            const [x, y] = proj(P[k]);
            return (
              <g key={name}>
                <circle cx={x} cy={y} r={4.5 * u} fill="var(--panel)" stroke="var(--ink)" strokeWidth={2 * u} />
                <PlaceLabel x={x} y={y} u={u} name={name} anchor={anchor} dx={dx} dy={dy} />
              </g>
            );
          })}
          {!focus && OVERVIEW_LABELS.map(([name, k, anchor, dx, dy, base, light]) => {
            const [x, y] = proj(P[k]);
            return (
              <g key={name}>
                {base
                  ? <rect x={x - 5 * u} y={y - 5 * u} width={10 * u} height={10 * u} fill="var(--road-paint)" stroke="#14222B" strokeWidth={2 * u} />
                  : <circle cx={x} cy={y} r={3.5 * u} fill="var(--panel)" stroke="var(--ink)" strokeWidth={1.8 * u} />}
                <PlaceLabel x={x} y={y} u={u} name={name} anchor={anchor} dx={dx} dy={dy} light={light} />
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}
