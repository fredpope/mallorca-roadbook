import type { ReactNode } from "react";
import { DAYS } from "../data/days";
import type { Day, Go, OptKey, ProfilePoint, Route } from "../data/types";

export function Spark({ points, color }: { points: ProfilePoint[]; color: string }) {
  const maxK = points[points.length - 1][0];
  const es = points.map((p) => p[1]);
  const lo = Math.min(...es);
  const hi = Math.max(...es, lo + 60);
  const pts = points.map((p) => `${((p[0] / maxK) * 120).toFixed(1)},${(34 - ((p[1] - lo) / (hi - lo)) * 30).toFixed(1)}`).join(" ");
  return (
    <svg className="spark" viewBox="0 0 120 36" preserveAspectRatio="xMinYMid meet" aria-hidden="true">
      <polygon points={`0,36 ${pts} 120,36`} fill={color} opacity={0.3} />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

export const Pips = ({ n }: { n: number }) => (
  <span className="pips" aria-hidden="true">{[1, 2, 3, 4, 5].map((i) => <i key={i} className={i <= n ? "on" : ""} />)}</span>
);

export const Tile = ({ big, small }: { big: ReactNode; small: string }) => (
  <div><b>{big}</b><span>{small}</span></div>
);

export function OptionToggle({ day, opt, setOpt }: { day: Day; opt: OptKey; setOpt: (v: OptKey) => void }) {
  if (!day.short) return null;
  return (
    <div className="opt" role="group" aria-label="Route option">
      <button aria-pressed={opt === "short"} onClick={() => setOpt("short")}>{day.short.label}</button>
      <button aria-pressed={opt === "long"} onClick={() => setOpt("long")}>{day.long.label}</button>
    </div>
  );
}

export function Nav({ route, go }: { route: Route; go: Go }) {
  const current = "n" in route ? route.n : null;
  return (
    <nav className="strip" aria-label="Days">
      <div className="wrap">
        <button aria-current={route.view === "week" ? "page" : undefined} onClick={() => go({ view: "week" })}>The week</button>
        {DAYS.map((d) => (
          <button key={d.n} aria-current={current === d.n ? "page" : undefined} onClick={() => go({ view: "day", n: d.n })}>
            <span className="sw" style={{ background: d.color }} />Day {d.n}
          </button>
        ))}
      </div>
    </nav>
  );
}

export function Crumbs({ items }: { items: { label: string; go?: () => void }[] }) {
  return (
    <div className="crumbs" aria-label="Breadcrumb">
      {items.map((it, i) => (
        <span key={i}>
          {i > 0 && <span className="sep">/</span>}
          {it.go ? <button onClick={it.go}>{it.label}</button> : <span className="here">{it.label}</span>}
        </span>
      ))}
    </div>
  );
}
