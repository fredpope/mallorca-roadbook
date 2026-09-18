import { Crumbs, OptionToggle, Pips, Spark, Tile } from "../components/Bits";
import { Gallery, HeroPhoto } from "../components/Gallery";
import { IslandMap } from "../components/IslandMap";
import { Profile } from "../components/Profile";
import { BAND } from "../data/bands";
import { DAYS } from "../data/days";
import type { Go, OptKey } from "../data/types";
import { dayBox, fmtH, hoursFor, num, round10 } from "../geo";
import { dayKey, photosFor } from "../photos";

interface Props { n: number; opt: OptKey; setOpt: (v: OptKey) => void; go: Go }

const FUEL_LABELS = ["Today", "Then", "Also", "After"];

export function DayPage({ n, opt, setOpt, go }: Props) {
  const d = DAYS[n - 1];
  const o = d.short && opt === "short" ? d.short : d.long;
  const b = BAND[d.band];
  const h = hoursFor(o);
  const carb = [round10(h * b.carb[0]), round10(h * b.carb[1])];
  const bottles = Math.max(1, Math.round((h * (b.fluid[0] + b.fluid[1])) / 2 / 750));
  const rhythm = d.band === "hard"
    ? "something every 20 minutes, alternating drink mix with a bar, gel, banana or rice cake"
    : d.band === "easy" ? "a snack around the halfway point is plenty" : "a bar, banana or gel every 30 minutes alongside drink mix";
  const photos = photosFor(dayKey(n));

  return (
    <div className="wrap">
      <Crumbs items={[{ label: "The week", go: () => go({ view: "week" }) }, { label: `Day ${d.n}` }]} />
      <div className="dayhead">
        <div className="big" style={{ color: d.color }}>{d.n}</div>
        <div><div className="date">{d.date}, {d.base}</div><h1 className="daytitle">{d.title}</h1></div>
      </div>
      <HeroPhoto photo={photos[0]} />
      <p className="intro">{d.summary}</p>
      <div className="sched"><span><b>Start</b> {d.start}</span><span><b>Lunch</b> {d.lunch}</span><span><b>Dinner</b> {d.dinner}</span></div>
      <OptionToggle day={d} opt={opt} setOpt={setOpt} />
      <div className="tiles">
        <Tile big={`${o.km} km`} small="distance" />
        <Tile big={`${num(o.m)} m`} small="climbing" />
        <Tile big={`${Math.round(o.m / o.km)} m/km`} small="climbing density" />
        <Tile big={`${fmtH(h * 0.9)} to ${fmtH(h * 1.15)}`} small="estimated moving time" />
        <Tile big={<><Pips n={d.pips} />{b.word}</>} small="planned effort" />
        <Tile big={`${carb[0]} to ${carb[1]} g`} small="carbohydrate on the bike" />
        <Tile big={`${bottles} ${bottles === 1 ? "bottle" : "bottles"}`} small="of 750 ml, more if hot" />
      </div>
      <Profile points={d.profile} marks={d.marks} color={d.color} shortMark={d.shortMark} label={`Schematic elevation profile for day ${d.n}`} note="Schematic profile of the long route. Move across it to read distance and height." />
      <div className="two">
        <div>
          <IslandMap vb={dayBox(d)} focus={d.n} label={`Map of day ${d.n}, ${d.title}`} onPick={(k) => go({ view: "day", n: k })} onPickAddon={(i) => go({ view: "addon", n: d.n, i })} />
          <p className="mapnote">Solid line is the day's route. Dotted lines are the extra rides; select one to open it. Other days are shown faintly.</p>
        </div>
        <div className="card">
          <h3>Climbs</h3>
          <div className="tablewrap">
            <table>
              <thead><tr><th>Climb</th><th>Length</th><th>Average</th><th>Gain</th></tr></thead>
              <tbody>{d.climbs.map((c) => <tr key={c[0]}><td><b>{c[0]}</b></td><td>{c[1]}</td><td>{c[2]}</td><td>{c[3]}</td></tr>)}</tbody>
            </table>
          </div>
        </div>
      </div>
      <Gallery photos={photos.slice(1)} heading="What it looks like" />
      <div className="two">
        <div className="card"><h3>How to ride it</h3><ul className="clean">{d.pacing.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
        <div className="card">
          <h3>Fuel plan</h3>
          <div className="fuel">
            <div className="row"><div className="when">Breakfast</div><div>{d.band === "easy" ? "A normal breakfast with carbohydrate: bread, fruit, yoghurt, eggs." : "Two to three hours before the start. Build it around carbohydrate: oats, bread, rice, fruit, honey, with a little protein. Roughly 1.5 to 2 g of carbohydrate per kg of body weight."}</div></div>
            <div className="row"><div className="when">On the bike</div><div><b>{b.carb[0]} to {b.carb[1]} g carbohydrate an hour</b> and <b>{b.fluid[0]} to {b.fluid[1]} ml fluid an hour</b>, with electrolytes in at least one bottle. For this option that is about {carb[0]} to {carb[1]} g in total. In practice: {rhythm}.</div></div>
            {d.fuel.map((t, i) => <div className="row" key={i}><div className="when">{FUEL_LABELS[i] ?? "Also"}</div><div>{t}</div></div>)}
            <div className="row"><div className="when">Recovery</div><div>{d.band === "easy" ? "Normal meals with protein at each one." : "Within an hour of finishing: about 1 g of carbohydrate per kg plus 20 to 30 g of protein. A sandwich and a milk or yoghurt drink does it."}</div></div>
          </div>
        </div>
      </div>
      <section className="block flush">
        <h2>If you want more</h2>
        <p>Optional extras, best agreed with the guides on the day. Open one for its own map, profile and what it does to the day.</p>
        <div className="extras">
          {d.addons.map((a, i) => (
            <button key={i} className="extra" onClick={() => go({ view: "addon", n: d.n, i })}>
              <span className="kind">{a.type}</span>
              <h3>{a.name}</h3>
              <span className="nums">+ {a.km} km, + {a.m} m, about {fmtH(Math.max(0.25, hoursFor(a)))} extra</span>
              <Spark points={a.profile} color={d.color} />
              <span className="desc">{a.blurb}</span>
              <span className="open">Open this ride</span>
            </button>
          ))}
        </div>
      </section>
      <div className="pager">
        <button onClick={() => go(n > 1 ? { view: "day", n: n - 1 } : { view: "week" })}>{n > 1 ? `Day ${n - 1}, ${DAYS[n - 2].title}` : "Back to the week"}</button>
        <button onClick={() => go(n < 7 ? { view: "day", n: n + 1 } : { view: "week" })}>{n < 7 ? `Day ${n + 1}, ${DAYS[n].title}` : "Back to the week"}</button>
      </div>
    </div>
  );
}
