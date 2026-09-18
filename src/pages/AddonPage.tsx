import { Crumbs, OptionToggle, Tile } from "../components/Bits";
import { Gallery, HeroPhoto } from "../components/Gallery";
import { IslandMap } from "../components/IslandMap";
import { Profile } from "../components/Profile";
import { BAND } from "../data/bands";
import { DAYS } from "../data/days";
import type { Go, OptKey } from "../data/types";
import { addonBox, fmtH, hoursFor, num, round10 } from "../geo";
import { addonKey, photosFor } from "../photos";

interface Props { n: number; i: number; opt: OptKey; setOpt: (v: OptKey) => void; go: Go }

export function AddonPage({ n, i, opt, setOpt, go }: Props) {
  const d = DAYS[n - 1];
  const a = d.addons[i];
  const o = d.short && opt === "short" ? d.short : d.long;
  const b = BAND[d.band];
  const extraH = Math.max(0.25, hoursFor(a));
  const total = { km: o.km + a.km, m: o.m + a.m };
  const carb = [round10(extraH * b.carb[0]), round10(extraH * b.carb[1])];
  const fluid = Math.round((extraH * (b.fluid[0] + b.fluid[1])) / 2 / 50) * 50;
  const other = d.addons[(i + 1) % d.addons.length];
  const photos = photosFor(addonKey(n, i));

  return (
    <div className="wrap">
      <Crumbs items={[{ label: "The week", go: () => go({ view: "week" }) }, { label: `Day ${d.n}, ${d.title}`, go: () => go({ view: "day", n }) }, { label: a.name }]} />
      <div className="addhead" style={{ borderLeftColor: d.color }}>
        <div className="date">Extra ride on day {d.n}, {a.type.toLowerCase()}</div>
        <h1 className="daytitle">{a.name}</h1>
      </div>
      <HeroPhoto photo={photos[0]} />
      <p className="intro">{a.blurb}</p>
      <div className="sched"><span><b>Leaves the route at</b> {a.from}</span></div>
      <div className="tiles">
        <Tile big={`+ ${a.km} km`} small="added distance" />
        <Tile big={`+ ${num(a.m)} m`} small="added climbing" />
        <Tile big={`+ ${fmtH(extraH)}`} small="estimated extra time" />
        <Tile big={a.climb ? a.climb[2] : "Flat"} small={a.climb ? `average on the main climb, ${a.climb[1]}` : "no real climbing"} />
        <Tile big={`+ ${carb[0]} to ${carb[1]} g`} small="extra carbohydrate to carry" />
      </div>
      <Profile points={a.profile} marks={a.marks} color={d.color} label={`Schematic elevation profile for ${a.name}`} note="Schematic profile of the extra ride only, measured from where it leaves the day's route." />
      <div className="two">
        <div>
          <IslandMap vb={addonBox(a)} focus={d.n} addon={a} label={`Map of ${a.name}`} onPick={(k) => go({ view: "day", n: k })} />
          <p className="mapnote">The extra ride is the dark line with the yellow edge. The day's main route is in colour beneath it.</p>
        </div>
        <div className="card">
          <h3>What it does to the day</h3>
          <OptionToggle day={d} opt={opt} setOpt={setOpt} />
          <div className="tablewrap">
            <table>
              <thead><tr><th></th><th>Distance</th><th>Climbing</th><th>Moving time</th></tr></thead>
              <tbody>
                <tr><td>{d.short ? o.label : `Day ${d.n} as planned`}</td><td>{o.km} km</td><td>{num(o.m)} m</td><td>{fmtH(hoursFor(o))}</td></tr>
                <tr><td>{a.name}</td><td>+ {a.km} km</td><td>+ {num(a.m)} m</td><td>+ {fmtH(extraH)}</td></tr>
                <tr className="sum"><td><b>Together</b></td><td><b>{total.km} km</b></td><td><b>{num(total.m)} m</b></td><td><b>{fmtH(hoursFor(total))}</b></td></tr>
              </tbody>
            </table>
          </div>
          {a.climb && <div style={{ marginTop: 16 }}><h3>Main climb</h3><p style={{ margin: 0 }}><b>{a.climb[0]}</b>: {a.climb[1]} at {a.climb[2]}, gaining {a.climb[3]}.</p></div>}
        </div>
      </div>
      <div className="three">
        <div className="card"><h3>Who it suits</h3><p>{a.suits}</p></div>
        <div className="card"><h3>How it fits the training week</h3><p>{a.fit}</p></div>
        <div className="card"><h3>Watch out for</h3><p>{a.watch}</p></div>
      </div>
      <div className="card" style={{ marginTop: 22 }}>
        <h3>Fuel for the extra</h3>
        <p style={{ marginBottom: 0 }}>Add about {carb[0]} to {carb[1]} g of carbohydrate and {fluid >= 1000 ? `${(fluid / 1000).toFixed(1)} litres` : `${fluid} ml`} of fluid to the day's plan, and carry it from the start. {extraH >= 1 ? "That is another full bottle and two or three extra items in your pockets. " : "One extra bar or gel covers it. "}Eat before the extra begins, not once you are on it.</p>
      </div>
      <Gallery photos={photos.slice(1)} heading="What it looks like" />
      <div className="pager">
        <button onClick={() => go({ view: "day", n })}>Back to day {n}, {d.title}</button>
        <button onClick={() => go({ view: "addon", n, i: (i + 1) % d.addons.length })}>The other extra: {other.name}</button>
      </div>
    </div>
  );
}
