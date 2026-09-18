import { useState } from "react";
import { Spark } from "../components/Bits";
import { IslandMap } from "../components/IslandMap";
import { BAND } from "../data/bands";
import { DAYS } from "../data/days";
import type { Go } from "../data/types";
import { Gallery } from "../components/Gallery";
import { ISLAND_BOX, num } from "../geo";
import { photosFor, WEEK_KEY } from "../photos";

export function Week({ go }: { go: Go }) {
  const [hot, setHot] = useState<number | null>(null);
  const long = DAYS.reduce((a, d) => [a[0] + d.long.km, a[1] + d.long.m], [0, 0]);
  const short = DAYS.reduce((a, d) => [a[0] + (d.short ?? d.long).km, a[1] + (d.short ?? d.long).m], [0, 0]);
  const maxM = Math.max(...DAYS.map((d) => d.long.m));

  return (
    <div>
      <header className="hero">
        <div className="wrap">
          <h1>Seven days across Mallorca</h1>
          <p className="lede">26 September to 2 October. Four nights in Port de Pollença, three in Deià, a last evening in Palma. Pick a route on the map or a day from the list to open its roadbook page, then open any extra ride from there.</p>
        </div>
      </header>
      <div className="wrap overview-grid">
        <div>
          <IslandMap vb={ISLAND_BOX} label="Map of Mallorca showing the seven ride routes" hot={hot} onHot={setHot} onPick={(n) => go({ view: "day", n })} />
          <p className="mapnote">Yellow squares mark the overnight bases. Route lines are schematic and drawn through known towns and passes; they are not GPS tracks.</p>
        </div>
        <ol className="stages">
          {DAYS.map((d) => (
            <li key={d.n}>
              <button className={hot === d.n ? "hot" : ""} style={{ borderLeftColor: d.color }} onClick={() => go({ view: "day", n: d.n })}
                onPointerEnter={() => setHot(d.n)} onPointerLeave={() => setHot(null)}>
                <span className="num">{d.n}</span>
                <span className="nm">{d.title}</span>
                <span className="eff">{BAND[d.band].word}</span>
                <span className="meta">{d.date.split(" ").slice(0, 2).join(" ")}, {d.short && d.short.km !== d.long.km ? `${d.short.km} or ` : ""}{d.long.km} km, up to {num(d.long.m)} m</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <section className="block">
        <div className="wrap">
          <h2>The shape of the week</h2>
          <p>Seven riding days with no rest day works if the hard days are properly hard and the easy days are properly easy. The itinerary already has that rhythm built in: two big mountain days, each followed by a short one. Bars show climbing for the long option, and the lighter inset is the short option.</p>
          <div className="week">
            {DAYS.map((d) => {
              const h = Math.round((d.long.m / maxM) * 220);
              const sh = d.short ? Math.round((d.short.m / d.long.m) * 100) : 0;
              return (
                <button key={d.n} className="col" onClick={() => go({ view: "day", n: d.n })} aria-label={`Day ${d.n}, ${d.title}, ${d.long.m} metres, ${BAND[d.band].word}`}>
                  <span className="val">{num(d.long.m)} m</span>
                  <span className="bar" style={{ height: `${h}px`, background: d.color }}>{sh > 0 && sh < 100 && <span className="short" style={{ height: `${sh}%` }} />}</span>
                  <span className="band">{BAND[d.band].word}</span>
                  <span className="val">{d.long.km} km</span>
                  <span className="lab">Day {d.n}<br />{d.title}</span>
                </button>
              );
            })}
          </div>
          <div className="totals">
            <div><b>{long[0]} km</b>every long option</div>
            <div><b>{num(long[1])} m</b>climbing on the long options, a little more than Everest from sea level</div>
            <div><b>{short[0]} km</b>every short option</div>
            <div><b>{num(short[1])} m</b>climbing on the short options</div>
          </div>
        </div>
      </section>

      <section className="block">
        <div className="wrap">
          <h2>Riding it as a training week</h2>
          <div className="rules">
            <article><h3>Two days to go deep</h3><p>Day 2, Sa Calobra, and Day 5, the Andratx loop. On each, spend the effort on the named climbs and ride everything else as transport. A third hard day is available on Day 6 through the Puig Major extra, but only for riders who held back on Day 5.</p></article>
            <article><h3>Two days to go easy</h3><p>Day 3 and Day 6 are recovery. Conversation pace, small ring, and no sprinting for town signs. The fitness you came for is built on these days, while the body absorbs the hard ones.</p></article>
            <article><h3>Three steady days</h3><p>Day 1 is an opener to loosen travel legs, with a few short surges at most. Days 4 and 7 are point-to-point endurance rides at an all-day effort, with the option of tempo on one climb if you feel good.</p></article>
            <article><h3>Fuel the whole block</h3><p>The most common mistake in a week like this is under-eating on the easy days. Each day's page has carbohydrate and fluid targets scaled to its length and intensity.</p></article>
          </div>
        </div>
      </section>

      <div className="wrap"><Gallery photos={photosFor(WEEK_KEY)} heading="Riding in Mallorca" /></div>

      <section className="block">
        <div className="wrap">
          <h2>Every extra ride</h2>
          <p>Fourteen optional additions, two for each day. Figures are the approximate amount each one adds. Open any row for its map, profile and advice on whether it fits your week.</p>
          <div className="tablewrap">
            <table className="pick">
              <thead><tr><th>Day</th><th>Extra ride</th><th>Kind</th><th>Adds</th><th>Profile</th></tr></thead>
              <tbody>
                {DAYS.flatMap((d) => d.addons.map((a, i) => (
                  <tr key={`${d.n}-${i}`} tabIndex={0} role="link" onClick={() => go({ view: "addon", n: d.n, i })} onKeyDown={(e) => { if (e.key === "Enter") go({ view: "addon", n: d.n, i }); }}>
                    <td><span className="sw" style={{ background: d.color }} /> {d.n}</td>
                    <td><b>{a.name}</b></td>
                    <td>{a.type}</td>
                    <td style={{ whiteSpace: "nowrap" }}>+ {a.km} km, + {a.m} m</td>
                    <td><Spark points={a.profile} color={d.color} /></td>
                  </tr>
                )))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
