import { useEffect, useState } from "react";
import { Nav } from "./components/Bits";
import type { Go, OptKey, Route } from "./data/types";
import { AddonPage } from "./pages/AddonPage";
import { Credits } from "./pages/Credits";
import { DayPage } from "./pages/DayPage";
import { Week } from "./pages/Week";

function toHash(r: Route): string {
  if (r.view === "day") return `#/day/${r.n}`;
  if (r.view === "addon") return `#/day/${r.n}/extra/${r.i + 1}`;
  if (r.view === "credits") return "#/credits";
  return "#/";
}

function fromHash(hash: string): Route {
  if (hash === "#/credits") return { view: "credits" };
  const m = /^#\/day\/([1-7])(?:\/extra\/([12]))?$/.exec(hash);
  if (!m) return { view: "week" };
  return m[2] ? { view: "addon", n: +m[1], i: +m[2] - 1 } : { view: "day", n: +m[1] };
}

export function App() {
  const [route, setRoute] = useState<Route>(() => fromHash(window.location.hash));
  const [opts, setOpts] = useState<Record<number, OptKey>>({});

  useEffect(() => {
    const onHash = () => setRoute(fromHash(window.location.hash));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go: Go = (r) => {
    setRoute(r);
    const h = toHash(r);
    if (window.location.hash !== h) window.location.hash = h;
    window.scrollTo(0, 0);
  };

  const n = "n" in route ? route.n : 0;
  const opt = opts[n] ?? "long";
  const setOpt = (v: OptKey) => setOpts((s) => ({ ...s, [n]: v }));

  return (
    <div>
      <Nav route={route} go={go} />
      <main>
        {route.view === "week" && <Week go={go} />}
        {route.view === "credits" && <Credits go={go} />}
        {route.view === "day" && <DayPage key={route.n} n={route.n} opt={opt} setOpt={setOpt} go={go} />}
        {route.view === "addon" && <AddonPage key={`${route.n}-${route.i}`} n={route.n} i={route.i} opt={opt} setOpt={setOpt} go={go} />}
      </main>
      <footer>
        <div className="wrap small">
          Routes, profiles and extra-ride figures are reconstructed from the tour itinerary and well-known Mallorcan roads. They are schematic, so expect the guides' GPS files to differ in detail. Headline distance and climbing for each day are the tour's own. Fuelling guidance is general sports-nutrition practice for healthy adults; adjust to what your stomach already knows, and follow your own medical advice where it applies. <button className="linkish" onClick={() => go({ view: "credits" })}>Photo credits</button>.
        </div>
      </footer>
    </div>
  );
}
