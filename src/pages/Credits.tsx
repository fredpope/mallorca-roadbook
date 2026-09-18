import { Crumbs } from "../components/Bits";
import type { Go } from "../data/types";
import { allPhotos } from "../photos";

export function Credits({ go }: { go: Go }) {
  const photos = allPhotos();
  return (
    <div className="wrap">
      <Crumbs items={[{ label: "The week", go: () => go({ view: "week" }) }, { label: "Photo credits" }]} />
      <h1 className="daytitle" style={{ marginTop: 14 }}>Photo credits</h1>
      <p className="intro">Most photographs on this site come from Wikimedia Commons under free licences and link to their original file page, where the full licence terms are shown. Others were taken by the group and are used with permission. All images have been resized.</p>
      {photos.length === 0 && <p>No photos have been added yet.</p>}
      <ul className="credits">
        {photos.map(([key, p]) => (
          <li key={`${key}-${p.file}`}>
            <img src={`/photos/${p.thumb}`} alt="" loading="lazy" />
            <div><b>{p.title}</b><br />{p.author}. {p.licenseUrl ? <a href={p.licenseUrl} target="_blank" rel="noopener">{p.license}</a> : p.license}.{p.source && <> <a href={p.source} target="_blank" rel="noopener">Original on Wikimedia Commons</a>.</>}</div>
          </li>
        ))}
      </ul>
      <div className="pager"><button onClick={() => go({ view: "week" })}>Back to the week</button><span /></div>
    </div>
  );
}
