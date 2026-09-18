import { useState, type PointerEvent } from "react";
import type { ProfileMark, ProfilePoint } from "../data/types";
import { elevAt } from "../geo";
import { useWidth } from "../useWidth";

interface Props {
  points: ProfilePoint[];
  marks: ProfileMark[];
  color: string;
  shortMark?: number;
  label: string;
  note: string;
}

export function Profile({ points, marks, color, shortMark, label, note }: Props) {
  const [ref, px] = useWidth<HTMLDivElement>();
  const [cursor, setCursor] = useState<number | null>(null);
  const W = 1000;
  const H = px && px < 600 ? 640 : 300;
  const u = px ? W / px : 1;
  const pl = 52 * u, pr = 14 * u, pt = 34 * u, pb = 30 * u;
  const maxK = points[points.length - 1][0];
  const maxE = Math.max(250, Math.ceil(Math.max(...points.map((p) => p[1])) / 100) * 100 + 50);
  const X = (k: number) => pl + (k / maxK) * (W - pl - pr);
  const Y = (e: number) => H - pb - (e / maxE) * (H - pt - pb);
  const stepE = maxE > 500 ? 200 : 100;
  const stepK = maxK > 60 ? 20 : maxK > 30 ? 10 : maxK > 12 ? 5 : maxK > 6 ? 2 : 1;
  const ticksE: number[] = [];
  const ticksK: number[] = [];
  for (let e = 0; e <= maxE; e += stepE) ticksE.push(e);
  for (let k = 0; k <= maxK; k += stepK) ticksK.push(k);
  const line = points.map((p) => `${X(p[0]).toFixed(1)},${Y(p[1]).toFixed(1)}`).join("L");

  const move = (ev: PointerEvent<SVGSVGElement>) => {
    const r = ev.currentTarget.getBoundingClientRect();
    const x = ((ev.clientX - r.left) / r.width) * W;
    setCursor(Math.max(0, Math.min(maxK, ((x - pl) / (W - pl - pr)) * maxK)));
  };

  return (
    <div className="profile">
      <div ref={ref}>
        {px > 0 && (
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} onPointerMove={move} onPointerDown={move} onPointerLeave={() => setCursor(null)}>
            {ticksE.map((e) => (
              <g key={e}>
                <line x1={pl} x2={W - pr} y1={Y(e)} y2={Y(e)} stroke="var(--line)" strokeWidth={u} />
                <text x={pl - 6 * u} y={Y(e) + 4 * u} fontSize={12 * u} textAnchor="end" fill="var(--muted)" fontFamily="var(--body)">{e} m</text>
              </g>
            ))}
            {ticksK.map((k) => (
              <text key={k} x={X(k)} y={H - pb + 17 * u} fontSize={12 * u} textAnchor="middle" fill="var(--muted)" fontFamily="var(--body)">{k}{k === 0 ? " km" : ""}</text>
            ))}
            <path d={`M${X(0)},${Y(0)}L${line}L${X(maxK)},${Y(0)}Z`} fill={color} opacity={0.28} />
            <path d={`M${line}`} fill="none" stroke={color} strokeWidth={3 * u} strokeLinejoin="round" />
            {shortMark && (
              <g>
                <line x1={X(shortMark)} x2={X(shortMark)} y1={pt} y2={H - pb} stroke="var(--ink)" strokeDasharray={`${4 * u} ${4 * u}`} strokeWidth={1.5 * u} />
                <text x={X(shortMark) + 5 * u} y={pt + 10 * u} fontSize={12 * u} fill="var(--ink)" fontFamily="var(--body)">{shortMark} km option ends</text>
              </g>
            )}
            {marks.map(([k, name], i) => {
              const x = X(k);
              const y = Y(elevAt(points, k));
              const anchor = x > W * 0.85 ? "end" : x < W * 0.12 ? "start" : "middle";
              const ly = Math.max(14 * u, y - 10 * u - (px < 600 && i % 2 ? 13 * u : 0));
              return (
                <g key={i}>
                  <circle cx={x} cy={y} r={4 * u} fill="var(--panel)" stroke="var(--ink)" strokeWidth={2 * u} />
                  <text x={x} y={ly} fontSize={12 * u} fontWeight={600} textAnchor={anchor} fill="var(--ink)" fontFamily="var(--body)" stroke="var(--panel)" strokeWidth={3 * u} paintOrder="stroke">{name}</text>
                </g>
              );
            })}
            {cursor !== null && (
              <g>
                <line x1={X(cursor)} x2={X(cursor)} y1={pt} y2={H - pb} stroke="var(--ink)" strokeWidth={u} />
                <circle cx={X(cursor)} cy={Y(elevAt(points, cursor))} r={5 * u} fill={color} stroke="var(--panel)" strokeWidth={2 * u} />
              </g>
            )}
          </svg>
        )}
      </div>
      <div className="cap">
        {cursor === null ? note : `Kilometre ${cursor.toFixed(1)}, about ${Math.round(elevAt(points, cursor) / 5) * 5} m above sea level.`}
      </div>
    </div>
  );
}
